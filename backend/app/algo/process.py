from .rule import Rule
from .trace import TraceRule

class RuleProcess:
    def __init__(self, process_name, rules, relations):
        self.process_name = process_name
        self.rules = rules
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
        new_objects = [
            obj for obj in objects
            if obj.get('type') != 'process' or obj.get('id') not in deleted_processes
        ]        
        objects.clear()
        objects.extend(new_objects)
    
    @staticmethod
    def clear_process_event(event, deleted_processes):
        new_relationships = [
            rel for rel in event['relationships'] 
            if rel.get('qualifier') != 'process' or rel.get('objectId') not in deleted_processes
        ]
        event['relationships'].clear()
        event['relationships'].extend(new_relationships)

    def update_objects(self, objects):
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
            rule = Rule(parent_process=r["parentProcess"], 
                        rule_name=r["ruleName"],
                        include_ot=r["includeOT"]["entities"],
                        include_ot_cond=r["includeOT"]["condition"],
                        include_act=r["includeAct"]["entities"],
                        include_act_cond=r["includeAct"]["condition"],
                        exclude_ot=r["excludeOT"]["entities"],
                        exclude_ot_cond=r["excludeOT"]["condition"],
                        exclude_act=r["excludeAct"]["entities"],
                        exclude_act_cond=r["excludeAct"]["condition"])
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
        event_pass = self.evaluate(context)
        if any(o.get('objectId') == self.process_name and o.get('qualifier') == 'process' for o in event['relationships']):
            if not event_pass:
                new_relationships = [
                    rel for rel in event['relationships'] 
                    if rel.get('objectId') != self.process_name or rel.get('qualifier') != 'process'
                ]
                event['relationships'].clear()
                event['relationships'].extend(new_relationships)
                return
            else:
                return

        if event_pass:
            event['relationships'].append({
                'objectId': self.process_name,
                'qualifier': 'process'
            })
    
    def update(self, event_log, object_type_map, object_attr_map, deleted_processes, should_cancel=None):
        for event in event_log["events"]:
            if should_cancel and should_cancel():
                raise RuntimeError("Processing cancelled")
            RuleProcess.clear_process_event(event=event, deleted_processes=deleted_processes)
            context = self.apply_rules(object_type_map=object_type_map, object_attr_map=object_attr_map, event=event)
            self.update_event(context=context, event=event)
        
        self.update_objects(event_log["objects"])


class TraceProcess:
    def __init__(self, process_name, rules):
        self.process_name = process_name
        self.rules = rules

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
            start_ot=rule_data.get("startOT", []),
            start_act=rule_data.get("startAct", []),
            end_ot=rule_data.get("endOT", []),
            end_act=rule_data.get("endAct", []),
            include_ot=rule_data.get("includeOT", []),
            include_act=rule_data.get("includeAct", []),
            exclude_ot=rule_data.get("excludeOT", []),
            exclude_act=rule_data.get("excludeAct", []),
        )

    def _precompute_rule_matches(self, ocel, traces, should_cancel=None):
        matches = {}
        for rule_data in self.rules:
            if should_cancel and should_cancel():
                raise RuntimeError("Processing cancelled")
            trace_rule = self._build_trace_rule(rule_data)
            matches[trace_rule.trace_name] = trace_rule.get_traces(ocel=ocel, traces=traces)
        return matches

    def apply_rules(self, ocel, rule_matches, event):
        context = dict()
        event_id = event.get(ocel.event_id_column)
        for trace_name, matched_event_ids in rule_matches.items():
            context[trace_name] = event_id in matched_event_ids
        return context

    def evaluate(self, context):
        return any(context.values())

    def update_event(self, context, event):
        event_pass = self.evaluate(context)
        if any(o.get('objectId') == self.process_name and o.get('qualifier') == 'process' for o in event['relationships']):
            if not event_pass:
                new_relationships = [
                    rel for rel in event['relationships']
                    if rel.get('objectId') != self.process_name or rel.get('qualifier') != 'process'
                ]
                event['relationships'].clear()
                event['relationships'].extend(new_relationships)
                return
            else:
                return

        if event_pass:
            event['relationships'].append({
                'objectId': self.process_name,
                'qualifier': 'process'
            })

    def update(self, ocel, traces, event_log, deleted_processes, should_cancel=None):
        rule_matches = self._precompute_rule_matches(ocel=ocel, traces=traces, should_cancel=should_cancel)
        for event in event_log["events"]:
            if should_cancel and should_cancel():
                raise RuntimeError("Processing cancelled")
            TraceProcess.clear_process_event(event=event, deleted_processes=deleted_processes)
            context = self.apply_rules(ocel=ocel, rule_matches=rule_matches, event=event)
            self.update_event(context=context, event=event)

        self.update_objects(event_log["objects"])