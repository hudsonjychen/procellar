import IosShareIcon from '@mui/icons-material/IosShare';
import { Box, Button } from '@mui/joy';
import { useGlobal } from '../GlobalContext';

export default function ExportButton() {
    const { processData } = useGlobal();

    const handleClick = async () => {

        try {
            const response = await fetch("http://localhost:5001/process_data", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(processData),
                mode: 'cors'
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Response error:", errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        
            const result = await response.json();
            console.log("Succeed", result);

            const res = await fetch("http://localhost:5001/export_file");
            const data = await res.json();

            if (!data.exportedFile) {
                throw new Error("No exported file data received");
            }

            const exportData = JSON.stringify(data.exportedFile, null, 2);
            const downloadBlob = new Blob([exportData], { type: 'application/json' });
            const url = URL.createObjectURL(downloadBlob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'procel.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
        
        } catch (err) {
            console.error("Fail", err);
        }
    };

    return (
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
    )
}