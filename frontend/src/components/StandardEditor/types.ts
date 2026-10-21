export type Operator = "==" | "!=" | ">" | ">=" | "<" | "<=" | "in" | "not in";

export type ActionType = "include" | "exclude";

export type EntityType = "objectType" | "activity";

export type ConditionMap = Record<string, Condition>;

export type EntityList = string[];

export interface SelectorCondition {
  entityType: EntityType;
  entity: string;
  attribute: string;
  operator: Operator;
  value: string;
}

/** Matches events of `activity` (if set) that are related to every type in `objectTypes`. */
export interface Selector {
  objectTypes: string[];
  activity: string | null;
  conditions: SelectorCondition[];
}

/** Selectors within include / exclude are combined with OR. */
export interface RuleData {
  ruleName: string;
  parentProcess: string;
  include: Selector[];
  exclude: Selector[];
}

export interface Condition {
  id: number;
  type?: EntityType;
  entity?: string;
  attribute?: string;
  operator?: string;
  value?: string;
}

export interface DraftSelector {
  id: number;
  objectTypes: string[];
  activity: string | null;
  conditions: Condition[];
}

export interface DraftSelectors {
  include: DraftSelector[];
  exclude: DraftSelector[];
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
