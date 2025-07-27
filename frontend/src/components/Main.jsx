import { Box, ButtonGroup, IconButton, Card, Chip, Divider, Sheet, Stack, Typography } from "@mui/joy";
import { ActivityIcon, AttributeIcon, ObjectIcon } from "../CustomIcons";
import LogicEditor from "./LogicEditor";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import { grey } from '@mui/material/colors';
import { useGlobal } from '../GlobalContext';

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
                        console.log(processData)
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
                        mb: 1.6,
                        overflowX: 'auto'
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
                    {/* include object type condition section */}
                    {rule.includeOT.condition.length > 0 && (
                        <Box>
                            {   
                                rule.includeOT.condition.map((cond, index) => (
                                    <Stack direction='row' spacing={1} ml={22.3} mb={0.2}>
                                        <Chip
                                            key={index}
                                            variant="outlined"
                                            size="md" 
                                            startDecorator={<FilterAltOutlinedIcon />}
                                            sx={{ 
                                                border: '1.6px solid',
                                                fontWeight: 'bold', 
                                                borderColor: 'neutral.300',
                                                color: 'neutral.500',
                                                backgroundColor: 'transparent'
                                            }}
                                        >
                                            <Chip
                                                key={index}
                                                variant="outlined"
                                                size="md" 
                                                startDecorator={<ObjectIcon />}
                                                sx={{ 
                                                    border: '1.6px solid',
                                                    fontWeight: 'bold', 
                                                    borderColor: 'transparent',
                                                    color: 'neutral.500',
                                                    backgroundColor: 'transparent'
                                                }}
                                            >
                                                {cond.entity}
                                            </Chip>
                                            <Chip
                                                key={index}
                                                variant="outlined"
                                                size="md" 
                                                startDecorator={<AttributeIcon />}
                                                sx={{ 
                                                    border: '1.6px solid',
                                                    fontWeight: 'bold', 
                                                    borderColor: 'transparent',
                                                    color: 'neutral.500',
                                                    backgroundColor: 'transparent'
                                                }}
                                            >
                                                {cond.attribute}
                                            </Chip>
                                            <Chip
                                                key={index}
                                                variant="outlined"
                                                size="md"
                                                sx={{ 
                                                    border: '1.6px solid',
                                                    fontWeight: 'bold', 
                                                    borderColor: 'transparent',
                                                    color: 'neutral.500',
                                                    backgroundColor: 'transparent'
                                                }}
                                            >
                                                {cond.operator + ' ' + cond.value}
                                            </Chip>
                                        </Chip>
                                    </Stack>
                                ))
                            }
                        </Box>
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
                    {/* include activity condition section */}
                    {rule.includeAct.condition.length > 0 && (
                        <Box>
                            {   
                                rule.includeAct.condition.map((cond, index) => (
                                    <Stack direction='row' spacing={1} ml={22.3} mb={0.2}>
                                        <Chip
                                            key={index}
                                            variant="outlined"
                                            size="md" 
                                            startDecorator={<FilterAltOutlinedIcon />}
                                            sx={{ 
                                                border: '1.6px solid',
                                                fontWeight: 'bold', 
                                                borderColor: 'neutral.300',
                                                color: 'neutral.500',
                                                backgroundColor: 'transparent'
                                            }}
                                        >
                                            <Chip
                                                key={index}
                                                variant="outlined"
                                                size="md" 
                                                startDecorator={<ActivityIcon />}
                                                sx={{ 
                                                    border: '1.6px solid',
                                                    fontWeight: 'bold', 
                                                    borderColor: 'transparent',
                                                    color: 'neutral.500',
                                                    backgroundColor: 'transparent'
                                                }}
                                            >
                                                {cond.entity}
                                            </Chip>
                                            <Chip
                                                key={index}
                                                variant="outlined"
                                                size="md" 
                                                startDecorator={<AttributeIcon />}
                                                sx={{ 
                                                    border: '1.6px solid',
                                                    fontWeight: 'bold', 
                                                    borderColor: 'transparent',
                                                    color: 'neutral.500',
                                                    backgroundColor: 'transparent'
                                                }}
                                            >
                                                {cond.attribute}
                                            </Chip>
                                            <Chip
                                                key={index}
                                                variant="outlined"
                                                size="md"
                                                sx={{ 
                                                    border: '1.6px solid',
                                                    fontWeight: 'bold', 
                                                    borderColor: 'transparent',
                                                    color: 'neutral.500',
                                                    backgroundColor: 'transparent'
                                                }}
                                            >
                                                {cond.operator + ' ' + cond.value}
                                            </Chip>
                                        </Chip>
                                    </Stack>
                                ))
                            }
                        </Box>
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
                    {/* exclude object type condition section */}
                    {rule.excludeOT.condition.length > 0 && (
                        <Box>
                            {   
                                rule.excludeOT.condition.map((cond, index) => (
                                    <Stack direction='row' spacing={1} ml={22.3} mb={0.2}>
                                        <Chip
                                            key={index}
                                            variant="outlined"
                                            size="md" 
                                            startDecorator={<FilterAltOutlinedIcon />}
                                            sx={{ 
                                                border: '1.6px solid',
                                                fontWeight: 'bold', 
                                                borderColor: 'neutral.300',
                                                color: 'neutral.500',
                                                backgroundColor: 'transparent'
                                            }}
                                        >
                                            <Chip
                                                key={index}
                                                variant="outlined"
                                                size="md" 
                                                startDecorator={<ObjectIcon />}
                                                sx={{ 
                                                    border: '1.6px solid',
                                                    fontWeight: 'bold', 
                                                    borderColor: 'transparent',
                                                    color: 'neutral.500',
                                                    backgroundColor: 'transparent'
                                                }}
                                            >
                                                {cond.entity}
                                            </Chip>
                                            <Chip
                                                key={index}
                                                variant="outlined"
                                                size="md" 
                                                startDecorator={<AttributeIcon />}
                                                sx={{ 
                                                    border: '1.6px solid',
                                                    fontWeight: 'bold', 
                                                    borderColor: 'transparent',
                                                    color: 'neutral.500',
                                                    backgroundColor: 'transparent'
                                                }}
                                            >
                                                {cond.attribute}
                                            </Chip>
                                            <Chip
                                                key={index}
                                                variant="outlined"
                                                size="md"
                                                sx={{ 
                                                    border: '1.6px solid',
                                                    fontWeight: 'bold', 
                                                    borderColor: 'transparent',
                                                    color: 'neutral.500',
                                                    backgroundColor: 'transparent'
                                                }}
                                            >
                                                {cond.operator + ' ' + cond.value}
                                            </Chip>
                                        </Chip>
                                    </Stack>
                                ))
                            }
                        </Box>
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
                    {/* exclude activity condition section */}
                    {rule.excludeAct.condition.length > 0 && (
                        <Box>
                            {   
                                rule.excludeAct.condition.map((cond, index) => (
                                    <Stack direction='row' spacing={1} ml={22.3} mb={0.2}>
                                        <Chip
                                            key={index}
                                            variant="outlined"
                                            size="md" 
                                            startDecorator={<FilterAltOutlinedIcon />}
                                            sx={{ 
                                                border: '1.6px solid',
                                                fontWeight: 'bold', 
                                                borderColor: 'neutral.300',
                                                color: 'neutral.500',
                                                backgroundColor: 'transparent'
                                            }}
                                        >
                                            <Chip
                                                key={index}
                                                variant="outlined"
                                                size="md" 
                                                startDecorator={<ActivityIcon />}
                                                sx={{ 
                                                    border: '1.6px solid',
                                                    fontWeight: 'bold', 
                                                    borderColor: 'transparent',
                                                    color: 'neutral.500',
                                                    backgroundColor: 'transparent'
                                                }}
                                            >
                                                {cond.entity}
                                            </Chip>
                                            <Chip
                                                key={index}
                                                variant="outlined"
                                                size="md" 
                                                startDecorator={<AttributeIcon />}
                                                sx={{ 
                                                    border: '1.6px solid',
                                                    fontWeight: 'bold', 
                                                    borderColor: 'transparent',
                                                    color: 'neutral.500',
                                                    backgroundColor: 'transparent'
                                                }}
                                            >
                                                {cond.attribute}
                                            </Chip>
                                            <Chip
                                                key={index}
                                                variant="outlined"
                                                size="md"
                                                sx={{ 
                                                    border: '1.6px solid',
                                                    fontWeight: 'bold', 
                                                    borderColor: 'transparent',
                                                    color: 'neutral.500',
                                                    backgroundColor: 'transparent'
                                                }}
                                            >
                                                {cond.operator + ' ' + cond.value}
                                            </Chip>
                                        </Chip>
                                    </Stack>
                                ))
                            }
                        </Box>
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
                        processName={process.processName}
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