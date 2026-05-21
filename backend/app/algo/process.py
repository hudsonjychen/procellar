from typing import Callable, Optional

from .edges import list_event_edges
from .ids import canonical_event_id
from .rule import Rule
from .trace import TraceRule


def _ensure_event_relationships(event: dict) -> None:
    """OCEL JSON may set ``relationships`` to null; normalize to a mutable list."""
    if event.get("relationships") is None:
        event["relationships"] = []


def _ensure_event_log_structure(event_log: dict) -> None:
    """Ensure list fields exist so in-place updates never iterate ``null``."""
    if event_log.get("objectTypes") is None:
        event_log["objectTypes"] = []
    if event_log.get("objects") is None:
        event_log["objects"] = []
    if event_log.get("events") is None:
        event_log["events"] = []


def _trace_entity_list(value) -> list:
    """
    Normalize trace rule object-type / activity fields from the UI or definition JSON.

    Accepts ``string[]`` (normal editor), a single string, or ``{"entities": [...]}`` as
    used for standard rules. Without this, a bare string becomes ``list(str)`` (per-char
    garbage), and dict payloads yield wrong matches so activity-based traces never link.
    """
    if value is None:
        return []
    if isinstance(value, str):
        s = value.strip()
        return [s] if s else []
    if isinstance(value, list):
        out: list[str] = []
        for x in value:
            if x is None:
                continue
            sx = str(x).strip()
            if sx:
                out.append(sx)
        return out
    if isinstance(value, dict):
        ent = value.get("entities")
        if isinstance(ent, list):
            return _trace_entity_list(ent)
        return []
    return []


def _json_event_id(event: dict, ocel) -> object:
    """
    Resolve the event id on an OCEL2 **JSON** event dict.

    pm4py uses columns like ``ocel:eid`` on ``ocel.events``, while JSON exports
    typically use ``id``. ``match_events`` / ``scan_edges`` ids come from the pm4py
    side, so we must align keys when stamping ``relationships`` on JSON events.
    """
    col = ocel.event_id_column
    if col in event:
        return event[col]
    for alt in ("id", "eventId", "event_id"):
        if alt in event:
            return event[alt]
    return None


class RuleProcess:
    def __init__(self, process_name, rules, relations):
        self.process_name = process_name
        self.rules = rules or []
        self.relations = relations or {}
    
    @staticmethod
    def update_object_types(objectTypes):
        if any(ot.get('name') == 'process' for ot in objectTypes):
            return

        objectTypes.append({
            'name': 'process',
            'attributes': []
        })
    
    @staticmethod
    def clear_process_objects(objects, deleted_processes):
        if objects is None:
            return
        new_objects = [
            obj for obj in objects
            if obj.get('type') != 'process' or obj.get('id') not in deleted_processes
        ]
        objects.clear()
        objects.extend(new_objects)
    
    @staticmethod
    def clear_process_event(event, deleted_processes):
        _ensure_event_relationships(event)
        new_relationships = [
            rel for rel in event["relationships"]
            if rel.get("qualifier") != "process" or rel.get("objectId") not in deleted_processes
        ]
        event["relationships"].clear()
        event["relationships"].extend(new_relationships)

    def update_objects(self, objects):
        if objects is None:
            return
        if any(o.get('id') == self.process_name and o.get('type') == 'process' for o in objects):
            return
        objects.append({
            'id': self.process_name,
            'type': 'process',
            'attributes': []
        })

    def apply_rules(self, object_type_map, object_attr_map, event):
        context = dict()
        for r in self.rules:
            inc_ot = r.get("includeOT") or {}
            inc_act = r.get("includeAct") or {}
            exc_ot = r.get("excludeOT") or {}
            exc_act = r.get("excludeAct") or {}
            rule = Rule(
                parent_process=r.get("parentProcess"),
                rule_name=r.get("ruleName"),
                include_ot=inc_ot.get("entities") or [],
                include_ot_cond=inc_ot.get("condition") or [],
                include_act=inc_act.get("entities") or [],
                include_act_cond=inc_act.get("condition") or [],
                exclude_ot=exc_ot.get("entities") or [],
                exclude_ot_cond=exc_ot.get("condition") or [],
                exclude_act=exc_act.get("entities") or [],
                exclude_act_cond=exc_act.get("condition") or [],
            )
            bool_value = rule.check_event(object_type_map, object_attr_map, event)
            context[rule.rule_name] = bool_value
        return context
    
    def _temp_evaluate(self, context):
        return any(context.values())

    def evaluate(self, context):
        if self.relations:
            return self._evaluate_node(self.relations, context)
        else:
            return any(context.values())

    def _evaluate_node(self, node, context):
        if isinstance(node, str):
            return context[node]
        
        op = node.get('op')
        left = self._evaluate_node(node['left'], context)
        right = self._evaluate_node(node['right'], context)

        if op == 'and':
            return left and right
        elif op == 'or':
            return left or right
        else:
            raise ValueError(f'Invalid operator: {op}')
        
    def update_event(self, context, event): 
        _ensure_event_relationships(event)
        event_pass = self.evaluate(context)
        if any(o.get('objectId') == self.process_name and o.get('qualifier') == 'process' for o in event["relationships"]):
            if not event_pass:
                new_relationships = [
                    rel for rel in event["relationships"]
                    if rel.get('objectId') != self.process_name or rel.get('qualifier') != 'process'
                ]
                event["relationships"].clear()
                event["relationships"].extend(new_relationships)
                return
            else:
                return

        if event_pass:
            event["relationships"].append({
                'objectId': self.process_name,
                'qualifier': 'process'
            })
    
    def update(self, event_log, object_type_map, object_attr_map, deleted_processes, should_cancel=None):
        for event in event_log.get("events") or []:
            if should_cancel and should_cancel():
                raise RuntimeError("Processing cancelled")
            RuleProcess.clear_process_event(event=event, deleted_processes=deleted_processes)
            context = self.apply_rules(object_type_map=object_type_map, object_attr_map=object_attr_map, event=event)
            self.update_event(context=context, event=event)
        
        self.update_objects(event_log.get("objects") or [])


