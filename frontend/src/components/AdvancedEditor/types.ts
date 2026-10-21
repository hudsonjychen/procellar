export interface RuleInfo {
  ruleName: string;
  parentProcess: { title: string; inputValue?: string } | null;
}

/** Matches events of `activity` (if set) that are related to every type in `objectTypes`. */
export interface Selector {
  objectTypes: string[];
  activity: string | null;
}

/** Selectors within start / end / include / exclude are combined with OR. */
export interface TraceData {
  traceName: string;
  parentProcess: string;
  start: Selector[];
  end: Selector[];
  include: Selector[];
  exclude: Selector[];
}

export type TraceSlot = "start" | "end" | "include" | "exclude";

export interface DraftSelector extends Selector {
  id: number;
}

export type DraftSelectors = Record<TraceSlot, DraftSelector[]>;

export type Operator = "==" | "!=" | ">" | ">=" | "<" | "<=" | "in" | "not in";
