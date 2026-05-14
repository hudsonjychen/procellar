from typing import Callable, Optional

import pm4py
import json
import os
import tempfile
from .map import map_object_id_to_type
from .process import RuleProcess, TraceProcess, _ensure_event_log_structure

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
    scan_progress_callback: Optional[Callable[[float], None]] = None,
):
    def _progress(value):
        if progress_callback:
            progress_callback(max(0.0, min(1.0, value)))

    if should_cancel and should_cancel():
        raise RuntimeError("Processing cancelled")

    _ensure_event_log_structure(event_log)

    RuleProcess.update_object_types(event_log["objectTypes"])
    RuleProcess.clear_process_objects(
        objects=event_log["objects"],
        deleted_processes=deleted_processes,
    )
    _progress(0.05)

    has_trace_processes = any(
        isinstance(p, dict)
        and isinstance(p.get("traces"), list)
        and len(p.get("traces") or []) > 0
        for p in (process_data or [])
    )
    ocel = _to_ocel(event_log) if has_trace_processes else None
    _progress(0.15)
    _progress(0.40)

    total = len(process_data or []) or 1
    n_trace_targets = sum(
        1
        for p in (process_data or [])
        if isinstance(p, dict)
        and isinstance(p.get("traces"), list)
        and len(p.get("traces") or []) > 0
        and ocel is not None
    )
    trace_pass = 0

    for idx, p in enumerate(process_data or []):
        if should_cancel and should_cancel():
            raise RuntimeError("Processing cancelled")
        if not isinstance(p, dict) or "processName" not in p:
            continue

        # Use non-empty lists only. JSON often has ``"rules": null`` alongside traces; ``"rules" in p``
        # would wrongly pick RuleProcess with zero rules so no event ever gets a process link.
        rules_list = p.get("rules")
        traces_list = p.get("traces")
        use_rules = isinstance(rules_list, list) and len(rules_list) > 0
        use_traces = isinstance(traces_list, list) and len(traces_list) > 0 and ocel is not None

        if use_rules:
            process = RuleProcess(
                process_name=p.get("processName"),
                rules=rules_list,
                relations=p.get("relations"),
            )
            process.update(
                event_log,
                object_type_map,
                object_attr_map,
                deleted_processes=deleted_processes,
                should_cancel=should_cancel,
            )
        elif use_traces:
            process = TraceProcess(
                process_name=p.get("processName"),
                rules=traces_list,
            )
            base_idx = trace_pass

            def wrapped_scan(t: float, base: int = base_idx) -> None:
                if scan_progress_callback and n_trace_targets:
                    scan_progress_callback((base + t) / n_trace_targets)

            process.update(
                ocel=ocel,
                event_log=event_log,
                deleted_processes=deleted_processes,
                should_cancel=should_cancel,
                scan_progress_callback=wrapped_scan if scan_progress_callback else None,
            )
            trace_pass += 1
        _progress(0.40 + 0.60 * ((idx + 1) / total))

def update(
    object_type_map,
    object_attr_map,
    event_log,
    process_data,
    deleted_processes,
    progress_callback=None,
    should_cancel=None,
    scan_progress_callback: Optional[Callable[[float], None]] = None,
):
    _update_event_log(
        object_type_map=object_type_map,
        object_attr_map=object_attr_map,
        event_log=event_log,
        process_data=process_data,
        deleted_processes=deleted_processes,
        progress_callback=progress_callback,
        should_cancel=should_cancel,
        scan_progress_callback=scan_progress_callback,
    )
