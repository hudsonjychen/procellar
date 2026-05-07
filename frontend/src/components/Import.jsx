import FileOpenOutlinedIcon from "@mui/icons-material/FileOpenOutlined";
import { useEffect, useRef, useState } from "react";
import { styled } from "@mui/material/styles";
import { useGlobal } from "../GlobalContext";
import { useDataStore } from "../stores/dataStore";
import { useProcessStore } from "../stores/processStore";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import {
  Box,
  Button,
  Card,
  DialogTitle,
  Divider,
  Chip,
  Modal,
  ModalDialog,
  Typography,
  Stack,
  IconButton,
} from "@mui/joy";

export default function ImportButton() {
  const {
    setFileInfo,
    setUploadStatus,
    setProcessData,
    setProcessAcList,
    setProcesses,
    setDeletedProcesses,
  } = useGlobal();
  const setObjectTypeList = useDataStore((state) => state.setObjectTypeList);
  const setActivityList = useDataStore((state) => state.setActivityList);
  const setAttrMapList = useDataStore((state) => state.setAttrMapList);
  const setProcessStoreData = useProcessStore((state) => state.setProcessData);
  const setObjectTypeOverview = useDataStore(
    (state) => state.setObjectTypeOverview,
  );
  const fileInputRef = useRef(null);
  const [fileType, setFileType] = useState("ocel");

  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [progressOpen, setProgressOpen] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [etaSeconds, setEtaSeconds] = useState(null);
  const [errorText, setErrorText] = useState("");

  const [ocelName, setOcelName] = useState(null);
  const [dfName, setDfName] = useState(null);

  const formDataRef = useRef(new FormData());
  const pollTimerRef = useRef(null);

  const VisuallyHiddenInput = styled("input")({
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    bottom: 0,
    left: 0,
    whiteSpace: "nowrap",
    width: 1,
  });

  const handleClose = () => {
    setOpen(false);
    setFileType("ocel");
    setOcelName(null);
    setDfName(null);
    setCurrentStep(1);
  };

  const handleChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (fileType === "ocel") {
      setOcelName(file.name);
    } else if (fileType === "df") {
      setDfName(file.name);
    } else {
      return;
    }

    formDataRef.current.set(fileType, file);
    console.log(formDataRef);
  };

  const handleContinue = async () => {
    try {
      setErrorText("");
      setProgress(0);
      setStatus("queued");
      setMessage("Queued");
      setEtaSeconds(null);
      setProgressOpen(true);

      const response = await fetch("http://localhost:5001/upload_async", {
        method: "POST",
        body: formDataRef.current,
        mode: "cors",
      });

      formDataRef.current = new FormData();
      const result = await response.json();
      if (!response.ok || !result.taskId) {
        throw new Error(result.error || result.message || "Failed to start import");
      }
      setTaskId(result.taskId);
    } catch (err) {
      console.error("Fail", err);
      setStatus("failed");
      setErrorText(err.message || "Import failed");
      setFileInfo({});
      setObjectTypeList([]);
      setActivityList([]);
      setAttrMapList([]);
      setProcessData([]);
      setProcessStoreData([]);
      setProcessAcList([]);
      setProcesses([]);
      setDeletedProcesses([]);
    }
  };

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const formatEta = (seconds) => {
    if (seconds === null || seconds === undefined) return "--";
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    if (min > 0) return `${min}m ${sec}s`;
    return `${sec}s`;
  };

  useEffect(() => {
    if (!taskId) return;
    stopPolling();
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:5001/upload_status/${taskId}`);
        if (!res.ok) return;
        const task = await res.json();
        setStatus(task.status);
        setProgress(task.progress ?? 0);
        setMessage(task.message ?? "");
        setEtaSeconds(task.eta_seconds ?? null);

        if (task.status === "completed") {
          stopPolling();
          const dataRes = await fetch("http://localhost:5001/get_data");
          const data = await dataRes.json();
          setFileInfo(data.fileInfo);
          setObjectTypeList(data.objectTypes);
          setActivityList(data.activities);
          setObjectTypeOverview(data.objectTypeList);
          setAttrMapList(data.attributes);
          setProcesses(data.processList);

          const processData = data.processData;
          const processAcList = processData.map((item) => ({ title: item.processName }));
          setProcessData(processData);
          setProcessStoreData(processData);
          setProcessAcList(processAcList);
          setDeletedProcesses([]);
          setUploadStatus((prev) => [...prev, "success"]);
          setProgressOpen(false);
          setTaskId(null);
        } else if (task.status === "incompatible") {
          stopPolling();
          setUploadStatus((prev) => [...prev, "incompatible"]);
          setErrorText(task.error || task.message || "Incompatible definition file");
        } else if (["failed", "cancelled"].includes(task.status)) {
          stopPolling();
          if (task.status === "failed") {
            setUploadStatus((prev) => [...prev, "failure"]);
          }
          setErrorText(task.error || task.message || "Import failed");
        }
      } catch (err) {
        stopPolling();
        setStatus("failed");
        setErrorText("Failed to poll import status");
      }
    }, 1000);

    return () => stopPolling();
  }, [taskId]);

  const handleCancelImport = async () => {
    if (!taskId) return;
    try {
      await fetch(`http://localhost:5001/upload_cancel/${taskId}`, {
        method: "POST",
        mode: "cors",
      });
      setMessage("Cancelling");
    } catch (err) {
      console.error("Cancel import failed", err);
    }
  };

  const ImportPanel = () => {
    const isStep1 = currentStep === 1;
    const isStep2 = currentStep === 2;

    const handleStepContinue = () => {
      if (isStep1) {
        if (!ocelName) return;
        setCurrentStep(2);
        return;
      }
      handleContinue();
      handleClose();
    };

    const continueLabel = isStep1 ? "Continue" : "Import";

    return (
      <Modal open={open} onClose={() => handleClose()}>
        <ModalDialog sx={{ width: 640, maxWidth: "92vw", overflowY: "auto" }}>
          <Stack sx={{ mx: 2, mt: 2, mb: 2 }}>
            <DialogTitle sx={{ fontSize: 22, fontWeight: "bold", p: 0 }}>
              Import
            </DialogTitle>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mx: 2, mb: 1 }}>
            <Chip
              size="sm"
              variant="soft"
              color={currentStep >= 1 ? "primary" : "neutral"}
            >
              1
            </Chip>
            <Typography level="title-sm">Import OCEL</Typography>
            <Divider sx={{ flex: 1, ml: 1 }} />
            <Chip
              size="sm"
              variant="soft"
              color={currentStep >= 2 ? "primary" : "neutral"}
            >
              2
            </Chip>
            <Typography level="title-sm">Import DF (Optional)</Typography>
          </Stack>

          {isStep1 && (
            <Card variant="soft" sx={{ mx: 2, mt: 2, p: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Chip size="sm" color="primary">
                  Step 1
                </Chip>
                <Typography level="title-sm">Import OCEL</Typography>
              </Stack>
              <Box
                sx={{
                  borderRadius: "12px",
                  backgroundColor: "neutral.100",
                  p: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <AttachFileRoundedIcon sx={{ color: "#a2a2a2ff" }} />
                  <Typography level="body-sm">
                    {ocelName ? ocelName : "No OCEL File Uploaded"}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  {ocelName && <CheckCircleRoundedIcon sx={{ color: "#00b140" }} />}
                  <Button
                    size="sm"
                    variant="soft"
                    color="neutral"
                    onClick={() => {
                      setFileType("ocel");
                      fileInputRef.current.click();
                    }}
                  >
                    Upload OCEL
                  </Button>
                </Stack>
              </Box>
            </Card>
          )}

          {isStep2 && (
            <Card variant="soft" sx={{ mx: 2, mt: 2, p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Chip size="sm" color="neutral">
                Step 2
              </Chip>
              <Typography level="title-sm">Import Definition File (Optional)</Typography>
            </Stack>
            <Stack spacing={1}>
              <Box
                sx={{
                  borderRadius: "12px",
                  backgroundColor: "neutral.100",
                  p: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <AttachFileRoundedIcon sx={{ color: "#a2a2a2ff" }} />
                  <Typography level="body-sm">
                    {dfName ? dfName : "No Definition File Uploaded"}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  {dfName && <CheckCircleRoundedIcon sx={{ color: "#00b140" }} />}
                  <Button
                    size="sm"
                    variant="soft"
                    color="neutral"
                    onClick={() => {
                      setFileType("df");
                      fileInputRef.current.click();
                    }}
                  >
                    Upload DF
                  </Button>
                </Stack>
              </Box>
            </Stack>
            </Card>
          )}

          <Stack
            direction="row"
            justifyContent="space-between"
            spacing={3}
            alignItems="center"
            sx={{ mx: 2, mt: 3, mb: 2 }}
          >
            <Stack direction="row" spacing={1.5}>
              <Button
                color="neutral"
                sx={{ width: 126 }}
                onClick={() => handleClose()}
              >
                Cancel
              </Button>
              {currentStep > 1 && (
                <Button
                  color="neutral"
                  variant="outlined"
                  sx={{ width: 126 }}
                  onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                >
                  Back
                </Button>
              )}
            </Stack>
            <Button
              disabled={isStep1 && !ocelName}
              sx={{ width: 126 }}
              onClick={handleStepContinue}
            >
              {continueLabel}
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>
    );
  };

  return (
    <Box>
      <ImportPanel />
      <Modal open={progressOpen} onClose={() => {}}>
        <ModalDialog sx={{ width: 460 }}>
          <Stack spacing={1.5}>
            <DialogTitle sx={{ fontSize: 20, fontWeight: "bold", p: 0 }}>
              Import Progress
            </DialogTitle>
            <Typography level="body-sm">{message || "Processing..."}</Typography>
            <Box sx={{ width: "100%" }}>
              <Box sx={{ mb: 0.8 }}>
                <Typography level="body-xs">
                  {Math.round(progress)}% • ETA: {formatEta(etaSeconds)}
                </Typography>
              </Box>
              <Box sx={{ width: "100%", height: 8, borderRadius: 8, backgroundColor: "neutral.200" }}>
                <Box
                  sx={{
                    width: `${Math.max(0, Math.min(100, progress))}%`,
                    height: 8,
                    borderRadius: 8,
                    backgroundColor: "primary.500",
                    transition: "width 0.3s ease",
                  }}
                />
              </Box>
            </Box>
            {errorText ? (
              <Typography level="body-sm" color="danger">{errorText}</Typography>
            ) : null}
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              {status === "completed" ? null : (
                <Button
                  color="danger"
                  variant="soft"
                  onClick={handleCancelImport}
                  disabled={!taskId || ["cancelled", "failed", "incompatible"].includes(status)}
                >
                  Cancel
                </Button>
              )}
              {["failed", "cancelled", "incompatible"].includes(status) ? (
                <Button
                  color="neutral"
                  onClick={() => {
                    setProgressOpen(false);
                    setTaskId(null);
                  }}
                >
                  Close
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </ModalDialog>
      </Modal>
      <Box sx={{ position: "fixed", left: "22px", top: "10px" }}>
        <Button
          aria-label="import"
          onClick={() => setOpen(true)}
          startDecorator={<FileOpenOutlinedIcon />}
          variant="solid"
          color="neutral"
        >
          Import
        </Button>
      </Box>
      <VisuallyHiddenInput
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        accept=".json"
      />
    </Box>
  );
}
