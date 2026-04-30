import { Box } from "@mui/joy";
import React from "react";
import { useEffect, useState } from "react";
import NewButton from "./NewButton";
import StandardEditor from "./StandardEditor/StandardEditor";
import {
  RuleInfo,
  SelectedConditions,
  ActionType,
  EntityList,
} from "./StandardEditor/types";
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

  const [includeOT, setIncludeOT] = useState<EntityList>([]);
  const [includeAct, setIncludeAct] = useState<EntityList>([]);
  const [excludeOT, setExcludeOT] = useState<EntityList>([]);
  const [excludeAct, setExcludeAct] = useState<EntityList>([]);

  const [ruleInfo, setRuleInfo] = useState<RuleInfo>({
    ruleName: "",
    parentProcess: { title: "" },
  });

  const [selectedConditions, setSelectedConditions] =
    useState<SelectedConditions>({
      include: [{ id: 0 }],
      exclude: [{ id: 0 }],
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
    setIncludeOT([...(matchedRule.includeOT?.entities ?? [])]);
    setIncludeAct([...(matchedRule.includeAct?.entities ?? [])]);
    setExcludeOT([...(matchedRule.excludeOT?.entities ?? [])]);
    setExcludeAct([...(matchedRule.excludeAct?.entities ?? [])]);

    const mapConditions = (
      conditions: {
        entity: string;
        attribute: string;
        operator: string;
        value: string;
      }[],
      type: "objectType" | "activity",
      idOffset: number,
    ) =>
      conditions.map((condition, index) => ({
        id: idOffset + index,
        type,
        entity: condition.entity,
        attribute: condition.attribute,
        operator: condition.operator,
        value: condition.value,
      }));

    const includeConditions = [
      ...mapConditions(matchedRule.includeOT?.condition ?? [], "objectType", 0),
      ...mapConditions(matchedRule.includeAct?.condition ?? [], "activity", 1000),
    ];
    const excludeConditions = [
      ...mapConditions(matchedRule.excludeOT?.condition ?? [], "objectType", 2000),
      ...mapConditions(matchedRule.excludeAct?.condition ?? [], "activity", 3000),
    ];

    setSelectedConditions({
      include: includeConditions.length ? includeConditions : [{ id: 0 }],
      exclude: excludeConditions.length ? excludeConditions : [{ id: 0 }],
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

    setIncludeOT([]);
    setIncludeAct([]);
    setExcludeOT([]);
    setExcludeAct([]);

    setSelectedConditions({ include: [{ id: 0 }], exclude: [{ id: 0 }] });
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
        includeOT={includeOT}
        includeAct={includeAct}
        setIncludeOT={setIncludeOT}
        setIncludeAct={setIncludeAct}
        excludeOT={excludeOT}
        excludeAct={excludeAct}
        setExcludeOT={setExcludeOT}
        setExcludeAct={setExcludeAct}
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
        includeOT={includeOT}
        includeAct={includeAct}
        setIncludeOT={setIncludeOT}
        setIncludeAct={setIncludeAct}
        excludeOT={excludeOT}
        excludeAct={excludeAct}
        setExcludeOT={setExcludeOT}
        setExcludeAct={setExcludeAct}
        selectedConditions={selectedConditions}
        setSelectedConditions={setSelectedConditions}
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
