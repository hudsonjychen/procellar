import ast
from typing import List
import operator

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
        include_ot: List[str],
        include_ot_cond: List[str],
        exclude_ot: List[str],
        exclude_ot_cond: List[str],
        include_act: List[str],
        include_act_cond: List[str],
        exclude_act: List[str],
        exclude_act_cond: List[str],
    ):
        self.parent_process = parent_process
        self.rule_name = rule_name
        self.include_ot = include_ot
        self.include_ot_cond = include_ot_cond
        self.exclude_ot = exclude_ot
        self.exclude_ot_cond = exclude_ot_cond
        self.include_act = include_act
        self.include_act_cond = include_act_cond
        self.exclude_act = exclude_act
        self.exclude_act_cond = exclude_act_cond

    def __repr__(self):
        return (
            f"{self.__class__.__name__}("
            f"parent_process={self.parent_process!r}, "
            f"rule_name={self.rule_name!r}, "
            f"include_ot={self.include_ot!r}, "
            f"include_ot_cond={self.include_ot_cond!r}, "
            f"exclude_ot={self.exclude_ot!r}, "
            f"exclude_ot_cond={self.exclude_ot_cond!r}, "
            f"include_act={self.include_act!r}, "
            f"include_act_cond={self.include_act_cond!r}, "
            f"exclude_act={self.exclude_act!r}, "
            f"exclude_act_cond={self.exclude_act_cond!r})"
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
    def _check_ot_condition(conds, object_type_map, object_attr_map, event):
        context = []
        if len(conds) > 0:
            for cond in conds:
                for rel in event['relationships']:
                    if object_type_map[rel['objectId']] == cond['entity']:
                        for attr in object_attr_map[rel['objectId']]:
                            if attr['name'] == cond['attribute']:
                                op = Rule._operator_convert(cond['operator'])
                                val = Rule._value_convert(cond['value'])
                                try:
                                    print(attr['value'], op, val)
                                    context.append(op(attr['value'], val))
                                except TypeError:
                                    context.append(False)
        if len(context) > 0:
            return all(context)
        else:
            return True
    
    @staticmethod
    def _check_act_condition(conds, event):
        context = []
        if len(conds) > 0:
            for cond in conds:
                if event['type'] == cond['entity']:
                    for attr in event['attributes']:
                        if attr['name'] == cond['attribute']:
                            op = Rule._operator_convert(cond['operator'])
                            val = Rule._value_convert(cond['operator'])
                            try:
                                print(attr['value'], op, val)
                                context.append(op(attr['value'], val))
                            except TypeError:
                                context.append(False)
        if len(context) > 0:
            return all(context)
        else:
            return True

    def check_event(self, object_type_map, object_attr_map, event):
        rel_oid = [rel['objectId'] for rel in event['relationships'] if rel['qualifier'] != 'process']
        rel_ot = [object_type_map[oid] for oid in rel_oid if oid in object_type_map]

        if self.parent_process in rel_oid:
            return False
        
        if self.exclude_act and event['type'] in self.exclude_act and self._check_act_condition(self.exclude_act_cond, event):
            return False
        
        if self.include_act and event['type'] in self.include_act and self._check_act_condition(self.include_act_cond, event):
            return True

        if self.exclude_ot:
            if all(ot in rel_ot for ot in self.exclude_ot) and self._check_ot_condition(self.exclude_ot_cond, object_type_map, object_attr_map, event): 
                return False
            else:
                if self.include_ot and all(ot in rel_ot for ot in self.include_ot) and self._check_ot_condition(self.include_ot_cond, object_type_map, object_attr_map, event):
                    return True
                elif not self.include_ot:
                    return True

        if self.include_ot and all(ot in rel_ot for ot in self.include_ot) and self._check_ot_condition(self.include_ot_cond, object_type_map, object_attr_map, event):
            return True
            
        return False