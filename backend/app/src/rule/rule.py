from typing import List, Optional

class Rule:
    def __init__(
        self,
        process_name: str,
        rule_name: str,
        include_object: Optional[List[str]] = None,
        exclude_object: Optional[List[str]] = None,
        include_activity: Optional[List[str]] = None,
        exclude_activity: Optional[List[str]] = None,
    ):
        self.process_name = process_name
        self.rule_name = rule_name
        self.include_object = include_object or []
        self.exclude_object = exclude_object or []
        self.include_activity = include_activity or []
        self.exclude_activity = exclude_activity or []

    def __repr__(self):
        return (f"{self.rule_name}("
                f"include_object={self.include_object}, "
                f"exclude_object={self.exclude_object}, "
                f"include_activity={self.include_activity}, "
                f"exclude_activity={self.exclude_activity})")
    
    def check_events(self, event):
        io, eo, ia, ea = [], [], [], []

        # include object
        if len(self.include_object) > 0:
            for obj in self.include_object:
                oblist = []
                for relation in event.relationships:
                    ob = False
                    if obj == relation.qualifier:
                        ob = True
                    oblist.append(ob)
                io.append(any(oblist))
        else:
            io.append(True)
            
        # exclude object
        if len(self.exclude_object) > 0:
            for obj in self.exclude_object:
                oblist = []
                for relation in event.relationships:
                    ob = True
                    if obj == relation.qualifier:
                        ob = False
                    oblist.append(ob)
                eo.append(any(oblist))
        else:
            eo.append(True)
        
        # include activity
        if len(self.include_activity) > 0:
            for act in self.include_activity:
                if act == event.type:
                    ia.append(True)
                else:
                    ia.append(False)
        else:
            ia.append(True)
        
        # exclude activity
        if len(self.exclude_activity) > 0:
            for act in self.exclude_activity:
                if act == event.type:
                    ea.append(False)
                else:
                    ea.append(True)
        else:
            ea.append(True)
                    
        b = all([all(io), all(eo), any(ia), any(ea)])
        if b:
            event.relationships.append(
                {
                    "objectId": self.rule_name,
                    "qualifier": "process" 
                }
            )
    
    def check_event(self, object_type_map, event):
        rel_oid = [rel['objectId'] for rel in event['relationships']]
        rel_ot = [object_type_map[oid] for oid in rel_oid]

        if self.include_object and not all(obj in rel_ot for obj in self.include_object):
            return False

        if self.exclude_object and any(obj in rel_ot for obj in self.exclude_object):
            return False

        if self.include_activity and event['type'] not in self.include_activity:
            return False

        if self.exclude_activity and event['type'] in self.exclude_activity:
            return False

        if self.process_name not in [oid['objectId'] for oid in event['relationships']]:
            event['relationships'].append({
                "objectId": self.process_name,
                "qualifier": "process"
            })
    
    def check_object_types(self, object_types):
        if self.process_name not in [ot['name'] for ot in object_types]:
            object_types.append({
                "name": self.process_name,
                "attribute": [
                    {
                        "name": "isprocess",
                        "value": True
                    }
                ]
            })
    
    def check_objects(self, objects):
        if self.process_name not in [obj['type'] for obj in objects]:
            objects.append({
                "id": self.process_name,
                "type": self.process_name
            })


