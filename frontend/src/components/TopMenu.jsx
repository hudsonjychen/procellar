import ExportButton from "./ExportButton";
import ImportButton from "./ImportButton";
import { Box } from "@mui/material";

export default function TopMenu() {

    return (
        <Box sx={{width: '100vw', height: '64px', position: 'fixed', left: 0, top: 0, borderBottom: '1.5px solid #757575'}}>
            <ImportButton />
            <ExportButton />
        </Box>
    )

}