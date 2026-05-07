import pm4py
import json
import os
import tempfile
from .map import map_object_id_to_type
from .process import RuleProcess, TraceProcess
from .split import split_ocel_into_traces

def _load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def _save_json(data, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def _get_map(path):
    return map_object_id_to_type(pm4py.read_ocel2_json(path))


def _to_ocel(event_log):
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".json", encoding="utf-8") as temp:
            json.dump(event_log, temp, ensure_ascii=False)
            temp_path = temp.name
        return pm4py.read_ocel2_json(temp_path)
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


def _update_event_log(
    object_type_map,
    object_attr_map,
    event_log,
    process_data,
    deleted_processes,
    progress_callback=None,
    should_cancel=None,
):
    def _progress(value):
        if progress_callback:
            progress_callback(max(0.0, min(1.0, value)))

    if should_cancel and should_cancel():
        raise RuntimeError("Processing cancelled")

    RuleProcess.update_object_types(event_log["objectTypes"])
    RuleProcess.clear_process_objects(objects=event_log["objects"], deleted_processes=deleted_processes)
    _progress(0.05)

    has_trace_processes = any(isinstance(p, dict) and "traces" in p for p in process_data)
    ocel = _to_ocel(event_log) if has_trace_processes else None
    _progress(0.15)
    traces_by_object_type = (
        split_ocel_into_traces(
            ocel,
            should_cancel=should_cancel,
            progress_callback=lambda p: _progress(0.15 + 0.25 * p),
        )
        if ocel is not None
        else None
    )
    _progress(0.40)

    total = len(process_data) or 1
    for idx, p in enumerate(process_data):
        if should_cancel and should_cancel():
            raise RuntimeError("Processing cancelled")
        if not isinstance(p, dict) or "processName" not in p:
            continue

        if "rules" in p:
            process = RuleProcess(
                process_name=p.get("processName"),
                rules=p.get("rules", []),
                relations=p.get("relations"),
            )
            process.update(
                event_log,
                object_type_map,
                object_attr_map,
                deleted_processes=deleted_processes,
                should_cancel=should_cancel,
            )
        elif "traces" in p and ocel is not None and traces_by_object_type is not None:
            process = TraceProcess(
                process_name=p.get("processName"),
                rules=p.get("traces", []),
            )
            process.update(
                ocel=ocel,
                traces=traces_by_object_type,
                event_log=event_log,
                deleted_processes=deleted_processes,
                should_cancel=should_cancel,
            )
        _progress(0.40 + 0.60 * ((idx + 1) / total))

def update(
    object_type_map,
    object_attr_map,
    event_log,
    process_data,
    deleted_processes,
    progress_callback=None,
    should_cancel=None,
):
    _update_event_log(
        object_type_map=object_type_map,
        object_attr_map=object_attr_map,
        event_log=event_log,
        process_data=process_data,
        deleted_processes=deleted_processes,
        progress_callback=progress_callback,
        should_cancel=should_cancel,
    )
