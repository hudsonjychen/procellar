import { Box, ButtonGroup, IconButton, Card, Chip, Divider, Sheet, Stack, Typography } from "@mui/joy";
import { ActivityIcon, ObjectIcon } from "../CustomIcons";
import LogicEditor from "./LogicEditor";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { grey } from '@mui/material/colors';
import { useGlobal } from '../GlobalContext';

const demoProcessData = [
    {
        "processName": "order management",
        "justCreated": true,
        "rules": [
            {
                "ruleName": "rule1",
                "parentProcess": "order management",
                "includeOT": {
                    "entities": ["order", "item"],
                    "condition": []
                },
                "includeAct": {
                    "entities": [],
                    "condition": []
                },
                "excludeOT": {
                    "entities": ["shipment"],
                    "condition": []
                },
                "excludeAct": {
                    "entities": ["order cancelled"],
                    "condition": []
                }
            },
            {
                "ruleName": "rule2",
                "parentProcess": "order management",
                "includeOT": {
                    "entities": ["order", "shipment"],
                    "condition": []
                },
                "includeAct": {
                    "entities": [],
                    "condition": []
                },
                "excludeOT": {
                    "entities": [],
                    "condition": []
                },
                "excludeAct": {
                    "entities": ["shipment delayed"],
                    "condition": []
                }
            },
            {
                "ruleName": "rule3",
                "parentProcess": "order management",
                "includeOT": {
                    "entities": [],
                    "condition": []
                },
                "includeAct": {
                    "entities": ["order placed"],
                    "condition": []
                },
                "excludeOT": {
                    "entities": [],
                    "condition": []
                },
                "excludeAct": {
                    "entities": [],
                    "condition": []
                }
            }
        ],
        "relations": [],
        "relationTree": {}
    },
    {
        "processName": "shipment management",
        "rules": [
            {
                "ruleName": "rule1",
                "parentProcess": "shipment management",
                "includeOT": {
                    "entities": ["shipment"],
                    "condition": []
                },
                "includeAct": {
                    "entities": [],
                    "condition": []
                },
                "excludeOT": {
                    "entities": [],
                    "condition": []
                },
                "excludeAct": {
                    "entities": ["order cancelled"],
                    "condition": []
                }
            },
            {
                "ruleName": "rule2",
                "parentProcess": "shipment management",
                "includeOT": {
                    "entities": [],
                    "condition": []
                },
                "includeAct": {
                    "entities": ["shipment delayed"],
                    "condition": []
                },
                "excludeOT": {
                    "entities": [],
                    "condition": []
                },
                "excludeAct": {
                    "entities": [],
                    "condition": []
                }
            }
        ],
        "relations": [],
        "relationTree": {}
    }
]

