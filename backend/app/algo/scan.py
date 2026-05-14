from collections import defaultdict
from typing import Any, Callable, DefaultDict, Hashable, Iterable, List, Optional, Set, Tuple


def _last_end_index(path: List[Hashable], end_set: Set[Hashable]) -> Optional[int]:
    last: Optional[int] = None
    for i, e in enumerate(path):
        if e in end_set:
            last = i
    return last


def scan_edges(
    edges: List[Tuple[Hashable, Hashable]],
    start_events: Iterable[Hashable],
    end_events: Iterable[Hashable],
    progress_callback: Optional[Callable[[float], None]] = None,
    should_cancel: Optional[Callable[[], bool]] = None,
) -> Set[Hashable]:
    """
    Walk the directed graph defined by ``edges`` from each start event in depth-first
    order (each outgoing edge is explored in its own branch).

    For each completed branch (no further outgoing edges to unvisited nodes, or only
    cycle edges left):

    - If no event on that path lies in ``end_events``, nothing from that branch is kept.
    - Otherwise, every event id from the path's initial start through the **last**
      occurrence of an end event on that path (inclusive) is added to a global set.

    ``progress_callback`` receives ``[0.0, 1.0]`` while scanning (per completed start root).

    Returns that global set of event ids.
    """
    edges = edges or []
    start_events = start_events or []
    end_events = end_events or []

    outgoing: DefaultDict[Hashable, List[Hashable]] = defaultdict(list)
    for u, v in edges:
        outgoing[u].append(v)

    end_set = set(end_events)
    global_events: Set[Hashable] = set()

    unique_starts = list(dict.fromkeys(start_events))
    n_starts = len(unique_starts)

    if progress_callback:
        progress_callback(0.0)

    ops = 0

    def tick() -> None:
        nonlocal ops
        ops += 1
        if should_cancel and ops % 4096 == 0 and should_cancel():
            raise RuntimeError("Processing cancelled")

    def commit_path(path: List[Hashable]) -> None:
        le = _last_end_index(path, end_set)
        if le is not None:
            global_events.update(path[: le + 1])

    # Explicit stack (path, visited, neighbors, next_idx) — avoids RecursionError on long paths.
    for si, s in enumerate(unique_starts):
        tick()
        stack: List[List[Any]] = [
            [[s], {s}, list(outgoing.get(s, ())), 0],
        ]
        while stack:
            tick()
            fr = stack[-1]
            path, vis, nbrs, _idx = fr[0], fr[1], fr[2], fr[3]
            advanced = False
            while fr[3] < len(nbrs):
                tick()
                nxt = nbrs[fr[3]]
                fr[3] += 1
                if nxt in vis:
                    continue
                stack.append([path + [nxt], vis | {nxt}, list(outgoing.get(nxt, ())), 0])
                advanced = True
                break
            if not advanced:
                stack.pop()
                commit_path(path)
        if progress_callback and n_starts > 0:
            progress_callback((si + 1) / n_starts)

    if progress_callback and n_starts == 0:
        progress_callback(1.0)

    return global_events
