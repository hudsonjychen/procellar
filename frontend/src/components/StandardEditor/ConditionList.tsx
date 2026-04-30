import { Stack, Box, Select, Option, Input, IconButton } from "@mui/joy";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import React from "react";
import { useEffect, useState } from "react";
import {
  ActionType,
  Attribute,
  AttributeMapList,
  EntityList,
  SelectedConditions,
  SelectedEntities,
} from "./types";
import { operatorMap, placeholderMap } from "./constants";

interface ConditionEditorProps {
  handleDelete: () => void;
  action: ActionType;
  id: number;
  selectedConditions: SelectedConditions;
  setSelectedConditions: React.Dispatch<
    React.SetStateAction<SelectedConditions>
  >;
  attrMapList: AttributeMapList;
  includeOT: EntityList;
  includeAct: EntityList;
  excludeOT: EntityList;
  excludeAct: EntityList;
}

const ConditionEditor = ({
  handleDelete,
  action,
  id,
  selectedConditions,
  setSelectedConditions,
  attrMapList,
  includeOT,
  includeAct,
  excludeOT,
  excludeAct,
}: ConditionEditorProps) => {
  const condition = selectedConditions[action].find((item) => item.id === id);
  const [attrOptions, setAttrOptions] = useState<Attribute[]>([]);
  const [opOptions, setOpOptions] = useState<string[]>([]);
  const [input, setInput] = useState<string>(condition?.value ?? "");

  useEffect(() => {
    if (condition?.entity) {
      const matched = attrMapList.find(
        (item) => item.name === condition?.entity,
      );
      if (matched) {
        setAttrOptions(matched.attributes);
      }
    }
  }, [condition?.entity]);

  useEffect(() => {
    if (condition?.attribute) {
      const matched = attrOptions.find(
        (item) => item.name === condition.attribute,
      );
      if (matched && operatorMap[matched?.type]) {
        setOpOptions(operatorMap[matched.type]);
      }
    }
  }, [condition?.attribute, attrOptions]);

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={1}
      sx={{ pt: 1, pb: 1 }}
    >
      <Box sx={{ width: 42, pl: 3 }}>
        <FilterAltOutlinedIcon />
      </Box>
      {/* entity select */}
      <Select
        placeholder={placeholderMap["entity"] || "Select..."}
        size="sm"
        sx={{ width: "8rem" }}
        value={condition?.entity}
        onChange={(_, newValue) => {
          const type = attrMapList.find((item) => item.name === newValue)?.type;
          setSelectedConditions((prev) => ({
            ...prev,
            action: prev[action].map((item) =>
              item.id === id ? { ...item, type: type, entity: newValue } : item,
            ),
          }));
        }}
      >
        {action === "include"
          ? [...includeOT, ...includeAct].map((item) => (
              <Option key={item} value={item}>
                {item}
              </Option>
            ))
          : [...excludeOT, ...excludeAct].map((item) => (
              <Option key={item} value={item}>
                {item}
              </Option>
            ))}
      </Select>
      {/* attribute select */}
      <Select
        placeholder={placeholderMap["attribute"] || "Select..."}
        size="sm"
        sx={{ width: "8rem" }}
        value={condition?.attribute}
        onChange={(_, newValue) => {
          setSelectedConditions((prev) => ({
            ...prev,
            action: prev[action].map((item) =>
              item.id === id ? { ...item, attribute: newValue } : item,
            ),
          }));
        }}
      >
        {attrOptions
          .filter((item) => item && item.name)
          .map((item) => (
            <Option key={item.name} value={item.name}>
              {item.name}
            </Option>
          ))}
      </Select>
      {/* operator select */}
      <Select
        placeholder={placeholderMap["operator"] || "Select..."}
        size="sm"
        sx={{ width: "8rem" }}
        value={condition?.operator}
        onChange={(_, newValue) => {
          setSelectedConditions((prev) => ({
            ...prev,
            action: prev[action].map((item) =>
              item.id === id ? { ...item, operator: newValue } : item,
            ),
          }));
        }}
      >
        {opOptions.map((item) => (
          <Option key={item} value={item}>
            {item}
          </Option>
        ))}
      </Select>
      {/* value input */}
      <Input
        placeholder="value..."
        name="condition"
        sx={{ width: "8rem" }}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
        }}
        onBlur={() => {
          setSelectedConditions((prev) => ({
            ...prev,
            action: prev[action].map((item) =>
              item.id === id ? { ...item, value: input } : item,
            ),
          }));
        }}
      />
      <IconButton
        size="sm"
        sx={{
          borderRadius: "50%",
          backgroundColor: "neutral",
        }}
        onClick={handleDelete}
      >
        <DeleteOutlineOutlinedIcon />
      </IconButton>
    </Stack>
  );
};

interface ConditionListProps {
  items: number[];
  setItems: React.Dispatch<React.SetStateAction<number[]>>;
  action: ActionType;
  selectedConditions: SelectedConditions;
  setSelectedConditions: React.Dispatch<
    React.SetStateAction<SelectedConditions>
  >;
  attrMapList: AttributeMapList;
  includeOT: EntityList;
  includeAct: EntityList;
  excludeOT: EntityList;
  excludeAct: EntityList;
}

const ConditionList = ({
  items,
  setItems,
  action,
  selectedConditions,
  setSelectedConditions,
  attrMapList,
  includeOT,
  includeAct,
  excludeOT,
  excludeAct,
}: ConditionListProps) => {
  const handleDelete = (index: number, id: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setSelectedConditions((prev) => {
      const leftConditions = prev[action].filter((item) => item.id !== id);
      return {
        ...prev,
        [action]: leftConditions,
      };
    });
  };

  return (
    <Box>
      {items.map((id, index) => (
        <ConditionEditor
          key={id + action}
          handleDelete={() => handleDelete(index, id)}
          action={action}
          id={id}
          selectedConditions={selectedConditions}
          setSelectedConditions={setSelectedConditions}
          attrMapList={attrMapList}
          includeOT={includeOT}
          includeAct={includeAct}
          excludeOT={excludeOT}
          excludeAct={excludeAct}
        />
      ))}
    </Box>
  );
};

export default ConditionList;
