from typing import Dict, Iterable, Optional, Set

from pm4py.objects.ocel.obj import OCEL


def match_events(
    ocel: OCEL,
    object_types: Optional[Iterable[str]] = None,
    activities: Optional[Iterable[str]] = None,
    match_type: str = "start",
) -> Dict[str, Set[str]]:
    """
    Match events by object-type and activity filters.

    - object_types: event must be related to all given object types.
    - activities: event activity must be one of the given activities.
    - match_type: "start" or "end" (kept for caller semantics/validation).
    """
    if match_type not in {"start", "end"}:
        raise ValueError("match_type must be either 'start' or 'end'.")

    object_type_set = set(object_types or [])
    activity_set = set(activities or [])

    if not object_type_set and not activity_set:
        raise ValueError("At least one of object_types or activities must be provided.")

    # Build event -> related object types map from OCEL relations.
    rel_df = ocel.relations[[ocel.event_id_column, ocel.object_type_column]]
    event_to_object_types = (
        rel_df.groupby(ocel.event_id_column)[ocel.object_type_column].agg(set).to_dict()
    )

    matched_event_ids: Set[str] = set()
    for _, event in ocel.events.iterrows():
        event_id = event[ocel.event_id_column]
        event_activity = event[ocel.event_activity]
        related_object_types = event_to_object_types.get(event_id, set())

        object_types_match = (
            True if not object_type_set else object_type_set.issubset(related_object_types)
        )
        activities_match = True if not activity_set else event_activity in activity_set

        if object_types_match and activities_match:
            matched_event_ids.add(event_id)

    return {match_type: matched_event_ids}
