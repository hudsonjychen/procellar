from .entity import get_object_types, get_activities
from .process import _trace_entity_list

class CompatibilityError(Exception):
    pass


def compatibility_check(ocel, df):
    df_ots, df_acts = set(), set()

    for process in df or []:
        if not isinstance(process, dict):
            continue
        for rule in (process.get("rules") or []):
            if not isinstance(rule, dict):
                continue
            inc_ot = rule.get("includeOT") or {}
            exc_ot = rule.get("excludeOT") or {}
            inc_act = rule.get("includeAct") or {}
            exc_act = rule.get("excludeAct") or {}
            df_ots.update(list(inc_ot.get("entities") or []))
            df_ots.update(list(exc_ot.get("entities") or []))
            df_acts.update(list(inc_act.get("entities") or []))
            df_acts.update(list(exc_act.get("entities") or []))
        for trace in (process.get("traces") or []):
            if not isinstance(trace, dict):
                continue
            df_ots.update(_trace_entity_list(trace.get("startOT")))
            df_ots.update(_trace_entity_list(trace.get("endOT")))
            df_ots.update(_trace_entity_list(trace.get("includeOT")))
            df_ots.update(_trace_entity_list(trace.get("excludeOT")))
            df_acts.update(_trace_entity_list(trace.get("startAct")))
            df_acts.update(_trace_entity_list(trace.get("endAct")))
            df_acts.update(_trace_entity_list(trace.get("includeAct")))
            df_acts.update(_trace_entity_list(trace.get("excludeAct")))
    
    object_types = get_object_types(ocel)
    activities = get_activities(ocel)

    if not (df_ots <= object_types and df_acts <= activities):
        raise CompatibilityError("The definition file is not compatible with the OCEL.")
    
    return True
