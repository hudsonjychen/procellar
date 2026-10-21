"""Trace pipeline: match_events -> list_event_edges -> scan_edges."""
import importlib.util
import json
import os
import sys
import tempfile
import types

import pm4py

ROOT = os.path.join(os.path.dirname(__file__), "..")
ALGO = os.path.join(ROOT, "app", "algo")
sys.path.insert(0, ROOT)

app = types.ModuleType("app")
app_algo = types.ModuleType("app.algo")
sys.modules["app"] = app
sys.modules["app.algo"] = app_algo

for name in ("ids", "entity", "edges", "selector", "match", "scan", "trace"):
    path = os.path.join(ALGO, f"{name}.py")
    spec = importlib.util.spec_from_file_location(f"app.algo.{name}", path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[f"app.algo.{name}"] = mod
    spec.loader.exec_module(mod)

TraceRule = sys.modules["app.algo.trace"].TraceRule

ocel_json = {
    "objectTypes": [{"name": "order", "attributes": []}],
    "objects": [{"id": "o1", "type": "order", "attributes": []}],
    "events": [
        {
            "id": "e1",
            "type": "Register",
            "time": "2020-01-01T00:00:00+00:00",
            "attributes": [],
            "relationships": [{"objectId": "o1", "qualifier": ""}],
        },
        {
            "id": "e2",
            "type": "Create",
            "time": "2020-01-02T00:00:00+00:00",
            "attributes": [],
            "relationships": [{"objectId": "o1", "qualifier": ""}],
        },
        {
            "id": "e3",
            "type": "Ship",
            "time": "2020-01-03T00:00:00+00:00",
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

rule = TraceRule(
    "proc",
    "t1",
    [{"objectTypes": [], "activity": "Create"}],
    [{"objectTypes": [], "activity": "Ship"}],
)
ids = rule.get_traces(log)
print("matched (edges+scan):", ids)
assert "e2" in ids and "e3" in ids, ids
print("OK")
