import os
from collections import defaultdict
from typing import Any, Callable, DefaultDict, Dict, Hashable, Iterable, List, Optional, Set, Tuple

from .ids import canonical_event_id, canonical_event_id_set

try:
    from . import _scan_rust as _scan_rust_ext
except Exception:
    _scan_rust_ext = None


def build_outgoing(
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


_build_outgoing = build_outgoing


def build_incoming(
    outgoing: DefaultDict[str, List[str]],
) -> DefaultDict[str, List[str]]:
    """Reverse adjacency (shared across trace rules on the same graph)."""
    incoming: DefaultDict[str, List[str]] = defaultdict(list)
    for u, nbrs in outgoing.items():
        for v in nbrs:
            incoming[v].append(u)
    return incoming


def _last_end_index(path: List[str], end_set: Set[str]) -> Optional[int]:
    last: Optional[int] = None
    for i, e in enumerate(path):
        if e in end_set:
            last = i
    return last


def _minimal_start_list(
    start_list: List[str],
    outgoing: DefaultDict[str, List[str]],
    incoming: Optional[DefaultDict[str, List[str]]] = None,
) -> List[str]:
    """Keep starts with no incoming edge from another start (same union of discovered events)."""
    start_set = set(start_list)
    if incoming is None:
        incoming = build_incoming(outgoing)
    incoming_from_start: Set[str] = set()
    for v in start_set:
        for pred in incoming.get(v, ()):
            if pred in start_set:
                incoming_from_start.add(v)
                break
    return [s for s in start_list if s not in incoming_from_start]


def nodes_reaching_end(
    end_set: Set[str],
    incoming: DefaultDict[str, List[str]],
    reachability_cache: Optional[Dict[frozenset, Set[str]]] = None,
) -> Set[str]:
    """Nodes on some directed path to an end event — backward BFS, O(V+E)."""
    if not end_set:
        return set()
    cache_key = frozenset(end_set)
    if reachability_cache is not None and cache_key in reachability_cache:
        return reachability_cache[cache_key]

    can_reach: Set[str] = set(end_set)
    stack = list(end_set)
    while stack:
        u = stack.pop()
        for pred in incoming.get(u, ()):
            if pred not in can_reach:
                can_reach.add(pred)
                stack.append(pred)

    if reachability_cache is not None:
        reachability_cache[cache_key] = can_reach
    return can_reach


_nodes_reaching_end = nodes_reaching_end


def _has_cycle(outgoing: DefaultDict[str, List[str]]) -> bool:
    """Iterative 3-colour cycle detection over all nodes in the adjacency map."""
    WHITE, GRAY, BLACK = 0, 1, 2
    color: Dict[str, int] = {}

    nodes: Set[str] = set(outgoing.keys())
    for nbrs in outgoing.values():
        nodes.update(nbrs)

    for root in nodes:
        if color.get(root, WHITE) != WHITE:
            continue
        color[root] = GRAY
        stack: List[Tuple[str, Any]] = [(root, iter(outgoing.get(root, ())))]
        while stack:
            node, it = stack[-1]
            advanced = False
            for nb in it:
                c = color.get(nb, WHITE)
                if c == GRAY:
                    return True
                if c == WHITE:
                    color[nb] = GRAY
                    stack.append((nb, iter(outgoing.get(nb, ()))))
                    advanced = True
                    break
            if not advanced:
                color[node] = BLACK
                stack.pop()
    return False


def _forward_reachable(
    start_list: Iterable[str],
    outgoing: DefaultDict[str, List[str]],
) -> Set[str]:
    """Nodes reachable from any start (inclusive) — forward BFS, O(V+E)."""
    reached: Set[str] = set(start_list)
    stack = list(reached)
    while stack:
        u = stack.pop()
        for v in outgoing.get(u, ()):
            if v not in reached:
                reached.add(v)
                stack.append(v)
    return reached


def _scan_edges_reachable(
    start_list: List[str],
    end_set: Set[str],
    outgoing: DefaultDict[str, List[str]],
    incoming: DefaultDict[str, List[str]],
    reachability_cache: Optional[Dict[frozenset, Set[str]]],
    progress_callback: Optional[Callable[[float], None]],
    should_cancel: Optional[Callable[[], bool]],
) -> Set[str]:
    """
    Exact result for an acyclic succession graph.

    An event is recorded by the DFS iff it lies on some simple path
    ``start -> ... -> end`` (kept up to the last end on that path). On a DAG this is
    exactly ``forward_reachable(starts)`` intersected with ``nodes_reaching_end(ends)``,
    because any forward path to ``e`` and any path ``e -> end`` share only ``e``
    (strictly increasing topological order), so their concatenation is a simple path.
    """
    if progress_callback:
        progress_callback(0.0)
    if should_cancel and should_cancel():
        raise RuntimeError("Processing cancelled")

    if not start_list or not end_set:
        if progress_callback:
            progress_callback(1.0)
        return set()

    forward = _forward_reachable(start_list, outgoing)
    if progress_callback:
        progress_callback(0.5)
    if should_cancel and should_cancel():
        raise RuntimeError("Processing cancelled")

    can_reach_end = nodes_reaching_end(end_set, incoming, reachability_cache)
    result = forward & can_reach_end

    if progress_callback:
        progress_callback(1.0)
    return result


def scan_single_entity(
    object_timelines: Dict[str, List[str]],
    start_events: Iterable[Hashable],
    end_events: Iterable[Hashable],
    progress_callback: Optional[Callable[[float], None]] = None,
    should_cancel: Optional[Callable[[], bool]] = None,
) -> Set[str]:
    """
    Single-entity trace flow.

    An event is part of the trace iff it lies on **one object's own timeline** between
    that object's start event (at/before it) and a later end event (at/after it). The
    flow is carried by a single entity from start to end, so reused resource objects
    (vehicles, forklifts, ...) can never bridge unrelated cases. Type-agnostic: any
    object instance whose life spans a start and a later end contributes its in-between
    events. O(total relations); no graph required.
    """
    if progress_callback:
        progress_callback(0.0)

    start_set = canonical_event_id_set(start_events)
    end_set = canonical_event_id_set(end_events)
    if not start_set or not end_set or not object_timelines:
        if progress_callback:
            progress_callback(1.0)
        return set()

    included: Set[str] = set()
    n = len(object_timelines) or 1
    for i, timeline in enumerate(object_timelines.values()):
        if should_cancel and i % 4096 == 0 and should_cancel():
            raise RuntimeError("Processing cancelled")
        m = len(timeline)
        if m == 0:
            continue
        # end_after[j] = some end at position >= j on this timeline
        end_after = False
        suffix = [False] * m
        for j in range(m - 1, -1, -1):
            if timeline[j] in end_set:
                end_after = True
            suffix[j] = end_after
        start_before = False
        for j in range(m):
            if timeline[j] in start_set:
                start_before = True
            if start_before and suffix[j]:
                included.add(timeline[j])
        if progress_callback and (i % 4096 == 0):
            progress_callback(min(1.0, i / n))

    if progress_callback:
        progress_callback(1.0)
    return included


def _use_rust_backend() -> bool:
    mode = os.getenv("SCAN_BACKEND", "auto").strip().lower()
    if mode == "python":
        return False
    if mode == "rust":
        return _scan_rust_ext is not None
    # "auto": the linear reachability path supersedes the Rust DFS, so Rust is only
    # used when explicitly requested via SCAN_BACKEND=rust.
    return False


def _scan_edges_rust(
    edges: List[Tuple[Hashable, Hashable]],
    start_events: Iterable[Hashable],
    end_events: Iterable[Hashable],
    *,
    use_minimal_starts: bool,
    use_reachability_prune: bool,
) -> Set[str]:
    if _scan_rust_ext is None:
        raise RuntimeError("Rust scan backend is unavailable")

    rust_edges: List[Tuple[str, str]] = []
    for u, v in edges or []:
        cu = canonical_event_id(u)
        cv = canonical_event_id(v)
        if cu is None or cv is None or cu == cv:
            continue
        rust_edges.append((cu, cv))
    rust_starts = list(canonical_event_id_set(start_events))
    rust_ends = list(canonical_event_id_set(end_events))
    return set(
        _scan_rust_ext.scan_edges_rust(
            rust_edges,
            rust_starts,
            rust_ends,
            use_minimal_starts,
            use_reachability_prune,
        )
    )


def _extend_chain(
    outgoing: DefaultDict[str, List[str]],
    end_set: Set[str],
    path: List[str],
    vis: Set[str],
    cur: str,
    global_events: Set[str],
    tick: Callable[[], None],
) -> bool:
    """Follow single-successor chains from ``cur``; DFS on branches. Returns True if branched."""
    while True:
        tick()
        nbrs = outgoing.get(cur, ())
        if not nbrs:
            return False
        if len(nbrs) > 1:
            _dfs_branches(outgoing, end_set, path, vis, nbrs, global_events, tick)
            return True
        nxt = nbrs[0]
        if nxt in vis:
            return False
        path.append(nxt)
        vis.add(nxt)
        cur = nxt


def _dfs_branches(
    outgoing: DefaultDict[str, List[str]],
    end_set: Set[str],
    path: List[str],
    vis: Set[str],
    nbrs: List[str],
    global_events: Set[str],
    tick: Callable[[], None],
) -> None:
    """Explore branches when out-degree > 1 (backtracking; no path/vis copies per frame)."""
    for nxt in nbrs:
        tick()
        if nxt in vis:
            continue
        path.append(nxt)
        vis.add(nxt)
        branched = _extend_chain(outgoing, end_set, path, vis, nxt, global_events, tick)
        if not branched:
            le = _last_end_index(path, end_set)
            if le is not None:
                global_events.update(path[: le + 1])
        path.pop()
        vis.discard(nxt)


def _scan_from_start(
    s: str,
    outgoing: DefaultDict[str, List[str]],
    end_set: Set[str],
    tick: Callable[[], None],
) -> Set[str]:
    local_events: Set[str] = set()
    path: List[str] = [s]
    vis: Set[str] = {s}
    branched = _extend_chain(outgoing, end_set, path, vis, s, local_events, tick)
    if not branched:
        le = _last_end_index(path, end_set)
        if le is not None:
            local_events.update(path[: le + 1])
    return local_events


def _scan_edges_dfs(
    edges: List[Tuple[Hashable, Hashable]],
    start_events: Iterable[Hashable],
    end_events: Iterable[Hashable],
    progress_callback: Optional[Callable[[float], None]],
    should_cancel: Optional[Callable[[], bool]],
    outgoing: DefaultDict[str, List[str]],
    incoming: DefaultDict[str, List[str]],
    reachability_cache: Optional[Dict[frozenset, Set[str]]],
    *,
    use_minimal_starts: bool,
    use_reachability_prune: bool,
) -> Set[str]:
    """
    Legacy exact scan: walk the graph from each start, simple-path DFS at branches.

    Retained as a defensive fallback for the (impossible-by-construction) cyclic case
    so the output never silently changes. The acyclic path uses ``_scan_edges_reachable``.
    """
    if _use_rust_backend():
        if should_cancel and should_cancel():
            raise RuntimeError("Processing cancelled")
        if progress_callback:
            progress_callback(0.0)
        result = _scan_edges_rust(
            edges,
            start_events,
            end_events,
            use_minimal_starts=use_minimal_starts,
            use_reachability_prune=use_reachability_prune,
        )
        if progress_callback:
            progress_callback(1.0)
        if should_cancel and should_cancel():
            raise RuntimeError("Processing cancelled")
        return result

    end_set = canonical_event_id_set(end_events)

    start_list: List[str] = []
    for s in start_events or []:
        cs = canonical_event_id(s)
        if cs is not None and cs not in start_list:
            start_list.append(cs)

    if use_minimal_starts and len(start_list) > 1:
        reduced = _minimal_start_list(start_list, outgoing, incoming)
        if reduced:
            start_list = reduced

    if use_reachability_prune and end_set and start_list:
        can_reach = nodes_reaching_end(end_set, incoming, reachability_cache)
        start_list = [s for s in start_list if s in can_reach]

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
        if should_cancel and should_cancel():
            raise RuntimeError("Processing cancelled")
        if progress_callback and n_starts > 0:
            progress_callback(si / n_starts)
        tick(si)
        global_events.update(_scan_from_start(s, outgoing, end_set, lambda: tick(si)))
        if progress_callback and n_starts > 0:
            progress_callback((si + 1) / n_starts)

    if progress_callback and n_starts == 0:
        progress_callback(1.0)

    return global_events


def scan_edges(
    edges: List[Tuple[Hashable, Hashable]],
    start_events: Iterable[Hashable],
    end_events: Iterable[Hashable],
    progress_callback: Optional[Callable[[float], None]] = None,
    should_cancel: Optional[Callable[[], bool]] = None,
    outgoing: Optional[DefaultDict[str, List[str]]] = None,
    incoming: Optional[DefaultDict[str, List[str]]] = None,
    reachability_cache: Optional[Dict[frozenset, Set[str]]] = None,
    *,
    use_minimal_starts: bool = True,
    use_reachability_prune: bool = True,
) -> Set[str]:
    """
    Events on some path ``start -> ... -> end`` in the object-centric succession graph.

    The succession graph built from time-ordered events is acyclic, so the result is
    computed in O(V+E) as ``forward_reachable(starts) & nodes_reaching_end(ends)`` — the
    exact same set the simple-path DFS produced, without the exponential branch blow-up.
    If a cycle is ever present (not expected), it falls back to the legacy DFS so the
    output is identical in every case.
    """
    edges = edges or []
    if outgoing is None:
        outgoing = build_outgoing(edges)
    if incoming is None:
        incoming = build_incoming(outgoing)

    if not _has_cycle(outgoing):
        end_set = canonical_event_id_set(end_events)
        start_list: List[str] = []
        seen: Set[str] = set()
        for s in start_events or []:
            cs = canonical_event_id(s)
            if cs is not None and cs not in seen:
                seen.add(cs)
                start_list.append(cs)
        return _scan_edges_reachable(
            start_list,
            end_set,
            outgoing,
            incoming,
            reachability_cache,
            progress_callback,
            should_cancel,
        )

    return _scan_edges_dfs(
        edges,
        start_events,
        end_events,
        progress_callback,
        should_cancel,
        outgoing,
        incoming,
        reachability_cache,
        use_minimal_starts=use_minimal_starts,
        use_reachability_prune=use_reachability_prune,
    )
