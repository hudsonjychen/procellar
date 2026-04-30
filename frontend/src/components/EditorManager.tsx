import { Box } from "@mui/joy";
import { useState } from "react";
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
import SmartEditor from "./SmartEditor/SmartEditor";
import EditorSelect from "./EditorSelect";

function EditorManager() {
  const processData = useProcessStore((state) => state.processData);
  const setProcessData = useProcessStore((state) => state.setProcessData);

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
