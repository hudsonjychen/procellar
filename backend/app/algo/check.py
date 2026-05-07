from .entity import get_object_types, get_activities

class CompatibilityError(Exception):
    pass


def compatibility_check(ocel, df):
    df_ots, df_acts = set(), set()

    for process in df:
        for rule in process.get('rules', []):
            df_ots.update(list(rule.get('includeOT', {}).get('entities', [])) or [])
            df_ots.update(list(rule.get('excludeOT', {}).get('entities', [])) or [])
            df_acts.update(list(rule.get('includeAct', {}).get('entities', [])) or [])
            df_acts.update(list(rule.get('excludeAct', {}).get('entities', [])) or [])
        for trace in process.get('traces', []):
            df_ots.update(list(trace.get('startOT', [])) or [])
            df_ots.update(list(trace.get('endOT', [])) or [])
            df_ots.update(list(trace.get('includeOT', [])) or [])
            df_ots.update(list(trace.get('excludeOT', [])) or [])
            df_acts.update(list(trace.get('startAct', [])) or [])
            df_acts.update(list(trace.get('endAct', [])) or [])
            df_acts.update(list(trace.get('includeAct', [])) or [])
            df_acts.update(list(trace.get('excludeAct', [])) or [])
    
    object_types = get_object_types(ocel)
    activities = get_activities(ocel)

    if not (df_ots <= object_types and df_acts <= activities):
        raise CompatibilityError("The definition file is not compatible with the OCEL.")
    
    return True
