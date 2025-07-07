from typing import Dict, Set
from pm4py.objects.ocel.obj import OCEL

def get_object_list(ocel: OCEL) -> Dict[str, int]:
    ol = {}
    ots = ocel.objects[ocel.object_type_column]
    for ot in ots:
        if ot not in ol:
            ol[ot] = 0
        ol[ot] += 1
    return [{'name': k, 'count': v} for k, v in ol.items()]


def _filter_column_values(
    ocel,
    target_column: str,
    qualifier_column: str = 'ocel:qualifier',
    qualifier_value: str = None,
    exclude: bool = False
) -> Set[str]:
    """
    Helper function to extract values from a column based on qualifier filter.
    """
    if qualifier_value is not None:
        mask = ocel[qualifier_column] != qualifier_value if exclude else ocel[qualifier_column] == qualifier_value
        return set(ocel.loc[mask, target_column])
    else:
        return set(ocel[target_column])


def get_object_types(ocel: OCEL) -> Set[str]:
    """
    Returns the set of object types.
    """
    return _filter_column_values(
        ocel.relations,
        target_column=ocel.object_type_column,
        qualifier_value="process",
        exclude=True
    )


def get_objects(ocel: OCEL) -> Set[str]:
    """
    Returns the set of object IDs.
    """
    return _filter_column_values(
        ocel.relations,
        target_column=ocel.object_id_column,
        qualifier_value="process",
        exclude=True
    )


def get_processes(ocel: OCEL) -> Set[str]:
    """
    Returns the set of process types.
    """
    return _filter_column_values(
        ocel.relations,
        target_column=ocel.object_type_column,
        qualifier_value="process"
    )


def get_activities(ocel: OCEL) -> Set[str]:
    """
    Returns the set of all unique activity names from the event log.
    """
    return set(ocel.events[ocel.event_activity].unique())


def get_events(ocel: OCEL) -> Set[str]:
    """
    Returns the set of all unique event IDs from the event log.
    """
    return set(ocel.events[ocel.event_id_column].unique())