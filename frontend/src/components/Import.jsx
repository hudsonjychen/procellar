import FileOpenOutlinedIcon from '@mui/icons-material/FileOpenOutlined';
import { useRef } from 'react';
import { styled } from '@mui/material/styles';
import { useGlobal } from '../GlobalContext';
import { Box, Button } from '@mui/joy';

export default function ImportButton() {
    const { setFileInfo, setUploadStatus, setObjectTypes, setActivities, setObjectTypeList, setAttrMap, setProcessData, setProcessAcList, setProcesses } = useGlobal();
    const fileInputRef = useRef(null);

    const VisuallyHiddenInput = styled('input')({
        clip: 'rect(0 0 0 0)',
        clipPath: 'inset(50%)',
        height: 1,
        overflow: 'hidden',
        position: 'absolute',
        bottom: 0,
        left: 0,
        whiteSpace: 'nowrap',
        width: 1,
    });

    const handleClick = () => {
        fileInputRef.current.click();
    };

    const handleChange = async (event) => {
        const file = event.target.files[0];
        
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("http://localhost:5001/upload", {
                method: "POST",
                body: formData,
                mode: 'cors'
            });
        
            const result = await response.json();
            if (!response.ok || result.error) {
                throw new Error(result.error || `Upload failed with status ${response.status}`);
            }

            const res = await fetch("http://localhost:5001/get_data");
            const data = await res.json();
            setFileInfo(data.fileInfo);
            setObjectTypes(data.objectTypes);
            setActivities(data.activities);
            setObjectTypeList(data.objectTypeList);
            setAttrMap(data.attributes)
            
            setUploadStatus(prev => [...prev, 'success'])
        } 
        catch (err) {
            console.error("Fail", err)
            setUploadStatus(prev => [...prev, 'failure'])
            setFileInfo({});
            setObjectTypes([]);
            setActivities([]);
            setObjectTypeList([]);
            setAttrMap({});
            setProcessData([]);
            setProcessAcList([]);
            setProcesses([]);
        }
    }

    return (
        <Box>
            <Box sx={{ position: 'fixed', left: '22px', top: '10px' }}>
                <Button 
                    aria-label='import'
                    onClick={handleClick}
                    startDecorator={<FileOpenOutlinedIcon />}
                    variant='solid'
                    color='neutral'
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
    )
}