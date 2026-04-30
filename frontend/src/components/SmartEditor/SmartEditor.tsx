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
  Card,
} from "@mui/joy";
import { ErrorAlert } from "./Alert";
import { ErrorBoundary, FallbackUI } from "./ErrorBoundary";
import ProcessNameInput from "./ProcessNameInput";
import { RuleInfo, SelectedEntities, RuleData, TraceData } from "./types";
import { useProcessStore } from "../../stores/processStore";
import { useDataStore } from "../../stores/dataStore";
import RuleNameInput from "./RuleNameInput";
import HelpOutlinedIcon from "@mui/icons-material/HelpOutlined";
import SelectCard from "./SelectBar";
import { useRef, useState } from "react";
import EntityChip from "./EntityChip";
import ConnectorArrow from "./ConnectorArrow";

interface SmartEditorProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showAlert: boolean;
  setShowAlert: React.Dispatch<React.SetStateAction<boolean>>;
  ruleInfo: RuleInfo;
  setRuleInfo: React.Dispatch<React.SetStateAction<RuleInfo>>;
  handleCancel: () => void;
}

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};

export default function SmartEditor({
  open,
  setOpen,
  showAlert,
  setShowAlert,
  ruleInfo,
  setRuleInfo,
  handleCancel,
}: SmartEditorProps) {
  const processNames = useProcessStore((state) => state.processNames);
  const setProcessNames = useProcessStore((state) => state.setProcessNames);
  const processData = useProcessStore((state) => state.processData);
  const setProcessData = useProcessStore((state) => state.setProcessData);
  const objectTypeList = useDataStore((state) => state.objectTypeList);
  const activityList = useDataStore((state) => state.activityList);

  const [checkedStartOTList, setCheckedStartOTList] = useState<string[]>([]);
  const [checkedStartActList, setCheckedStartActList] = useState<string[]>([]);
  const [checkedEndOTList, setCheckedEndOTList] = useState<string[]>([]);
  const [checkedEndActList, setCheckedEndActList] = useState<string[]>([]);

  const [includeOTList, setIncludeOTList] = useState<string[]>([]);
  const [includeActList, setIncludeActList] = useState<string[]>([]);
  const [excludeOTList, setExcludeOTList] = useState<string[]>([]);
  const [excludeActList, setExcludeActList] = useState<string[]>([]);

  const { ruleName, parentProcess } = ruleInfo;
  const allEmptyStart =
    checkedStartOTList.length + checkedStartActList.length === 0;
  const allEmptyEnd = checkedEndOTList.length + checkedEndActList.length === 0;
  const noName = ruleName.trim() === "" || parentProcess?.title.trim();

  const clearEditor = () => {
    setRuleInfo({
      ruleName: "",
      parentProcess: { title: "" },
    });

    setCheckedStartOTList([]);
    setCheckedStartActList([]);
    setCheckedEndOTList([]);
    setCheckedEndActList([]);

    setIncludeOTList([]);
    setIncludeActList([]);
    setExcludeOTList([]);
    setExcludeActList([]);
  };

  const handleSave = () => {
    if (allEmptyStart || allEmptyEnd) {
      setShowAlert(true);
    } else {
      const newTrace: TraceData = {
        traceName: ruleInfo.ruleName,
        parentProcess: ruleInfo.parentProcess?.title || "",
        startOT: checkedStartOTList,
        startAct: checkedStartActList,
        endOT: checkedEndOTList,
        endAct: checkedEndActList,
        includeOT: includeOTList,
        includeAct: includeActList,
        excludeOT: excludeOTList,
        excludeAct: excludeActList,
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
          traces:
            "traces" in existingProcess
              ? [...(existingProcess.traces ?? []), newTrace]
              : [newTrace],
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
            traces: [newTrace],
            relations: {},
          },
        ]);
      }
      setOpen(false);
      clearEditor();
    }
  };

  const startTextRef = useRef<HTMLSpanElement>(null);
  const endTextRef = useRef<HTMLSpanElement>(null);

  return (
    <Modal
      open={open}
      onClose={() => {
        setOpen(false);
        setShowAlert(false);
      }}
    >
      <ModalDialog sx={{ display: "flex", width: "560px", overflowY: "auto" }}>
        <ErrorAlert
          showAlert={showAlert}
          setShowAlert={setShowAlert}
          alertText="Please provide a process name, a unique rule name, and select at least one entity before saving."
        />
        <DialogTitle sx={{ fontSize: 22, fontWeight: "bold", ml: 2, mt: 2 }}>
          Advanced Editor
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
            <Box
              sx={{ position: "relative", m: 2 }}
              className="editor-container"
            >
              <ConnectorArrow startRef={startTextRef} endRef={endTextRef} />

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ pt: 1, pb: 1 }}
              >
                <Stack direction="row" alignItems="center" sx={{ width: 86 }}>
                  <Typography level="title-md" ref={startTextRef}>
                    Start
                  </Typography>

                  <Tooltip
                    variant="outlined"
                    title={
                      "Select object types and/or activities as start of the process."
                    }
                  >
                    <HelpOutlinedIcon fontSize="small" sx={{ color: "#999" }} />
                  </Tooltip>
                </Stack>
                <Stack sx={{ width: 320 }}>
                  <SelectCard
                    objectTypeList={objectTypeList}
                    activityList={activityList}
                    checkedOTList={checkedStartOTList}
                    setCheckedOTList={setCheckedStartOTList}
                    checkedActList={checkedStartActList}
                    setCheckedActList={setCheckedStartActList}
                  />
                </Stack>
              </Stack>

              <Stack sx={{ ml: 22, alignItems: "flex-start" }}>
                {checkedStartOTList.map((item) => (
                  <EntityChip entityType="objectType" label={item} />
                ))}

                {checkedStartActList.map((item) => (
                  <EntityChip entityType="activity" label={item} />
                ))}
              </Stack>

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={6}
                sx={{ pt: 1, pb: 1 }}
              >
                <Stack direction="row" alignItems="center" sx={{ width: 86 }}>
                  <Typography level="title-md" ref={endTextRef}>
                    End
                  </Typography>

                  <Tooltip
                    variant="outlined"
                    title={
                      "Select object types and/or activities as end of the process."
                    }
                  >
                    <HelpOutlinedIcon fontSize="small" sx={{ color: "#999" }} />
                  </Tooltip>
                </Stack>
                <Stack sx={{ width: 320 }}>
                  <SelectCard
                    objectTypeList={objectTypeList}
                    activityList={activityList}
                    checkedOTList={checkedEndOTList}
                    setCheckedOTList={setCheckedEndOTList}
                    checkedActList={checkedEndActList}
                    setCheckedActList={setCheckedEndActList}
                  />
                </Stack>
              </Stack>

              <Stack sx={{ ml: 22, alignItems: "flex-start" }}>
                {checkedEndOTList.map((item) => (
                  <EntityChip entityType="objectType" label={item} />
                ))}

                {checkedEndActList.map((item) => (
                  <EntityChip entityType="activity" label={item} />
                ))}
              </Stack>
            </Box>

            <Box sx={{ m: 1 }}>
              <Typography level="title-sm" color="neutral" sx={{ pl: 1 }}>
                More functions
              </Typography>
              <Card
                variant="outlined"
                size="md"
                sx={{ borderRadius: "lg", borderStyle: "dashed" }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack direction="row" alignItems="center" sx={{ width: 86 }}>
                    <Typography level="title-sm">Include</Typography>
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
                        sx={{ color: "#999" }}
                      />
                    </Tooltip>
                  </Stack>
                  <Stack sx={{ width: 310 }}>
                    <SelectCard
                      objectTypeList={objectTypeList}
                      activityList={activityList}
                      checkedOTList={includeOTList}
                      setCheckedOTList={setIncludeOTList}
                      checkedActList={includeActList}
                      setCheckedActList={setIncludeActList}
                      buttonSize="sm"
                    />
                  </Stack>
                </Stack>
                {includeOTList.length > 0 && (
                  <Stack
                    direction="row"
                    sx={{ ml: 12, mb: -1, alignItems: "flex-start" }}
                  >
                    {includeOTList.map((item) => (
                      <EntityChip entityType="objectType" label={item} />
                    ))}
                  </Stack>
                )}

                {includeActList.length > 0 && (
                  <Stack
                    direction="row"
                    sx={{ ml: 12, alignItems: "flex-start" }}
                  >
                    {includeActList.map((item) => (
                      <EntityChip entityType="activity" label={item} />
                    ))}
                  </Stack>
                )}

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack direction="row" alignItems="center" sx={{ width: 86 }}>
                    <Typography level="title-sm">Exclude</Typography>
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
                        sx={{ color: "#999" }}
                      />
                    </Tooltip>
                  </Stack>
                  <Stack sx={{ width: 310 }}>
                    <SelectCard
                      objectTypeList={objectTypeList}
                      activityList={activityList}
                      checkedOTList={excludeOTList}
                      setCheckedOTList={setExcludeOTList}
                      checkedActList={excludeActList}
                      setCheckedActList={setExcludeActList}
                      buttonSize="sm"
                    />
                  </Stack>
                </Stack>
                {excludeOTList.length > 0 && (
                  <Stack
                    direction="row"
                    sx={{ ml: 12, mb: -1, alignItems: "flex-start" }}
                  >
                    {excludeOTList.map((item) => (
                      <EntityChip entityType="objectType" label={item} />
                    ))}
                  </Stack>
                )}

                {excludeActList.length > 0 && (
                  <Stack
                    direction="row"
                    sx={{ ml: 12, alignItems: "flex-start" }}
                  >
                    {excludeActList.map((item) => (
                      <EntityChip entityType="activity" label={item} />
                    ))}
                  </Stack>
                )}
              </Card>
            </Box>

            <Divider sx={{ m: 2 }} />
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
