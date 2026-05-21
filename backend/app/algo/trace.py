from typing import Callable, Dict, Hashable, List, Optional, Set, Tuple

from pm4py.objects.ocel.obj import OCEL

from .edges import list_event_edges
from .match import match_events
from .scan import scan_edges


class TraceRule:
    def __init__(
        self,
        parent_process: str,
        trace_name: str,
        start_ot: List[str],
        start_act: List[str],
        end_ot: List[str],
        end_act: List[str],
        include_ot: List[str],
        include_act: List[str],
        exclude_ot: List[str],
        exclude_act: List[str],
    ):
        self.parent_process = parent_process
        self.trace_name = trace_name
        self.start_ot = list(start_ot or [])
        self.start_act = list(start_act or [])
        self.end_ot = list(end_ot or [])
        self.end_act = list(end_act or [])
        self.include_ot = list(include_ot or [])
        self.include_act = list(include_act or [])
        self.exclude_ot = list(exclude_ot or [])
        self.exclude_act = list(exclude_act or [])

    def __repr__(self):
        return (
            f"{self.__class__.__name__}("
            f"parent_process={self.parent_process!r}, "
            f"trace_name={self.trace_name!r}, "
            f"start_ot={self.start_ot!r}, "
            f"start_act={self.start_act!r}, "
            f"end_ot={self.end_ot!r}, "
            f"end_act={self.end_act!r}, "
            f"include_ot={self.include_ot!r}, "
            f"include_act={self.include_act!r}, "
            f"exclude_ot={self.exclude_ot!r}, "
            f"exclude_act={self.exclude_act!r}, "
            ")"
        )

    def _match_events_by_entities(self, ocel: OCEL) -> Dict[str, Set[str]]:
        start_matches = match_events(
            ocel=ocel,
            object_types=self.start_ot,
            activities=self.start_act,
            match_type="start",
        )
        end_matches = match_events(
            ocel=ocel,
            object_types=self.end_ot,
            activities=self.end_act,
            match_type="end",
        )
        return {
            "start": start_matches["start"],
            "end": end_matches["end"],
        }

    def get_traces(
        self,
        ocel: OCEL,
        edges: Optional[List] = None,
        scan_progress_callback: Optional[Callable[[float], None]] = None,
        should_cancel: Optional[Callable[[], bool]] = None,
    ) -> Set[Hashable]:
        """
        1. ``match_events`` — start / end event ids.
        2. ``scan_edges`` on pre-built edges (built once per process in ``TraceProcess``).
        """
        if scan_progress_callback:
            scan_progress_callback(0.0)

        matched_events = self._match_events_by_entities(ocel)
        start_event_ids = matched_events["start"]
        end_event_ids = matched_events["end"]

        if scan_progress_callback:
            scan_progress_callback(0.15)

        if should_cancel and should_cancel():
            raise RuntimeError("Processing cancelled")

        if edges is None:
            edges = list_event_edges(ocel, should_cancel=should_cancel)

        result = scan_edges(
            edges,
            start_event_ids,
            end_event_ids,
            progress_callback=(
                (lambda t: scan_progress_callback(0.15 + 0.85 * t))
                if scan_progress_callback
                else None
            ),
            should_cancel=should_cancel,
        )

        if scan_progress_callback:
            scan_progress_callback(1.0)

        return result
