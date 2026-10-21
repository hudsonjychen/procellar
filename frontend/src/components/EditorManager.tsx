import { Box } from "@mui/joy";
import React from "react";
import { useEffect, useState } from "react";
import NewButton from "./NewButton";
import StandardEditor from "./StandardEditor/StandardEditor";
import { RuleInfo, DraftSelectors } from "./StandardEditor/types";
import {
  emptyDraftSelectors,
  toDraftSelectors,
} from "./StandardEditor/selectors";
import ConditionEditor from "./StandardEditor/ConditionEditor";
import { useProcessStore } from "../stores/processStore";
import SmartEditor from "./AdvancedEditor/SmartEditor";
import EditorSelect from "./EditorSelect";

function EditorManager() {
  const processData = useProcessStore((state) => state.processData);
  const editRequest = useProcessStore((state) => state.editRequest);
  const clearEditRequest = useProcessStore((state) => state.clearEditRequest);
  const setTraceEditPayloadStore = useProcessStore(
    (state) => state.setTraceEditPayload,
  );

  const [selectOpen, setSelectOpen] = useState<boolean>(false);
  const [standardEditorOpen, setStandardEditorOpen] = useState<boolean>(false);
  const [conditionEditorOpen, setConditionEditorOpen] =
    useState<boolean>(false);
  const [advancedEditorOpen, setAdvancedEditorOpen] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);

  const [selectors, setSelectors] =
    useState<DraftSelectors>(emptyDraftSelectors);

  const [ruleInfo, setRuleInfo] = useState<RuleInfo>({
    ruleName: "",
    parentProcess: { title: "" },
  });

  const [editingSource, setEditingSource] = useState<{
    processName: string;
    ruleName: string;
  } | null>(null);
  useEffect(() => {
    if (!editRequest) return;

    const matchedProcess = processData.find(
      (process) => process.processName === editRequest.processName,
    );
    if (!matchedProcess) {
      clearEditRequest();
      return;
    }

    if (editRequest.type === "trace" && "traces" in matchedProcess) {
      const matchedTrace = matchedProcess.traces.find(
        (trace) => trace.traceName === editRequest.ruleName,
      );
      if (!matchedTrace) {
        clearEditRequest();
        return;
      }
      setTraceEditPayloadStore({
        sourceProcessName: editRequest.processName,
        sourceTraceName: editRequest.ruleName,
        ...matchedTrace,
        requestId: editRequest.requestId,
      });
      setRuleInfo({
        ruleName: matchedTrace.traceName,
        parentProcess: { title: matchedTrace.parentProcess },
      });
      setEditingSource(null);
      setShowAlert(false);
      setSelectOpen(false);
      setStandardEditorOpen(false);
      setConditionEditorOpen(false);
      setAdvancedEditorOpen(true);
      clearEditRequest();
      return;
    }

    if (!("rules" in matchedProcess)) {
      clearEditRequest();
      return;
    }

    const matchedRule = matchedProcess.rules.find(
      (rule) => rule.ruleName === editRequest.ruleName,
    );
    if (!matchedRule) {
      clearEditRequest();
      return;
    }

    setRuleInfo({
      ruleName: matchedRule.ruleName,
      parentProcess: { title: matchedRule.parentProcess },
    });
    setSelectors({
      include: toDraftSelectors(matchedRule.include),
      exclude: toDraftSelectors(matchedRule.exclude),
    });

    setEditingSource({
      processName: editRequest.processName,
      ruleName: editRequest.ruleName,
    });
      setTraceEditPayloadStore(null);
    setShowAlert(false);
    setSelectOpen(false);
    setAdvancedEditorOpen(false);
    setConditionEditorOpen(false);
    setStandardEditorOpen(true);
    clearEditRequest();
  }, [editRequest, processData, clearEditRequest, setTraceEditPayloadStore]);

  const clearEditor = () => {
    setRuleInfo({
      ruleName: "",
      parentProcess: { title: "" },
    });

    setSelectors(emptyDraftSelectors());
    setEditingSource(null);
    setTraceEditPayloadStore(null);
  };

  const handleCancel = () => {
    setStandardEditorOpen(false);
    setAdvancedEditorOpen(false);
    setConditionEditorOpen(false);
    clearEditor();
  };

  return (
    <Box>
      <NewButton setSelectOpen={setSelectOpen} />
      <EditorSelect
        selectOpen={selectOpen}
        setSelectOpen={setSelectOpen}
        setStandardEditorOpen={setStandardEditorOpen}
        setAdvancedEditorOpen={setAdvancedEditorOpen}
      />
      <StandardEditor
        standardEditorOpen={standardEditorOpen}
        setStandardEditorOpen={setStandardEditorOpen}
        setConditionEditorOpen={setConditionEditorOpen}
        showAlert={showAlert}
        setShowAlert={setShowAlert}
        ruleInfo={ruleInfo}
        setRuleInfo={setRuleInfo}
        selectors={selectors}
        setSelectors={setSelectors}
        editingSource={editingSource}
        handleCancel={handleCancel}
      />
      <ConditionEditor
        conditionEditorOpen={conditionEditorOpen}
        setStandardEditorOpen={setStandardEditorOpen}
        setConditionEditorOpen={setConditionEditorOpen}
        showAlert={showAlert}
        setShowAlert={setShowAlert}
        ruleInfo={ruleInfo}
        setRuleInfo={setRuleInfo}
        selectors={selectors}
        setSelectors={setSelectors}
        editingSource={editingSource}
        handleCancel={handleCancel}
      />
      <SmartEditor
        open={advancedEditorOpen}
        setOpen={setAdvancedEditorOpen}
        showAlert={showAlert}
        setShowAlert={setShowAlert}
        ruleInfo={ruleInfo}
        setRuleInfo={setRuleInfo}
        handleCancel={handleCancel}
      />
    </Box>
  );
}

export { EditorManager };
