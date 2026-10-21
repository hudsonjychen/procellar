"""Verify enriched OCEL process tags against trace rule definitions."""
import importlib.util
import json
import os
import sys
import types
from collections import defaultdict

ROOT = os.path.join(os.path.dirname(__file__), "..")
ALGO = os.path.join(ROOT, "app", "algo")
sys.path.insert(0, ROOT)
sys.modules["app"] = types.ModuleType("app")
sys.modules["app.algo"] = types.ModuleType("app.algo")
for name in ("ids", "entity", "edges", "match", "scan", "trace", "rule", "process", "map", "check", "update"):
    path = os.path.join(ALGO, f"{name}.py")
    spec = importlib.util.spec_from_file_location(f"app.algo.{name}", path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[f"app.algo.{name}"] = mod
    spec.loader.exec_module(mod)

ocel_from_event_log = sys.modules["app.algo.update"].ocel_from_event_log
update = sys.modules["app.algo.update"].update
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
            "traceName": "r1",
            "parentProcess": "Order - Invoice",
            "startOT": ["order"],
            "startAct": [],
            "endOT": ["invoice"],
            "endAct": [],
            "includeOT": [],
            "includeAct": [],
            "excludeOT": [],
            "excludeAct": [],
        }],
    },
    {
        "processName": "Order - Shipment",
        "traces": [{
            "traceName": "r1",
            "parentProcess": "Order - Shipment",
            "startOT": ["order"],
            "startAct": [],
            "endOT": ["shipment"],
            "endAct": [],
            "includeOT": [],
            "includeAct": [],
            "excludeOT": [],
            "excludeAct": [],
        }],
    },
    {
        "processName": "Shipment - Return",
        "traces": [{
            "traceName": "r1",
            "parentProcess": "Shipment - Return",
            "startOT": ["shipment"],
            "startAct": [],
            "endOT": ["return"],
            "endAct": [],
            "includeOT": [],
            "includeAct": [],
            "excludeOT": [],
            "excludeAct": [],
        }],
    },
]


def strip_process_links(ocel_json):
    out = json.loads(json.dumps(ocel_json))
    out["events"] = []
    for ev in ocel_json.get("events") or []:
        ev2 = json.loads(json.dumps(ev))
        ev2["relationships"] = [
            r for r in (ev2.get("relationships") or [])
            if r.get("qualifier") != "process"
        ]
        out["events"].append(ev2)
    out["objects"] = [
        o for o in (out.get("objects") or [])
        if o.get("type") != "process"
    ]
    ot = out.get("objectTypes") or []
    out["objectTypes"] = [t for t in ot if t.get("name") != "process"]
    return out


def actual_process_tags(ocel_json):
    tags = defaultdict(set)
    for ev in ocel_json.get("events") or []:
        eid = ev.get("id")
        for r in ev.get("relationships") or []:
            if r.get("qualifier") == "process":
                tags[eid].add(r.get("objectId"))
    return tags


def expected_process_tags(base_json):
    log = ocel_from_event_log(base_json)
    edges = list_event_edges(log)
    outgoing = build_outgoing(edges)
    etot = build_event_to_object_types(log)

    expected = defaultdict(set)
    for proc in PROCESSES:
        pname = proc["processName"]
        for tr in proc["traces"]:
            rule = TraceRule(
                parent_process=tr["parentProcess"],
                trace_name=tr["traceName"],
                start_ot=tr["startOT"],
                start_act=tr["startAct"],
                end_ot=tr["endOT"],
                end_act=tr["endAct"],
                include_ot=tr.get("includeOT") or [],
                include_act=tr.get("includeAct") or [],
                exclude_ot=tr.get("excludeOT") or [],
                exclude_act=tr.get("excludeAct") or [],
            )
            matched = rule.get_traces(
                log, edges=edges, outgoing=outgoing, event_to_object_types=etot
            )
            for eid in matched:
                expected[str(eid)].add(pname)
    return expected


def compare(enriched_path):
    with open(enriched_path, encoding="utf-8") as f:
        enriched = json.load(f)

    base = strip_process_links(enriched)
    actual = actual_process_tags(enriched)
    expected = expected_process_tags(base)

    all_eids = sorted(set(actual) | set(expected), key=lambda x: (len(x), x))
    mismatches = []
    for eid in all_eids:
        a = actual.get(eid, set())
        e = expected.get(eid, set())
        if a != e:
            mismatches.append((eid, e, a))

    print("=== Process rule alignment check ===")
    print(f"Events with expected tags: {sum(1 for eid in all_eids if expected.get(eid))}")
    print(f"Mismatches: {len(mismatches)}")
    if mismatches:
        print("\n--- MISMATCHES ---")
        for eid, e, a in mismatches:
            ev = next(x for x in enriched["events"] if x["id"] == eid)
            print(f"  {eid} ({ev['type']})")
            print(f"    expected: {sorted(e)}")
            print(f"    actual:   {sorted(a)}")
            print(f"    missing:  {sorted(e - a)}")
            print(f"    extra:    {sorted(a - e)}")
    else:
        print("All process tags align with trace rules.")

    print("\n=== Per-process event counts (expected) ===")
    by_proc = defaultdict(list)
    for eid, procs in expected.items():
        for p in procs:
            by_proc[p].append(eid)
    for p in sorted(by_proc):
        print(f"  {p}: {len(by_proc[p])} events -> {by_proc[p][:8]}{'...' if len(by_proc[p])>8 else ''}")

    print("\n=== Per-process event counts (actual) ===")
    by_proc_a = defaultdict(list)
    for eid, procs in actual.items():
        for p in procs:
            by_proc_a[p].append(eid)
    for p in sorted(by_proc_a):
        print(f"  {p}: {len(by_proc_a[p])} events")

    print("\n=== Spot checks ===")
    checks = [
        ("e020", "cancelled o4 create-order", set()),
        ("e022", "cancelled o4 order-cancelled", set()),
        ("e003", "o1 invoice-issued", {"Order - Invoice", "Order - Shipment"}),
        ("e005", "o1 package-prepared", {"Order - Shipment"}),
        ("e042", "o7 return-initiated", {"Order - Shipment", "Shipment - Return"}),
        ("e043", "o7 return-completed", {"Order - Shipment", "Shipment - Return"}),
    ]
    for eid, label, exp_subset in checks:
        e = expected.get(eid, set())
        a = actual.get(eid, set())
        ok = exp_subset.issubset(e) and e == a
        print(f"  {'OK' if ok else 'CHECK'} {eid} {label}: expected={sorted(e)} actual={sorted(a)}")

    return len(mismatches) == 0


if __name__ == "__main__":
    path = os.path.join(ROOT, "..", "example-data", "example-data-2.json")
    if len(sys.argv) > 1:
        path = sys.argv[1]
    ok = compare(path)
    sys.exit(0 if ok else 1)
