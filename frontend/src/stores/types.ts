interface Condition {
  entity: string;
  attribute: string;
  operator: "==" | "!=" | ">" | ">=" | "<" | "<=" | "in" | "not in";
  value: string;
}

interface EntitiesWithCondition {
  entities: string[];
  condition: Condition[];
}

interface Rule {
  ruleName: string;
  parentProcess: string;
  includeOT: EntitiesWithCondition;
  includeAct: EntitiesWithCondition;
  excludeOT: EntitiesWithCondition;
  excludeAct: EntitiesWithCondition;
}

interface Trace {
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

type Relation =
  | {
      op: "and" | "or";
      left: string | Relation;
      right: string | Relation;
    }
  | {};

interface ProcessR {
  processName: string;
  imported: boolean;
  rules: Rule[];
  relations: Relation;
}

interface ProcessT {
  processName: string;
  imported: boolean;
  traces: Trace[];
  relations: Relation;
}

interface ProcessName {
  title: string;
  inputValue?: string;
}
export type ProcessData<T extends ProcessR | ProcessT = ProcessR | ProcessT> =
  T[];

export type ProcessNames = ProcessName[];
