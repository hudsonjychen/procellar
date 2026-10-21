"""
User's example. Object type = first letter of object id.
  e1(o1,o2) -> e2(o1,o2,c1) -> {
      e3(c1,g1,g2) -> e4(g1),
      e5(c1,h1,h2) -> e6(h1,g3) -> e7(h1,p1),
      e8(o1,s1) -> { e9(s1,v1), e10(s1,v2) }
  }
Rule: start object type = C, end object type = G.
Expected included: {e2, e3, e4, e5, e6}
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
sys.modules["app"] = types.ModuleType("app")
sys.modules["app.algo"] = types.ModuleType("app.algo")
for name in ("ids", "entity", "edges", "match", "scan", "trace"):
    spec = importlib.util.spec_from_file_location(
        f"app.algo.{name}", os.path.join(ALGO, f"{name}.py")
    )
    mod = importlib.util.module_from_spec(spec)
    sys.modules[f"app.algo.{name}"] = mod
    spec.loader.exec_module(mod)

TraceRule = sys.modules["app.algo.trace"].TraceRule
list_event_edges = sys.modules["app.algo.edges"].list_event_edges
match_start_end = sys.modules["app.algo.match"].match_events_start_and_end

OTYPES = {"o": "O", "c": "C", "g": "G", "h": "H", "s": "S", "v": "V", "p": "P"}
objs = {}


def ev(eid, day, objids):
    for oid in objids:
        objs[oid] = OTYPES[oid[0]]
    return {
        "id": eid,
        "type": f"act_{eid}",
        "time": f"2020-01-{day:02d}T00:00:00+00:00",
        "attributes": [],
        "relationships": [{"objectId": o, "qualifier": ""} for o in objids],
    }


events = [
    ev("e1", 1, ["o1", "o2"]),
    ev("e2", 2, ["o1", "o2", "c1"]),
    ev("e3", 3, ["c1", "g1", "g2"]),
    ev("e4", 4, ["g1"]),
    ev("e5", 5, ["c1", "h1", "h2"]),
    ev("e6", 6, ["h1", "g3"]),
    ev("e7", 7, ["h1", "p1"]),
    ev("e8", 8, ["o1", "s1"]),
    ev("e9", 9, ["s1", "v1"]),
    ev("e10", 10, ["s1", "v2"]),
]

object_types = sorted(set(objs.values()))
ocel_json = {
    "objectTypes": [{"name": t, "attributes": []} for t in object_types],
    "objects": [{"id": oid, "type": t, "attributes": []} for oid, t in objs.items()],
    "events": events,
    "version": "2.0",
}

with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8") as f:
    json.dump(ocel_json, f)
    path = f.name
log = pm4py.read_ocel2_json(path)
os.remove(path)

edges = list_event_edges(log)
print("succession edges :", edges)
m = match_start_end(log, start_object_types=["C"], end_object_types=["G"])
print("start events (C) :", sorted(m["start"]))
print("end events   (G) :", sorted(m["end"]))

rule = TraceRule("proc", "t1", ["C"], [], ["G"], [], [], [], [], [])
ids = rule.get_traces(log)
expected = {"e2", "e3", "e4", "e5", "e6"}
print("CURRENT result   :", sorted(ids))
print("EXPECTED result  :", sorted(expected))
print("over-included    :", sorted(set(ids) - expected))
print("missing          :", sorted(expected - set(ids)))
print("MATCH" if set(ids) == expected else "MISMATCH")
