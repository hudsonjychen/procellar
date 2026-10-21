"""
Verify Group A scan optimizations return the same event sets as the baseline walk.
Run: python scripts/test_scan_optimizations.py
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

list_event_edges = sys.modules["app.algo.edges"].list_event_edges
scan_edges = sys.modules["app.algo.scan"].scan_edges
build_outgoing = sys.modules["app.algo.scan"].build_outgoing
match_events_start_and_end = sys.modules["app.algo.match"].match_events_start_and_end
TraceRule = sys.modules["app.algo.trace"].TraceRule

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

RULES = [
    ("act", TraceRule("p", "act", [], ["Create"], [], ["Ship"], [], [], [], [])),
    ("ot", TraceRule("p", "ot", ["order"], [], ["order"], [], [], [], [], [])),
    ("mix", TraceRule("p", "mix", ["order"], ["Create"], ["order"], ["Ship"], [], [], [], [])),
    ("mix2", TraceRule("p", "mix2", ["order", "item"], ["Register"], ["order"], ["Ship"], [], [], [], [])),
    ("disc", TraceRule("p", "disc", [], ["Pack"], [], ["Create"], [], [], [], [])),
]


def load_ocel(data):
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8") as f:
        json.dump(data, f)
        path = f.name
    log = pm4py.read_ocel2_json(path)
    os.remove(path)
    return log


def baseline_scan(edges, outgoing, start_ids, end_ids):
    return scan_edges(
        edges,
        start_ids,
        end_ids,
        outgoing=outgoing,
        use_minimal_starts=False,
        use_reachability_prune=False,
    )


def optimized_scan(edges, outgoing, start_ids, end_ids):
    return scan_edges(
        edges,
        start_ids,
        end_ids,
        outgoing=outgoing,
        use_minimal_starts=True,
        use_reachability_prune=True,
    )


def main():
    log = load_ocel(SIMPLE)
    edges = list_event_edges(log)
    outgoing = build_outgoing(edges)
    failures = []

    for name, rule in RULES:
        matched = match_events_start_and_end(
            log,
            start_object_types=rule.start_ot,
            start_activities=rule.start_act,
            end_object_types=rule.end_ot,
            end_activities=rule.end_act,
        )
        base = baseline_scan(edges, outgoing, matched["start"], matched["end"])
        opt = optimized_scan(edges, outgoing, matched["start"], matched["end"])
        via_rule = rule.get_traces(log, edges=edges, outgoing=outgoing)
        if base != opt or base != set(via_rule):
            failures.append(
                f"{name}: base={base} opt={opt} get_traces={set(via_rule)}"
            )
        else:
            print(f"OK   {name}: {base}")

    if failures:
        print("\n--- FAILURES ---")
        for f in failures:
            print(f)
        sys.exit(1)
    print("\nAll scan optimization equivalence checks passed.")


if __name__ == "__main__":
    main()
