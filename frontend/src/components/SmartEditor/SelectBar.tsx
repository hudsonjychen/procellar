import * as React from "react";
import {
  Button,
  IconButton,
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
import EditRoundedIcon from "@mui/icons-material/EditRounded";

const objectTypeList = [
  "Order",
  "Item",
  "Invoice",
  "Package",
  "Shipment",
  "Route",
];
const activityList = [
  "Place order",
  "Issue invoice",
  "Package order",
  "Start shipment",
  "Complete shipment",
];

interface SelectCardProps {
  checkedOTList: string[];
  setCheckedOTList: React.Dispatch<React.SetStateAction<string[]>>;
  checkedActList: string[];
  setCheckedActList: React.Dispatch<React.SetStateAction<string[]>>;
  buttonSize?: "sm" | "md" | "lg";
}

export default function SelectCard({
  checkedOTList,
  setCheckedOTList,
  checkedActList,
  setCheckedActList,
  buttonSize = "md",
}: SelectCardProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [entityType, setEntityType] = React.useState<"objectType" | "activity">(
    "objectType",
  );
  const [open, setOpen] = React.useState(false);

  const currentList =
    entityType === "objectType" ? checkedOTList : checkedActList;
  const setCurrentList =
    entityType === "objectType" ? setCheckedOTList : setCheckedActList;
  const currentEntities =
    entityType === "objectType" ? objectTypeList : activityList;

  const handleClick = (item: string) => {
    setCurrentList((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };

  return (
    <React.Fragment>
      <Button
        ref={buttonRef}
        variant="outlined"
        color="neutral"
        onClick={() => setOpen(true)}
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
            position: "absolute",
            left: (buttonRef.current?.getBoundingClientRect().right ?? 0) + 152,
            top: buttonRef.current?.getBoundingClientRect().top ?? 0,
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
                    {currentList.includes(item) && (
                      <CheckRoundedIcon color="primary" />
                    )}
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
