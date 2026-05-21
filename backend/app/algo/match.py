from typing import Any, Dict, Iterable, Optional, Set

import pandas as pd
from pm4py.objects.ocel.obj import OCEL

from .edges import _business_relations
from .ids import canonical_event_id


def _scalar_str(v) -> Optional[str]:
    """Stable string form for activity / object-type names; None if missing."""
    return canonical_event_id(v) if v is not None else None


def match_events(
    ocel: OCEL,
    object_types: Optional[Iterable[str]] = None,
    activities: Optional[Iterable[str]] = None,
    match_type: str = "start",
) -> Dict[str, Set[str]]:
    """
    Match events by object-type and activity filters.

    - object_types: event must be related to all given object types (AND).
    - activities: event activity must be one of the given activities (OR).
    - match_type: "start" or "end" (kept for caller semantics/validation).
    """
    if match_type not in {"start", "end"}:
        raise ValueError("match_type must be either 'start' or 'end'.")

    object_type_set = {_scalar_str(x) for x in (object_types or [])}
    object_type_set.discard(None)
    activity_set = {_scalar_str(a) for a in (activities or [])}
    activity_set.discard(None)

    if not object_type_set and not activity_set:
        raise ValueError("At least one of object_types or activities must be provided.")

    rel = _business_relations(ocel)
    eid_col = ocel.event_id_column
    ot_col = ocel.object_type_column
    rel_df = rel[[eid_col, ot_col]].dropna(subset=[eid_col, ot_col])

    def _agg_ot_set(series: pd.Series) -> Set[str]:
        out: Set[str] = set()
        for x in series:
            sx = _scalar_str(x)
            if sx is not None:
                out.add(sx)
        return out

    primary = rel_df.groupby(eid_col, sort=False)[ot_col].agg(_agg_ot_set).to_dict()
    event_to_object_types: Dict[str, Set[str]] = {}
    for k, v in primary.items():
        ck = canonical_event_id(k)
        if ck is None:
            continue
        event_to_object_types[ck] = v

    events_df = ocel.events
    eid_series = events_df[eid_col].map(canonical_event_id)
    act_col = ocel.event_activity
    act_series = events_df[act_col].map(_scalar_str)

    if not object_type_set:
        ot_ok = pd.Series(True, index=events_df.index)
    else:
        ot_ok = eid_series.map(
            lambda eid: bool(eid)
            and object_type_set.issubset(event_to_object_types.get(eid, set()))
        )

    if not activity_set:
        act_ok = pd.Series(True, index=events_df.index)
    else:
        act_ok = act_series.isin(activity_set)

    mask = ot_ok & act_ok
    matched_event_ids = set(eid_series[mask].dropna())

    return {match_type: matched_event_ids}
