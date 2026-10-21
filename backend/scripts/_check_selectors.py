"""Selector semantics check without pm4py: python scripts/_check_selectors.py"""
import importlib.util
import os
import sys
import types

import pandas as pd

ROOT = os.path.join(os.path.dirname(__file__), "..")
ALGO = os.path.join(ROOT, "app", "algo")
sys.path.insert(0, ROOT)

# minimal pm4py stand-in: only the OCEL symbol is needed at import time
pm4py = types.ModuleType("pm4py")
for name in ("pm4py.objects", "pm4py.objects.ocel", "pm4py.objects.ocel.obj"):
    sys.modules[name] = types.ModuleType(name)
sys.modules["pm4py.objects.ocel.obj"].OCEL = object
sys.modules["pm4py"] = pm4py

sys.modules["app"] = types.ModuleType("app")
sys.modules["app.algo"] = types.ModuleType("app.algo")
for name in ("ids", "edges", "selector", "match", "scan", "rule", "trace", "process"):
    spec = importlib.util.spec_from_file_location(
        f"app.algo.{name}", os.path.join(ALGO, f"{name}.py")
    )
    mod = importlib.util.module_from_spec(spec)
    sys.modules[f"app.algo.{name}"] = mod
    spec.loader.exec_module(mod)

match = sys.modules["app.algo.match"]
selector_mod = sys.modules["app.algo.selector"]
process = sys.modules["app.algo.process"]
SelectorFormatError = selector_mod.SelectorFormatError


class FakeOCEL:
    event_id_column = "ocel:eid"
    event_activity = "ocel:activity"

    def __init__(self, rows):
        self.events = pd.DataFrame(rows, columns=[self.event_id_column, self.event_activity])


def sel(object_types=(), activity=None):
    return {"objectTypes": list(object_types), "activity": activity}


ocel = FakeOCEL(
    [
        ("e1", "Register"),   # order + item
        ("e2", "Create"),     # order
        ("e3", "Pack"),       # item
        ("e4", "Ship"),       # order + shipment
    ]
)
eto = {
    "e1": {"order", "item"},
    "e2": {"order"},
    "e3": {"item"},
    "e4": {"order", "shipment"},
}

failures = []


def check(name, got, expected):
    got, expected = set(got), set(expected)
    if got == expected:
        print(f"OK   {name}: {sorted(got)}")
    else:
        failures.append(f"{name}: got={sorted(got)} expected={sorted(expected)}")
        print(f"FAIL {name}: got={sorted(got)} expected={sorted(expected)}")


def matched(selectors):
    mask = match._selector_mask(ocel, selectors, eto)
    return set(ocel.events[ocel.event_id_column][mask])


# --- _selector_mask: AND inside a selector, OR between selectors
check("activity only", matched([sel(activity="Create")]), {"e2"})
check("single object type", matched([sel(["order"])]), {"e1", "e2", "e4"})
check("two object types (AND)", matched([sel(["order", "item"])]), {"e1"})
check("object type + activity (AND)", matched([sel(["order"], "Ship")]), {"e4"})
check("activity not on object type", matched([sel(["item"], "Create")]), set())
check(
    "two selectors (OR)",
    matched([sel(activity="Create"), sel(["item"])]),
    {"e2", "e1", "e3"},
)
check("empty selector ignored", matched([sel(), sel(activity="Pack")]), {"e3"})

# --- start / end matching
both = match.match_events_start_and_end(
    ocel,
    start_selectors=[sel(["order"], "Create"), sel(activity="Register")],
    end_selectors=[sel(["shipment"])],
    event_to_object_types=eto,
)
check("start selectors", both["start"], {"e1", "e2"})
check("end selectors", both["end"], {"e4"})

for name, kwargs in [
    ("missing start", {"start_selectors": [], "end_selectors": [sel(["order"])]}),
    ("missing end", {"start_selectors": [sel(["order"])], "end_selectors": []}),
]:
    try:
        match.match_events_start_and_end(ocel, event_to_object_types=eto, **kwargs)
        failures.append(f"{name}: expected ValueError")
        print(f"FAIL {name}: no error raised")
    except ValueError as e:
        print(f"OK   {name} rejected: {e}")

# --- include / exclude filtering on a trace path
all_ids = ["e1", "e2", "e3", "e4"]
check(
    "no filter keeps path",
    match.filter_trace_events(ocel, all_ids, event_to_object_types=eto),
    all_ids,
)
check(
    "include OR of selectors",
    match.filter_trace_events(
        ocel,
        all_ids,
        include_selectors=[sel(["item"]), sel(activity="Ship")],
        event_to_object_types=eto,
    ),
    {"e1", "e3", "e4"},
)
check(
    "include selector AND inside",
    match.filter_trace_events(
        ocel, all_ids, include_selectors=[sel(["order", "item"])], event_to_object_types=eto
    ),
    {"e1"},
)
check(
    "exclude wins over include",
    match.filter_trace_events(
        ocel,
        all_ids,
        include_selectors=[sel(["order"])],
        exclude_selectors=[sel(activity="Ship")],
        event_to_object_types=eto,
    ),
    {"e1", "e2"},
)

# --- cache signature is order independent but criteria sensitive
sig = selector_mod.selector_signature
assert sig([sel(["a", "b"]), sel(activity="x")]) == sig([sel(activity="x"), sel(["b", "a"])])
assert sig([sel(["a"])]) != sig([sel(["a"], "x")])
print("OK   cache signature order independent")

# --- normalize_trace
trace = process.normalize_trace(
    {
        "traceName": "t",
        "parentProcess": "p",
        "start": [{"objectTypes": ["order", "order"], "activity": "Create"}, {}],
        "end": [{"objectTypes": [], "activity": " Ship "}],
        "include": None,
    }
)
check("normalize start dedup", [tuple(trace["start"][0]["objectTypes"])], {("order",)})
assert len(trace["start"]) == 1, trace["start"]
assert trace["end"] == [{"objectTypes": [], "activity": "Ship"}], trace["end"]
assert trace["include"] == [] and trace["exclude"] == []
print("OK   normalize_trace drops empty selectors and trims names")

ots, acts = process.trace_entities(trace)
check("trace entities ot", ots, {"order"})
check("trace entities act", acts, {"Create", "Ship"})

for name, raw in [
    ("old trace format", {"traceName": "x", "startOT": ["order"], "startAct": []}),
    ("multi activity", {"traceName": "y", "start": [{"activity": ["a", "b"]}], "end": []}),
    ("start without entities", {"traceName": "z", "start": [{}], "end": [sel(["order"])]}),
    ("start not a list", {"traceName": "w", "start": {}, "end": [sel(["order"])]}),
]:
    try:
        process.normalize_trace(raw)
        failures.append(f"{name}: expected SelectorFormatError")
        print(f"FAIL {name}: no error raised")
    except SelectorFormatError as e:
        print(f"OK   {name} rejected: {e}")

if failures:
    print("\n--- FAILURES ---")
    for f in failures:
        print(f)
    sys.exit(1)
print("\nAll selector checks passed.")
