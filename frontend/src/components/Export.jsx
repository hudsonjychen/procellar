import IosShareIcon from '@mui/icons-material/IosShare';
import { Box, Button, LinearProgress, Modal, ModalDialog, Stack, Typography } from '@mui/joy';
import { useGlobal } from '../GlobalContext';
import { useProcessStore } from '../stores/processStore';
import { useEffect, useRef, useState } from 'react';
import JSZip from "jszip"

export default function ExportButton() {
    const { deletedProcesses } = useGlobal();
    const processData = useProcessStore((state) => state.processData);
    const [open, setOpen] = useState(false);
    const [taskId, setTaskId] = useState(null);
    const [status, setStatus] = useState("idle");
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState("");
    const [scanProgress, setScanProgress] = useState(null);
    const [etaSeconds, setEtaSeconds] = useState(null);
    const [errorText, setErrorText] = useState("");
    const pollTimerRef = useRef(null);

    const formatEta = (seconds) => {
        if (seconds === null || seconds === undefined) return "--";
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        if (min > 0) return `${min}m ${sec}s`;
        return `${sec}s`;
    };

    const stopPolling = () => {
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
        }
    };

    const finalizeDownload = async () => {
        const res = await fetch("http://localhost:5001/export_file");
        const data = await res.json();

        if (!data.exportedFile) {
            throw new Error("No exported file data received");
        }

        const zip = new JSZip();
        zip.file('process-enriched-ocel.json', JSON.stringify(data.exportedFile, null, 2));
        zip.file('definition-file.json', JSON.stringify(processData, null, 2));

        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exported-data.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        if (!taskId) return;
        stopPolling();
        pollTimerRef.current = setInterval(async () => {
            try {
                const res = await fetch(`http://localhost:5001/process_data_status/${taskId}`);
                if (!res.ok) return;
                const task = await res.json();
                setStatus(task.status);
                setProgress(task.progress ?? 0);
                setMessage(task.message ?? "");
                setScanProgress(
                    typeof task.scan_progress === "number" ? task.scan_progress : null
                );
                setEtaSeconds(task.eta_seconds ?? null);

                if (task.status === "completed") {
                    stopPolling();
                    await finalizeDownload();
                    setOpen(false);
                    setTaskId(null);
                    setScanProgress(null);
                } else if (["failed", "cancelled", "incompatible"].includes(task.status)) {
                    stopPolling();
                    setErrorText(task.error || task.message || "Export failed");
                    setScanProgress(null);
                }
            } catch (err) {
                stopPolling();
                setErrorText("Failed to poll export status");
                setStatus("failed");
                setScanProgress(null);
            }
        }, 1000);

        return () => stopPolling();
    }, [taskId]);

    const handleClick = async () => {

        const zipData = {processData: processData, deletedProcesses: deletedProcesses}

        try {
            setErrorText("");
            setProgress(0);
            setScanProgress(null);
            setEtaSeconds(null);
            setStatus("queued");
            setMessage("Queued");
            setOpen(true);

            const response = await fetch("http://localhost:5001/process_data_async", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(zipData),
                mode: 'cors'
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Response error:", errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            setTaskId(result.taskId);
        
        } catch (err) {
            console.error("Fail", err);
            setErrorText(err.message || "Failed to start export");
            setStatus("failed");
            setOpen(true);
        }
    };

    const handleCancel = async () => {
        if (!taskId) return;
        try {
            await fetch(`http://localhost:5001/process_data_cancel/${taskId}`, {
                method: "POST",
                mode: "cors",
            });
            setMessage("Cancelling");
        } catch (err) {
            console.error("Cancel failed", err);
        }
    };

    return (
        <>
            <Box sx={{ position: 'fixed', right: '22px', top: '10px' }}>
                <Button 
                    aria-label='export'
                    variant='soft'
                    color='neutral' 
                    onClick={handleClick}
                    startDecorator={<IosShareIcon />}
                >
                    Export
                </Button>
            </Box>
            <Modal open={open} onClose={() => {}}>
                <ModalDialog sx={{ width: 460 }}>
                    <Stack spacing={1.5}>
                        <Typography level="title-lg">Export Progress</Typography>
                        <Typography level="body-sm">{message || "Processing..."}</Typography>
                        <LinearProgress determinate value={Math.max(0, Math.min(100, progress))} />
                        <Typography level="body-xs">
                            {Math.round(progress)}% • ETA: {formatEta(etaSeconds)}
                        </Typography>
                        {typeof scanProgress === "number" ? (
                            <Stack spacing={0.5} sx={{ mt: 1 }}>
                                <Typography level="body-xs" color="neutral">
                                    Scanning traces
                                </Typography>
                                <LinearProgress
                                    determinate
                                    value={Math.max(0, Math.min(100, scanProgress))}
                                    color="primary"
                                />
                                <Typography level="body-xs" color="neutral">
                                    {Math.round(scanProgress)}%
                                </Typography>
                            </Stack>
                        ) : null}
                        {errorText ? (
                            <Typography level="body-sm" color="danger">{errorText}</Typography>
                        ) : null}
                        <Stack direction="row" justifyContent="flex-end" spacing={1}>
                            {status === "completed" ? null : (
                                <Button
                                    color="danger"
                                    variant="soft"
                                    onClick={handleCancel}
                                    disabled={!taskId || ["cancelled", "failed", "incompatible"].includes(status)}
                                >
                                    Cancel
                                </Button>
                            )}
                            {["failed", "cancelled", "incompatible"].includes(status) ? (
                                <Button color="neutral" onClick={() => { setOpen(false); setTaskId(null); setScanProgress(null); }}>
                                    Close
                                </Button>
                            ) : null}
                        </Stack>
                    </Stack>
                </ModalDialog>
            </Modal>
        </>
    )
}