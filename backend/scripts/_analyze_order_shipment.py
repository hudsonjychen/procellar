"""Analyze why Order - Shipment tags so many events."""
import importlib.util
import json
import os
import sys
import types
from collections import Counter, defaultdict

ROOT = os.path.join(os.path.dirname(__file__), "..")
ALGO = os.path.join(ROOT, "app", "algo")
DATA = os.path.join(ROOT, "..", "example-data", "example-data-2.json")
sys.path.insert(0, ROOT)
sys.modules["app"] = types.ModuleType("app")
sys.modules["app.algo"] = types.ModuleType("app.algo")
for name in ("ids", "entity", "edges", "match", "scan", "trace"):
    path = os.path.join(ALGO, f"{name}.py")
    spec = importlib.util.spec_from_file_location(f"app.algo.{name}", path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[f"app.algo.{name}"] = mod
    spec.loader.exec_module(mod)

ocel_from_event_log = __import__("pm4py").read_ocel2_json(DATA)
TraceRule = sys.modules["app.algo.trace"].TraceRule
match_events_start_and_end = sys.modules["app.algo.match"].match_events_start_and_end
build_event_to_object_types = sys.modules["app.algo.match"].build_event_to_object_types
list_event_edges = sys.modules["app.algo.edges"].list_event_edges
build_outgoing = sys.modules["app.algo.scan"].build_outgoing
scan_edges = sys.modules["app.algo.scan"].scan_edges

with open(DATA, encoding="utf-8") as f:
    raw = json.load(f)
etype = {e["id"]: e["type"] for e in raw["events"]}

log = ocel_from_event_log
etot = build_event_to_object_types(log)
matched = match_events_start_and_end(log, start_object_types=["order"], end_object_types=["shipment"])
starts, ends = matched["start"], matched["end"]

rule = TraceRule("Order - Shipment", "r1", ["order"], [], ["shipment"], [], [], [], [], [])
edges = list_event_edges(log)
out = build_outgoing(edges)
result = set(rule.get_traces(log, edges=edges, outgoing=out, event_to_object_types=etot))

print("=== Order - Shipment trace analysis ===")
print(f"Total events in log: {len(raw['events'])}")
print(f"Start anchors (order OT): {len(starts)}")
print(f"End anchors (shipment OT): {len(ends)}")
print(f"Matched by trace: {len(result)}")

print("\nStart anchor events by type:")
sc = Counter(etype[e] for e in starts if e in etype)
for t, c in sc.most_common():
    print(f"  {t}: {c}")

print("\nEnd anchor events by type:")
ec = Counter(etype[e] for e in ends if e in etype)
for t, c in ec.most_common():
    print(f"  {t}: {c}")

print("\nMatched events by activity type:")
mc = Counter(etype[e] for e in result if e in etype)
for t, c in mc.most_common():
    print(f"  {t}: {c}")

untagged = [e["id"] for e in raw["events"] if e["id"] not in result]
print(f"\nNOT tagged ({len(untagged)}):")
for eid in untagged:
    print(f"  {eid} {etype[eid]}")

print("\n--- Per order: which events tagged ---")
order_events = defaultdict(list)
for e in raw["events"]:
    for r in e.get("relationships") or []:
        if r.get("qualifier") == "order":
            order_events[r["objectId"]].append(e["id"])

for oid in sorted(order_events):
    evs = order_events[oid]
    tagged = [e for e in evs if e in result]
    print(f"  {oid}: {len(tagged)}/{len(evs)} tagged")

print("\n--- Shared shipment s3 timeline pulls in o6 without return ---")
# edges involving s3
s3_evs = [e["id"] for e in raw["events"] if any(r.get("objectId")=="s3" for r in e.get("relationships") or [])]
print(f"  s3 events: {s3_evs}")
print(f"  s3 tagged: {[e for e in s3_evs if e in result]}")
