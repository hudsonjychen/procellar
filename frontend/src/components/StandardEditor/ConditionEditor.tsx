import {
  DialogTitle,
  Divider,
  Modal,
  ModalDialog,
  Box,
  Stack,
  Typography,
  Button,
  Tooltip,
} from "@mui/joy";
import React from "react";
import { ErrorAlert } from "./Alert";
import { ErrorBoundary, FallbackUI } from "./ErrorBoundary";
import ProcessNameInput from "./ProcessNameInput";
import {
  ActionType,
  EntityList,
  EntityType,
  Operator,
  RuleData,
  RuleInfo,
  SelectedConditions,
} from "./types";
import { useProcessStore } from "../../stores/processStore";
import { useDataStore } from "../../stores/dataStore";
import RuleNameInput from "./RuleNameInput";
import HelpOutlinedIcon from "@mui/icons-material/HelpOutlined";
import EditorNavigate from "./EditorNavigate";
import EditorSummary from "./EditorSummary";
import { useState } from "react";
import ConditionList from "./ConditionList";
import AddButton from "./AddButton";
import SelectCard from "./SelectCard";
import EntityChip from "./EntityChip";

interface AdvancedEditorProps {
  conditionEditorOpen: boolean;
  setStandardEditorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setConditionEditorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showAlert: boolean;
  setShowAlert: React.Dispatch<React.SetStateAction<boolean>>;
  ruleInfo: RuleInfo;
  setRuleInfo: React.Dispatch<React.SetStateAction<RuleInfo>>;
  includeOT: EntityList;
  excludeOT: EntityList;
  setIncludeOT: React.Dispatch<React.SetStateAction<EntityList>>;
  setExcludeOT: React.Dispatch<React.SetStateAction<EntityList>>;
  includeAct: EntityList;
  excludeAct: EntityList;
  setIncludeAct: React.Dispatch<React.SetStateAction<EntityList>>;
  setExcludeAct: React.Dispatch<React.SetStateAction<EntityList>>;
  selectedConditions: SelectedConditions;
  setSelectedConditions: React.Dispatch<
    React.SetStateAction<SelectedConditions>
  >;
  editingSource: {
    processName: string;
    ruleName: string;
  } | null;
  handleCancel: () => void;
}

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};

