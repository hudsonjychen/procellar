from collections import defaultdict
from typing import Callable, DefaultDict, Hashable, List, Optional, Set, Tuple

import pandas as pd
from pm4py.objects.ocel.obj import OCEL


def _business_relations(ocel: OCEL) -> pd.DataFrame:
    """Event-object rows excluding synthetic ``process`` qualifiers (see ``entity.get_objects``)."""
    rel = ocel.relations
    qcol = ocel.qualifier
    if qcol in rel.columns:
        return rel[rel[qcol].astype(str) != "process"]
    return rel


def _event_time_map(ocel: OCEL) -> pd.Series:
    ts_col = ocel.event_timestamp
    if ts_col not in ocel.events.columns:
        raise ValueError(
            f"Event timestamp column {ts_col!r} not found on ocel.events "
            f"(columns: {list(ocel.events.columns)})."
        )
    return ocel.events.set_index(ocel.event_id_column)[ts_col]


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

    ``progress_callback`` receives values in ``[0.0, 1.0]`` for this phase when provided.

    Returns:
        A list of unique ``(from_event_id, to_event_id)`` tuples, sorted for stable order.
    """
    if progress_callback:
        progress_callback(0.0)

    rel = _business_relations(ocel)
    eid_col = ocel.event_id_column
    oid_col = ocel.object_id_column

    rel_df = rel[[eid_col, oid_col]]
    total_rows = len(rel_df)
    object_events: DefaultDict[Hashable, Set[Hashable]] = defaultdict(set)
    for i, (_, row) in enumerate(rel_df.iterrows()):
        if should_cancel and should_cancel():
            raise RuntimeError("Processing cancelled")
        if progress_callback and total_rows > 0 and (
            i % max(1, total_rows // 25) == 0 or i + 1 == total_rows
        ):
            progress_callback(
                (i / max(total_rows - 1, 1)) * 0.55 if total_rows > 1 else 0.55
            )
        eid = row[eid_col]
        oid = row[oid_col]
        if pd.isna(eid) or pd.isna(oid):
            continue
        object_events[oid].add(eid)

    if progress_callback:
        progress_callback(0.55)

    times = _event_time_map(ocel)

    def sort_key(eid: Hashable):
        if eid in times.index:
            t = times.at[eid]
        else:
            t = pd.NaT
        return (t, repr(eid))

    edges: Set[Tuple[Hashable, Hashable]] = set()
    obj_list = list(object_events.values())
    n_obj = len(obj_list)
    for j, eids in enumerate(obj_list):
        if should_cancel and should_cancel():
            raise RuntimeError("Processing cancelled")
        if progress_callback and n_obj > 0 and (
            j % max(1, n_obj // 25) == 0 or j + 1 == n_obj
        ):
            progress_callback(
                0.55 + 0.45 * (j / max(n_obj - 1, 1)) if n_obj > 1 else 1.0
            )
        ordered = sorted(eids, key=sort_key)
        for k in range(len(ordered) - 1):
            e1, e2 = ordered[k], ordered[k + 1]
            if e1 != e2:
                edges.add((e1, e2))

    if progress_callback:
        progress_callback(1.0)
