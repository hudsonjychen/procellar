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

def _update_event_log(object_type_map, event_log, process_data):
    event_log = event_log.copy()

    Process.update_object_types(event_log["objectTypes"])

    for p in process_data:
        process = Process(process_name=p["processName"], rules=p["rules"], relations=[])
        
        process.update(event_log, object_type_map)

def update(object_type_map, event_log, process_data):
    _update_event_log(object_type_map=object_type_map, event_log=event_log, process_data=process_data)

if __name__ == "__main__":
    process_data = [
        {
            "processName": "order management",
            "rules": [
                {
                    "ruleName": "rule-a",
                    "parentProcess": "order management",
                    "includeOT": {
                        "entities": ["order", "item"],
                        "condition": []
                    },
                    "includeAct": {
                        "entities": [],
                        "condition": []
                    },
                    "excludeOT": {
                        "entities": [],
                        "condition": []
                    },
                    "excludeAct": {
                        "entities": ["order-cancelled"],
                        "condition": []
                    }
                },
                {
                    "ruleName": "rule-b",
                    "parentProcess": "order management",
                    "includeOT": {
                        "entities": ["item"],
                        "condition": []
                    },
                    "includeAct": {
                        "entities": [],
                        "condition": []
                    },
                    "excludeOT": {
                        "entities": [],
                        "condition": []
                    },
                    "excludeAct": {
                        "entities": [],
                        "condition": []
                    }
                }
            ],
            "relations": {
                "op": "or",
                "left": "rule-a",
                "right": "rule-b"
            }
        }
    ]
    path = "/Users/I767410/Desktop/ocpv/example-data/example_data.json"
    save_path = "/Users/I767410/Desktop/ocpv/example-data/example_data_1.json"
    log = _load_json(path)
    _update_event_log(log, process_data)
    _save_json(log, save_path)