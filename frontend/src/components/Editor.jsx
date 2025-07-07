import { IconButton, DialogTitle, Divider, Input, Modal, ModalDialog, Box, Stack, Typography, Button } from "@mui/joy";
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import Add from '@mui/icons-material/Add';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import { useState } from "react";
import { useGlobal } from '../GlobalContext';
import Select from '@mui/joy/Select'
import Option from '@mui/joy/Option'

export default function Editor() {
    const { setProcesses, objectTypes, activities } = useGlobal()
    const [open1, setOpen1] = useState(false)
    const [open2, setOpen2] = useState(false)
    const [items1, setItems1] = useState([0]);
    const [items2, setItems2] = useState([0]);
    const [ruleData, setRuleData] = useState({
        processName: '',
        ruleName: '',
        includeObjectTypes: [],
        includeActivities: [],
        excludeObjectTypes: [],
        excludeActivities: []
    })

    const placeholderMap = {
        objectTypes: 'Object Types...',
        activities: 'Activities...',
        entity: 'Entity...',
        attribute: 'Attribute...',
        operator: 'Operator...'
    }

    const handleSubmit = (e) => {
        e.preventDefault()
    }

    const handleSave1 = () => {
        setProcesses(prev => ([...prev, ruleData]))
        setOpen1(false)
    }

    {/* for demo */}
    const handleSave2 = () => {
        setOpen2(false)
    }

    const AddButton = ({ setItems }) => {
        return (
            <IconButton
                size="sm"
                sx={{ 
                    borderRadius: '50%',
                    backgroundColor: 'neutral',
                }}
                onClick={() => {
                    setItems(prev => [...prev, Date.now()])
                }} 
            >
                <Add />
            </IconButton>
        )
    }

    const ConditionEditor = ({ onDelete }) => {
        return (
            <Stack
                direction='row' 
                justifyContent='space-between' 
                alignItems='center'
                spacing={1}
                sx={{ pt: 1, pb: 1 }}
            >
                <Box sx={{ width: 42, pl: 3 }}>
                    <FilterAltOutlinedIcon />
                </Box>
                <Select
                    multiple
                    placeholder={placeholderMap['entity'] || 'Select...'}
                    size="sm"
                    sx={{ width: '8rem' }}
                    onChange={
                        (e, newValue) => {
                            setRuleData(prev => ({ ...prev, ['includeObjectTypes']: newValue}))
                        }
                    }
                >
                    {objectTypes.map((item) => (
                        <Option key={item} value={item}>{item}</Option>
                    ))}
                </Select>
                <Select
                    multiple
                    placeholder={placeholderMap['attribute'] || 'Select...'}
                    size="sm"
                    sx={{ width: '8rem' }}
                    onChange={
                        (e, newValue) => {
                            setRuleData(prev => ({ ...prev, ['includeObjectTypes']: newValue}))
                        }
                    }
                >
                    {objectTypes.map((item) => (
                        <Option key={item} value={item}>{item}</Option>
                    ))}
                </Select>
                <Select
                    multiple
                    placeholder={placeholderMap['operator'] || 'Select...'}
                    size="sm"
                    sx={{ width: '8rem' }}
                    onChange={
                        (e, newValue) => {
                            setRuleData(prev => ({ ...prev, ['includeObjectTypes']: newValue}))
                        }
                    }
                >
                    {objectTypes.map((item) => (
                        <Option key={item} value={item}>{item}</Option>
                    ))}
                </Select>
                <Input 
                    placeholder="Complete the condition..."
                    name="condition"
                    sx={{ width: '8rem'}}
                    onChange={(e) => {
                        setRuleData(prev => ({ ...prev, [e.target.name]: e.target.value}))
                    }}
                />
                <IconButton
                    size="sm"
                    sx={{ 
                        borderRadius: '50%',
                        backgroundColor: 'neutral',
                    }}
                    onClick={onDelete}
                >
                    <DeleteOutlineOutlinedIcon />
                </IconButton>
            </Stack>
        )
    }

    const ConditionList = ({ items, setItems }) => {
        const handleDelete = (index) => {
            setItems(prev => prev.filter((_, i) => i !== index));
        };

        return (
            <Box>
                {items.map((id, index) => (
                    <ConditionEditor
                        key={id}
                        onDelete={() => handleDelete(index)}
                    />
                ))}
            </Box>
        );
    }

    return (
        <Box>
            <Button 
                size="large"
                variant="soft"
                color="neutral"
                startDecorator={<Add />} 
                sx={{
                    width: '160px',
                    height: '62px',
                    borderRadius: 'xl',
                    bgcolor: 'white',
                        '&:hover': {bgcolor: 'neutral.100'},
                    position: 'fixed',
                    right: '68px',
                    bottom: '68px',
                    boxShadow: '0px 4px 10px rgba(0,0,0,0.3)',
                    fontSize: '120',
                    fontWeight: 'bold',
                    "--Button-gap": "12px" 
                }}
                onClick={() => setOpen1(true)}
            >
                Add New
            </Button>

            {/* standard process editor */}
            <Modal open={open1} onClose={() => setOpen1(false)}>
                <ModalDialog sx={{ overflowY: 'auto' }}>
                    <DialogTitle sx={{ fontSize: 22, fontWeight: 'bold', ml: 2, mt: 2 }}>
                        Process Editor
                    </DialogTitle>
                    <form onSubmit={handleSubmit}>
                        <Box sx={{ m: 2, width: 380 }}>
                            <Stack 
                                direction='row' 
                                justifyContent='space-between' 
                                alignItems='center' 
                                sx={{ pt: 1, pb: 1 }}
                            >
                                <Typography level="title-md"> Process name </Typography>
                                <Input 
                                    placeholder="Enter process name..." 
                                    name="processName"
                                    onChange={(e) => {
                                        setRuleData(prev => ({ ...prev, [e.target.name]: e.target.value}))
                                    }}
                                />
                            </Stack>
                            <Stack 
                                direction='row' 
                                justifyContent='space-between' 
                                alignItems='center' 
                                sx={{ pt: 1, pb: 1 }}
                            >
                                <Typography level="title-md"> Rule name </Typography>
                                <Input 
                                    placeholder="Enter rule name..."
                                    name="ruleName"
                                    onChange={(e) => {
                                        setRuleData(prev => ({ ...prev, [e.target.name]: e.target.value}))
                                    }}
                                />
                            </Stack>
                        </Box>
                        <Divider sx={{ m: 2 }}/>
                        <Box sx={{ m: 2 }}>
                            <Stack 
                                direction='row' 
                                justifyContent='flex-start' 
                                alignItems='center'
                                spacing={2} 
                                sx={{ pt: 1, pb: 1 }}
                            >
                                <Box sx={{ width: 86 }}>
                                    <Typography level="title-md"> Include </Typography>
                                </Box>
                                <Select
                                    multiple
                                    placeholder={placeholderMap['objectTypes'] || 'Select...'}
                                    sx={{ width: '12rem' }}
                                    onChange={
                                        (e, newValue) => {
                                            setRuleData(prev => ({ ...prev, ['includeObjectTypes']: newValue}))
                                        }
                                    }
                                >
                                    {objectTypes.map((item) => (
                                        <Option key={item} value={item}>{item}</Option>
                                    ))}
                                </Select>
                                <Select
                                    multiple
                                    placeholder={placeholderMap['activities'] || 'Select...'}
                                    sx={{ width: '12rem' }}
                                    onChange={
                                        (e, newValue) => {
                                            setRuleData(prev => ({ ...prev, ['includeActivities']: newValue}))
                                        }
                                    }
                                >
                                    {activities.map((item) => (
                                        <Option key={item} value={item}>{item}</Option>
                                    ))}
                                </Select>
                            </Stack>
                            <Stack 
                                direction='row' 
                                justifyContent='flex-start' 
                                alignItems='center'
                                spacing={2} 
                                sx={{ pt: 1, pb: 1 }}
                            >
                                <Box  sx={{ width: 86 }}>
                                    <Typography level="title-md"> Exclude </Typography>
                                </Box>
                                <Select
                                    multiple
                                    placeholder={placeholderMap['objectTypes'] || 'Select...'}
                                    sx={{ width: '12rem' }}
                                    onChange={
                                        (e, newValue) => {
                                            setRuleData(prev => ({ ...prev, ['excludeObjectTypes']: newValue}))
                                        }
                                    }
                                >
                                    {objectTypes.map((item) => (
                                        <Option key={item} value={item}>{item}</Option>
                                    ))}
                                </Select>
                                <Select
                                    multiple
                                    placeholder={placeholderMap['activities'] || 'Select...'}
                                    sx={{ width: '12rem' }}
                                    onChange={
                                        (e, newValue) => {
                                            setRuleData(prev => ({ ...prev, ['excludeActivities']: newValue}))
                                        }
                                    }
                                >
                                    {activities.map((item) => (
                                        <Option key={item} value={item}>{item}</Option>
                                    ))}
                                </Select>
                            </Stack>
                        </Box>
                        <Divider sx={{ m: 2 }}/>
                        <Box sx={{ m: 2 }}>
                            <Button 
                                variant="plain"
                                color="primary"
                                disableRipple
                                sx={{
                                    p: 0,
                                    m: 0,
                                    minWidth: 'unset',
                                    background: 'none',
                                    fontWeight: 'bold',
                                    textDecoration: 'underline',
                                    '&:hover': {
                                        background: 'none',
                                        textDecoration: 'underline'
                                    }
                                }}
                                onClick={() => {
                                    setOpen1(false);
                                    setOpen2(true);
                                }}
                            >
                                Open Advanced Process Editor
                            </Button>
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
                                onClick={() => setOpen1(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                sx={{ width: 126 }}
                                onClick={handleSave1}
                            >
                                Save
                            </Button>
                        </Stack>
                    </form>
                </ModalDialog>
            </Modal>
            
            {/* advanced process editor */}
            <Modal open={open2} onClose={() => setOpen2(false)}>
                <ModalDialog sx={{ overflowY: 'auto' }}>
                    <DialogTitle sx={{ fontSize: 22, fontWeight: 'bold', ml: 2, mt: 2 }}>
                        Advanced Process Editor
                    </DialogTitle>
                    <form onSubmit={handleSubmit}>
                        {/* name input */}
                        <Box sx={{ m: 2, width: 460 }}>
                            <Stack 
                                direction='row' 
                                justifyContent='space-between' 
                                alignItems='center' 
                                sx={{ pt: 1, pb: 1 }}
                            >
                                <Typography level="title-md"> Process name </Typography>
                                <Input 
                                    placeholder="Enter process name..." 
                                    name="processName"
                                    sx={{ width: '16rem'}}
                                    onChange={(e) => {
                                        setRuleData(prev => ({ ...prev, [e.target.name]: e.target.value}))
                                    }}
                                />
                            </Stack>
                            <Stack 
                                direction='row' 
                                justifyContent='space-between' 
                                alignItems='center' 
                                sx={{ pt: 1, pb: 1 }}
                            >
                                <Typography level="title-md"> Rule name </Typography>
                                <Input 
                                    placeholder="Enter rule name..."
                                    name="ruleName"
                                    sx={{ width: '16rem'}}
                                    onChange={(e) => {
                                        setRuleData(prev => ({ ...prev, [e.target.name]: e.target.value}))
                                    }}
                                />
                            </Stack>
                        </Box>
                        <Divider sx={{ m: 2 }}/>
                        {/* entities editor */}
                        <Box sx={{ m: 2 }}>
                            <Stack 
                                direction='row' 
                                justifyContent='flex-start' 
                                alignItems='center'
                                spacing={2} 
                                sx={{ pt: 1, pb: 1 }}
                            >
                                <Box sx={{ width: 126 }}>
                                    <Typography level="title-md"> Include </Typography>
                                </Box>
                                <Select
                                    multiple
                                    placeholder={placeholderMap['objectTypes'] || 'Select...'}
                                    sx={{ width: '16rem' }}
                                    onChange={
                                        (e, newValue) => {
                                            setRuleData(prev => ({ ...prev, ['includeObjectTypes']: newValue}))
                                        }
                                    }
                                >
                                    {objectTypes.map((item) => (
                                        <Option key={item} value={item}>{item}</Option>
                                    ))}
                                </Select>
                                <Select
                                    multiple
                                    placeholder={placeholderMap['activities'] || 'Select...'}
                                    sx={{ width: '16rem' }}
                                    onChange={
                                        (e, newValue) => {
                                            setRuleData(prev => ({ ...prev, ['includeActivities']: newValue}))
                                        }
                                    }
                                >
                                    {activities.map((item) => (
                                        <Option key={item} value={item}>{item}</Option>
                                    ))}
                                </Select>
                                <AddButton setItems={setItems1} />
                            </Stack>
                            {/* advanced condition editor */}
                            <ConditionList items={items1} setItems={setItems1} />
                            <Stack 
                                direction='row' 
                                justifyContent='flex-start' 
                                alignItems='center'
                                spacing={2} 
                                sx={{ mt: 2, pt: 1, pb: 1 }}
                            >
                                <Box  sx={{ width: 126 }}>
                                    <Typography level="title-md"> Exclude </Typography>
                                </Box>
                                <Select
                                    multiple
                                    placeholder={placeholderMap['objectTypes'] || 'Select...'}
                                    sx={{ width: '16rem' }}
                                    onChange={
                                        (e, newValue) => {
                                            setRuleData(prev => ({ ...prev, ['excludeObjectTypes']: newValue}))
                                        }
                                    }
                                >
                                    {objectTypes.map((item) => (
                                        <Option key={item} value={item}>{item}</Option>
                                    ))}
                                </Select>
                                <Select
                                    multiple
                                    placeholder={placeholderMap['activities'] || 'Select...'}
                                    sx={{ width: '16rem' }}
                                    onChange={
                                        (e, newValue) => {
                                            setRuleData(prev => ({ ...prev, ['excludeActivities']: newValue}))
                                        }
                                    }
                                >
                                    {activities.map((item) => (
                                        <Option key={item} value={item}>{item}</Option>
                                    ))}
                                </Select>
                                <AddButton setItems={setItems2} />
                            </Stack>
                            {/* advanced condition editor */}
                            <ConditionList items={items2} setItems={setItems2} />
                        </Box>
                        <Divider sx={{ m: 2 }}/>
                        <Box sx={{ m: 2 }}>
                            <Button 
                                variant="plain"
                                color="primary"
                                disableRipple
                                sx={{
                                    p: 0,
                                    m: 0,
                                    minWidth: 'unset',
                                    background: 'none',
                                    fontWeight: 'bold',
                                    textDecoration: 'underline',
                                    '&:hover': {
                                        background: 'none',
                                        textDecoration: 'underline'
                                    }
                                }}
                                onClick={() => {
                                    setOpen1(true);
                                    setOpen2(false);
                                }}
                            >
                                Go Back to Process Editor
                            </Button>
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
                                onClick={() => setOpen1(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                sx={{ width: 126 }}
                                onClick={handleSave2}
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