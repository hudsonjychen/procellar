import React from "react";
import PolylineRoundedIcon from "@mui/icons-material/PolylineRounded";
import RuleRoundedIcon from "@mui/icons-material/RuleRounded";
import {
  Card,
  Modal,
  ModalDialog,
  Stack,
  Typography,
  CardContent,
  Box,
  ModalClose,
  Divider,
} from "@mui/joy";

interface EditorSelectProps {
  open1: boolean;
  setOpen1: React.Dispatch<React.SetStateAction<boolean>>;
  setOpen2: React.Dispatch<React.SetStateAction<boolean>>;
  setOpen3: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function EditorSelect({
  open1,
  setOpen1,
  setOpen2,
  setOpen3,
}: EditorSelectProps) {
  return (
    <Modal open={open1} onClose={() => setOpen1(false)}>
      <ModalDialog
        sx={{
          maxWidth: 500,
          width: "100%",
          borderRadius: "xl",
          p: 3,
          boxShadow: "lg",
        }}
      >
        <ModalClose />
        <Typography level="h4" fontWeight="xl">
          Select Editor
        </Typography>
        <Typography level="body-sm" textColor="text.secondary" mb={2}>
          Choose an editor to start defining processes.
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          {/* Rule-based Option */}
          <Card
            variant="outlined"
            onClick={() => {
              setOpen3(true);
              setOpen1(false);
            }}
            sx={{
              flex: 1,
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                bgcolor: "primary.softBg",
                borderColor: "primary.outlinedBorder",
                cursor: "pointer",
                transform: "translateY(-4px)",
              },
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
              <RuleRoundedIcon
                sx={{ fontSize: "2.5rem", color: "primary.solidBg" }}
              />
            </Box>
            <CardContent>
              <Typography level="title-md" textAlign="center">
                Standard Editor
              </Typography>
              <Typography
                level="body-xs"
                textAlign="center"
                textColor="text.tertiary"
              >
                Using include/exclude statements to build rules.
              </Typography>
            </CardContent>
          </Card>

          {/* Trace-based Option */}
          <Card
            variant="outlined"
            onClick={() => {
              setOpen2(true);
              setOpen1(false);
            }}
            sx={{
              flex: 1,
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                bgcolor: "primary.softBg",
                borderColor: "primary.outlinedBorder",
                cursor: "pointer",
                transform: "translateY(-4px)",
              },
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
              <PolylineRoundedIcon
                sx={{ fontSize: "2.5rem", color: "primary.solidBg" }}
              />
            </Box>
            <CardContent>
              <Typography level="title-md" textAlign="center">
                Advanced Editor
              </Typography>
              <Typography
                level="body-xs"
                textAlign="center"
                textColor="text.tertiary"
              >
                Using start/end entities to build traces.
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}