class TraceProcess:
    def __init__(self, process_name, rules):
        self.process_name = process_name
        self.rules = rules or []

    @staticmethod
    def update_object_types(objectTypes):
        RuleProcess.update_object_types(objectTypes)

    @staticmethod
    def clear_process_objects(objects, deleted_processes):
        RuleProcess.clear_process_objects(objects, deleted_processes)

    @staticmethod
    def clear_process_event(event, deleted_processes):
        RuleProcess.clear_process_event(event, deleted_processes)

    def update_objects(self, objects):
        if objects is None:
            return
        if any(o.get('id') == self.process_name and o.get('type') == 'process' for o in objects):
            return
        objects.append({
            'id': self.process_name,
            'type': 'process',
            'attributes': []
        })

    def _build_trace_rule(self, rule_data):
        return TraceRule(
            parent_process=rule_data.get("parentProcess"),
            trace_name=rule_data.get("traceName"),
            start_ot=_trace_entity_list(rule_data.get("startOT")),
            start_act=_trace_entity_list(rule_data.get("startAct")),
            end_ot=_trace_entity_list(rule_data.get("endOT")),
            end_act=_trace_entity_list(rule_data.get("endAct")),
            include_ot=_trace_entity_list(rule_data.get("includeOT")),
            include_act=_trace_entity_list(rule_data.get("includeAct")),
            exclude_ot=_trace_entity_list(rule_data.get("excludeOT")),
            exclude_act=_trace_entity_list(rule_data.get("excludeAct")),
        )

    def _precompute_rule_matches(
        self,
        ocel,
        edges=None,
        should_cancel=None,
        scan_progress_callback: Optional[Callable[[float], None]] = None,
    ):
        """
        Each value is the set of event ids from ``TraceRule.get_traces``
        (``list_event_edges`` + ``scan_edges``). ``apply_rules`` checks membership when
        attaching ``qualifier: process`` links.
        """
        matches = {}
        n_rules = len(self.rules) or 1
        precompute_share = 0.9

        def report_local(t: float) -> None:
            """``t`` in [0, 1] for this process only (``update`` maps it globally)."""
            if scan_progress_callback:
                scan_progress_callback(max(0.0, min(1.0, t)))

        if edges is None:
            edges = list_event_edges(
                ocel,
                progress_callback=(
                    (lambda t: report_local(0.05 + 0.25 * t)) if scan_progress_callback else None
                ),
                should_cancel=should_cancel,
            )
            report_local(0.30)

        for ri, rule_data in enumerate(self.rules):
            if should_cancel and should_cancel():
                raise RuntimeError("Processing cancelled")
            trace_rule = self._build_trace_rule(rule_data)

            def sub_cb(t: float, r: int = ri) -> None:
                report_local(precompute_share * (r + t) / n_rules)

            raw_ids = trace_rule.get_traces(
                ocel=ocel,
                edges=edges,
                scan_progress_callback=sub_cb if scan_progress_callback else None,
                should_cancel=should_cancel,
            )
            trace_key = (
                trace_rule.trace_name
                if trace_rule.trace_name is not None
                else f"__trace_rule_{ri}"
            )
            matches[trace_key] = set(raw_ids)

        report_local(precompute_share)
        return matches

    def apply_rules(self, ocel, rule_matches, event):
        context = dict()
        eid = canonical_event_id(_json_event_id(event, ocel))
        for trace_name, matched_event_ids in rule_matches.items():
            context[trace_name] = eid is not None and eid in matched_event_ids
        return context

    def evaluate(self, context):
        return any(context.values())

    def update_event(self, context, event):
        _ensure_event_relationships(event)
        event_pass = self.evaluate(context)
        if any(o.get('objectId') == self.process_name and o.get('qualifier') == 'process' for o in event["relationships"]):
            if not event_pass:
                new_relationships = [
                    rel for rel in event["relationships"]
                    if rel.get('objectId') != self.process_name or rel.get('qualifier') != 'process'
                ]
                event["relationships"].clear()
                event["relationships"].extend(new_relationships)
                return
            else:
                return

        if event_pass:
            event["relationships"].append({
                'objectId': self.process_name,
                'qualifier': 'process'
            })

    def update(
        self,
        ocel,
        event_log,
        deleted_processes,
        edges=None,
        should_cancel=None,
        scan_progress_callback: Optional[Callable[[float], None]] = None,
    ):
        rule_matches = self._precompute_rule_matches(
            ocel=ocel,
            edges=edges,
            should_cancel=should_cancel,
            scan_progress_callback=scan_progress_callback,
        )
        events = event_log.get("events") or []
        n_events = len(events) or 1
        stamp_share = 0.1
        for ei, event in enumerate(events):
            if should_cancel and should_cancel():
                raise RuntimeError("Processing cancelled")
            if scan_progress_callback and ei % max(1, n_events // 50) == 0:
                scan_progress_callback(0.9 + stamp_share * (ei / n_events))
            TraceProcess.clear_process_event(event=event, deleted_processes=deleted_processes)
            context = self.apply_rules(ocel=ocel, rule_matches=rule_matches, event=event)
            self.update_event(context=context, event=event)

        if scan_progress_callback:
            scan_progress_callback(1.0)
        self.update_objects(event_log.get("objects") or [])