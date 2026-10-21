import { Box } from "@mui/joy";
import { useState } from "react";
import NewButton from "./NewButton";
import BasicEditor from "./BasicEditor";
import {
  RuleInfo,
  SelectedEntities,
  SelectedConditions,
  ActionType,
} from "./types";
import AdvancedEditor from "./AdvancedEditor";
import { useProcessStore } from "../../stores/processStore";
import SmartEditor from "../SmartEditor/SmartEditor";
import EditorSelect from "../EditorSelect";

function Editor() {
  const processData = useProcessStore((state) => state.processData);
  const setProcessData = useProcessStore((state) => state.setProcessData);

  const [open1, setOpen1] = useState<boolean>(false);
  const [open2, setOpen2] = useState<boolean>(false);
  const [open3, setOpen3] = useState<boolean>(false);
  const [open4, setOpen4] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);

  const [ruleInfo, setRuleInfo] = useState<RuleInfo>({
    ruleName: "",
    parentProcess: { title: "" },
  });
  const [selectedEntities, setSelectedEntities] = useState<SelectedEntities>({
    includeOT: [],
    includeAct: [],
    excludeOT: [],
    excludeAct: [],
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

    setSelectedEntities({
      includeOT: [],
      includeAct: [],
      excludeOT: [],
      excludeAct: [],
    });

    setSelectedConditions({ include: [{ id: 0 }], exclude: [{ id: 0 }] });
  };

  const handleCancel = () => {
    setOpen1(false);
    setOpen2(false);
    clearEditor();
  };

  return (
    <Box>
      <NewButton setOpen1={setOpen1} />
      <EditorSelect
        open1={open1}
        setOpen1={setOpen1}
        setOpen2={setOpen2}
        setOpen3={setOpen3}
      />
      <SmartEditor
        open={open2}
        setOpen={setOpen2}
        showAlert={showAlert}
        setShowAlert={setShowAlert}
        ruleInfo={ruleInfo}
        setRuleInfo={setRuleInfo}
        selectedEntities={selectedEntities}
        setSelectedEntities={setSelectedEntities}
        handleCancel={handleCancel}
      />
      <BasicEditor
        open3={open3}
        setOpen3={setOpen3}
        setOpen4={setOpen4}
        showAlert={showAlert}
        setShowAlert={setShowAlert}
        ruleInfo={ruleInfo}
        setRuleInfo={setRuleInfo}
        selectedEntities={selectedEntities}
        setSelectedEntities={setSelectedEntities}
        handleCancel={handleCancel}
      />
      <AdvancedEditor
        open2={open4}
        setOpen1={setOpen3}
        setOpen2={setOpen4}
        showAlert={showAlert}
        setShowAlert={setShowAlert}
        ruleInfo={ruleInfo}
        setRuleInfo={setRuleInfo}
        selectedEntities={selectedEntities}
        setSelectedEntities={setSelectedEntities}
        selectedConditions={selectedConditions}
        setSelectedConditions={setSelectedConditions}
        handleCancel={handleCancel}
      />
    </Box>
  );
}

interface EditingEditorProps {
  processName: string;
  ruleName: string;
}

function EditingEditor({ processName, ruleName }: EditingEditorProps) {
  const processNames = useProcessStore((state) => state.processNames);
  const processData = useProcessStore((state) => state.processData);

  const [open1, setOpen1] = useState<boolean>(false);
  const [open2, setOpen2] = useState<boolean>(false);
  const [open3, setOpen3] = useState<boolean>(false);
  const [open4, setOpen4] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);

  const [ruleInfo, setRuleInfo] = useState<RuleInfo>({
    ruleName: ruleName,
    parentProcess: { title: processName },
  });
  const [selectedEntities, setSelectedEntities] = useState<SelectedEntities>(
    () => {
      const types: (keyof SelectedEntities)[] = [
        "includeOT",
        "includeAct",
        "excludeOT",
        "excludeAct",
      ];
      const result: SelectedEntities = {
        includeOT: [],
        includeAct: [],
        excludeOT: [],
        excludeAct: [],
      };

      processData.forEach((process) => {
        if (process.processName === processName) {
          process.rules?.forEach((rule) => {
            if (rule.ruleName === ruleName) {
              types.forEach((type) => {
                const { entities, condition } = rule[type] || {};
                result[type] = [...entities];
              });
            }
          });
        }
      });

      return result;
    },
  );

  const [selectedConditions, setSelectedConditions] =
    useState<SelectedConditions>(() => {
      const actions: ActionType[] = ["include", "exclude"];
      const types: (keyof SelectedEntities)[] = [
        "includeOT",
        "includeAct",
        "excludeOT",
        "excludeAct",
      ];
      const typeMapAction: Record<keyof SelectedEntities, ActionType> = {
        includeOT: "include",
        includeAct: "include",
        excludeOT: "exclude",
        excludeAct: "exclude",
      };
      const result: SelectedConditions = {
        include: [{ id: 0 }],
        exclude: [{ id: 0 }],
      };

      processData.forEach((process) => {
        if (process.processName === processName) {
          process.rules?.forEach((rule) => {
            if (rule.ruleName === ruleName) {
              types.forEach((type) => {
                const { entities, condition } = rule[type] || {};
                const conditionWithId = condition.map((item, index) => ({
                  id: index,
                  ...item,
                }));
                result[typeMapAction[type]] = [...conditionWithId];
              });
            }
          });
        }
      });

      return result;
    });

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

    setSelectedConditions({ include: [{ id: 0 }], exclude: [{ id: 0 }] });
  };

  const handleCancel = () => {
    setOpen1(false);
    setOpen2(false);
    clearEditor();
  };

  return (
    <Box>
      <BasicEditor
        open3={open3}
        setOpen3={setOpen3}
        setOpen4={setOpen4}
        showAlert={showAlert}
        setShowAlert={setShowAlert}
        ruleInfo={ruleInfo}
        setRuleInfo={setRuleInfo}
        selectedEntities={selectedEntities}
        setSelectedEntities={setSelectedEntities}
        handleCancel={handleCancel}
      />
      <AdvancedEditor
        open2={open2}
        setOpen1={setOpen1}
        setOpen2={setOpen2}
        showAlert={showAlert}
        setShowAlert={setShowAlert}
        ruleInfo={ruleInfo}
        setRuleInfo={setRuleInfo}
        selectedEntities={selectedEntities}
        setSelectedEntities={setSelectedEntities}
        selectedConditions={selectedConditions}
        setSelectedConditions={setSelectedConditions}
        handleCancel={handleCancel}
      />
    </Box>
  );
}

export { Editor, EditingEditor };
