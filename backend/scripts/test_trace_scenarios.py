"""
Pipeline scenarios: activity-only, OT-only, mixed OT+activity.
Run: python scripts/test_trace_scenarios.py
"""
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
for name in ("ids", "entity", "edges", "match", "scan", "trace"):
    path = os.path.join(ALGO, f"{name}.py")
    spec = importlib.util.spec_from_file_location(f"app.algo.{name}", path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[f"app.algo.{name}"] = mod
    spec.loader.exec_module(mod)

TraceRule = sys.modules["app.algo.trace"].TraceRule


def _trace_entity_list(value):
    if value is None:
        return []
    if isinstance(value, str):
        s = value.strip()
        return [s] if s else []
    if isinstance(value, list):
        return [str(x).strip() for x in value if x is not None and str(x).strip()]
    if isinstance(value, dict):
        ent = value.get("entities")
        return _trace_entity_list(ent) if isinstance(ent, list) else []
    return []


def load_ocel(data):
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8") as f:
        json.dump(data, f)
        path = f.name
    log = pm4py.read_ocel2_json(path)
    os.remove(path)
    return log


# One order object: Register -> Create -> Ship (same timeline, edges connect all)
SIMPLE = {
    "objectTypes": [
        {"name": "order", "attributes": []},
        {"name": "item", "attributes": []},
    ],
    "objects": [
        {"id": "o1", "type": "order", "attributes": []},
        {"id": "i1", "type": "item", "attributes": []},
    ],
    "events": [
        {
            "id": "e1",
            "type": "Register",
            "time": "2020-01-01T00:00:00+00:00",
            "attributes": [],
            "relationships": [
                {"objectId": "o1", "qualifier": ""},
                {"objectId": "i1", "qualifier": ""},
            ],
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
            "type": "Pack",
            "time": "2020-01-02T12:00:00+00:00",
            "attributes": [],
            "relationships": [{"objectId": "i1", "qualifier": ""}],
        },
        {
            "id": "e4",
            "type": "Ship",
            "time": "2020-01-03T00:00:00+00:00",
            "attributes": [],
            "relationships": [{"objectId": "o1", "qualifier": ""}],
        },
    ],
    "version": "2.0",
}

failures = []


def check(name, got, expected_subset, forbidden=None):
    got = set(got)
    forbidden = forbidden or set()
    missing = expected_subset - got
    bad = forbidden & got
    if missing or bad:
        failures.append(f"{name}: got={got}, missing={missing}, forbidden_present={bad}")
        print(f"FAIL {name}: got={got}")
    else:
        print(f"OK   {name}: {got}")


log = load_ocel(SIMPLE)

# 1) Activity-only
r1 = TraceRule("p", "act", [], ["Create"], [], ["Ship"], [], [], [], [])
check("activity-only", r1.get_traces(log), {"e2", "e4"})

# 2) OT-only (order lifecycle segment from first order event to last)
r2 = TraceRule("p", "ot", ["order"], [], ["order"], [], [], [], [], [])
ids2 = r2.get_traces(log)
# From e2 (first order-only? e1 also has order) - e1,e2,e4 on order timeline
check("ot-only-order", ids2, {"e2", "e4"}, forbidden=set())  # e1 may appear if path from e1

# 3) Mixed start: order + Create, end: order + Ship
r3 = TraceRule("p", "mix", ["order"], ["Create"], ["order"], ["Ship"], [], [], [], [])
check("mixed-ot-act", r3.get_traces(log), {"e2", "e4"})

# 4) Mixed both OTs on start (order+item on same event) - only e1 has both
r4 = TraceRule("p", "mix2", ["order", "item"], ["Register"], ["order"], ["Ship"], [], [], [], [])
check("mixed-multi-ot-start", r4.get_traces(log), {"e1", "e2", "e4"})  # path e1->? order edges e1-e2-e4

# 5) Payload normalization (entities wrapper)
payload = {
    "startOT": {"entities": ["order"]},
    "startAct": ["Create"],
    "endOT": {"entities": ["order"]},
    "endAct": ["Ship"],
}
r5 = TraceRule(
    "p",
    "norm",
    _trace_entity_list(payload["startOT"]),
    _trace_entity_list(payload["startAct"]),
    _trace_entity_list(payload["endOT"]),
    _trace_entity_list(payload["endAct"]),
    [],
    [],
    [],
    [],
)
check("entities-wrapper", r5.get_traces(log), {"e2", "e4"})

# 6) No graph path: start on item timeline only, end on order only
r6 = TraceRule("p", "disconnected", [], ["Pack"], [], ["Create"], [], [], [], [])
ids6 = r6.get_traces(log)
check("disconnected-act", ids6, set(), forbidden={"e2", "e3", "e4"})

if failures:
    print("\n--- FAILURES ---")
    for f in failures:
        print(f)
    sys.exit(1)
print("\nAll scenarios passed.")
