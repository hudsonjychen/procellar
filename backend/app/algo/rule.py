from typing import List

class Rule:
    def __init__(
        self,
        parent_process: str,
        rule_name: str,
        include_ot: List[str],
        exclude_ot: List[str],
        include_act: List[str],
        exclude_act: List[str],
    ):
        self.parent_process = parent_process
        self.rule_name = rule_name
        self.include_ot = include_ot
        self.exclude_ot = exclude_ot
        self.include_act = include_act
        self.exclude_act = exclude_act

    def __repr__(self):
        return (f"parent process: {self.parent_process}\nrule name: {self.rule_name}("
                f"include object types = {self.include_ot}, "
                f"exclude object types = {self.exclude_ot}, "
                f"include activities = {self.include_act}, "
                f"exclude activities = {self.exclude_act})")
    
    def check_event(self, object_type_map, event):
        rel_oid = [rel['objectId'] for rel in event['relationships'] if rel['qualifier'] != 'process']
        rel_ot = [object_type_map[oid] for oid in rel_oid if oid in object_type_map]

        if self.parent_process in rel_oid:
            return False
        
        if self.exclude_act and event['type'] in self.exclude_act:
            return False
        
        if self.include_act and event['type'] in self.include_act:
            return True

        if self.exclude_ot:
            if all(ot in rel_ot for ot in self.exclude_ot):
                return False
            else:
                if self.include_ot and all(ot in rel_ot for ot in self.include_ot):
                    return True
                elif not self.include_ot:
                    return True

        if self.include_ot and all(ot in rel_ot for ot in self.include_ot):
            return True
            
        return False