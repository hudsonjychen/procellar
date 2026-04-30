export type Operator = "==" | "!=" | ">" | ">=" | "<" | "<=" | "in" | "not in";

export type ActionType = "include" | "exclude";

export type EntityType = "objectType" | "activity";

export type ConditionMap = Record<string, Condition>;

export type EntityList = string[];

export interface RuleBlock {
  entities: string[];
  condition: {
    entity: string;
    attribute: string;
    operator: Operator;
    value: string;
  }[];
}

export interface RuleData {
  ruleName: string;
  parentProcess: string;
  includeOT: RuleBlock;
  includeAct: RuleBlock;
  excludeOT: RuleBlock;
  excludeAct: RuleBlock;
}

export interface SelectedEntities {
  includeOT: string[];
  includeAct: string[];
  excludeOT: string[];
  excludeAct: string[];
}

export interface Condition {
  id: number;
  type?: EntityType;
  entity?: string;
  attribute?: string;
  operator?: string;
  value?: string;
}

export interface SelectedConditions {
  include: Condition[];
  exclude: Condition[];
}

export interface RuleInfo {
  ruleName: string;
  parentProcess: { title: string; inputValue?: string } | null;
}

export type AttributeType = "string" | "int64" | "float64";

export interface Attribute {
  name: string;
  type: AttributeType;
}

interface AttributeMap {
  name: string;
  type: "objectType" | "eventType";
  attributes: Attribute[];
}

export type AttributeMapList = AttributeMap[];
