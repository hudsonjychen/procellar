from collections import defaultdict
from typing import Any, Callable, DefaultDict, Hashable, Iterable, List, Optional, Set, Tuple

from .ids import canonical_event_id, canonical_event_id_set


def _build_outgoing(
    edges: List[Tuple[Hashable, Hashable]],
) -> DefaultDict[str, List[str]]:
    """Directed adjacency on canonical event-id strings."""
    outgoing: DefaultDict[str, List[str]] = defaultdict(list)
    for u, v in edges:
        cu = canonical_event_id(u)
        cv = canonical_event_id(v)
        if cu is None or cv is None or cu == cv:
            continue
        if cv not in outgoing[cu]:
            outgoing[cu].append(cv)
    return outgoing


def _last_end_index(path: List[str], end_set: Set[str]) -> Optional[int]:
    last: Optional[int] = None
    for i, e in enumerate(path):
        if e in end_set:
            last = i
    return last


def _dfs_branches(
    outgoing: DefaultDict[str, List[str]],
    end_set: Set[str],
    prefix: List[str],
    vis: Set[str],
    nbrs: List[str],
    global_events: Set[str],
    tick: Callable[[], None],
) -> None:
    """Explore branches when out-degree > 1 (prefix is the path up to the branch node)."""
    stack: List[List[Any]] = [
        [list(prefix), set(vis), list(nbrs), 0],
    ]
    while stack:
        tick()
        fr = stack[-1]
        path: List[str] = fr[0]
        branch_vis: Set[str] = fr[1]
        branch_nbrs: List[str] = fr[2]
        advanced = False
        while fr[3] < len(branch_nbrs):
            tick()
            nxt = branch_nbrs[fr[3]]
            fr[3] += 1
            if nxt in branch_vis:
                continue
            stack.append(
                [
                    path + [nxt],
                    branch_vis | {nxt},
                    list(outgoing.get(nxt, ())),
                    0,
                ]
            )
            advanced = True
            break
        if not advanced:
            stack.pop()
            le = _last_end_index(path, end_set)
            if le is not None:
                global_events.update(path[: le + 1])


def scan_edges(
    edges: List[Tuple[Hashable, Hashable]],
    start_events: Iterable[Hashable],
    end_events: Iterable[Hashable],
    progress_callback: Optional[Callable[[float], None]] = None,
    should_cancel: Optional[Callable[[], bool]] = None,
) -> Set[str]:
    """
    Walk the graph from each start event. Uses fast single-successor chain walks
    (typical for object timelines); full branch DFS only when out-degree > 1.
    """
    edges = edges or []
    outgoing = _build_outgoing(edges)
    end_set = canonical_event_id_set(end_events)

    start_list: List[str] = []
    for s in start_events or []:
        cs = canonical_event_id(s)
        if cs is not None and cs not in start_list:
            start_list.append(cs)

    global_events: Set[str] = set()
    n_starts = len(start_list)

    if progress_callback:
        progress_callback(0.0)

    ops = 0

    def tick(si: int = 0) -> None:
        nonlocal ops
        ops += 1
        if should_cancel and ops % 8192 == 0 and should_cancel():
            raise RuntimeError("Processing cancelled")
        if progress_callback and n_starts > 0 and ops % 2048 == 0:
            progress_callback(min(1.0, (si + 0.25) / n_starts))

    for si, s in enumerate(start_list):
        if progress_callback and n_starts > 0:
            progress_callback(si / n_starts)
        tick(si)
        path: List[str] = [s]
        vis: Set[str] = {s}
        cur = s
        branched = False

        while True:
            tick(si)
            nbrs = outgoing.get(cur, ())
            if not nbrs:
                break
            if len(nbrs) > 1:
                _dfs_branches(
                    outgoing,
                    end_set,
                    path,
                    vis,
                    nbrs,
                    global_events,
                    lambda: tick(si),
                )
                branched = True
                break
            nxt = nbrs[0]
            if nxt in vis:
                break
            path.append(nxt)
            vis.add(nxt)
            cur = nxt

        if not branched:
            le = _last_end_index(path, end_set)
            if le is not None:
                global_events.update(path[: le + 1])

        if progress_callback and n_starts > 0:
            progress_callback((si + 1) / n_starts)

    if progress_callback and n_starts == 0:
        progress_callback(1.0)

    return global_events
