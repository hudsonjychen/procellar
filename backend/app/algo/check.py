from .entity import get_object_types, get_activities
from .process import normalize_trace, trace_entities
from .rule import normalize_rule, rule_entities
from .selector import SelectorFormatError

class CompatibilityError(Exception):
    pass


def compatibility_check(ocel, df):
    df_ots, df_acts = set(), set()

    for process in df or []:
        if not isinstance(process, dict):
            continue
        try:
            for rule in (process.get("rules") or []):
                rule_ots, rule_acts = rule_entities(normalize_rule(rule))
                df_ots.update(rule_ots)
                df_acts.update(rule_acts)
            for trace in (process.get("traces") or []):
                trace_ots, trace_acts = trace_entities(normalize_trace(trace))
                df_ots.update(trace_ots)
                df_acts.update(trace_acts)
        except SelectorFormatError as e:
            raise CompatibilityError(str(e)) from e

    object_types = get_object_types(ocel)
    activities = get_activities(ocel)

    if not (df_ots <= object_types and df_acts <= activities):
        raise CompatibilityError("The definition file is not compatible with the OCEL.")
    
    return True
