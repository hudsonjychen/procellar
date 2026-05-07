from typing import Dict, List

from pm4py.objects.conversion.log import converter as log_converter
from pm4py.objects.log.obj import EventLog, Trace
from pm4py.objects.ocel.obj import OCEL

from .entity import get_object_types


def _flatten_ocel_by_object_type(ocel: OCEL, object_type: str):
    """
    Flatten an OCEL into a classical log representation for one object type.
    Supports multiple pm4py API layouts.
    """
    try:
        from pm4py.objects.ocel.util import flattening

        return flattening.flatten(ocel, object_type)
    except Exception:
        import pm4py

        if hasattr(pm4py, "ocel_flattening"):
            return pm4py.ocel_flattening(ocel, object_type)
        raise


def _detect_case_id_column(flattened_log) -> str:
    if "case:concept:name" in flattened_log.columns:
        return "case:concept:name"

    for col in flattened_log.columns:
        if "case" in str(col).lower():
            return col

    raise ValueError(
        "Unable to detect case id column in flattened log. "
        "Expected a column like 'case:concept:name'."
    )


def _to_traces(flattened_log) -> List[Trace]:
    if isinstance(flattened_log, EventLog):
        return list(flattened_log)

    case_id_column = _detect_case_id_column(flattened_log)
    event_log = log_converter.apply(
        flattened_log,
        variant=log_converter.Variants.TO_EVENT_LOG,
        parameters={
            log_converter.Variants.TO_EVENT_LOG.value.Parameters.CASE_ID_KEY: case_id_column
        },
    )
    return list(event_log)


def _sort_trace_events_by_timestamp(traces: List[Trace], should_cancel=None) -> List[Trace]:
    timestamp_key = "time:timestamp"
    sorted_traces = []
    for trace in traces:
        if should_cancel and should_cancel():
            raise RuntimeError("Processing cancelled")
        sorted_events = sorted(list(trace), key=lambda e: e.get(timestamp_key))

        # pm4py Trace implementations are not always mutable list-like objects.
        # Keep Trace objects when they expose an internal list; otherwise
        # gracefully fall back to a plain list of ordered events.
        if hasattr(trace, "_list"):
            trace._list = sorted_events
            sorted_traces.append(trace)
        else:
            sorted_traces.append(sorted_events)

    return sorted_traces


def split_ocel_into_traces(ocel: OCEL, should_cancel=None, progress_callback=None) -> Dict[str, List[Trace]]:
    """
    Split an OCEL into classical traces for every object type found in the OCEL.

    Steps:
    1) Get all object types from the OCEL.
    2) Flatten OCEL for each object type.
    3) Convert each flattened log into classical traces.
    4) Return a dictionary: {object_type: [trace, ...]}.
    """
    traces_by_object_type: Dict[str, List[Trace]] = {}
    object_types = list(get_object_types(ocel))
    total = len(object_types) or 1

    for idx, object_type in enumerate(object_types):
        if should_cancel and should_cancel():
            raise RuntimeError("Processing cancelled")
        flattened_log = _flatten_ocel_by_object_type(ocel, object_type)
        traces = _to_traces(flattened_log)
        traces_by_object_type[object_type] = _sort_trace_events_by_timestamp(traces, should_cancel=should_cancel)
        if progress_callback:
            progress_callback((idx + 1) / total)

    return traces_by_object_type
