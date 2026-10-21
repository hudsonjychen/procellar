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
import SelectCard from "./SelectBar";
import EntityChip from "./EntityChip";
import { DraftSelector } from "./types";
import { isEmptySelector, newDraftSelector } from "./selectors";

interface SelectorListProps {
  selectors: DraftSelector[];
  onChange: (selectors: DraftSelector[]) => void;
  objectTypeList: string[];
  activityList: string[];
  color?: "primary" | "success" | "danger";
  size?: "sm" | "md";
}

export default function SelectorList({
  selectors,
  onChange,
  objectTypeList,
  activityList,
  color = "primary",
  size = "md",
}: SelectorListProps) {
  const updateSelector = (id: number, patch: Partial<DraftSelector>) =>
    onChange(selectors.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  return (
    <Stack spacing={1.5} sx={{ flex: 1 }}>
      <Box>
        <Button
          variant="outlined"
          color="neutral"
          size={size}
          startDecorator={<Add />}
          sx={{ borderRadius: "lg" }}
          onClick={() => onChange([...selectors, newDraftSelector()])}
        >
          Add selector
        </Button>
      </Box>

      {selectors.map((selector, index) => (
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
                onChange={(next) => updateSelector(selector.id, next)}
                buttonSize="sm"
              />
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
          </Card>
        </Fragment>
      ))}
    </Stack>
  );
}
