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
import { ErrorAlert } from "./Alert";
import { ErrorBoundary, FallbackUI } from "./ErrorBoundary";
import ProcessNameInput from "./ProcessNameInput";
import { EntityList, RuleData, RuleInfo, SelectedEntities } from "./types";
import { useProcessStore } from "../../stores/processStore";
import { useDataStore } from "../../stores/dataStore";
import RuleNameInput from "./RuleNameInput";
import HelpOutlinedIcon from "@mui/icons-material/HelpOutlined";
import EditorNavigate from "./EditorNavigate";
import EditorSummary from "./EditorSummary";
import SelectCard from "./SelectCard";
import EntityChip from "./EntityChip";
import { useState } from "react";

interface StandardEditorProps {
  standardEditorOpen: boolean;
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
  editingSource: {
    processName: string;
    ruleName: string;
  } | null;
  handleCancel: () => void;
}

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};

function StandardEditor1({
  standardEditorOpen,
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
  handleCancel,
}: StandardEditorProps) {
  const processNames = useProcessStore((state) => state.processNames);
  const setProcessNames = useProcessStore((state) => state.setProcessNames);
  const processData = useProcessStore((state) => state.processData);
  const setProcessData = useProcessStore((state) => state.setProcessData);
  const objectTypeList = useDataStore((state) => state.objectTypeList);
  const activityList = useDataStore((state) => state.activityList);
  const [alertText, setAlertText] = useState(
    "Please provide a process name, a unique rule name, and select at least one entity before saving.",
  );

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
    if (allEmpty || noName) {
      setShowAlert(true);
    } else {
      const newRule: RuleData = {
        ruleName: ruleInfo.ruleName,
        parentProcess: ruleInfo.parentProcess?.title || "",
        includeOT: {
          entities: includeOT,
          condition: [],
        },
        includeAct: {
          entities: includeAct,
          condition: [],
        },
        excludeOT: {
          entities: excludeOT,
          condition: [],
        },
        excludeAct: {
          entities: excludeAct,
          condition: [],
        },
      };
      const existingIndex = processData.findIndex(
        (process) =>
          process.processName === ruleInfo.parentProcess?.title || "",
      );
      if (existingIndex !== -1) {
        const existingProcess = processData.find(
          (process) => process.processName === parentProcess?.title || "",
        );
        if (!existingProcess) return;
        const updatedExistingProcess = {
          ...existingProcess,
          rules:
            "rules" in existingProcess
              ? [...(existingProcess.rules ?? []), newRule]
              : [newRule],
        };
        const updatedProcesses = processData.filter(
          (process) => process.processName !== parentProcess?.title || "",
        );
        setProcessData([...updatedProcesses, updatedExistingProcess]);
      } else {
        const processes = [...processData];
        setProcessData([
          ...processes,
          {
            processName: parentProcess?.title || "",
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
      open={standardEditorOpen}
      onClose={() => {
        setStandardEditorOpen(false);
        setShowAlert(false);
      }}
    >
      <ModalDialog sx={{ display: "flex", width: "576px", overflowY: "auto" }}>
        <ErrorAlert
          showAlert={showAlert}
          setShowAlert={setShowAlert}
          alertText="Please provide a process name, a unique rule name, and select at least one entity before saving."
        />
        <DialogTitle sx={{ fontSize: 22, fontWeight: "bold", ml: 2, mt: 2 }}>
          Standard Editor
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
                <Box sx={{ width: "224px" }}>
                  <ProcessNameInput
                    ruleInfo={ruleInfo}
                    setRuleInfo={setRuleInfo}
                    processNames={processNames}
                    setProcessNames={setProcessNames}
                    width="224px"
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
                <Box sx={{ width: "224px" }}>
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
                sx={{ pt: 1, pb: 1 }}
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
                <SelectCard
                  objectTypeList={objectTypeList}
                  activityList={activityList}
                  checkedOTList={includeOT}
                  setCheckedOTList={setIncludeOT}
                  checkedActList={includeAct}
                  setCheckedActList={setIncludeAct}
                  buttonSize="md"
                />
              </Stack>
              {includeOT.length > 0 && (
                <Stack
                  direction="row"
                  sx={{ ml: 12, mb: -1, alignItems: "flex-start" }}
                >
                  {includeOT.map((item) => (
                    <EntityChip
                      entityType="objectType"
                      label={item}
                      color="success"
                    />
                  ))}
                </Stack>
              )}

              {includeAct.length > 0 && (
                <Stack
                  direction="row"
                  sx={{ ml: 12, alignItems: "flex-start" }}
                >
                  {includeAct.map((item) => (
                    <EntityChip
                      entityType="activity"
                      label={item}
                      color="success"
                    />
                  ))}
                </Stack>
              )}
              <Stack
                direction="row"
                justifyContent="flex-start"
                alignItems="center"
                spacing={2}
                sx={{ pt: 1, pb: 1 }}
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
                <SelectCard
                  objectTypeList={objectTypeList}
                  activityList={activityList}
                  checkedOTList={excludeOT}
                  setCheckedOTList={setExcludeOT}
                  checkedActList={excludeAct}
                  setCheckedActList={setExcludeAct}
                  buttonSize="md"
                />
              </Stack>
              {excludeOT.length > 0 && (
                <Stack
                  direction="row"
                  sx={{ ml: 12, mb: -1, alignItems: "flex-start" }}
                >
                  {excludeOT.map((item) => (
                    <EntityChip
                      entityType="objectType"
                      label={item}
                      color="danger"
                    />
                  ))}
                </Stack>
              )}

              {excludeAct.length > 0 && (
                <Stack
                  direction="row"
                  sx={{ ml: 12, alignItems: "flex-start" }}
                >
                  {excludeAct.map((item) => (
                    <EntityChip
                      entityType="activity"
                      label={item}
                      color="danger"
                    />
                  ))}
                </Stack>
              )}
            </Box>
            <Divider sx={{ m: 2 }} />
            <Box sx={{ m: 2 }}>
              <EditorNavigate
                setFromOpen={setStandardEditorOpen}
                setToOpen={setConditionEditorOpen}
                text="Open Conditions Editor"
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

export default function StandardEditor({
  standardEditorOpen,
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
  editingSource,
  handleCancel,
}: StandardEditorProps) {
  const processNames = useProcessStore((state) => state.processNames);
  const setProcessNames = useProcessStore((state) => state.setProcessNames);
  const processData = useProcessStore((state) => state.processData);
  const setProcessData = useProcessStore((state) => state.setProcessData);
  const objectTypeList = useDataStore((state) => state.objectTypeList);
  const activityList = useDataStore((state) => state.activityList);
  const [alertText, setAlertText] = useState(
    "Please provide a process name, a unique rule name, and select at least one entity before saving.",
  );

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
  const a = false;
  const handleSave = () => {
    const processName = ruleInfo.parentProcess?.title?.trim() || "";
    const trimmedRuleName = ruleInfo.ruleName.trim();
    if (!processName || !trimmedRuleName || allEmpty) {
      setAlertText(
        "Please provide a process name, a unique rule name, and select at least one entity before saving.",
      );
      setShowAlert(true);
    } else {
      const newRule: RuleData = {
        ruleName: trimmedRuleName,
        parentProcess: processName,
        includeOT: {
          entities: includeOT,
          condition: [],
        },
        includeAct: {
          entities: includeAct,
          condition: [],
        },
        excludeOT: {
          entities: excludeOT,
          condition: [],
        },
        excludeAct: {
          entities: excludeAct,
          condition: [],
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
        const existingProcess = baseProcessData.find((process) => process.processName === processName);
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
      open={standardEditorOpen}
      onClose={() => {
        setStandardEditorOpen(false);
        setShowAlert(false);
      }}
    >
      <ModalDialog sx={{ display: "flex", width: "576px", overflowY: "auto" }}>
        <ErrorAlert
          showAlert={showAlert}
          setShowAlert={setShowAlert}
          alertText={alertText}
        />
        <DialogTitle sx={{ fontSize: 22, fontWeight: "bold", ml: 2, mt: 2 }}>
          Basic Editor
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
                <Box sx={{ width: "224px" }}>
                  <ProcessNameInput
                    ruleInfo={ruleInfo}
                    setRuleInfo={setRuleInfo}
                    processNames={processNames}
                    setProcessNames={setProcessNames}
                    width="224px"
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
                <Box sx={{ width: "224px" }}>
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
                spacing={2}
                alignItems="flex-start"
                sx={{ pt: 1, pb: 2 }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  sx={{ width: 86, mt: 1 }}
                >
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
                    <HelpOutlinedIcon
                      fontSize="small"
                      sx={{ color: "#999", ml: 0.5 }}
                    />
                  </Tooltip>
                </Stack>

                <Stack spacing={1.5} sx={{ flex: 1 }}>
                  <SelectCard
                    objectTypeList={objectTypeList}
                    activityList={activityList}
                    checkedOTList={includeOT}
                    setCheckedOTList={setIncludeOT}
                    checkedActList={includeAct}
                    setCheckedActList={setIncludeAct}
                    buttonSize="md"
                  />

                  {(includeOT.length > 0 || includeAct.length > 0) && (
                    <Stack spacing={1}>
                      {includeOT.length > 0 && (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {includeOT.map((item) => (
                            <EntityChip
                              key={`inc-ot-${item}`}
                              entityType="objectType"
                              label={item}
                              color="success"
                            />
                          ))}
                        </Box>
                      )}
                      {includeAct.length > 0 && (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {includeAct.map((item) => (
                            <EntityChip
                              key={`inc-act-${item}`}
                              entityType="activity"
                              label={item}
                              color="success"
                            />
                          ))}
                        </Box>
                      )}
                    </Stack>
                  )}
                </Stack>
              </Stack>

              <Stack
                direction="row"
                spacing={2}
                alignItems="flex-start"
                sx={{ pt: 1, pb: 1 }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  sx={{ width: 86, mt: 1 }}
                >
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
                    <HelpOutlinedIcon
                      fontSize="small"
                      sx={{ color: "#999", ml: 0.5 }}
                    />
                  </Tooltip>
                </Stack>

                <Stack spacing={1.5} sx={{ flex: 1 }}>
                  <SelectCard
                    objectTypeList={objectTypeList}
                    activityList={activityList}
                    checkedOTList={excludeOT}
                    setCheckedOTList={setExcludeOT}
                    checkedActList={excludeAct}
                    setCheckedActList={setExcludeAct}
                    buttonSize="md"
                  />

                  {(excludeOT.length > 0 || excludeAct.length > 0) && (
                    <Stack spacing={1}>
                      {excludeOT.length > 0 && (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {excludeOT.map((item) => (
                            <EntityChip
                              key={`exc-ot-${item}`}
                              entityType="objectType"
                              label={item}
                              color="danger"
                            />
                          ))}
                        </Box>
                      )}
                      {excludeAct.length > 0 && (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {excludeAct.map((item) => (
                            <EntityChip
                              key={`exc-act-${item}`}
                              entityType="activity"
                              label={item}
                              color="danger"
                            />
                          ))}
                        </Box>
                      )}
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </Box>

            <Divider sx={{ m: 2 }} />
            <Box sx={{ m: 2 }}>
              <EditorNavigate
                setFromOpen={setStandardEditorOpen}
                setToOpen={setConditionEditorOpen}
                text="Open Conditions Editor"
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
