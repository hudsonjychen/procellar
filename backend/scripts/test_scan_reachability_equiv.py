"""
Prove the reachability scan returns the CORRECT set of trace-linked events.

The intended semantics: an event is linked iff it lies on some simple path
``start -> ... -> end`` (kept up to the last end on that path). This is verified
here against an independent brute-force enumeration of all simple paths.

(Note: the legacy DFS in scan.py had a backtracking bug that dropped/added events
on branchy graphs; we deliberately do NOT compare against it. The fast reachability
path matches the brute-force ground truth.)

Run: python scripts/test_scan_reachability_equiv.py
"""
import importlib.util
import os
import random
import sys
import types
from collections import defaultdict

ROOT = os.path.join(os.path.dirname(__file__), "..")
ALGO = os.path.join(ROOT, "app", "algo")
sys.path.insert(0, ROOT)
sys.modules["app"] = types.ModuleType("app")
sys.modules["app.algo"] = types.ModuleType("app.algo")
for name in ("ids", "scan"):
    spec = importlib.util.spec_from_file_location(
        f"app.algo.{name}", os.path.join(ALGO, f"{name}.py")
    )
    mod = importlib.util.module_from_spec(spec)
    sys.modules[f"app.algo.{name}"] = mod
    spec.loader.exec_module(mod)

scan_mod = sys.modules["app.algo.scan"]
scan_edges = scan_mod.scan_edges


def brute_force(edges, starts, ends):
    """Ground truth: enumerate every simple path from each start, keep up to last end."""
    outgoing = defaultdict(list)
    for u, v in edges:
        if v not in outgoing[u]:
            outgoing[u].append(v)
    end_set = set(ends)
    result = set()

    def walk(path, vis, cur):
        last_end = None
        for i, n in enumerate(path):
            if n in end_set:
                last_end = i
        nbrs = [n for n in outgoing.get(cur, ()) if n not in vis]
        if not nbrs:
            if last_end is not None:
                result.update(path[: last_end + 1])
            return
        extended = False
        for nb in nbrs:
            extended = True
            path.append(nb)
            vis.add(nb)
            walk(path, vis, nb)
            path.pop()
            vis.discard(nb)
        if not extended and last_end is not None:
            result.update(path[: last_end + 1])

    for s in set(starts):
        walk([s], {s}, s)
    return result


def random_dag(n_nodes, edge_prob, rng):
    edges = []
    for i in range(n_nodes):
        for j in range(i + 1, n_nodes):
            if rng.random() < edge_prob:
                edges.append((f"e{i}", f"e{j}"))
    return edges


def main():
    os.environ["SCAN_BACKEND"] = "python"
    failures = []
    rng = random.Random(20240611)
    trials = 600
    for t in range(trials):
        n = rng.randint(1, 14)
        edges = random_dag(n, rng.uniform(0.1, 0.6), rng)
        nodes = [f"e{i}" for i in range(n)]
        starts = rng.sample(nodes, rng.randint(0, n))
        ends = rng.sample(nodes, rng.randint(0, n))

        ref = brute_force(edges, starts, ends)
        got = scan_edges(edges, starts, ends)
        if ref != got:
            failures.append(
                f"trial {t}: n={n} starts={starts} ends={ends}\n"
                f"   brute={sorted(ref)}\n   scan ={sorted(got)}"
            )
            if len(failures) > 6:
                break

    if failures:
        print("--- FAILURES ---")
        for f in failures:
            print(f)
        sys.exit(1)
    print(f"OK   {trials} random DAGs: reachability scan == brute-force ground truth")


if __name__ == "__main__":
    main()
