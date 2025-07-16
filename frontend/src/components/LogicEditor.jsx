import { IconButton, Box, Modal, ModalDialog, DialogTitle, Stack, Typography, Button, Select, Option, Tooltip } from "@mui/joy";
import { LogicIcon } from "../CustomIcons";
import { useState, useEffect } from "react";
import { useGlobal } from '../GlobalContext';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';

export default function LogicEditor({ rules, processName }) {
    const { setRelations } = useGlobal()
    const [open, setOpen] = useState(false)
    const [ops, setOps] = useState({})
    const [rel, setRel] = useState([])

    useEffect(() => {
        if (rules.length > 1) {
            setOps(prevOps => {
                const newOps = { ...prevOps };
                for (let i = 0; i < rules.length - 1; i++) {
                    if (!(i in newOps)) {
                        newOps[i] = 'or';
                    }
                }
                Object.keys(newOps).forEach(i => {
                    if (i >= rules.length - 1) {
                        delete newOps[i];
                    }
                });
                return newOps;
            });

            setRel(prevRel => {
                const newRel = [];

                for (let i = 0; i < rules.length - 1; i++) {
                    const rule1 = rules[i].ruleName;
                    const rule2 = rules[i + 1].ruleName;

                    const existing = prevRel.find(r => r.rule1 === rule1 && r.rule2 === rule2);

                    if (existing) {
                        newRel.push(existing);
                    } else {
                        newRel.push({ rule1, rule2, op: 'or' });
                    }
                }

                return newRel;
            });
        } else {
            setOps({});
            setRel([]);
        }
    }, [rules]);

    const handleSubmit = (e) => {
        e.preventDefault()
    }

    const LogicSelect = ({ rule1, rule2, index }) => {
        return (<Select
            sx={{ width: '6rem' }}
            value={ops[index] || 'or'}
            onChange={(e, newValue) => {
                setOps(prev => ({...prev, [index]: newValue}))
                setRel(prev => {
                    const existing = prev.find(r => r.rule1 === rule1 && r.rule2 === rule2);
                    if (existing) {
                        return prev.map(r =>
                            r.rule1 === rule1 && r.rule2 === rule2
                                ? { ...r, op: newValue }
                                : r
                        );
                    } else {
                        return [...prev, { rule1, rule2, op: newValue }];
                    }
                });
            }}
        >
            <Option value='and'>AND</Option>
            <Option value='or'>OR</Option>
        </Select>)
    }

    const buildExpressionTree = (rel) => {
        const precedence = { and: 2, or: 1 };

        const outputStack = [];
        const operatorStack = [];

        const applyOp = () => {
            const { op, rule1, rule2 } = operatorStack.pop();
            const left = typeof rule1 === 'string' ? rule1 : outputStack.pop();
            const right = typeof rule2 === 'string' ? rule2 : outputStack.pop();

            outputStack.push({
                op,
                left,
                right,
            });
        };

        for (const r of rel) {
            while (
                operatorStack.length > 0 &&
                precedence[operatorStack[operatorStack.length - 1].op] >= precedence[r.op]
            ) {
                applyOp();
            }
            operatorStack.push(r);
        }

        while (operatorStack.length > 0) {
            applyOp();
        }

        return outputStack[0];
    }

    const handleSave = (processName) => {
        setOpen(false)
        setRelations(prev => ({
            ...prev,
            [processName]: buildExpressionTree(rel)
        }))
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
                                                    rule1={rule.ruleName} 
                                                    rule2={rules[index+1].ruleName}
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