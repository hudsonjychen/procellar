from typing import Callable, Optional

from .edges import list_event_edges
from .ids import event_id_in_set
from .scan import build_incoming, build_outgoing
from .rule import Rule
from .selector import (
    SelectorFormatError,
    normalize_selector_list,
    selector_entities,
)
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


def normalize_trace(raw) -> dict:
    """Normalize a trace rule; only the selector format is accepted."""
    if not isinstance(raw, dict):
        raise SelectorFormatError("Each trace must be an object")

    trace_name = raw.get("traceName")
    owner = f"Trace '{trace_name}': "
    if raw.get("start") is None or raw.get("end") is None:
        raise SelectorFormatError(
            f"Trace '{trace_name}' uses an unsupported format; "
            "expected 'start' / 'end' selector lists"
        )

    normalized = {
        "traceName": trace_name,
        "parentProcess": raw.get("parentProcess"),
    }
    for key in ("start", "end", "include", "exclude"):
        normalized[key] = normalize_selector_list(raw.get(key), key, owner)

    for key in ("start", "end"):
        if not normalized[key]:
            raise SelectorFormatError(
                f"Trace '{trace_name}': '{key}' needs at least one selector with entities"
            )
    return normalized


def trace_entities(trace: dict):
    """Object types and activities referenced by a normalized trace."""
    return selector_entities(
        trace.get("start"),
        trace.get("end"),
        trace.get("include"),
        trace.get("exclude"),
    )


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
        self._compiled_rules = [Rule.from_dict(r) for r in self.rules]
    
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
        for rule in self._compiled_rules:
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
        trace = normalize_trace(rule_data)
        return TraceRule(
            parent_process=trace["parentProcess"],
            trace_name=trace["traceName"],
            start=trace["start"],
            end=trace["end"],
            include=trace["include"],
            exclude=trace["exclude"],
        )

    def _precompute_rule_matches(
        self,
        ocel,
        edges=None,
        outgoing=None,
        incoming=None,
        event_to_object_types=None,
        trace_rule_cache=None,
        trace_scan_cache=None,
        reachability_cache=None,
        should_cancel=None,
        scan_progress_callback: Optional[Callable[[float], None]] = None,
    ):
        """
        Each value is the set of event ids from ``TraceRule.get_traces``
        (``list_event_edges`` + ``scan_edges``). Stamping checks union membership
        when attaching ``qualifier: process`` links.
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
        if outgoing is None:
            outgoing = build_outgoing(edges)
        if incoming is None:
            incoming = build_incoming(outgoing)

        for ri, rule_data in enumerate(self.rules):
            if should_cancel and should_cancel():
                raise RuntimeError("Processing cancelled")
            trace_rule = self._build_trace_rule(rule_data)

            def sub_cb(t: float, r: int = ri) -> None:
                report_local(precompute_share * (r + t) / n_rules)

            sig = trace_rule.cache_signature()
            if trace_rule_cache is not None and sig in trace_rule_cache:
                raw_ids = trace_rule_cache[sig]
            else:
                raw_ids = trace_rule.get_traces(
                    ocel=ocel,
                    edges=edges,
                    outgoing=outgoing,
                    incoming=incoming,
                    event_to_object_types=event_to_object_types,
                    scan_cache=trace_scan_cache,
                    reachability_cache=reachability_cache,
                    scan_progress_callback=sub_cb if scan_progress_callback else None,
                    should_cancel=should_cancel,
                )
                if trace_rule_cache is not None:
                    trace_rule_cache[sig] = set(raw_ids)

            trace_key = (
                trace_rule.trace_name
                if trace_rule.trace_name is not None
                else f"__trace_rule_{ri}"
            )
            matches[trace_key] = set(raw_ids)

        report_local(precompute_share)
        return matches

    @staticmethod
    def _union_matched_ids(rule_matches):
        union: set = set()
        for matched in (rule_matches or {}).values():
            union.update(matched)
        return frozenset(union)

    def event_matches_process(self, ocel, union_matched_ids, event):
        return event_id_in_set(_json_event_id(event, ocel), union_matched_ids)

    def update_event(self, event_pass, event):
        _ensure_event_relationships(event)
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
        outgoing=None,
        incoming=None,
        event_to_object_types=None,
        trace_rule_cache=None,
        trace_scan_cache=None,
        reachability_cache=None,
        should_cancel=None,
        scan_progress_callback: Optional[Callable[[float], None]] = None,
        **_legacy,
    ):
        rule_matches = self._precompute_rule_matches(
            ocel=ocel,
            edges=edges,
            outgoing=outgoing,
            incoming=incoming,
            event_to_object_types=event_to_object_types,
            trace_rule_cache=trace_rule_cache,
            trace_scan_cache=trace_scan_cache,
            reachability_cache=reachability_cache,
            should_cancel=should_cancel,
            scan_progress_callback=scan_progress_callback,
        )
        union_matched = self._union_matched_ids(rule_matches)
        events = event_log.get("events") or []
        n_events = len(events) or 1
        stamp_share = 0.1
        for ei, event in enumerate(events):
            if should_cancel and should_cancel():
                raise RuntimeError("Processing cancelled")
            if scan_progress_callback and ei % max(1, n_events // 50) == 0:
                scan_progress_callback(0.9 + stamp_share * (ei / n_events))
            TraceProcess.clear_process_event(event=event, deleted_processes=deleted_processes)
            event_pass = self.event_matches_process(ocel, union_matched, event)
            self.update_event(event_pass=event_pass, event=event)

        if scan_progress_callback:
            scan_progress_callback(1.0)
        self.update_objects(event_log.get("objects") or [])