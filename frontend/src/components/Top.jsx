import { Sheet } from "@mui/joy";
import ExportButton from "./ExportButton";
import ImportButton from "./ImportButton";

export default function Top() {
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
        </Sheet>
    )
}