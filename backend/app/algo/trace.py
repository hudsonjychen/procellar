from typing import Dict, List, Set

from pm4py.objects.ocel.obj import OCEL

from .match import match_events


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
        self.start_ot = start_ot
        self.start_act = start_act
        self.end_ot = end_ot
        self.end_act = end_act
        self.include_ot = include_ot
        self.include_act = include_act
        self.exclude_ot = exclude_ot
        self.exclude_act = exclude_act

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
    
    def get_traces(self, ocel: OCEL, traces):
        matched_events = self._match_events_by_entities(ocel)
        start_event_ids = matched_events["start"]
        end_event_ids = matched_events["end"]

        recorded_event_ids: Set[str] = set()

        for object_type_traces in traces.values():
            for trace in object_type_traces:
                if not trace:
                    continue

                start_index = None
                for idx, event in enumerate(trace):
                    event_id = event.get(ocel.event_id_column)
                    if event_id in start_event_ids:
                        start_index = idx
                        break

                end_index = None
                for idx in range(len(trace) - 1, -1, -1):
                    event_id = trace[idx].get(ocel.event_id_column)
                    if event_id in end_event_ids:
                        end_index = idx
                        break

                if (
                    start_index is not None
                    and end_index is not None
                    and start_index < end_index
                ):
                    for event in trace[start_index : end_index + 1]:
                        event_id = event.get(ocel.event_id_column)
                        if event_id is not None:
                            recorded_event_ids.add(event_id)

        return recorded_event_ids