from typing import Any, Dict, Iterable, Optional, Set, Tuple



import pandas as pd

from pm4py.objects.ocel.obj import OCEL



from .edges import _business_relations

from .ids import canonical_event_id

from .selector import selector_signature





def _scalar_str(v) -> Optional[str]:

    """Stable string form for activity / object-type names; None if missing."""

    return canonical_event_id(v) if v is not None else None





def _agg_ot_set(series: pd.Series) -> Set[str]:

    out: Set[str] = set()

    for x in series:

        sx = _scalar_str(x)

        if sx is not None:

            out.add(sx)

    return out





def build_event_to_object_types(ocel: OCEL) -> Dict[str, Set[str]]:

    """Per-event object-type sets from business relations (shared across trace rules)."""

    rel = _business_relations(ocel)

    eid_col = ocel.event_id_column

    ot_col = ocel.object_type_column

    rel_df = rel[[eid_col, ot_col]].dropna(subset=[eid_col, ot_col])

    primary = rel_df.groupby(eid_col, sort=False)[ot_col].agg(_agg_ot_set).to_dict()

    event_to_object_types: Dict[str, Set[str]] = {}

    for k, v in primary.items():

        ck = canonical_event_id(k)

        if ck is None:

            continue

        event_to_object_types[ck] = v

    return event_to_object_types





def _selector_mask(
    ocel: OCEL,
    selectors: Iterable[dict],
    event_to_object_types: Dict[str, Set[str]],
) -> pd.Series:
    """
    Mask of events matched by a selector list.

    A selector matches an event of its activity (when set) that is related to every
    object type it lists (AND); selectors are combined with OR.
    """
    events_df = ocel.events
    eid_series = events_df[ocel.event_id_column].map(canonical_event_id)
    act_series = events_df[ocel.event_activity].map(_scalar_str)

    mask = pd.Series(False, index=events_df.index)
    for selector in selectors or []:
        object_types = _normalize_entity_set(selector.get("objectTypes"))
        activity = _scalar_str(selector.get("activity"))
        if not object_types and activity is None:
            continue

        selector_ok = pd.Series(True, index=events_df.index)
        if activity is not None:
            selector_ok &= act_series == activity
        if object_types:
            selector_ok &= eid_series.map(
                lambda eid: bool(eid)
                and object_types.issubset(event_to_object_types.get(eid, set()))
            )
        mask |= selector_ok

    return mask



def match_events(
    ocel: OCEL,
    selectors: Optional[Iterable[dict]] = None,
    match_type: str = "start",
    event_to_object_types: Optional[Dict[str, Set[str]]] = None,
) -> Dict[str, Set[str]]:
    """
    Match events against a selector list (see ``_selector_mask``).

    ``match_type`` is "start" or "end" and only names the returned key.
    """
    if match_type not in {"start", "end"}:
        raise ValueError("match_type must be either 'start' or 'end'.")

    selectors = list(selectors or [])
    if not selectors:
        raise ValueError("At least one selector must be provided.")

    if event_to_object_types is None:
        event_to_object_types = build_event_to_object_types(ocel)

    mask = _selector_mask(ocel, selectors, event_to_object_types)
    eid_series = ocel.events[ocel.event_id_column].map(canonical_event_id)

    return {match_type: set(eid_series[mask].dropna())}



def match_events_start_and_end(
    ocel: OCEL,
    start_selectors: Optional[Iterable[dict]] = None,
    end_selectors: Optional[Iterable[dict]] = None,
    event_to_object_types: Optional[Dict[str, Set[str]]] = None,
) -> Dict[str, Set[str]]:
    """Match start and end event sets in one pass over events."""
    start_selectors = list(start_selectors or [])
    end_selectors = list(end_selectors or [])

    if not start_selectors:
        raise ValueError("At least one start selector must be provided.")
    if not end_selectors:
        raise ValueError("At least one end selector must be provided.")

    if event_to_object_types is None:
        event_to_object_types = build_event_to_object_types(ocel)

    eid_series = ocel.events[ocel.event_id_column].map(canonical_event_id)
    start_mask = _selector_mask(ocel, start_selectors, event_to_object_types)
    end_mask = _selector_mask(ocel, end_selectors, event_to_object_types)

    return {
        "start": set(eid_series[start_mask].dropna()),
        "end": set(eid_series[end_mask].dropna()),
    }



def _normalize_entity_set(values: Optional[Iterable[str]]) -> Set[str]:
    out = {_scalar_str(x) for x in (values or [])}
    out.discard(None)
    return out


def _selector_matches_event(
    selector: dict,
    object_types: Set[str],
    activity: Optional[str],
) -> bool:
    selector_act = _scalar_str(selector.get("activity"))
    if selector_act is not None and activity != selector_act:
        return False
    return _normalize_entity_set(selector.get("objectTypes")).issubset(object_types)


def _event_passes_include_exclude(
    object_types: Set[str],
    activity: Optional[str],
    include: list,
    exclude: list,
) -> bool:
    """
    Include/exclude filter for trace rules (no attribute conditions).

    Selectors are combined with OR; an empty include list passes all events and an
    empty exclude list excludes nothing.
    """
    include_pass = not include or any(
        _selector_matches_event(s, object_types, activity) for s in include
    )
    exclude_pass = any(
        _selector_matches_event(s, object_types, activity) for s in exclude
    )
    return include_pass and not exclude_pass


def filter_trace_events(
    ocel: OCEL,
    event_ids: Iterable[str],
    include_selectors: Optional[Iterable[dict]] = None,
    exclude_selectors: Optional[Iterable[dict]] = None,
    event_to_object_types: Optional[Dict[str, Set[str]]] = None,
) -> Set[str]:
    """Keep trace path events that satisfy the include / exclude selectors."""
    include = list(include_selectors or [])
    exclude = list(exclude_selectors or [])

    normalized_ids = {canonical_event_id(eid) for eid in event_ids}
    normalized_ids.discard(None)
    if not normalized_ids:
        return set()
    if not include and not exclude:
        return normalized_ids

    if event_to_object_types is None:
        event_to_object_types = build_event_to_object_types(ocel)

    events_df = ocel.events
    eid_series = events_df[ocel.event_id_column].map(canonical_event_id)
    act_series = events_df[ocel.event_activity].map(_scalar_str)
    eid_to_activity = dict(zip(eid_series, act_series))

    kept: Set[str] = set()
    for eid in normalized_ids:
        if _event_passes_include_exclude(
            event_to_object_types.get(eid, set()),
            eid_to_activity.get(eid),
            include,
            exclude,
        ):
            kept.add(eid)
    return kept


def trace_rule_signature(
    start: Iterable[dict],
    end: Iterable[dict],
    include: Optional[Iterable[dict]] = None,
    exclude: Optional[Iterable[dict]] = None,
) -> Tuple[Tuple, Tuple, Tuple, Tuple]:
    """Cache key for identical trace criteria including include/exclude filters."""
    return (
        selector_signature(start),
        selector_signature(end),
        selector_signature(include),
        selector_signature(exclude),
    )


