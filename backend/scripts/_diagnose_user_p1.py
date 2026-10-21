"""Diagnose p1 trace rule on user test data."""
import importlib.util
import copy
import os
import sys
import types

import pm4py

ROOT = os.path.join(os.path.dirname(__file__), "..")
ALGO = os.path.join(ROOT, "app", "algo")
sys.path.insert(0, ROOT)
sys.modules["app"] = types.ModuleType("app")
sys.modules["app.algo"] = types.ModuleType("app.algo")
for name in ("ids", "entity", "edges", "match", "scan", "trace", "rule", "process", "map", "check", "update"):
    path = os.path.join(ALGO, f"{name}.py")
    if name == "map":
        path = os.path.join(ROOT, "app", "algo", "map.py")
    spec = importlib.util.spec_from_file_location(f"app.algo.{name}", path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[f"app.algo.{name}"] = mod
    spec.loader.exec_module(mod)

ocel_from_event_log = sys.modules["app.algo.update"].ocel_from_event_log
update = sys.modules["app.algo.update"].update
map_object_id_to_type = sys.modules["app.algo.map"].map_object_id_to_type
map_attribute_to_object = sys.modules["app.algo.map"].map_attribute_to_object
build_event_to_object_types = sys.modules["app.algo.match"].build_event_to_object_types
match_events_start_and_end = sys.modules["app.algo.match"].match_events_start_and_end
list_event_edges = sys.modules["app.algo.edges"].list_event_edges
build_object_timelines = sys.modules["app.algo.edges"].build_object_timelines
build_outgoing = sys.modules["app.algo.scan"].build_outgoing
scan_edges = sys.modules["app.algo.scan"].scan_edges
scan_single_entity = sys.modules["app.algo.scan"].scan_single_entity
TraceRule = sys.modules["app.algo.trace"].TraceRule

OCEL_JSON = {
    "eventTypes": [
        {"attributes": [{"name": "total-items", "type": "integer"}], "name": "create-order"},
        {"attributes": [{"name": "confirmation-code", "type": "string"}], "name": "order-confirmation"},
        {"attributes": [{"name": "total-items", "type": "integer"}], "name": "create-order"},
        {"attributes": [{"name": "reason", "type": "string"}], "name": "order-cancelled"},
        {"attributes": [{"name": "warehouse-id", "type": "string"}], "name": "package-prepared"},
        {"attributes": [{"name": "logistics-provider", "type": "string"}], "name": "shipment-started"},
        {"attributes": [{"name": "recipient", "type": "string"}], "name": "shipment-delivered"},
    ],
    "events": [
        {"attributes": [{"name": "total-items", "value": 3}], "id": "e1", "relationships": [{"objectId": "o1", "qualifier": "order"}, {"objectId": "i1", "qualifier": "item"}, {"objectId": "i2", "qualifier": "item"}, {"objectId": "i3", "qualifier": "item"}], "time": "2025-02-01T09:00:00Z", "type": "create-order"},
        {"attributes": [{"name": "confirmation-code", "value": "CONF6034X"}], "id": "e2", "relationships": [{"objectId": "o1", "qualifier": "order"}], "time": "2025-02-01T09:02:00Z", "type": "order-confirmation"},
        {"attributes": [{"name": "warehouse-id", "value": "WH-77"}], "id": "e3", "relationships": [{"objectId": "o1", "qualifier": "order"}, {"objectId": "i1", "qualifier": "item"}, {"objectId": "i2", "qualifier": "item"}, {"objectId": "i3", "qualifier": "item"}], "time": "2025-02-01T15:00:00Z", "type": "package-prepared"},
        {"attributes": [{"name": "logistics-provider", "value": "FastExpress"}], "id": "e4", "relationships": [{"objectId": "s1", "qualifier": "shipment"}], "time": "2025-02-02T10:20:00Z", "type": "shipment-started"},
        {"attributes": [{"name": "recipient", "value": "Erik"}], "id": "e5", "relationships": [{"objectId": "s1", "qualifier": "shipment"}], "time": "2025-02-03T15:45:00Z", "type": "shipment-delivered"},
        {"attributes": [{"name": "total-items", "value": 2}], "id": "e6", "relationships": [{"objectId": "o2", "qualifier": "order"}, {"objectId": "i4", "qualifier": "item"}, {"objectId": "i5", "qualifier": "item"}], "time": "2025-02-01T12:00:00Z", "type": "create-order"},
        {"attributes": [{"name": "reason", "value": "Customer requested cancellation"}], "id": "e7", "relationships": [{"objectId": "o2", "qualifier": "order"}], "time": "2025-02-01T12:30:00Z", "type": "order-cancelled"},
    ],
    "objectTypes": [
        {"attributes": [{"name": "order-id", "type": "string"}], "name": "order"},
        {"attributes": [{"name": "product-name", "type": "string"}], "name": "item"},
        {"attributes": [{"name": "tracking-number", "type": "string"}], "name": "shipment"},
        {"attributes": [], "name": "process"},
    ],
    "objects": [
        {"attributes": [{"name": "order-id", "time": "2025-02-01T09:00:00Z", "value": "20250201-9801"}], "id": "o1", "type": "order"},
        {"attributes": [{"name": "order-id", "time": "2025-02-01T12:00:00Z", "value": "20250201-6034"}], "id": "o2", "type": "order"},
        {"attributes": [{"name": "product-name", "time": "2025-02-01T09:00:00Z", "value": "Laptop"}], "id": "i1", "type": "item"},
        {"attributes": [{"name": "product-name", "time": "2025-02-01T09:00:00Z", "value": "Smart-phone"}], "id": "i2", "type": "item"},
        {"attributes": [{"name": "product-name", "time": "2025-02-01T09:00:00Z", "value": "Headphone"}], "id": "i3", "type": "item"},
        {"attributes": [{"name": "product-name", "time": "2025-02-01T12:00:00Z", "value": "Laptop"}], "id": "i4", "type": "item"},
        {"attributes": [{"name": "product-name", "time": "2025-02-01T12:00:00Z", "value": "Tablet"}], "id": "i5", "type": "item"},
        {"attributes": [{"name": "tracking-number", "time": "2025-02-02T10:00:00Z", "value": "TRK974208"}], "id": "s1", "type": "shipment"},
    ],
    "version": "2.0",
}


def main():
    log = ocel_from_event_log(OCEL_JSON)
    etot = build_event_to_object_types(log)
    print("=== event -> object types ===")
    for k, v in sorted(etot.items()):
        print(f"  {k}: {sorted(v)}")

    matched = match_events_start_and_end(
        log, start_object_types=["order"], end_object_types=["shipment"]
    )
    print("\n=== start/end anchors ===")
    print("  start:", sorted(matched["start"]))
    print("  end:", sorted(matched["end"]))

    edges = list_event_edges(log)
    print(f"\n=== succession edges ({len(edges)}) ===")
    for u, v in edges:
        print(f"  {u} -> {v}")

    out = build_outgoing(edges)
    graph_result = scan_edges(edges, matched["start"], matched["end"], outgoing=out)
    print("\n=== scan_edges result ===")
    print(" ", sorted(graph_result))

    timelines = build_object_timelines(log)
    print("\n=== object timelines ===")
    for oid, tl in sorted(timelines.items()):
        print(f"  {oid}: {tl}")

    single = scan_single_entity(timelines, matched["start"], matched["end"])
    print("\n=== scan_single_entity result ===")
    print(" ", sorted(single))

    rule = TraceRule("p1", "t1", ["order"], [], ["shipment"], [], [], [], [])
    print("\n=== TraceRule.get_traces ===")
    print(" ", sorted(rule.get_traces(log, edges=edges, outgoing=out, event_to_object_types=etot)))

    event_log = copy.deepcopy(OCEL_JSON)
    otm = map_object_id_to_type(log)
    oam = map_attribute_to_object(event_log)
    process_data = [{
        "processName": "p1",
        "traces": [{
            "traceName": "t1",
            "parentProcess": "p1",
            "startOT": ["order"],
            "startAct": [],
            "endOT": ["shipment"],
            "endAct": [],
            "includeOT": [],
            "includeAct": [],
            "excludeOT": [],
            "excludeAct": [],
        }],
    }]
    update(otm, oam, event_log, process_data, deleted_processes=set())
    enriched = [
        e["id"]
        for e in event_log["events"]
        if any(r.get("objectId") == "p1" and r.get("qualifier") == "process" for r in (e.get("relationships") or []))
    ]
    print("\n=== after update() enriched events ===")
    print(" ", enriched)

    # What if e4 also references the order o1?
    fixed = copy.deepcopy(OCEL_JSON)
    fixed["events"][3]["relationships"].append({"objectId": "o1", "qualifier": "order"})
    log2 = ocel_from_event_log(fixed)
    edges2 = list_event_edges(log2)
    matched2 = match_events_start_and_end(log2, start_object_types=["order"], end_object_types=["shipment"])
    out2 = build_outgoing(edges2)
    result2 = scan_edges(edges2, matched2["start"], matched2["end"], outgoing=out2)
    print("\n=== IF e4 also links o1 (data fix) ===")
    print("  new edges sample:", edges2)
    print("  scan result:", sorted(result2))


if __name__ == "__main__":
    main()
