from typing import Callable, DefaultDict, Dict, Hashable, List, Optional, Set, Tuple

from pm4py.objects.ocel.obj import OCEL

from .edges import list_event_edges
from .ids import canonical_event_id_set
from .match import filter_trace_events, match_events_start_and_end, trace_rule_signature
from .scan import build_incoming, build_outgoing, scan_edges


class TraceRule:
    """
    A trace rule described by four selector lists.

    Each selector matches events of its activity (at most one) that are related to all
    of its object types; selectors within a list are combined with OR.
    """

    def __init__(
        self,
        parent_process: str,
        trace_name: str,
        start: List[dict],
        end: List[dict],
        include: Optional[List[dict]] = None,
        exclude: Optional[List[dict]] = None,
    ):
        self.parent_process = parent_process
        self.trace_name = trace_name
        self.start = list(start or [])
        self.end = list(end or [])
        self.include = list(include or [])
        self.exclude = list(exclude or [])

    def __repr__(self):
        return (
            f"{self.__class__.__name__}("
            f"parent_process={self.parent_process!r}, "
            f"trace_name={self.trace_name!r}, "
            f"start={self.start!r}, "
            f"end={self.end!r}, "
            f"include={self.include!r}, "
            f"exclude={self.exclude!r})"
        )

    def cache_signature(self) -> Tuple[Tuple, Tuple, Tuple, Tuple]:
        return trace_rule_signature(
            self.start,
            self.end,
            self.include,
            self.exclude,
        )

    def _match_events_by_entities(
        self,
        ocel: OCEL,
        event_to_object_types: Optional[Dict[str, Set[str]]] = None,
    ) -> Dict[str, Set[str]]:
        return match_events_start_and_end(
            ocel=ocel,
            start_selectors=self.start,
            end_selectors=self.end,
            event_to_object_types=event_to_object_types,
        )

    def get_traces(
        self,
        ocel: OCEL,
        edges: Optional[List] = None,
        outgoing: Optional[DefaultDict[str, List[str]]] = None,
        incoming: Optional[DefaultDict[str, List[str]]] = None,
        scan_progress_callback: Optional[Callable[[float], None]] = None,
        should_cancel: Optional[Callable[[], bool]] = None,
        event_to_object_types: Optional[Dict[str, Set[str]]] = None,
        scan_cache: Optional[dict] = None,
        reachability_cache: Optional[Dict[frozenset, Set[str]]] = None,
        **_legacy,
    ) -> Set[Hashable]:
        """
        1. ``match_events_start_and_end`` — start / end event ids.
        2. ``scan_edges`` — graph walk on object-centric succession edges (DFS on
           branches; O(V+E) reachability on the acyclic case).
        3. ``filter_trace_events`` — apply the include / exclude selectors.
        """
        if scan_progress_callback:
            scan_progress_callback(0.0)

        matched_events = self._match_events_by_entities(
            ocel, event_to_object_types=event_to_object_types
        )
        start_event_ids = matched_events["start"]
        end_event_ids = matched_events["end"]

        if scan_progress_callback:
            scan_progress_callback(0.15)

        if should_cancel and should_cancel():
            raise RuntimeError("Processing cancelled")

        scan_key = (
            frozenset(canonical_event_id_set(start_event_ids)),
            frozenset(canonical_event_id_set(end_event_ids)),
        )
        if scan_cache is not None and scan_key in scan_cache:
            path_ids = set(scan_cache[scan_key])
        else:
            if edges is None:
                edges = list_event_edges(ocel, should_cancel=should_cancel)
            if outgoing is None:
                outgoing = build_outgoing(edges)
            if incoming is None:
                incoming = build_incoming(outgoing)

            path_ids = scan_edges(
                edges,
                start_event_ids,
                end_event_ids,
                progress_callback=(
                    (lambda t: scan_progress_callback(0.15 + 0.70 * t))
                    if scan_progress_callback
                    else None
                ),
                should_cancel=should_cancel,
                outgoing=outgoing,
                incoming=incoming,
                reachability_cache=reachability_cache,
            )

            if scan_cache is not None:
                scan_cache[scan_key] = set(path_ids)

        if scan_progress_callback:
            scan_progress_callback(0.85)

        result = filter_trace_events(
            ocel=ocel,
            event_ids=path_ids,
            include_selectors=self.include,
            exclude_selectors=self.exclude,
            event_to_object_types=event_to_object_types,
        )

        if scan_progress_callback:
            scan_progress_callback(1.0)

        return result
