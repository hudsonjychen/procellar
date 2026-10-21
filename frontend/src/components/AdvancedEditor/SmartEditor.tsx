import {
  DialogTitle,
  Divider,
  Modal,
  ModalDialog,
  Box,
  Stack,
  Typography,
  Button,
  Tooltip,
  Card,
} from "@mui/joy";
import { ErrorAlert } from "./Alert";
import { ErrorBoundary, FallbackUI } from "./ErrorBoundary";
import ProcessNameInput from "./ProcessNameInput";
import { DraftSelectors, RuleInfo, TraceData, TraceSlot } from "./types";
import { useProcessStore } from "../../stores/processStore";
import { useDataStore } from "../../stores/dataStore";
import RuleNameInput from "./RuleNameInput";
import HelpOutlinedIcon from "@mui/icons-material/HelpOutlined";
import SelectorList from "./SelectorList";
import { useEffect, useRef, useState } from "react";
import ConnectorArrow from "./ConnectorArrow";
import {
  emptyDraftSelectors,
  toDraftSelectors,
  toTraceSelectors,
} from "./selectors";

interface SmartEditorProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showAlert: boolean;
  setShowAlert: React.Dispatch<React.SetStateAction<boolean>>;
  ruleInfo: RuleInfo;
  setRuleInfo: React.Dispatch<React.SetStateAction<RuleInfo>>;
  handleCancel: () => void;
}

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};

const SELECTOR_HINT = (
  <>
    A selector matches events of its activity (at most one)
    <br />
    that are related to all of its object types.
    <br />
    Multiple selectors are combined with OR.
  </>
);

