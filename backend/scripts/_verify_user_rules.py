"""Apply trace rules to example-data-2 and verify alignment."""
import copy
import importlib.util
import json
import os
import sys
import types
from collections import defaultdict

ROOT = os.path.join(os.path.dirname(__file__), "..")
ALGO = os.path.join(ROOT, "app", "algo")
DATA = os.path.join(ROOT, "..", "example-data", "example-data-2.json")
sys.path.insert(0, ROOT)
sys.modules["app"] = types.ModuleType("app")
sys.modules["app.algo"] = types.ModuleType("app.algo")
for name in ("ids", "entity", "edges", "match", "scan", "trace", "rule", "process", "map", "check", "update"):
    path = os.path.join(ALGO, f"{name}.py")
    spec = importlib.util.spec_from_file_location(f"app.algo.{name}", path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[f"app.algo.{name}"] = mod
    spec.loader.exec_module(mod)

update = sys.modules["app.algo.update"].update
ocel_from_event_log = sys.modules["app.algo.update"].ocel_from_event_log
map_object_id_to_type = sys.modules["app.algo.map"].map_object_id_to_type
map_attribute_to_object = sys.modules["app.algo.map"].map_attribute_to_object
TraceRule = sys.modules["app.algo.trace"].TraceRule
list_event_edges = sys.modules["app.algo.edges"].list_event_edges
build_outgoing = sys.modules["app.algo.scan"].build_outgoing
build_event_to_object_types = sys.modules["app.algo.match"].build_event_to_object_types

PROCESSES = [
    {
        "processName": "Order - Invoice",
        "traces": [{
            "traceName": "r1", "parentProcess": "Order - Invoice",
            "startOT": ["order"], "startAct": [], "endOT": ["invoice"], "endAct": [],
            "includeOT": [], "includeAct": [], "excludeOT": [], "excludeAct": [],
        }],
    },
    {
        "processName": "Order - Shipment",
        "traces": [{
            "traceName": "r1", "parentProcess": "Order - Shipment",
            "startOT": ["order"], "startAct": [], "endOT": ["shipment"], "endAct": [],
            "includeOT": [], "includeAct": [], "excludeOT": [], "excludeAct": [],
        }],
    },
    {
        "processName": "Shipment - Return",
        "traces": [{
            "traceName": "r1", "parentProcess": "Shipment - Return",
            "startOT": ["shipment"], "startAct": [], "endOT": ["return"], "endAct": [],
            "includeOT": [], "includeAct": [], "excludeOT": [], "excludeAct": [],
        }],
    },
]


def tags_from_log(event_log):
    out = defaultdict(set)
    for ev in event_log.get("events") or []:
        for r in ev.get("relationships") or []:
            if r.get("qualifier") == "process":
                out[ev["id"]].add(r["objectId"])
    return out


def expected_tags(base_json):
    log = ocel_from_event_log(base_json)
    edges = list_event_edges(log)
    outgoing = build_outgoing(edges)
    etot = build_event_to_object_types(log)
    expected = defaultdict(set)
    for proc in PROCESSES:
        pname = proc["processName"]
        tr = proc["traces"][0]
        rule = TraceRule(
            pname, tr["traceName"], tr["startOT"], tr["startAct"],
            tr["endOT"], tr["endAct"], [], [], [], [],
        )
        for eid in rule.get_traces(log, edges=edges, outgoing=outgoing, event_to_object_types=etot):
            expected[str(eid)].add(pname)
    return expected


def main():
    with open(DATA, encoding="utf-8") as f:
        base = json.load(f)

    expected = expected_tags(base)

    event_log = copy.deepcopy(base)
    log = ocel_from_event_log(base)
    otm = map_object_id_to_type(log)
    oam = map_attribute_to_object(event_log)
    update(otm, oam, event_log, PROCESSES, deleted_processes=set(), ocel=log)
    actual = tags_from_log(event_log)

    mismatches = []
    all_ids = sorted(set(expected) | set(actual), key=lambda x: (len(x), x))
    for eid in all_ids:
        if expected.get(eid, set()) != actual.get(eid, set()):
            mismatches.append(eid)

    print("=== example-data-2 + your 3 trace processes ===\n")
    for pname in ["Order - Invoice", "Order - Shipment", "Shipment - Return"]:
        evs = sorted(e for e, ps in expected.items() if pname in ps)
        print(f"{pname}: {len(evs)} events")

    print("\n--- Cancelled orders (o4, o9) ---")
    for eid in ["e020", "e021", "e022", "e053", "e054", "e055"]:
        ev = next(e for e in base["events"] if e["id"] == eid)
        print(f"  {eid} {ev['type']}: {sorted(expected.get(eid, set())) or '(none)'}")

    print("\n--- Return flow (o7) ---")
    for eid in ["e040", "e041", "e042", "e043"]:
        ev = next(e for e in base["events"] if e["id"] == eid)
        print(f"  {eid} {ev['type']}: {sorted(expected.get(eid, set()))}")

    print("\n--- Invoice-only vs shipment-only (o1) ---")
    for eid in ["e001", "e003", "e004", "e005", "e006", "e007"]:
        ev = next(e for e in base["events"] if e["id"] == eid)
        print(f"  {eid} {ev['type']}: {sorted(expected.get(eid, set()))}")

    print(f"\nBackend update() mismatches vs recomputed rules: {len(mismatches)}")
    if mismatches:
        for eid in mismatches[:10]:
            print(f"  {eid}: expected={expected.get(eid)} actual={actual.get(eid)}")

    # Compare with user-pasted patterns from message
    user_samples = {
        "e001": {"Order - Invoice", "Order - Shipment"},
        "e005": {"Order - Shipment"},
        "e020": set(),
        "e042": {"Order - Shipment", "Shipment - Return"},
    }
    print("\n--- vs your pasted enriched OCEL samples ---")
    for eid, user in user_samples.items():
        exp = expected.get(eid, set())
        match = exp == user
        print(f"  {'OK' if match else 'DIFF'} {eid}: rules={sorted(exp)} yours={sorted(user)}")


if __name__ == "__main__":
    main()
