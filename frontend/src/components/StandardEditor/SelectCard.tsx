import * as React from "react";
import {
  Button,
  Modal,
  ModalDialog,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemContent,
  RadioGroup,
  Radio,
  Stack,
  Divider,
  Box,
} from "@mui/joy";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { EntityList } from "./types";

interface SelectCardProps {
  objectTypeList: EntityList;
  activityList: EntityList;
  objectTypes: EntityList;
  activity: string | null;
  onChange: (next: { objectTypes: EntityList; activity: string | null }) => void;
  buttonSize?: "sm" | "md" | "lg";
}

const POPUP_WIDTH = 320;
const POPUP_MAX_HEIGHT = 400;

export default function SelectCard({
  objectTypeList,
  activityList,
  objectTypes,
  activity,
  onChange,
  buttonSize = "md",
}: SelectCardProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [entityType, setEntityType] = React.useState<"objectType" | "activity">(
    "objectType",
  );
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ left: 0, top: 0 });

  const currentEntities =
    entityType === "objectType" ? objectTypeList : activityList;
  const isChecked = (item: string) =>
    entityType === "objectType" ? objectTypes.includes(item) : activity === item;

  const handleOpen = () => {
    const button = buttonRef.current;
    if (button) {
      const buttonRect = button.getBoundingClientRect();
      const dialogRect = button
        .closest('[role="dialog"]')
        ?.getBoundingClientRect();
      const left = (dialogRect?.right ?? buttonRect.right) + 16;
      setPosition({
        left: Math.max(0, Math.min(left, window.innerWidth - POPUP_WIDTH - 16)),
        top: Math.max(
          16,
          Math.min(buttonRect.top, window.innerHeight - POPUP_MAX_HEIGHT - 16),
        ),
      });
    }
    setOpen(true);
  };

  const handleClick = (item: string) => {
    if (entityType === "objectType") {
      onChange({
        activity,
        objectTypes: objectTypes.includes(item)
          ? objectTypes.filter((i) => i !== item)
          : [...objectTypes, item],
      });
    } else {
      onChange({ objectTypes, activity: activity === item ? null : item });
    }
  };

  return (
    <React.Fragment>
      <Button
        ref={buttonRef}
        variant="outlined"
        color="neutral"
        onClick={handleOpen}
        sx={{ borderRadius: "lg" }}
        size={buttonSize}
      >
        Select entities
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: "none",
              backgroundColor: "rgba(0, 0, 0, 0.1)",
            },
          },
        }}
      >
        <ModalDialog
          size="sm"
          sx={{
            borderRadius: "lg",
            m: 0,
            width: POPUP_WIDTH,
            position: "absolute",
            transform: "none",
            left: position.left,
            top: position.top,
          }}
        >
          <Box
            sx={{
              p: 0.5,
            }}
          >
            <Stack spacing={1}>
              <Typography level="title-md">Select Entities</Typography>

              {/* Segmented Control */}
              <RadioGroup
                size="sm"
                orientation="horizontal"
                value={entityType}
                onChange={(e) =>
                  setEntityType(e.target.value as "objectType" | "activity")
                }
                sx={{
                  p: 0.5,
                  bg: "background.level1", // Subtle grey background
                  borderRadius: "xl",
                  display: "inline-flex",
                  gap: 0.5,
                }}
              >
                {["objectType", "activity"].map((value) => (
                  <Radio
                    size="sm"
                    key={value}
                    color="neutral"
                    value={value}
                    disableIcon
                    label={value === "objectType" ? "Object Type" : "Activity"}
                    slotProps={{
                      action: ({ checked }) => ({
                        sx: {
                          borderRadius: "lg",
                          transition: "0.2s",
                          ...(checked && {
                            bgcolor: "background.surface",
                            boxShadow: "sm",
                            "&:hover": { bgcolor: "background.surface" },
                          }),
                        },
                      }),
                      label: ({ checked }) => ({
                        sx: {
                          fontSize: "sm",
                          fontWeight: checked ? "600" : "500",
                          color: checked ? "primary.600" : "neutral.500",
                          px: 2,
                          py: 0.5,
                        },
                      }),
                    }}
                  />
                ))}
              </RadioGroup>

              <Typography
                level="body-xs"
                textColor={
                  entityType === "objectType" && objectTypes.length > 1
                    ? "warning.600"
                    : "text.tertiary"
                }
                startDecorator={<InfoOutlinedIcon sx={{ fontSize: "md" }} />}
                sx={{ alignItems: "flex-start" }}
              >
                {entityType === "objectType"
                  ? "Selecting multiple object types means the selected events must be related to all of them."
                  : "At most one activity can be selected per selector."}
              </Typography>
            </Stack>
          </Box>

          <Divider sx={{ mx: 0.5 }} />

          <Box
            sx={{
              maxHeight: 180,
              overflow: "auto",
            }}
          >
            <List size="sm">
              {currentEntities.map((item) => (
                <ListItem key={item}>
                  <ListItemButton onClick={() => handleClick(item)}>
                    <ListItemContent>{item}</ListItemContent>
                    {isChecked(item) && <CheckRoundedIcon color="primary" />}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider sx={{ mx: 0.5 }} />

          <Box sx={{ p: 0.5, display: "flex", justifyContent: "flex-end" }}>
            <Button variant="soft" size="sm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </Box>
        </ModalDialog>
      </Modal>
    </React.Fragment>
  );
}
