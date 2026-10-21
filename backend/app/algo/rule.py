import ast
from typing import List, Optional, Tuple
import operator

from .selector import (
    SelectorFormatError,
    entity_name as _entity_name,
    normalize_entity_selector,
    selector_entities,
)


def _normalize_condition(raw, object_types: List[str], activity: Optional[str]) -> Optional[dict]:
    if not isinstance(raw, dict):
        return None
    entity = _entity_name(raw.get("entity"))
    attribute = _entity_name(raw.get("attribute"))
    op = raw.get("operator")
    value = raw.get("value")
    if not entity or not attribute or op is None or value is None:
        return None

    entity_type = raw.get("entityType")
    if entity_type not in ("objectType", "activity"):
        entity_type = "activity" if entity == activity else "objectType"
    if entity_type == "activity" and entity != activity:
        return None
    if entity_type == "objectType" and entity not in object_types:
        return None

    return {
        "entityType": entity_type,
        "entity": entity,
        "attribute": attribute,
        "operator": op,
        "value": str(value),
    }


def normalize_selector(raw) -> Optional[dict]:
    """
    Normalize one rule selector, i.e. an entity selector plus attribute ``conditions``.

    Returns ``None`` for selectors without any entity.
    """
    selector = normalize_entity_selector(raw)
    if selector is None:
        return None

    object_types = selector["objectTypes"]
    activity = selector["activity"]
    conditions = [
        c
        for c in (
            _normalize_condition(cond, object_types, activity)
            for cond in (raw.get("conditions") or [])
        )
        if c is not None
    ]
    return {"objectTypes": object_types, "activity": activity, "conditions": conditions}


def normalize_rule(raw) -> dict:
    """Normalize a standard rule; only the ``include`` / ``exclude`` selector format is accepted."""
    if not isinstance(raw, dict):
        raise SelectorFormatError("Each rule must be an object")

    rule_name = raw.get("ruleName")
    for key in ("include", "exclude"):
        if raw.get(key) is not None and not isinstance(raw.get(key), list):
            raise SelectorFormatError(
                f"Rule '{rule_name}': '{key}' must be a list of selectors"
            )
    if raw.get("include") is None and raw.get("exclude") is None:
        raise SelectorFormatError(
            f"Rule '{rule_name}' uses an unsupported format; expected 'include' / 'exclude' selector lists"
        )

    normalized = {
        "ruleName": rule_name,
        "parentProcess": raw.get("parentProcess"),
    }
    for key in ("include", "exclude"):
        selectors = [normalize_selector(s) for s in (raw.get(key) or [])]
        normalized[key] = [s for s in selectors if s is not None]
    return normalized


def rule_entities(rule: dict) -> Tuple[set, set]:
    """Object types and activities referenced by a normalized rule."""
    return selector_entities(rule.get("include"), rule.get("exclude"))


class Selector:
    """
    Matches an event when its activity equals ``activity`` (if set), it is related to
    every object type in ``object_types``, and all attribute ``conditions`` hold.
    """

    def __init__(self, object_types: List[str], activity: Optional[str], conditions: List[dict]):
        self.object_types = list(object_types or [])
        self.activity = activity
        self.ot_conditions = [c for c in (conditions or []) if c["entityType"] == "objectType"]
        self.act_conditions = [c for c in (conditions or []) if c["entityType"] == "activity"]

    @classmethod
    def from_dict(cls, data: dict) -> "Selector":
        return cls(
            object_types=data.get("objectTypes") or [],
            activity=data.get("activity"),
            conditions=data.get("conditions") or [],
        )

    def __repr__(self):
        return (
            f"{self.__class__.__name__}("
            f"object_types={self.object_types!r}, "
            f"activity={self.activity!r}, "
            f"conditions={self.ot_conditions + self.act_conditions!r})"
        )

    def matches(self, event, rel_oid, rel_ot, object_type_map, object_attr_map) -> bool:
        if self.activity is not None and event.get("type") != self.activity:
            return False
        if any(ot not in rel_ot for ot in self.object_types):
            return False
        return (
            Rule._check_ot_condition(self.ot_conditions, rel_oid, object_type_map, object_attr_map)
            and Rule._check_act_condition(self.act_conditions, event)
        )


