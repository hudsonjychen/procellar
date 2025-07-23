import { IconButton, Box, Modal, ModalDialog, DialogTitle, Stack, Typography, Button, Select, Option, Tooltip } from "@mui/joy";
import { LogicIcon } from "../CustomIcons";
import { useState } from "react";
import { useGlobal } from '../GlobalContext';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';

export default function LogicEditor({ rules, processName }) {
    const { relations, setRelations, setProcessData, ops, setOps } = useGlobal()
    const [open, setOpen] = useState(false)
    const [tempOps, setTempOps] = useState(ops)

    const handleSubmit = (e) => {
        e.preventDefault()
    }

    const LogicSelect = ({ index }) => {
        return (<Select
            sx={{ width: '6rem' }}
            value={tempOps[processName][index] || 'or'}
            onChange={(e, newValue) => {
                setTempOps(prev => {
                    const updated = { ...prev };
                    const currentArray = [...(prev[processName] || [])];
                    currentArray[index] = newValue;
                    updated[processName] = currentArray;
                    console.log(tempOps)
                    return updated;
                });
            }}
        >
            <Option value='and'>AND</Option>
            <Option value='or'>OR</Option>
        </Select>)
    }

    const buildExpressionTree = ({ ops, rules }) => {

        if (ops.length === 0) {
            return {}
        }
        
        const precedence = { and: 2, or: 1 }
        const ruleNames = rules.map(rule => rule.ruleName);
        const opStack = []
        const nodeStack = []

        for(let i = 0; i < ruleNames.length; i++){
            nodeStack.push(ruleNames[i])
            if(i < ops.length) {
                while (
                    opStack.length &&
                    precedence[opStack[opStack.length - 1]] >= precedence[ops[i]]
                ) {
                    const right = nodeStack.pop()
                    const left = nodeStack.pop()
                    const op = opStack.pop()
                    nodeStack.push({ op, left, right })
                }
                opStack.push(ops[i])
            }
        }

        while (opStack.length) {
            const right = nodeStack.pop()
            const left = nodeStack.pop()
            const op = opStack.pop()
            nodeStack.push({ op, left, right })
        }
        
        return nodeStack[0]
    }

    const handleSave = (processName) => {
        setOpen(false)
        setOps(tempOps)

        {/* not used */}
        setRelations(prev => ({
            ...prev,
            [processName]: buildExpressionTree({ ops: tempOps[processName], rules })
        }))

        setProcessData(prev =>
            prev.map(item => ({
                ...item,
                relations: buildExpressionTree({ ops: tempOps[processName], rules })
            }))
        )
        console.log(relations)
    }

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
                                                <LogicSelect
                                                    key={index}
                                                    index={index}
                                                />
                                            ) : (
                                                <Box sx={{ visibility: 'hidden' }}>
                                                    <LogicSelect key={index}/>
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
                            <Typography>AND is processed first by default.</Typography>
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
                                onClick={() => handleSave(processName)}
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