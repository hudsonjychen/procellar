"""Diagnostic without importing app package (no Flask)."""
import importlib.util
import json
import os
import sys
import tempfile
import types

import pm4py

ALGO = os.path.join(os.path.dirname(__file__), "..", "app", "algo")

sys.modules.setdefault("app", types.ModuleType("app"))
sys.modules.setdefault("app.algo", types.ModuleType("app.algo"))


def _load(name, path):
    spec = importlib.util.spec_from_file_location(f"app.algo.{name}", path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[f"app.algo.{name}"] = mod
    spec.loader.exec_module(mod)
    return mod


edges = _load("ids", os.path.join(ALGO, "ids.py"))
edges = _load("edges", os.path.join(ALGO, "edges.py"))
selector_mod = _load("selector", os.path.join(ALGO, "selector.py"))
match_mod = _load("match", os.path.join(ALGO, "match.py"))
scan_mod = _load("scan", os.path.join(ALGO, "scan.py"))
trace_mod = _load("trace", os.path.join(ALGO, "trace.py"))

match_events = match_mod.match_events
TraceRule = trace_mod.TraceRule

ocel_json = {
    "objectTypes": [{"name": "order", "attributes": []}],
    "objects": [{"id": "o1", "type": "order", "attributes": []}],
    "events": [
        {
            "id": "e1",
            "type": "Create",
            "time": "2020-01-01T00:00:00+00:00",
            "attributes": [],
            "relationships": [{"objectId": "o1", "qualifier": ""}],
        },
        {
            "id": "e2",
            "type": "Ship",
            "time": "2020-01-02T00:00:00+00:00",
            "attributes": [],
            "relationships": [{"objectId": "o1", "qualifier": ""}],
        },
    ],
    "version": "2.0",
}

with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8") as f:
    json.dump(ocel_json, f)
    path = f.name

log = pm4py.read_ocel2_json(path)
os.remove(path)

print("event_id_column:", log.event_id_column)
print("event_activity:", log.event_activity)
print(log.events[[log.event_id_column, log.event_activity]])

start = [{"objectTypes": [], "activity": "Create"}]
end = [{"objectTypes": [], "activity": "Ship"}]

m_start = match_events(log, start, match_type="start")
m_end = match_events(log, end, match_type="end")
print("match start:", m_start)
print("match end:", m_end)

tr = TraceRule("p", "t", start, end)
print("trace ids:", tr.get_traces(log))
