"""
Diagnose a trace rule on a REAL OCEL: show counts and prove WHY events are included.

Usage (PowerShell):
  python scripts/diagnose_trace.py --ocel PATH ^
      --start-ot Container --end-ot Item ^
      [--start-act Create] [--end-act Ship] ^
      [--check e1234]            # explain one specific event
      [--samples 10]             # print witness paths for N included events

For each included event it prints a witness path  start -> ... -> event -> ... -> end,
which proves the event really lies on a start->end path. If an event the user thinks
is wrong HAS such a path, it is correct by the trace semantics (the old DFS simply
under-counted). If --check reports "NOT reachable"/"cannot reach end", that is a bug.
"""
import argparse
import importlib.util
import os
import sys
import types
from collections import deque

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

edges_mod = sys.modules["app.algo.edges"]
match_mod = sys.modules["app.algo.match"]
scan_mod = sys.modules["app.algo.scan"]
ids_mod = sys.modules["app.algo.ids"]


def load_ocel(path):
    ext = os.path.splitext(path)[1].lower()
    if ext == ".sqlite":
        return pm4py.read_ocel2_sqlite(path)
    if ext in (".json", ".jsonocel"):
        try:
            return pm4py.read_ocel2_json(path)
        except Exception:
            return pm4py.read_ocel(path)
    if ext in (".xml", ".xmlocel"):
        return pm4py.read_ocel2_xml(path)
    return pm4py.read_ocel(path)


def build_edge_carriers(log):
    """Map each succession edge (u,v) -> set of "carrier" objects 'oid:otype'.

    A carrier is an object whose timeline has u immediately followed by v (the same
    rule list_event_edges uses to create the edge), so it shows WHICH object flow
    justifies each hop in a path.
    """
    rel = log.relations
    qcol = log.qualifier
    if qcol in rel.columns:
        rel = rel[rel[qcol].astype(str) != "process"]
    eid_col = log.event_id_column
    oid_col = log.object_id_column
    ot_col = log.object_type_column
    ts_col = log.event_timestamp

    event_times = log.events.set_index(eid_col, drop=False)[ts_col]
    rel_df = rel[[eid_col, oid_col, ot_col]].dropna(subset=[eid_col, oid_col]).drop_duplicates(
        subset=[eid_col, oid_col]
    ).copy()
    rel_df["_ts"] = rel_df[eid_col].map(event_times)
    rel_df["_eid"] = rel_df[eid_col].astype(str)

    carriers = {}
    for (oid, otype), grp in rel_df.groupby([oid_col, ot_col], sort=False):
        ordered = grp.sort_values(by=["_ts", "_eid"], kind="mergesort")[eid_col].tolist()
        prev = None
        for eid in ordered:
            if prev is not None and eid != prev:
                carriers.setdefault((str(prev), str(eid)), set()).add(f"{oid}:{otype}")
            prev = eid
    return carriers


def single_instance_result(log, start_set, end_set):
    """Per-entity flow: include events that lie on a single object's timeline between
    a start (at/before) and an end (at/after) on that same timeline. Type-agnostic.
    """
    rel = log.relations
    qcol = log.qualifier
    if qcol in rel.columns:
        rel = rel[rel[qcol].astype(str) != "process"]
    eid_col = log.event_id_column
    oid_col = log.object_id_column
    ts_col = log.event_timestamp
    event_times = log.events.set_index(eid_col, drop=False)[ts_col]
    rel_df = rel[[eid_col, oid_col]].dropna(subset=[eid_col, oid_col]).drop_duplicates(
        subset=[eid_col, oid_col]
    ).copy()
    rel_df["_ts"] = rel_df[eid_col].map(event_times)
    rel_df["_eid"] = rel_df[eid_col].astype(str)

    from app.algo.ids import canonical_event_id  # noqa
    included = set()
    for _, grp in rel_df.groupby(oid_col, sort=False):
        timeline = [str(x) for x in grp.sort_values(by=["_ts", "_eid"], kind="mergesort")[eid_col].tolist()]
        n = len(timeline)
        suffix_end = [False] * n
        seen = False
        for i in range(n - 1, -1, -1):
            if timeline[i] in end_set:
                seen = True
            suffix_end[i] = seen
        start_so_far = False
        for i in range(n):
            if timeline[i] in start_set:
                start_so_far = True
            if start_so_far and suffix_end[i]:
                included.add(timeline[i])
    return included


def annotate(path, carriers):
    if not path:
        return None
    out = [path[0]]
    for i in range(1, len(path)):
        cs = carriers.get((path[i - 1], path[i]), set())
        out.append(f"--[{','.join(sorted(cs)) or '??'}]--> {path[i]}")
    return "  ".join(out)