export default function Main() {
    const { processData, setProcessData } = useGlobal()

    const handleDelete = ({ ruleName, parentProcess }) => {
        setProcessData(prev => {
            return prev.map(process => {
                if (process.processName === parentProcess) {
                    return {
                        ...process,
                        rules: process.rules.filter(rule => rule.ruleName != ruleName),
                    }
                } else {
                    return process
                }
            })
        })
    }

    const cleanEmptyProcess = (setProcessData) => {
        setProcessData(prev => {
            return prev.filter(process => process.rules.length != 0)
        })
    }

    const ButtonBar = ({ ruleName, parentProcess }) => {
        return (
            <ButtonGroup 
                orientation="vertical"
                variant="plain"
            >
                <IconButton>
                    <EditIcon sx={{ color: grey[600] }}/>
                </IconButton>
                <IconButton 
                    onClick={() => {
                        handleDelete({ ruleName: ruleName, parentProcess: parentProcess });
                        cleanEmptyProcess(setProcessData)
                    }}
                >
                    <DeleteIcon sx={{ color: grey[600] }}/>
                </IconButton>
            </ButtonGroup>
        )
    }

    const RuleCard = ({ rule }) => {
        return (
            <Box
                sx={{
                    display: 'flex',
                    direction: 'row',
                    justifyContent: 'flex-start',
                    gap: 2
                }}
            >
                <Card 
                    variant="soft" 
                    sx={{
                        display: 'flex',
                        direction: 'column',
                        alignItems: 'flex-start',
                        width: '91%',
                        bgcolor: 'white', 
                        boxShadow: 'md',
                        borderRadius: 'xl',
                        overflow: 'hidden',
                        p: 2,
                        pb: 3,
                        mb: 1.6
                    }}
                >
                    <Box sx={{ ml: 1}}>
                        <Typography level="title-lg">
                            Rule: {rule.ruleName}
                        </Typography>
                    </Box>
                    {/* include object type section */}
                    {rule.includeOT.entities.length > 0 && (
                        <Stack direction='row' spacing={1} m={1} mb={-1}>
                            <Box sx={{ display: 'flex', width: 162 }}>
                                <Typography level="title-md" color="neutral">
                                    Include
                                </Typography>
                            </Box>
                            {
                                rule.includeOT.entities.map((entity, index) => (
                                    <Chip
                                        key={entity}
                                        variant="outlined"
                                        size="lg" 
                                        startDecorator={<ObjectIcon />}
                                        sx={{ 
                                            border: '1.6px solid',
                                            fontWeight: 'bold', 
                                            borderColor: 'success.300',
                                            color: 'success.500',
                                            backgroundColor: 'transparent'
                                        }}
                                    >
                                        {entity}
                                    </Chip>
                                ))
                            }
                        </Stack>
                    )}
                    {/* include activity section */}
                    {rule.includeAct.entities.length > 0 && (
                        <Stack direction='row' spacing={1} m={1} mb={-1}>
                            <Box sx={{ display: 'flex', width: 162 }}>
                                <Typography level="title-md" color="neutral">
                                    Include
                                </Typography>
                            </Box>
                            {
                                rule.includeAct.entities.map((entity) => (
                                    <Chip
                                        key={entity}
                                        variant="outlined"
                                        size="lg" 
                                        startDecorator={<ActivityIcon />}
                                        sx={{ 
                                            border: '1.6px solid',
                                            fontWeight: 'bold', 
                                            borderColor: 'success.300',
                                            color: 'success.500',
                                            backgroundColor: 'transparent'
                                        }}
                                    >
                                        {entity}
                                    </Chip>
                                ))
                            }
                        </Stack>
                    )}
                    {/* exclude object type section */}
                    {rule.excludeOT.entities.length > 0 && (
                        <Stack direction='row' spacing={1} m={1} mb={-1}>
                            <Box sx={{ display: 'flex', width: 162 }}>
                                <Typography level="title-md" color="neutral">
                                    Exclude
                                </Typography>
                            </Box>
                            {
                                rule.excludeOT.entities.map((entity) => (
                                    <Chip
                                        key={entity}
                                        variant="outlined"
                                        size="lg" 
                                        startDecorator={<ObjectIcon />}
                                        sx={{ 
                                            border: '1.6px solid',
                                            fontWeight: 'bold', 
                                            borderColor: 'danger.300',
                                            color: 'danger.500',
                                            backgroundColor: 'transparent'
                                        }}
                                    >
                                        {entity}
                                    </Chip>
                                ))
                            }
                        </Stack>
                    )}
                    {/* exclude activiy section */}
                    {rule.excludeAct.entities.length > 0 && (
                        <Stack direction='row' spacing={1} m={1} mb={-1}>
                            <Box sx={{ display: 'flex', width: 162 }}>
                                <Typography level="title-md" color="neutral">
                                    Exclude
                                </Typography>
                            </Box>
                            {
                                rule.excludeAct.entities.map((entity) => (
                                    <Chip
                                        key={entity}
                                        variant="outlined"
                                        size="lg"
                                        startDecorator={<ActivityIcon />}
                                        sx={{
                                            border: '1.6px solid',
                                            fontWeight: 'bold', 
                                            borderColor: 'danger.300',
                                            color: 'danger.500',
                                            backgroundColor: 'transparent'
                                        }}
                                    >
                                        {entity}
                                    </Chip>
                                ))
                            }
                        </Stack>
                    )}
                </Card>
                <ButtonBar ruleName={rule.ruleName} parentProcess={rule.parentProcess}/>
            </Box>
        )
    }

    const ProcessCard = ({ process }) => {
        return (
            <Box 
                sx={{
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                }}
            >
                <Box
                    sx={{
                        display: 'flex', 
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                    }}
                >
                    <LogicEditor 
                        rules={process.rules}
                    />
                    <Typography level='h4' sx={{ pl: 1, mb: 1 }}>
                        Process: {process.processName}
                    </Typography>
                </Box>
                <Box sx={{ width: '100%' }}>
                    {
                        process.rules.map((rule) => (
                            <RuleCard key={rule.ruleName} rule={rule} />    
                        )) 
                    }
                </Box>
                <Divider sx={{ width: '100%', mt: 2, mb: 2 }}/>
            </Box>
        )
    }

    return (
        <Sheet
            variant="plain"
            color="neutral"
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                p: 2.5,
                overflowY: 'auto',
                overflowX: 'hidden'
            }}
        >
            <Box sx={{ mb: -1 }}>
                <Typography sx={{ fontSize: 22, fontWeight: 'bold', p: 1.2 }}> Process View List </Typography>
            </Box>
            <Box sx={{ p: 1.2, width: '100%' }}>
                {
                    processData.map((process) => (
                        <ProcessCard key={process.processName} process={process} />
                    ))
                }
            </Box>
        </Sheet>
    )
}