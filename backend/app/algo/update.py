import pm4py
import json
from .map import map_object_id_to_type
from .process import Process

def _load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def _save_json(data, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def _get_map(path):
    return map_object_id_to_type(pm4py.read_ocel2_json(path))

def _update_event_log(object_type_map, object_attr_map, event_log, process_data):
    Process.update_object_types(event_log["objectTypes"])

    for p in process_data:
        process = Process(process_name=p.get("processName"), rules=p.get("rules"), relations=p.get("relations"))
        process.update(event_log, object_type_map, object_attr_map)

def update(object_type_map, object_attr_map, event_log, process_data):
    _update_event_log(object_type_map=object_type_map, object_attr_map=object_attr_map, event_log=event_log, process_data=process_data)
