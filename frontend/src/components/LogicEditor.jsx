import { IconButton, Box, Modal, ModalDialog, DialogTitle, Stack, Typography, Button, Select, Option, Tooltip } from "@mui/joy";
import { LogicIcon } from "../CustomIcons";
import { useState } from "react";
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import { alignContent, alignItems, display, flex, flexWrap, gap } from "@mui/system";

export default function LogicEditor({ rules }) {
    const [open, setOpen] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
    }

    const LogicSelect = () => (
        <Select
            sx={{ width: '6rem' }}
            defaultValue='and'
        >
            <Option value='and'>AND</Option>
            <Option value='or'>OR</Option>
        </Select>
    )

    return (
        <Box>
            <Tooltip title='Edit logic relations'>
                <IconButton
                    onClick={() => setOpen(true)}
                    sx={{ 
                        borderRadius: '50%'
                    }}
                >
                    <LogicIcon />
                </IconButton>
            </Tooltip>
            <Modal open={open} onClose={() => setOpen(false)}>
                <ModalDialog sx={{ overflowY: 'auto' }}>
                    <DialogTitle sx={{ fontSize: 22, fontWeight: 'bold', ml: 2, mt: 2 }}>
                        Logic Editor
                    </DialogTitle>
                    <form onSubmit={handleSubmit}>
                        <Box 
                            sx={{ 
                                m: 1.2,
                                mb: 4, 
                                width: 520,
                                p: 1,
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignContent: 'flex-start',
                                alignItems: 'flex-start',
                                gap: 2
                            }}
                        >
                            {
                                rules.map((rule, index) => (
                                    <Stack
                                        key={rule.ruleName}
                                        direction='row'
                                        alignItems='center'
                                        justifyContent='flex-start'
                                        spacing={2}
                                    >
                                        <Typography fontWeight='bold'>
                                            {rule.ruleName}
                                        </Typography>
                                        {
                                            rules.length - 1 !== index ? (
                                                <LogicSelect />
                                            ) : (
                                                <Box sx={{ visibility: 'hidden' }}>
                                                    <LogicSelect />
                                                </Box>
                                            )
                                        }
                                    </Stack>
                                ))
                            }
                        </Box>
                        <Stack
                            direction='row' 
                            justifyContent='flex-start' 
                            alignItems='flex-start'
                            spacing={2} 
                            sx={{ m: 2, pt: 1, pb: 1 }}
                        >
                            <TipsAndUpdatesOutlinedIcon />
                            <Typography>It will show how the event log will be modified.</Typography>
                        </Stack>
                        <Stack 
                            direction='row' 
                            justifyContent='space-evenly' 
                            alignItems='center'
                            sx={{ m: 2, mt: 6 }}
                        >
                            <Button 
                                color='neutral' 
                                sx={{ width: 126 }} 
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                sx={{ width: 126 }}
                            >
                                Save
                            </Button>
                        </Stack>
                    </form>
                </ModalDialog>
            </Modal>
        </Box>
    )
}