def bfs_path(src_set, adj, target):
    """Shortest path from any node in src_set to target along adj. Returns list or None."""
    if target in src_set:
        return [target]
    parent = {s: None for s in src_set}
    q = deque(src_set)
    while q:
        u = q.popleft()
        for v in adj.get(u, ()):
            if v not in parent:
                parent[v] = u
                if v == target:
                    path = [v]
                    while parent[path[-1]] is not None:
                        path.append(parent[path[-1]])
                    return list(reversed(path))
                q.append(v)
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ocel", required=True)
    ap.add_argument("--start-ot", nargs="*", default=[])
    ap.add_argument("--start-act", nargs="*", default=[])
    ap.add_argument("--end-ot", nargs="*", default=[])
    ap.add_argument("--end-act", nargs="*", default=[])
    ap.add_argument("--check", default=None, help="explain one event id")
    ap.add_argument("--samples", type=int, default=8)
    ap.add_argument("--sample-act", default=None,
                    help="explain included events whose activity equals this")
    ap.add_argument("--carriers", action="store_true", help="annotate each hop with carrier object(s)")
    ap.add_argument("--mode", choices=["merged", "single"], default="merged")
    ap.add_argument("--carrier-ot", nargs="*", default=None,
                    help="only keep succession edges carried by an object of these types")
    args = ap.parse_args()

    log = load_ocel(args.ocel)
    print(f"events={len(log.events)}  objects={len(log.objects)}  relations={len(log.relations)}")

    edges = edges_mod.list_event_edges(log)
    carriers_all = build_edge_carriers(log) if (args.check or args.carriers or args.carrier_ot or args.sample_act) else {}
    if args.carrier_ot is not None:
        allowed = set(args.carrier_ot)
        kept = []
        for (u, v) in edges:
            cs = carriers_all.get((str(u), str(v)), set())
            if any(c.split(":", 1)[1] in allowed for c in cs):
                kept.append((u, v))
        print(f"edge filter by carrier types {sorted(allowed)}: {len(edges)} -> {len(kept)} edges")
        edges = kept
    outgoing = scan_mod.build_outgoing(edges)
    incoming = scan_mod.build_incoming(outgoing)
    print(f"succession edges={len(edges)}  acyclic={not scan_mod._has_cycle(outgoing)}")

    m = match_mod.match_events_start_and_end(
        log,
        start_object_types=args.start_ot,
        start_activities=args.start_act,
        end_object_types=args.end_ot,
        end_activities=args.end_act,
    )
    starts = ids_mod.canonical_event_id_set(m["start"])
    ends = ids_mod.canonical_event_id_set(m["end"])
    print(f"start events={len(starts)}  end events={len(ends)}")

    result = scan_mod.scan_edges(edges, starts, ends, outgoing=outgoing, incoming=incoming)
    print(f"[merged reachability] included={len(result)}  ({100.0*len(result)/max(1,len(log.events)):.1f}%)")

    si = single_instance_result(log, starts, ends)
    print(f"[single-entity flow ] included={len(si)}  ({100.0*len(si)/max(1,len(log.events)):.1f}%)")
    if args.mode == "single":
        result = si

    eid_col2 = log.event_id_column
    act_col2 = log.event_activity
    act_map = dict(
        zip(log.events[eid_col2].map(ids_mod.canonical_event_id),
            log.events[act_col2].astype(str))
    )
    from collections import Counter
    dist = Counter(act_map.get(e, "?") for e in result)
    print("activity distribution of result:")
    for a, c in sorted(dist.items(), key=lambda x: -x[1]):
        print(f"  {c:6d}  {a}")

    carriers = carriers_all

    def explain(eid):
        eid = ids_mod.canonical_event_id(eid)
        fwd = bfs_path(starts, outgoing, eid)          # start -> eid
        bwd = bfs_path({eid}, outgoing, None) if False else None
        # path eid -> end: BFS forward from eid to any end
        to_end = None
        if eid is not None:
            parent = {eid: None}
            q = deque([eid])
            while q and to_end is None:
                u = q.popleft()
                if u in ends:
                    p = [u]
                    while parent[p[-1]] is not None:
                        p.append(parent[p[-1]])
                    to_end = list(reversed(p))
                    break
                for v in outgoing.get(u, ()):
                    if v not in parent:
                        parent[v] = u
                        q.append(v)
        print(f"\n--- explain {eid} ---")
        print(f"  in result      : {eid in result}")
        print(f"  is start       : {eid in starts}")
        print(f"  is end         : {eid in ends}")
        if args.carriers:
            print(f"  start -> {eid}  : {annotate(fwd, carriers) if fwd else 'NOT reachable from any start'}")
            print(f"  {eid} -> end    : {annotate(to_end, carriers) if to_end else 'CANNOT reach any end'}")
        else:
            print(f"  start -> {eid}  : {' -> '.join(fwd) if fwd else 'NOT reachable from any start'}")
            print(f"  {eid} -> end    : {' -> '.join(to_end) if to_end else 'CANNOT reach any end'}")

    if args.check:
        explain(args.check)
    elif args.sample_act:
        eid_col = log.event_id_column
        act_col = log.event_activity
        act_of = dict(
            zip(log.events[eid_col].map(ids_mod.canonical_event_id),
                log.events[act_col].astype(str))
        )
        picked = [e for e in result if act_of.get(e) == args.sample_act][: args.samples]
        print(f"\nincluded events with activity '{args.sample_act}': "
              f"{sum(1 for e in result if act_of.get(e) == args.sample_act)}")
        for eid in picked:
            explain(eid)
    else:
        sample = list(result)[: args.samples]
        for eid in sample:
            explain(eid)


if __name__ == "__main__":
    main()
