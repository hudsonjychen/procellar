export interface RuleInfo {
  ruleName: string;
  parentProcess: { title: string; inputValue?: string } | null;
}

export interface SelectedEntities {
  includeOT: string[];
  includeAct: string[];
  excludeOT: string[];
  excludeAct: string[];
}

export interface RuleData {
  ruleName: string;
  parentProcess: string;
  includeOT: RuleBlock;
  includeAct: RuleBlock;
  excludeOT: RuleBlock;
  excludeAct: RuleBlock;
}

export interface TraceData {
  traceName: string;
  parentProcess: string;
  startOT: string[];
  startAct: string[];
  endOT: string[];
  endAct: string[];
  includeOT: string[];
  includeAct: string[];
  excludeOT: string[];
  excludeAct: string[];
}

export interface RuleBlock {
  entities: string[];
  condition: {
    entity: string;
    attribute: string;
    operator: Operator;
    value: string;
  }[];
}

export type Operator = "==" | "!=" | ">" | ">=" | "<" | "<=" | "in" | "not in";
