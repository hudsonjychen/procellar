import {
  DialogTitle,
  Divider,
  Modal,
  ModalDialog,
  Box,
  Stack,
  Typography,
  Button,
} from "@mui/joy";
import React from "react";
import { ErrorAlert } from "./Alert";
import { ErrorBoundary, FallbackUI } from "./ErrorBoundary";
import ProcessNameInput from "./ProcessNameInput";
import { DraftSelectors, RuleInfo } from "./types";
import { useProcessStore } from "../../stores/processStore";
import { useDataStore } from "../../stores/dataStore";
import RuleNameInput from "./RuleNameInput";
import EditorNavigate from "./EditorNavigate";
import EditorSummary from "./EditorSummary";
import { useState } from "react";
import SelectorSection from "./SelectorSection";
import { MISSING_FIELDS_TEXT, upsertRule } from "./saveRule";

interface ConditionEditorProps {
  conditionEditorOpen: boolean;
  setStandardEditorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setConditionEditorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showAlert: boolean;
  setShowAlert: React.Dispatch<React.SetStateAction<boolean>>;
  ruleInfo: RuleInfo;
  setRuleInfo: React.Dispatch<React.SetStateAction<RuleInfo>>;
  selectors: DraftSelectors;
  setSelectors: React.Dispatch<React.SetStateAction<DraftSelectors>>;
  editingSource: {
    processName: string;
    ruleName: string;
  } | null;
  handleCancel: () => void;
}

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};

export default function ConditionEditor({
  conditionEditorOpen,
  setStandardEditorOpen,
  setConditionEditorOpen,
  showAlert,
  setShowAlert,
  ruleInfo,
  setRuleInfo,
  selectors,
  setSelectors,
  editingSource,
  handleCancel,
}: ConditionEditorProps) {
  const [alertText, setAlertText] = useState(MISSING_FIELDS_TEXT);

  const processNames = useProcessStore((state) => state.processNames);
  const setProcessNames = useProcessStore((state) => state.setProcessNames);
  const processData = useProcessStore((state) => state.processData);
  const setProcessData = useProcessStore((state) => state.setProcessData);

  const objectTypeList = useDataStore((state) => state.objectTypeList);
  const activityList = useDataStore((state) => state.activityList);
  const attrMapList = useDataStore((state) => state.attrMapList);

  const handleSave = () => {
    const result = upsertRule(processData, ruleInfo, selectors, editingSource);
    if ("error" in result) {
      setAlertText(result.error);
      setShowAlert(true);
      return;
    }
    setProcessData(result.data);
    setShowAlert(false);
    handleCancel();
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
              <SelectorSection
                action="include"
                selectors={selectors}
                setSelectors={setSelectors}
                objectTypeList={objectTypeList}
                activityList={activityList}
                showConditions
                attrMapList={attrMapList}
              />
              <SelectorSection
                action="exclude"
                selectors={selectors}
                setSelectors={setSelectors}
                objectTypeList={objectTypeList}
                activityList={activityList}
                showConditions
                attrMapList={attrMapList}
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
            <EditorSummary selectors={selectors} />
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
