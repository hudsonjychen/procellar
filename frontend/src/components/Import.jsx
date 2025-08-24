import FileOpenOutlinedIcon from '@mui/icons-material/FileOpenOutlined';
import { useRef, useState } from 'react';
import { styled } from '@mui/material/styles';
import { useGlobal } from '../GlobalContext';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { Box, Button, DialogTitle, Modal, ModalDialog, Typography, Stack, IconButton, Select, Option } from '@mui/joy';

export default function ImportButton() {
    const { setFileInfo, setUploadStatus, setObjectTypes, setActivities, setObjectTypeList, setAttrMap, setProcessData, setProcessAcList, setProcesses } = useGlobal();
    const fileInputRef = useRef(null);
    const [fileType, setFileType] = useState('ocel');

    const [open, setOpen] = useState(false);

    const [ocelName, setOcelName] = useState(null);
    const [dfName, setDfName] = useState(null);

    const formDataRef = useRef(new FormData());

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

    const handleClose = () => {
        setOpen(false);
        setFileType('ocel');
        setOcelName(null);
        setDfName(null);
    };

    const handleChange = (event) => {

        const file = event.target.files[0];

        if (!file) return;

        if (fileType === 'ocel') {
            setOcelName(file.name);
        } else if (fileType === 'df') {
            setDfName(file.name);
        } else {
            return;
        }
        
        formDataRef.current.set(fileType, file);
    };
    
    const handleContinue = async () => {
        try {
            const response = await fetch("http://localhost:5001/upload", {
                method: "POST",
                body: formDataRef.current,
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
            setAttrMap(data.attributes);
            setProcesses(data.processList);
            setProcessData(data.processData);
            
            setUploadStatus(prev => [...prev, 'success']);
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
    };

    const ImportPanel = () => {
        return (
            <Modal 
                open={open} 
                onClose={() => handleClose()}
            >
                <ModalDialog sx={{ overflowY: 'auto', overflowX: 'auto' }}>
                    <Stack 
                        direction='row' 
                        justifyContent='space-between' 
                        sx={{ mx: 2, mt: 2, mb: 1 }}
                    >
                        <DialogTitle sx={{ fontSize: 22, fontWeight: 'bold' }}>
                            Import
                        </DialogTitle>

                        <Select 
                            variant='soft'
                            sx={{
                                width: '6rem'
                            }}
                            value={fileType}
                            onChange={(e, newValue) => {setFileType(newValue)}}
                        >
                            <Option value='ocel'>OCEL</Option>
                            <Option value='df'>DF</Option>
                        </Select>
                    </Stack>
                    <Box
                        sx={{
                            width: '568px',
                            height: '122px',
                            border: '1px dashed #d6d6d6ff',
                            borderRadius: '12px',
                            backgroundColor: 'neutral.100',
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            mx: 2
                        }}      
                    >
                        <IconButton
                            onClick={() => fileInputRef.current.click()} 
                            sx={{ 
                                mb: 0.8, 
                                p: 1 
                            }}
                        >
                            <FileOpenOutlinedIcon sx={{ color: '#a2a2a2ff', fontSize: 38 }} />
                        </IconButton>
                        <Typography level='body-lg' fontWeight={500}>
                            Click the Icon to Upload a File
                        </Typography>
                        <Typography level='body-sm' fontSize={14}>
                            Maximum Size: 500MB
                        </Typography>
                    </Box>
                    
                    <Box
                        sx={{
                            mx: 2,
                            mt: 1
                        }}
                    >
                        <Typography 
                            level='title-sm'
                            sx={{
                                color: 'neutral.600'
                            }}
                        >
                            OCEL
                        </Typography>
                        <Box sx={{
                            width: '568px',
                            height: '18px',
                            borderRadius: '12px',
                            backgroundColor: 'neutral.100',
                            p: 2,
                            display: 'flex',
                            justifyContent: 'space-between'
                        }}>
                            <Stack 
                                direction='row'
                                spacing={2}
                                alignItems='center'
                            >
                                <AttachFileRoundedIcon sx={{ color: '#a2a2a2ff' }} />
                                <Typography level='body-sm'>
                                    {ocelName ? ocelName : 'No File Uploaded'}
                                </Typography>
                            </Stack>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {ocelName && 
                                    <CheckCircleRoundedIcon 
                                        sx={{
                                            color: '#00b140'
                                        }}
                                    />
                                }
                            </Box>
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            mx: 2,
                            mt: 1
                        }}
                    >
                        <Stack 
                            direction='row' 
                            justifyContent='space-between'
                            alignItems='center'
                        >
                            <Typography 
                                level='title-sm'
                                sx={{
                                    color: 'neutral.600'
                                }}
                            >
                                Definition File (DF)
                            </Typography>
                            <Typography
                                level='body-sm'
                                sx={{
                                    color: 'neutral.600'
                                }}
                            >
                                Optional
                            </Typography>
                        </Stack>
                        <Box sx={{
                            width: '568px',
                            height: '18px',
                            borderRadius: '12px',
                            backgroundColor: 'neutral.100',
                            p: 2,
                            display: 'flex',
                            justifyContent: 'space-between'
                        }}>
                            <Stack 
                                direction='row'
                                spacing={2}
                                alignItems='center'
                            >
                                <AttachFileRoundedIcon sx={{ color: '#a2a2a2ff' }} />
                                <Typography level='body-sm'>
                                    {dfName ? dfName : 'No File Uploaded'}
                                </Typography>
                            </Stack>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {dfName && 
                                    <CheckCircleRoundedIcon 
                                        sx={{
                                            color: '#00b140'
                                        }}
                                    />
                                }
                            </Box>
                        </Box>
                    </Box>

                    <Stack 
                        direction='row' 
                        justifyContent='flex-end'
                        spacing={3} 
                        alignItems='center'
                        sx={{ mx: 2, mt: 3, mb: 2 }}
                    >
                        <Button 
                            color='neutral' 
                            sx={{ width: 126 }}
                            onClick={() => handleClose()}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={!ocelName}
                            sx={{ width: 126 }}
                            onClick={() => {
                                handleContinue();
                                handleClose();
                            }}
                        >
                            Continue
                        </Button>
                    </Stack>
                </ModalDialog>
            </Modal>
        )
    }

    return (
        <Box>
            <ImportPanel />
            <Box sx={{ position: 'fixed', left: '22px', top: '10px' }}>
                <Button 
                    aria-label='import'
                    onClick={() => setOpen(true)}
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