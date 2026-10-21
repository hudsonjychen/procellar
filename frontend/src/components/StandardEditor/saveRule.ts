import { ProcessData } from "../../stores/types";
import { DraftSelectors, RuleData, RuleInfo } from "./types";
import { hasAnyEntity, toRuleSelectors } from "./selectors";

export const MISSING_FIELDS_TEXT =
  "Please provide a process name, a unique rule name, and add at least one selector with entities before saving.";

type SaveResult = { data: ProcessData } | { error: string };

export function upsertRule(
  processData: ProcessData,
  ruleInfo: RuleInfo,
  selectors: DraftSelectors,
  editingSource: { processName: string; ruleName: string } | null,
): SaveResult {
  const processName = ruleInfo.parentProcess?.title?.trim() || "";
  const ruleName = ruleInfo.ruleName.trim();
  if (!processName || !ruleName || !hasAnyEntity(selectors)) {
    return { error: MISSING_FIELDS_TEXT };
  }

  const newRule: RuleData = {
    ruleName,
    parentProcess: processName,
    include: toRuleSelectors(selectors.include),
    exclude: toRuleSelectors(selectors.exclude),
  };

  const baseProcessData = editingSource
    ? processData.map((process) =>
        process.processName === editingSource.processName && "rules" in process
          ? {
              ...process,
              rules: (process.rules ?? []).filter(
                (rule) => rule.ruleName !== editingSource.ruleName,
              ),
            }
          : process,
      )
    : processData;

  const existingProcess = baseProcessData.find(
    (process) => process.processName === processName,
  );
  if (!existingProcess) {
    return {
      data: [
        ...baseProcessData,
        { processName, imported: false, rules: [newRule], relations: {} },
      ],
    };
  }
  if ("traces" in existingProcess) {
    return {
      error:
        "A process that contains trace-based rules cannot contain standard rules.",
    };
  }
  if ((existingProcess.rules ?? []).some((rule) => rule.ruleName === ruleName)) {
    return { error: "Rule name must be unique within the same process." };
  }
  return {
    data: [
      ...baseProcessData.filter((process) => process.processName !== processName),
      { ...existingProcess, rules: [...(existingProcess.rules ?? []), newRule] },
    ],
  };
}
