from .rule import Rule

class Process:
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

    def update_objects(self, objects):
        if any(o.get('id') == self.process_name and o.get('type') == 'process' for o in objects):
            return
        objects.append({
            'id': self.process_name,
            'type': 'process',
            'attributes': []
        })

    def apply_rules(self, object_type_map, event):
        context = dict()
        for r in self.rules:
            rule = Rule(parent_process=r["parentProcess"], 
                        rule_name=r["ruleName"],
                        include_ot=r["includeOT"]["entities"],
                        include_act=r["includeAct"]["entities"],
                        exclude_ot=r["excludeOT"]["entities"],
                        exclude_act=r["excludeAct"]["entities"])
            bool_value = rule.check_event(object_type_map, event)
            context[rule.rule_name] = bool_value
        print(context)
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
        if not self.evaluate(context):
            return 
        if any(o.get('objectId') == self.process_name and o.get('qualifier') == 'process' for o in event['relationships']):
            return
        event['relationships'].append({
            'objectId': self.process_name,
            "qualifier": 'process'
        })
    
    def update(self, event_log, object_type_map):
        for event in event_log["events"]:
            context = self.apply_rules(object_type_map=object_type_map, event=event)
            self.update_event(context=context, event=event)
        
        self.update_objects(event_log["objects"])