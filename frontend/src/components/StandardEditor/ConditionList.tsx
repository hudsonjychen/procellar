import { Stack, Box, Select, Option, Input, IconButton } from "@mui/joy";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { AttributeMapList, Condition, DraftSelector, EntityType } from "./types";
import { operatorMap, placeholderMap } from "./constants";

const encodeEntity = (type: EntityType, name: string) => `${type}::${name}`;
const decodeEntity = (value: string) => {
  const index = value.indexOf("::");
  return {
    type: value.slice(0, index) as EntityType,
    entity: value.slice(index + 2),
  };
};

interface ConditionRowProps {
  selector: DraftSelector;
  condition: Condition;
  attrMapList: AttributeMapList;
  onChange: (patch: Partial<Condition>) => void;
  onDelete: () => void;
}

const ConditionRow = ({
  selector,
  condition,
  attrMapList,
  onChange,
  onDelete,
}: ConditionRowProps) => {
  const entityOptions = [
    ...(selector.activity
      ? [{ type: "activity" as EntityType, name: selector.activity }]
      : []),
    ...selector.objectTypes.map((name) => ({
      type: "objectType" as EntityType,
      name,
    })),
  ];
  const attrOptions =
    attrMapList.find(
      (item) =>
        item.name === condition.entity &&
        item.type ===
          (condition.type === "activity" ? "eventType" : "objectType"),
    )?.attributes ?? [];
  const attrType = attrOptions.find(
    (item) => item.name === condition.attribute,
  )?.type;
  const opOptions = attrType ? (operatorMap[attrType] ?? []) : [];

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={1}
      sx={{ pt: 0.5, pb: 0.5 }}
    >
      <Box sx={{ width: 24, display: "flex" }}>
        <FilterAltOutlinedIcon />
      </Box>
      {/* entity select */}
      <Select
        placeholder={placeholderMap["entity"] || "Select..."}
        size="sm"
        sx={{ width: "8rem" }}
        value={
          condition.type && condition.entity
            ? encodeEntity(condition.type, condition.entity)
            : null
        }
        onChange={(_, newValue) => {
          if (!newValue) return;
          const { type, entity } = decodeEntity(newValue);
          onChange({
            type,
            entity,
            attribute: undefined,
            operator: undefined,
          });
        }}
      >
        {entityOptions.map((item) => (
          <Option
            key={encodeEntity(item.type, item.name)}
            value={encodeEntity(item.type, item.name)}
          >
            {item.name}
          </Option>
        ))}
      </Select>
      {/* attribute select */}
      <Select
        placeholder={placeholderMap["attribute"] || "Select..."}
        size="sm"
        sx={{ width: "8rem" }}
        value={condition.attribute ?? null}
        onChange={(_, newValue) =>
          onChange({ attribute: newValue ?? undefined, operator: undefined })
        }
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
        value={condition.operator ?? null}
        onChange={(_, newValue) =>
          onChange({ operator: newValue ?? undefined })
        }
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
        size="sm"
        sx={{ width: "8rem" }}
        value={condition.value ?? ""}
        onChange={(e) => onChange({ value: e.target.value })}
      />
      <IconButton
        size="sm"
        sx={{
          borderRadius: "50%",
          backgroundColor: "neutral",
        }}
        onClick={onDelete}
      >
        <DeleteOutlineOutlinedIcon />
      </IconButton>
    </Stack>
  );
};

interface ConditionListProps {
  selector: DraftSelector;
  attrMapList: AttributeMapList;
  onChange: (conditions: Condition[]) => void;
}

const ConditionList = ({
  selector,
  attrMapList,
  onChange,
}: ConditionListProps) => {
  return (
    <Box>
      {selector.conditions.map((condition) => (
        <ConditionRow
          key={condition.id}
          selector={selector}
          condition={condition}
          attrMapList={attrMapList}
          onChange={(patch) =>
            onChange(
              selector.conditions.map((c) =>
                c.id === condition.id ? { ...c, ...patch } : c,
              ),
            )
          }
          onDelete={() =>
            onChange(selector.conditions.filter((c) => c.id !== condition.id))
          }
        />
      ))}
    </Box>
  );
};

export default ConditionList;
