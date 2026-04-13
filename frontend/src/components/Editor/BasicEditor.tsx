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
import { RuleBlock, RuleData, RuleInfo, SelectedEntities } from "./types";
import { useProcessStore } from "../../stores/processStore";
import { useDataStore } from "../../stores/dataStore";
import RuleNameInput from "./RuleNameInput";
import HelpOutlinedIcon from "@mui/icons-material/HelpOutlined";
import EntitySelect from "./EntitySelect";
import EditorNavigate from "./EditorNavigate";
import EditorSummary from "./EditorSummary";
import { ProcessData } from "../../stores/types";

interface BasicEditorProps {
  open3: boolean;
  setOpen3: React.Dispatch<React.SetStateAction<boolean>>;
  setOpen4: React.Dispatch<React.SetStateAction<boolean>>;
  showAlert: boolean;
  setShowAlert: React.Dispatch<React.SetStateAction<boolean>>;
  ruleInfo: RuleInfo;
  setRuleInfo: React.Dispatch<React.SetStateAction<RuleInfo>>;
  selectedEntities: SelectedEntities;
  setSelectedEntities: React.Dispatch<React.SetStateAction<SelectedEntities>>;
  handleCancel: () => void;
}

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};

export default function BasicEditor({
  open3,
  setOpen3,
  setOpen4,
  showAlert,
  setShowAlert,
  ruleInfo,
  setRuleInfo,
  selectedEntities,
  setSelectedEntities,
  handleCancel,
}: BasicEditorProps) {
  const processNames = useProcessStore((state) => state.processNames);
  const setProcessNames = useProcessStore((state) => state.setProcessNames);
  const processData = useProcessStore((state) => state.processData);
  const setProcessData = useProcessStore((state) => state.setProcessData);
  const objectTypeList = useDataStore((state) => state.objectTypeList);
  const activityList = useDataStore((state) => state.activityList);

  const { includeOT, includeAct, excludeOT, excludeAct } = selectedEntities;
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

    setSelectedEntities({
      includeOT: [],
      includeAct: [],
      excludeOT: [],
      excludeAct: [],
    });
  };

  const handleSave = () => {
    if (allEmpty || noName) {
      setShowAlert(true);
    } else {
      const newRule: RuleData = {
        ruleName: ruleInfo.ruleName,
        parentProcess: ruleInfo.parentProcess?.title || "",
        includeOT: {
          entities: selectedEntities["includeOT"],
          condition: [],
        },
        includeAct: {
          entities: selectedEntities["includeAct"],
          condition: [],
        },
        excludeOT: {
          entities: selectedEntities["excludeOT"],
          condition: [],
        },
        excludeAct: {
          entities: selectedEntities["excludeAct"],
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
      setOpen3(false);
      setOpen4(false);
      clearEditor();
    }
  };

  return (
    <Modal
      open={open3}
      onClose={() => {
        setOpen3(false);
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
                <EntitySelect
                  placeholder="objectTypes"
                  type="includeOT"
                  selectedEntities={selectedEntities}
                  setSelectedEntities={setSelectedEntities}
                  entityList={objectTypeList}
                />
                <EntitySelect
                  placeholder="activities"
                  type="includeAct"
                  selectedEntities={selectedEntities}
                  setSelectedEntities={setSelectedEntities}
                  entityList={activityList}
                />
              </Stack>
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
                <EntitySelect
                  placeholder="objectTypes"
                  type="excludeOT"
                  selectedEntities={selectedEntities}
                  setSelectedEntities={setSelectedEntities}
                  entityList={objectTypeList}
                />
                <EntitySelect
                  placeholder="activities"
                  type="excludeAct"
                  selectedEntities={selectedEntities}
                  setSelectedEntities={setSelectedEntities}
                  entityList={activityList}
                />
              </Stack>
            </Box>
            <Divider sx={{ m: 2 }} />
            <Box sx={{ m: 2 }}>
              <EditorNavigate
                setOpen1={setOpen3}
                setOpen2={setOpen4}
                text="Open Conditions Editor"
              />
            </Box>
            <EditorSummary selectedEntities={selectedEntities} />
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