class Rule:
    OPERATORS = {
        '==': operator.eq,
        '!=': operator.ne,
        '>': operator.gt,
        '<': operator.lt,
        '>=': operator.ge,
        '<=': operator.le,
        'in': lambda a, b: a in b,
        'not in': lambda a, b: a not in b
    }

    ALLOWED_TYPES = (int, float, str, bool, list, type(None))

    def __init__(
        self,
        parent_process: str,
        rule_name: str,
        include: List[Selector],
        exclude: List[Selector],
    ):
        self.parent_process = parent_process
        self.rule_name = rule_name
        self.include = list(include or [])
        self.exclude = list(exclude or [])

    @classmethod
    def from_dict(cls, data: dict) -> "Rule":
        rule = normalize_rule(data)
        return cls(
            parent_process=rule["parentProcess"],
            rule_name=rule["ruleName"],
            include=[Selector.from_dict(s) for s in rule["include"]],
            exclude=[Selector.from_dict(s) for s in rule["exclude"]],
        )

    def __repr__(self):
        return (
            f"{self.__class__.__name__}("
            f"parent_process={self.parent_process!r}, "
            f"rule_name={self.rule_name!r}, "
            f"include={self.include!r}, "
            f"exclude={self.exclude!r})"
        )

    @classmethod
    def _value_convert(cls, value_str):
        try:
            res = ast.literal_eval(value_str)
            if isinstance(res, cls.ALLOWED_TYPES):
                return res
            else:
                return value_str
        except Exception:
            return value_str

    @classmethod
    def _operator_convert(cls, operator_str):
        op = cls.OPERATORS.get(operator_str)
        if not op:
            raise ValueError(f'Unsupported operator: {operator_str}')
        return op

    @staticmethod
    def _check_ot_condition(conds, rel_oid, object_type_map, object_attr_map):
        context = []
        for cond in conds or []:
            for oid in rel_oid:
                if object_type_map.get(oid) != cond['entity']:
                    continue
                for attr in object_attr_map.get(oid, []):
                    if attr['name'] == cond['attribute']:
                        op = Rule._operator_convert(cond['operator'])
                        val = Rule._value_convert(cond['value'])
                        try:
                            context.append(op(attr['value'], val))
                        except TypeError:
                            context.append(True)
        return all(context)

    @staticmethod
    def _check_act_condition(conds, event):
        context = []
        for cond in conds or []:
            if event.get('type') != cond['entity']:
                continue
            for attr in (event.get("attributes") or []):
                if attr['name'] == cond['attribute']:
                    op = Rule._operator_convert(cond['operator'])
                    val = Rule._value_convert(cond['value'])
                    try:
                        context.append(op(attr['value'], val))
                    except TypeError:
                        context.append(True)
        return all(context)

    def check_event(self, object_type_map, object_attr_map, event):
        rel_oid = [
            rel["objectId"]
            for rel in (event.get("relationships") or [])
            if rel.get("qualifier") != "process"
        ]
        rel_ot = {object_type_map[oid] for oid in rel_oid if oid in object_type_map}

        # a rule without any selector matches nothing
        if not self.include and not self.exclude:
            return False

        # check if the process has existed in the event, if so, return false
        if self.parent_process in rel_oid:
            return False

        args = (event, rel_oid, rel_ot, object_type_map, object_attr_map)
        # selectors within include / exclude are combined with OR
        include_pass = not self.include or any(s.matches(*args) for s in self.include)
        exclude_pass = any(s.matches(*args) for s in self.exclude)

        return include_pass and not exclude_pass
