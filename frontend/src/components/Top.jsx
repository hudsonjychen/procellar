import { Sheet } from "@mui/joy";
import ExportButton from "./Export";
import ImportButton from "./Import";
import { useGlobal } from '../GlobalContext';
import { SuccessAlert, FailureAlert } from "./Alert";
import { useEffect, useState } from "react";

export default function Top() {
    const { uploadStatus } = useGlobal()
    const [showAlert, setShowAlert] = useState(false)
    const [alertStatus, setAlertStatus] = useState('')
    const status = uploadStatus[uploadStatus.length - 1]
    useEffect(() => {
        setAlertStatus(status)
        setShowAlert(true)
    }, [uploadStatus])

    return (
        <Sheet
            variant="plain"
            sx={{
                bgcolor: 'white',
                borderBottom: '1.2px solid',
                borderColor: 'neutral.outlinedBorder',
                position: 'fixed',
                top: 0,
                left: 0,
                height: 56,
                width: '100%',
            }}
        >
            <ExportButton />
            <ImportButton />
            {alertStatus === 'success' ? (
                <SuccessAlert
                    showAlert={showAlert}
                    setShowAlert={setShowAlert}
                    alertText='File imported successfully.'
                />
                ) : alertStatus === 'failure' ? (
                <FailureAlert
                    showAlert={showAlert}
                    setShowAlert={setShowAlert}
                    alertText='File is not imported.'
                />
                ) : null
            }
        </Sheet>
    )
}