export default function AdvancedEditor({
  conditionEditorOpen,
  setStandardEditorOpen,
  setConditionEditorOpen,
  showAlert,
  setShowAlert,
  ruleInfo,
  setRuleInfo,
  includeOT,
  excludeOT,
  setIncludeOT,
  setExcludeOT,
  includeAct,
  excludeAct,
  setIncludeAct,
  setExcludeAct,
  selectedConditions,
  setSelectedConditions,
  editingSource,
  handleCancel,
}: AdvancedEditorProps) {
  const [includeConditionList, setIncludeConditionList] = useState<number[]>([
    0,
  ]);
  const [excludeConditionList, setExcludeConditionList] = useState<number[]>([
    0,
  ]);
  const [alertText, setAlertText] = useState(
    "Please provide a process name, a unique rule name, and select at least one entity before saving.",
  );

  const processNames = useProcessStore((state) => state.processNames);
  const setProcessNames = useProcessStore((state) => state.setProcessNames);
  const processData = useProcessStore((state) => state.processData);
  const setProcessData = useProcessStore((state) => state.setProcessData);

  const objectTypeList = useDataStore((state) => state.objectTypeList);
  const activityList = useDataStore((state) => state.activityList);

  const attrMapList = useDataStore((state) => state.attrMapList);

  const { ruleName, parentProcess } = ruleInfo;
  const allEmpty =
    includeOT.length +
      includeAct.length +
      excludeOT.length +
      excludeAct.length ===
    0;
  const noName = ruleName.trim() === "" || parentProcess?.title.trim();

  const clearEditor = () => {
    setRuleInfo({
      ruleName: "",
      parentProcess: { title: "" },
    });

    setIncludeOT([]);
    setExcludeOT([]);
    setIncludeAct([]);
    setExcludeAct([]);
  };
  const handleSave = () => {
    const processName = ruleInfo.parentProcess?.title?.trim() || "";
    const trimmedRuleName = ruleInfo.ruleName.trim();
    if (!processName || !trimmedRuleName || allEmpty) {
      setAlertText(
        "Please provide a process name, a unique rule name, and select at least one entity before saving.",
      );
      setShowAlert(true);
    } else {
      const constructCondition = (action: ActionType, type: EntityType) => {
        const condition = selectedConditions[action]
          .filter((cond) => cond.type === type)
          .map((c) => {
            if (!c.entity || !c.attribute || !c.operator || !c.value)
              return null;
            return {
              entity: c.entity,
              attribute: c.attribute,
              operator: c.operator,
              value: c.value,
            };
          })
          .filter(
            (
              c,
            ): c is {
              entity: string;
              attribute: string;
              operator: Operator;
              value: string;
            } => c !== null,
          );

        return condition;
      };
      const newRule: RuleData = {
        ruleName: trimmedRuleName,
        parentProcess: processName,
        includeOT: {
          entities: includeOT,
          condition: constructCondition("include", "objectType"),
        },
        includeAct: {
          entities: includeAct,
          condition: constructCondition("include", "activity"),
        },
        excludeOT: {
          entities: excludeOT,
          condition: constructCondition("exclude", "objectType"),
        },
        excludeAct: {
          entities: excludeAct,
          condition: constructCondition("exclude", "activity"),
        },
      };
      const baseProcessData = editingSource
        ? processData.map((process) => {
            if (
              process.processName === editingSource.processName &&
              "rules" in process
            ) {
              return {
                ...process,
                rules: (process.rules ?? []).filter(
                  (rule) => rule.ruleName !== editingSource.ruleName,
                ),
              };
            }
            return process;
          })
        : processData;

      const existingIndex = baseProcessData.findIndex(
        (process) => process.processName === processName,
      );
      if (existingIndex !== -1) {
        const existingProcess = baseProcessData.find(
          (process) => process.processName === processName,
        );
        if (!existingProcess) return;
        if ("traces" in existingProcess) {
          setAlertText(
            "A process that contains trace-based rules cannot contain standard rules.",
          );
          setShowAlert(true);
          return;
        }
        if (
          "rules" in existingProcess &&
          (existingProcess.rules ?? []).some((rule) => rule.ruleName === trimmedRuleName)
        ) {
          setAlertText("Rule name must be unique within the same process.");
          setShowAlert(true);
          return;
        }
        const updatedExistingProcess = {
          ...existingProcess,
          rules:
            "rules" in existingProcess
              ? [...(existingProcess.rules ?? []), newRule]
              : [newRule],
        };
        const updatedProcesses = baseProcessData.filter(
          (process) => process.processName !== processName,
        );
        setProcessData([...updatedProcesses, updatedExistingProcess]);
      } else {
        const processes = [...baseProcessData];
        setProcessData([
          ...processes,
          {
            processName,
            imported: false,
            rules: [newRule],
            relations: {},
          },
        ]);
      }
      setStandardEditorOpen(false);
      setConditionEditorOpen(false);
      clearEditor();
    }
  };

  return (
    <Modal
      open={conditionEditorOpen}
      onClose={() => {
        setConditionEditorOpen(false);
        setShowAlert(false);
      }}
    >
      <ModalDialog sx={{ overflowY: "auto" }}>
        <ErrorAlert
          showAlert={showAlert}
          setShowAlert={setShowAlert}
          alertText={alertText}
        />
        <DialogTitle sx={{ fontSize: 22, fontWeight: "bold", ml: 2, mt: 2 }}>
          Basic Editor with Conditions
        </DialogTitle>
        <ErrorBoundary fallback={<FallbackUI />}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ m: 2, width: 380 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ pt: 1, pb: 1 }}
              >
                <Typography level="title-md">Process name</Typography>
                <Box sx={{ width: "16rem" }}>
                  <ProcessNameInput
                    ruleInfo={ruleInfo}
                    setRuleInfo={setRuleInfo}
                    processNames={processNames}
                    setProcessNames={setProcessNames}
                    width="16rem"
                  />
                </Box>
              </Stack>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ pt: 1, pb: 1 }}
              >
                <Typography level="title-md">Rule name</Typography>
                <Box sx={{ width: "16rem" }}>
                  <RuleNameInput
                    ruleInfo={ruleInfo}
                    setRuleInfo={setRuleInfo}
                    text="Enter rule name..."
                  />
                </Box>
              </Stack>
            </Box>
            <Divider sx={{ m: 2 }} />
            <Box sx={{ m: 2 }}>
              <Stack
                direction="row"
                justifyContent="flex-start"
                alignItems="center"
                spacing={2}
                sx={{ pt: 1, pb: 1, width: "100%" }}
              >
                <Stack direction="row" alignItems="center" sx={{ width: 86 }}>
                  <Typography level="title-md">Include</Typography>
                  <Tooltip
                    variant="outlined"
                    title={
                      <>
                        Multiple object types are combined with AND.
                        <br />
                        Multiple activities are combined with OR.
                      </>
                    }
                  >
                    <HelpOutlinedIcon fontSize="small" sx={{ color: "#999" }} />
                  </Tooltip>
                </Stack>
                <Box
                  sx={{
                    flexGrow: 1,
                    mx: 1,
                    "& > button": { width: "100%", justifyContent: "flex-start" },
                  }}
                >
                  <SelectCard
                    objectTypeList={objectTypeList}
                    activityList={activityList}
                    checkedOTList={includeOT}
                    setCheckedOTList={setIncludeOT}
                    checkedActList={includeAct}
                    setCheckedActList={setIncludeAct}
                    buttonSize="lg"
                  />
                </Box>
                <Box sx={{ ml: "auto" }}>
                  <AddButton setItems={setIncludeConditionList} />
                </Box>
              </Stack>
              {includeOT.length > 0 && (
                <Stack
                  direction="row"
                  sx={{ ml: 13, alignItems: "flex-start" }}
                >
                  {includeOT.map((item) => (
                    <EntityChip entityType="objectType" label={item} />
                  ))}
                </Stack>
              )}

              {includeAct.length > 0 && (
                <Stack
                  direction="row"
                  sx={{ ml: 13, alignItems: "flex-start" }}
                >
                  {includeAct.map((item) => (
                    <EntityChip entityType="activity" label={item} />
                  ))}
                </Stack>
              )}
              <ConditionList
                items={includeConditionList}
                setItems={setIncludeConditionList}
                action="include"
                selectedConditions={selectedConditions}
                setSelectedConditions={setSelectedConditions}
                attrMapList={attrMapList}
                includeOT={includeOT}
                includeAct={includeAct}
                excludeOT={excludeOT}
                excludeAct={excludeAct}
              />
              <Stack
                direction="row"
                justifyContent="flex-start"
                alignItems="center"
                spacing={2}
                sx={{ pt: 1, pb: 1, width: "100%" }}
              >
                <Stack direction="row" alignItems="center" sx={{ width: 86 }}>
                  <Typography level="title-md">Exclude</Typography>
                  <Tooltip
                    variant="outlined"
                    title={
                      <>
                        Multiple object types are combined with AND.
                        <br />
                        Multiple activities are combined with OR.
                      </>
                    }
                  >
                    <HelpOutlinedIcon fontSize="small" sx={{ color: "#999" }} />
                  </Tooltip>
                </Stack>
                <Box
                  sx={{
                    flexGrow: 1,
                    mx: 1,
                    "& > button": { width: "100%", justifyContent: "flex-start" },
                  }}
                >
                  <SelectCard
                    objectTypeList={objectTypeList}
                    activityList={activityList}
                    checkedOTList={excludeOT}
                    setCheckedOTList={setExcludeOT}
                    checkedActList={excludeAct}
                    setCheckedActList={setExcludeAct}
                    buttonSize="lg"
                  />
                </Box>
                <Box sx={{ ml: "auto" }}>
                  <AddButton setItems={setExcludeConditionList} />
                </Box>
              </Stack>
              {excludeOT.length > 0 && (
                <Stack
                  direction="row"
                  sx={{ ml: 13, alignItems: "flex-start" }}
                >
                  {excludeOT.map((item) => (
                    <EntityChip entityType="objectType" label={item} />
                  ))}
                </Stack>
              )}

              {excludeAct.length > 0 && (
                <Stack
                  direction="row"
                  sx={{ ml: 13, alignItems: "flex-start" }}
                >
                  {excludeAct.map((item) => (
                    <EntityChip entityType="activity" label={item} />
                  ))}
                </Stack>
              )}
              <ConditionList
                items={excludeConditionList}
                setItems={setExcludeConditionList}
                action="exclude"
                selectedConditions={selectedConditions}
                setSelectedConditions={setSelectedConditions}
                attrMapList={attrMapList}
                includeOT={includeOT}
                includeAct={includeAct}
                excludeOT={excludeOT}
                excludeAct={excludeAct}
              />
            </Box>
            <Divider sx={{ m: 2 }} />
            <Box sx={{ m: 2 }}>
              <EditorNavigate
                setFromOpen={setConditionEditorOpen}
                setToOpen={setStandardEditorOpen}
                text="Go Back to Basic Editor"
              />
            </Box>
            <EditorSummary
              includeOT={includeOT}
              includeAct={includeAct}
              excludeOT={excludeOT}
              excludeAct={excludeAct}
            />
            <Stack
              direction="row"
              justifyContent="flex-end"
              spacing={3}
              alignItems="center"
              sx={{ m: 2, mt: 6 }}
            >
              <Button
                color="neutral"
                sx={{ width: 126 }}
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button sx={{ width: 126 }} onClick={handleSave}>
                Save
              </Button>
            </Stack>
          </form>
        </ErrorBoundary>
      </ModalDialog>
    </Modal>
  );
}
