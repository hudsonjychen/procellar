from typing import Callable, Hashable, List, Optional, Set, Tuple

import pandas as pd
from pm4py.objects.ocel.obj import OCEL


def _business_relations(ocel: OCEL) -> pd.DataFrame:
    """Event-object rows excluding synthetic ``process`` qualifiers (see ``entity.get_objects``)."""
    rel = ocel.relations
    qcol = ocel.qualifier
    if qcol in rel.columns:
        return rel[rel[qcol].astype(str) != "process"]
    return rel


def list_event_edges(
    ocel: OCEL,
    progress_callback: Optional[Callable[[float], None]] = None,
    should_cancel: Optional[Callable[[], bool]] = None,
) -> List[Tuple[Hashable, Hashable]]:
    """
    List **direct object-centric succession** edges between event ids.

    For each business object (non-``process`` links), events referencing that object are
    ordered by timestamp (then event id). Each consecutive pair ``(e1, e2)`` yields a
    directed edge. The same edge may arise from several objects; duplicates are removed.

    Uses vectorized pandas (no ``iterrows``) so large OCELs stay tractable.
    """
    if progress_callback:
        progress_callback(0.0)

    if should_cancel and should_cancel():
        raise RuntimeError("Processing cancelled")

    rel = _business_relations(ocel)
    eid_col = ocel.event_id_column
    oid_col = ocel.object_id_column
    ts_col = ocel.event_timestamp

    rel_df = rel[[eid_col, oid_col]].dropna(subset=[eid_col, oid_col])
    if rel_df.empty:
        if progress_callback:
            progress_callback(1.0)
        return []

    if progress_callback:
        progress_callback(0.15)

    if should_cancel and should_cancel():
        raise RuntimeError("Processing cancelled")

    event_times = ocel.events.set_index(eid_col, drop=False)[ts_col]
    rel_df = rel_df.drop_duplicates(subset=[eid_col, oid_col])
    rel_df = rel_df.copy()
    rel_df["_ts"] = rel_df[eid_col].map(event_times)
    rel_df["_eid_sort"] = rel_df[eid_col].astype(str)

    if progress_callback:
        progress_callback(0.35)

    edges: Set[Tuple[Hashable, Hashable]] = set()
    grouped = rel_df.groupby(oid_col, sort=False)
    n_groups = grouped.ngroups
    step = max(1, n_groups // 80)

    for gi, (_, grp) in enumerate(grouped, start=1):
        if should_cancel and should_cancel():
            raise RuntimeError("Processing cancelled")
        if progress_callback and (gi % step == 0 or gi == n_groups):
            progress_callback(0.35 + 0.65 * (gi / n_groups))

        ordered = grp.sort_values(by=["_ts", "_eid_sort"], kind="mergesort")[eid_col].tolist()
        prev = None
        for eid in ordered:
            if prev is not None and eid != prev:
                edges.add((prev, eid))
            prev = eid

    if progress_callback:
        progress_callback(1.0)

    return sorted(edges)
