import { Fragment } from "react";
import {
  Box,
  Button,
  Card,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/joy";
import Add from "@mui/icons-material/Add";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import SelectCard from "./SelectCard";
import EntityChip from "./EntityChip";
import AddButton from "./AddButton";
import ConditionList from "./ConditionList";
import { AttributeMapList, DraftSelector, EntityList } from "./types";
import {
  completeConditions,
  isEmptySelector,
  newDraftSelector,
  newId,
} from "./selectors";

interface SelectorListProps {
  selectors: DraftSelector[];
  onChange: (selectors: DraftSelector[]) => void;
  objectTypeList: EntityList;
  activityList: EntityList;
  color: "success" | "danger";
  showConditions?: boolean;
  attrMapList?: AttributeMapList;
}

export default function SelectorList({
  selectors,
  onChange,
  objectTypeList,
  activityList,
  color,
  showConditions = false,
  attrMapList = [],
}: SelectorListProps) {
  const updateSelector = (id: number, patch: Partial<DraftSelector>) =>
    onChange(selectors.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const handleEntitiesChange = (
    selector: DraftSelector,
    next: { objectTypes: EntityList; activity: string | null },
  ) =>
    updateSelector(selector.id, {
      ...next,
      conditions: selector.conditions.filter(
        (c) =>
          !c.entity ||
          (c.type === "activity"
            ? c.entity === next.activity
            : next.objectTypes.includes(c.entity)),
      ),
    });

  return (
    <Stack spacing={1.5} sx={{ flex: 1 }}>
      <Box>
        <Button
          variant="outlined"
          color="neutral"
          size="md"
          startDecorator={<Add />}
          sx={{ borderRadius: "lg" }}
          onClick={() => onChange([...selectors, newDraftSelector()])}
        >
          Add selector
        </Button>
      </Box>

      {selectors.map((selector, index) => {
        const conditionCount = completeConditions(selector).length;
        return (
          <Fragment key={selector.id}>
            {index > 0 && (
              <Divider
                sx={{ fontSize: "xs", fontWeight: "lg", color: "text.tertiary" }}
              >
                OR
              </Divider>
            )}
            <Card variant="outlined" size="sm" sx={{ borderRadius: "lg" }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography level="title-sm" sx={{ flex: 1 }}>
                  Selector {index + 1}
                </Typography>
                <SelectCard
                  objectTypeList={objectTypeList}
                  activityList={activityList}
                  objectTypes={selector.objectTypes}
                  activity={selector.activity}
                  onChange={(next) => handleEntitiesChange(selector, next)}
                  buttonSize="sm"
                />
                {showConditions && (
                  <Tooltip title="Add condition" variant="outlined">
                    <span>
                      <AddButton
                        onClick={() =>
                          updateSelector(selector.id, {
                            conditions: [
                              ...selector.conditions,
                              { id: newId() },
                            ],
                          })
                        }
                      />
                    </span>
                  </Tooltip>
                )}
                <Tooltip title="Remove selector" variant="outlined">
                  <IconButton
                    size="sm"
                    sx={{ borderRadius: "50%" }}
                    onClick={() =>
                      onChange(selectors.filter((s) => s.id !== selector.id))
                    }
                  >
                    <DeleteOutlineOutlinedIcon />
                  </IconButton>
                </Tooltip>
              </Stack>

              {isEmptySelector(selector) ? (
                <Typography level="body-xs" textColor="text.tertiary">
                  No entities selected yet.
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {selector.activity && (
                    <EntityChip
                      key={`act-${selector.activity}`}
                      entityType="activity"
                      label={selector.activity}
                      color={color}
                    />
                  )}
                  {selector.objectTypes.map((item) => (
                    <EntityChip
                      key={`ot-${item}`}
                      entityType="objectType"
                      label={item}
                      color={color}
                    />
                  ))}
                </Box>
              )}

              {showConditions ? (
                <ConditionList
                  selector={selector}
                  attrMapList={attrMapList}
                  onChange={(conditions) =>
                    updateSelector(selector.id, { conditions })
                  }
                />
              ) : (
                conditionCount > 0 && (
                  <Typography
                    level="body-xs"
                    textColor="text.tertiary"
                    startDecorator={
                      <FilterAltOutlinedIcon sx={{ fontSize: "md" }} />
                    }
                  >
                    {conditionCount} condition{conditionCount > 1 ? "s" : ""}{" "}
                    applied
                  </Typography>
                )
              )}
            </Card>
          </Fragment>
        );
      })}
    </Stack>
  );
}
