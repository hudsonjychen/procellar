from typing import Dict
from pm4py.objects.ocel.obj import OCEL
import pandas as pd

def map_object_id_to_type(ocel: OCEL) -> Dict[str, str]:
    """
    Creates a mapping from object ID to object type in an OCEL.

    Args:
        ocel (OCEL): The object-centric event log.

    Returns:
        Dict[str, str]: A dictionary mapping each object ID to its corresponding object type.
    """
    return ocel.objects.set_index(ocel.object_id_column)[ocel.object_type_column].to_dict()

def map_attibute_to_object_type(ocel: OCEL) -> Dict[str, list]:
    objects = ocel.objects
    attr_cols = objects.columns[2: ]
    ot_attrs = {}

    for _, row in objects.iterrows():
        ot = row[ocel.object_type_column]
        if ot not in ot_attrs:
            ot_attrs[ot] = set()
        for col in attr_cols:
            if pd.notna(row[col]):
                ot_attrs[ot].add(col)
    
    ot_attrs = {k: list(v) for k, v in ot_attrs.items()}
    return ot_attrs

def map_attribute(event_log):
    eventTypes = [{'name': item['name'], 'type': 'eventType', 'attributes': item['attributes']} for item in event_log['eventTypes']]
    objectTypes = [{'name': item['name'], 'type': 'objectType', 'attributes': item['attributes']} for item in event_log['objectTypes']]
    attributeMap = eventTypes + objectTypes
    return attributeMap