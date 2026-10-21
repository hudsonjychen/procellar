import { DraftSelector, DraftSelectors, Selector, TraceSlot } from "./types";

export const TRACE_SLOTS: TraceSlot[] = ["start", "end", "include", "exclude"];

let nextId = Date.now();
export const newId = () => nextId++;

export const newDraftSelector = (): DraftSelector => ({
  id: newId(),
  objectTypes: [],
  activity: null,
});

export const emptyDraftSelectors = (): DraftSelectors => ({
  start: [],
  end: [],
  include: [],
  exclude: [],
});

export const isEmptySelector = (selector: Selector) =>
  selector.objectTypes.length === 0 && !selector.activity;

export const toTraceSelectors = (drafts: DraftSelector[]): Selector[] =>
  drafts
    .filter((s) => !isEmptySelector(s))
    .map(({ objectTypes, activity }) => ({
      objectTypes: [...objectTypes],
      activity,
    }));

export const toDraftSelectors = (selectors: Selector[] | undefined) =>
  (selectors ?? []).map<DraftSelector>((s) => ({
    id: newId(),
    objectTypes: [...(s.objectTypes ?? [])],
    activity: s.activity ?? null,
  }));
