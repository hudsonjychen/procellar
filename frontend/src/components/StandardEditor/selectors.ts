import {
  DraftSelector,
  DraftSelectors,
  Operator,
  Selector,
  SelectorCondition,
} from "./types";

let nextId = Date.now();
export const newId = () => nextId++;

export const newDraftSelector = (): DraftSelector => ({
  id: newId(),
  objectTypes: [],
  activity: null,
  conditions: [],
});

export const emptyDraftSelectors = (): DraftSelectors => ({
  include: [],
  exclude: [],
});

export const isEmptySelector = (selector: {
  objectTypes: string[];
  activity: string | null;
}) => selector.objectTypes.length === 0 && !selector.activity;

export const hasAnyEntity = (drafts: DraftSelectors) =>
  [...drafts.include, ...drafts.exclude].some((s) => !isEmptySelector(s));

const conditionEntityExists = (
  selector: DraftSelector,
  type: SelectorCondition["entityType"] | undefined,
  entity: string | undefined,
) =>
  type === "activity"
    ? entity === selector.activity
    : type === "objectType" && !!entity && selector.objectTypes.includes(entity);

export const completeConditions = (
  selector: DraftSelector,
): SelectorCondition[] =>
  selector.conditions
    .filter(
      (c) =>
        conditionEntityExists(selector, c.type, c.entity) &&
        c.attribute &&
        c.operator &&
        c.value,
    )
    .map((c) => ({
      entityType: c.type!,
      entity: c.entity!,
      attribute: c.attribute!,
      operator: c.operator as Operator,
      value: c.value!,
    }));

export const toRuleSelectors = (drafts: DraftSelector[]): Selector[] =>
  drafts
    .filter((s) => !isEmptySelector(s))
    .map((s) => ({
      objectTypes: [...s.objectTypes],
      activity: s.activity,
      conditions: completeConditions(s),
    }));

export const toDraftSelectors = (selectors: Selector[] | undefined) =>
  (selectors ?? []).map<DraftSelector>((s) => ({
    id: newId(),
    objectTypes: [...(s.objectTypes ?? [])],
    activity: s.activity ?? null,
    conditions: (s.conditions ?? []).map((c) => ({
      id: newId(),
      type: c.entityType,
      entity: c.entity,
      attribute: c.attribute,
      operator: c.operator,
      value: c.value,
    })),
  }));