export default function SmartEditor({
  open,
  setOpen,
  showAlert,
  setShowAlert,
  ruleInfo,
  setRuleInfo,
  handleCancel,
}: SmartEditorProps) {
  const processNames = useProcessStore((state) => state.processNames);
  const setProcessNames = useProcessStore((state) => state.setProcessNames);
  const processData = useProcessStore((state) => state.processData);
  const setProcessData = useProcessStore((state) => state.setProcessData);
  const traceEditPayload = useProcessStore((state) => state.traceEditPayload);
  const setTraceEditPayload = useProcessStore(
    (state) => state.setTraceEditPayload,
  );
  const objectTypeList = useDataStore((state) => state.objectTypeList);
  const activityList = useDataStore((state) => state.activityList);

  const [selectors, setSelectors] =
    useState<DraftSelectors>(emptyDraftSelectors);
  const [alertText, setAlertText] = useState(
    "Please provide a process name, a unique rule name, and add at least one start and one end selector with entities before saving.",
  );

  const traceSelectors = {
    start: toTraceSelectors(selectors.start),
    end: toTraceSelectors(selectors.end),
    include: toTraceSelectors(selectors.include),
    exclude: toTraceSelectors(selectors.exclude),
  };

  const clearEditor = () => {
    setRuleInfo({
      ruleName: "",
      parentProcess: { title: "" },
    });
    setSelectors(emptyDraftSelectors());
  };

  useEffect(() => {
    if (!traceEditPayload) return;
    setRuleInfo({
      ruleName: traceEditPayload.traceName,
      parentProcess: { title: traceEditPayload.parentProcess },
    });
    setSelectors({
      start: toDraftSelectors(traceEditPayload.start),
      end: toDraftSelectors(traceEditPayload.end),
      include: toDraftSelectors(traceEditPayload.include),
      exclude: toDraftSelectors(traceEditPayload.exclude),
    });
  }, [traceEditPayload, setRuleInfo]);

  const handleSave = () => {
    const processName = ruleInfo.parentProcess?.title?.trim() || "";
    const trimmedTraceName = ruleInfo.ruleName.trim();
    if (
      !processName ||
      !trimmedTraceName ||
      traceSelectors.start.length === 0 ||
      traceSelectors.end.length === 0
    ) {
      setAlertText(
        "Please provide a process name, a unique rule name, and add at least one start and one end selector with entities before saving.",
      );
      setShowAlert(true);
      return;
    }

    const newTrace: TraceData = {
      traceName: trimmedTraceName,
      parentProcess: processName,
      ...traceSelectors,
    };
    const baseProcessData = traceEditPayload
      ? processData.map((process) =>
          process.processName === traceEditPayload.sourceProcessName &&
          "traces" in process
            ? {
                ...process,
                traces: (process.traces ?? []).filter(
                  (trace) =>
                    trace.traceName !== traceEditPayload.sourceTraceName,
                ),
              }
            : process,
        )
      : processData;

    const existingProcess = baseProcessData.find(
      (process) => process.processName === processName,
    );
    if (existingProcess) {
      if ("rules" in existingProcess) {
        setAlertText(
          "A process that contains standard rules cannot contain trace-based rules.",
        );
        setShowAlert(true);
        return;
      }
      if (
        (existingProcess.traces ?? []).some(
          (trace) => trace.traceName === trimmedTraceName,
        )
      ) {
        setAlertText("Rule name must be unique within the same process.");
        setShowAlert(true);
        return;
      }
      setProcessData([
        ...baseProcessData.filter(
          (process) => process.processName !== processName,
        ),
        {
          ...existingProcess,
          traces: [...(existingProcess.traces ?? []), newTrace],
        },
      ]);
    } else {
      setProcessData([
        ...baseProcessData,
        {
          processName,
          imported: false,
          traces: [newTrace],
          relations: {},
        },
      ]);
    }
    setShowAlert(false);
    setOpen(false);
    clearEditor();
    setTraceEditPayload(null);
  };

  const handleCloseEditor = () => {
    clearEditor();
    setShowAlert(false);
    setTraceEditPayload(null);
    setOpen(false);
  };

  const startTextRef = useRef<HTMLSpanElement>(null);
  const endTextRef = useRef<HTMLSpanElement>(null);

  const slotList = (slot: TraceSlot) => (
    <SelectorList
      selectors={selectors[slot]}
      onChange={(next) => setSelectors((prev) => ({ ...prev, [slot]: next }))}
      objectTypeList={objectTypeList}
      activityList={activityList}
      color={
        slot === "include" ? "success" : slot === "exclude" ? "danger" : "primary"
      }
      size={slot === "include" || slot === "exclude" ? "sm" : "md"}
    />
  );

  return (
    <Modal open={open} onClose={handleCloseEditor}>
      <ModalDialog sx={{ display: "flex", width: "560px", overflowY: "auto" }}>
        <ErrorAlert
          showAlert={showAlert}
          setShowAlert={setShowAlert}
          alertText={alertText}
        />
        <DialogTitle sx={{ fontSize: 22, fontWeight: "bold", ml: 2, mt: 2 }}>
          Advanced Editor
        </DialogTitle>
        <ErrorBoundary fallback={<FallbackUI />}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ m: 2, width: 380 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ pt: 1, pb: 1 }}
              >
                <Typography level="title-md">Process name</Typography>
                <Box sx={{ width: "224px" }}>
                  <ProcessNameInput
                    ruleInfo={ruleInfo}
                    setRuleInfo={setRuleInfo}
                    processNames={processNames}
                    setProcessNames={setProcessNames}
                    width="224px"
                  />
                </Box>
              </Stack>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ pt: 1, pb: 1 }}
              >
                <Typography level="title-md">Rule name</Typography>
                <Box sx={{ width: "224px" }}>
                  <RuleNameInput
                    ruleInfo={ruleInfo}
                    setRuleInfo={setRuleInfo}
                    text="Enter rule name..."
                  />
                </Box>
              </Stack>
            </Box>
            <Divider sx={{ m: 2 }} />
            <Box
              sx={{ position: "relative", m: 2 }}
              className="editor-container"
            >
              <ConnectorArrow startRef={startTextRef} endRef={endTextRef} />

              <Stack
                direction="row"
                spacing={2}
                alignItems="flex-start"
                sx={{ pt: 1, pb: 2 }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  sx={{ width: 86, mt: 1 }}
                >
                  <Typography level="title-md" ref={startTextRef}>
                    Start
                  </Typography>
                  <Tooltip variant="outlined" title={SELECTOR_HINT}>
                    <HelpOutlinedIcon
                      fontSize="small"
                      sx={{ color: "#999", ml: 0.5 }}
                    />
                  </Tooltip>
                </Stack>
                {slotList("start")}
              </Stack>

              <Stack
                direction="row"
                spacing={2}
                alignItems="flex-start"
                sx={{ pt: 1, pb: 1 }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  sx={{ width: 86, mt: 1 }}
                >
                  <Typography level="title-md" ref={endTextRef}>
                    End
                  </Typography>
                  <Tooltip variant="outlined" title={SELECTOR_HINT}>
                    <HelpOutlinedIcon
                      fontSize="small"
                      sx={{ color: "#999", ml: 0.5 }}
                    />
                  </Tooltip>
                </Stack>
                {slotList("end")}
              </Stack>
            </Box>

            <Box sx={{ m: 1 }}>
              <Typography level="title-sm" color="neutral" sx={{ pl: 1 }}>
                More functions
              </Typography>
              <Card
                variant="outlined"
                size="md"
                sx={{ borderRadius: "lg", borderStyle: "dashed" }}
              >
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Stack
                    direction="row"
                    alignItems="center"
                    sx={{ width: 86, mt: 0.5 }}
                  >
                    <Typography level="title-sm">Include</Typography>
                    <Tooltip variant="outlined" title={SELECTOR_HINT}>
                      <HelpOutlinedIcon
                        fontSize="small"
                        sx={{ color: "#999", ml: 0.5 }}
                      />
                    </Tooltip>
                  </Stack>
                  {slotList("include")}
                </Stack>

                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Stack
                    direction="row"
                    alignItems="center"
                    sx={{ width: 86, mt: 0.5 }}
                  >
                    <Typography level="title-sm">Exclude</Typography>
                    <Tooltip variant="outlined" title={SELECTOR_HINT}>
                      <HelpOutlinedIcon
                        fontSize="small"
                        sx={{ color: "#999", ml: 0.5 }}
                      />
                    </Tooltip>
                  </Stack>
                  {slotList("exclude")}
                </Stack>
              </Card>
            </Box>

            <Divider sx={{ m: 2 }} />
            <Stack
              direction="row"
              justifyContent="flex-end"
              spacing={3}
              alignItems="center"
              sx={{ m: 2, mt: 6 }}
            >
              <Button
                color="neutral"
                sx={{ width: 126 }}
                onClick={() => {
                  handleCloseEditor();
                  handleCancel();
                }}
              >
                Cancel
              </Button>
              <Button sx={{ width: 126 }} onClick={handleSave}>
                Save
              </Button>
            </Stack>
          </form>
        </ErrorBoundary>
      </ModalDialog>
    </Modal>
  );
}
