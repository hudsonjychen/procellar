interface Condition {
  entityType: "objectType" | "activity";
  entity: string;
  attribute: string;
  operator: "==" | "!=" | ">" | ">=" | "<" | "<=" | "in" | "not in";
  value: string;
}

interface Selector {
  objectTypes: string[];
  activity: string | null;
  conditions: Condition[];
}

interface Rule {
  ruleName: string;
  parentProcess: string;
  include: Selector[];
  exclude: Selector[];
}

interface EntitySelector {
  objectTypes: string[];
  activity: string | null;
}

interface Trace {
  traceName: string;
  parentProcess: string;
  start: EntitySelector[];
  end: EntitySelector[];
  include: EntitySelector[];
  exclude: EntitySelector[];
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

export type { EntitySelector };
