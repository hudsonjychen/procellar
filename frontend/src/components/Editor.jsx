import { IconButton, DialogTitle, Divider, Autocomplete, AutocompleteOption, ListItemDecorator, Input, Modal, ModalDialog, Box, Stack, Typography, Button } from "@mui/joy";
import { createFilterOptions } from '@mui/joy/Autocomplete';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import Add from '@mui/icons-material/Add';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import { useEffect, useState } from "react";
import { useGlobal } from '../GlobalContext';
import Select from '@mui/joy/Select'
import Option from '@mui/joy/Option'

const RuleNameInput = ({ ruleData, setRuleData }) => (
    <Input 
        placeholder="Enter rule name..."
        value={ruleData.ruleName}
        onChange={(e) => {
            setRuleData(prev => ({ ...prev, ruleName: e.target.value}))
        }}
    />
)

const operatorMap = {
    string: ['===', '!=='],
    number: ['===', '!==', '>', '>=', '<', '<='],
    boolean: ['===', '!=='],
    array: ['included in', 'not included in']
}

const demoAttributeMap = [
    {
        entityName: 'order',
        entityType: 'objectType',
        attributes: [
            {
                attributeName: "total-items",
                attributeType: "integer"
            },
            {
                attributeName: "order-id",
                attributeType: "string"
            }
        ]
    }
]

const placeholderMap = {
    objectTypes: 'Object Types...',
    activities: 'Activities...',
    entity: 'Entity...',
    attribute: 'Attribute...',
    operator: 'Operator...'
}

export default function Editor() {
    const { setProcessData, processAcList, setProcessAcList, setProcesses, objectTypes, activities, attrMap } = useGlobal()
    const [open1, setOpen1] = useState(false)
    const [open2, setOpen2] = useState(false)
    const [items1, setItems1] = useState([0])
    const [items2, setItems2] = useState([0])

    const [processAcName, setProcessAcName] = useState(null)

    const [selectedEntities, setSelectedEntities] = useState({
        includeOT: [],
        includeAct: [],
        excludeOT: [],
        excludeAct: []
    })

    const [ruleData, setRuleData] = useState({
        ruleName: '',
        parentProcess: '',
        includeOT: {
            entities: [],
            condition: []
        },
        includeAct: {
            entities: [],
            condition: []
        },
        excludeOT: {
            entities: [],
            condition: []
        },
        excludeAct: {
            entities: [],
            condition: []
        }
    })

    const allEmpty =
        ruleData.includeOT.entities.length === 0 &&
        ruleData.includeAct.entities.length === 0 &&
        ruleData.excludeOT.entities.length === 0 &&
        ruleData.excludeAct.entities.length === 0;

    const filter = createFilterOptions();

    const handleSubmit = (e) => {
        e.preventDefault()
    }

    const clearEditor = () => {
        setRuleData({
            ruleName: '',
            parentProcess: '',
            includeOT: {
                entities: [],
                condition: []
            },
            includeAct: {
                entities: [],
                condition: []
            },
            excludeOT: {
                entities: [],
                condition: []
            },
            excludeAct: {
                entities: [],
                condition: []
            }
        })

        setSelectedEntities({
            includeOT: [],
            includeAct: [],
            excludeOT: [],
            excludeAct: []
        })
    }

    const handleCancel1 = () => {
        setOpen1(false)
        clearEditor()
    }

    const handleSave1 = () => {
        {/* update processes and process list for autocomplete component */}
        const originalProcessList = processAcList.map(item => item.title)
        if (!originalProcessList.includes(processAcName.title)) {
            setProcesses(prev => ([...prev, {name: processAcName.title, justCreated: true}]))
            setProcessAcList(prev => ([...prev, processAcName]))
        }

        const { title } = processAcName
        const updatedRuleData = {
            ...ruleData,
            parentProcess: title
        }
        setRuleData(updatedRuleData);
        if (updatedRuleData.ruleName && updatedRuleData.parentProcess) {
            setProcessData(prev => {
                const existingIndex = prev.findIndex(
                    p => p.processName === title
                )
                if (existingIndex !== -1) {
                    const updatedProcesses = [...prev]
                    const existingProcess = updatedProcesses[existingIndex];
                    updatedProcesses[existingIndex] = {
                        ...existingProcess,
                        rules: [...existingProcess.rules, updatedRuleData],
                    }
                    return updatedProcesses;
                } else {
                    return [
                        ...prev,
                        {
                            processName: title,
                            justCreated: true,
                            rules: [updatedRuleData],
                        }
                    ]
                }
            })
            setOpen1(false)
            clearEditor()
        }        
    }

    {/* for demo */}
    const handleSave2 = () => {
        setOpen2(false)
    }

    const EditorSummary = () => (
        <Stack
            direction='row' 
            justifyContent='flex-start' 
            alignItems='flex-start'
            spacing={2} 
            sx={{ m: 2, pt: 1, pb: 1 }}
        >
            <TipsAndUpdatesOutlinedIcon />
            {
                allEmpty ? 
                <Typography>
                    Start configuring and reviewing the defined scope of the selected events in this section.
                </Typography> :
                <Typography>
                    Events involving all of <strong>{ruleData.includeOT.entities.join(', ')}</strong> or
                    classified under the one of the activity type(s) <strong>{ruleData.includeAct.entities.join(', ')}</strong> will be included. <br />
                    Events involving all of <strong>{ruleData.excludeOT.entities.join(', ')}</strong> or
                    classified under the one of the activity type(s) <strong>{ruleData.excludeAct.entities.join(', ')}</strong> will be excluded.
                </Typography>
            }
        </Stack>
    )

    const ProcessNameInput = (width) => (
        <Autocomplete
            value={processAcName}
            selectOnFocus
            clearOnBlur
            handleHomeEndKeys
            freeSolo
            options={processAcList} 
            placeholder="Enter process name..."
            sx={{ width: {width} }} 
            onChange={(e, newValue) => {
                if (typeof newValue === 'string') {
                    setProcessAcName({
                        title: newValue,
                    });
                } else if (newValue && newValue.inputValue) {
                    setProcessAcName({
                        title: newValue.inputValue,
                    });
                } else {
                    setProcessAcName(newValue);
                }
            }}
            filterOptions={(options, params) => {
                const filtered = filter(options, params);
                const { inputValue } = params;
                const isExisting = options.some((option) => inputValue === option.title);
                if (inputValue !== '' && !isExisting) {
                        filtered.push({
                        inputValue,
                        title: `Add "${inputValue}"`,
                    });
                }
                return filtered;
            }}
            getOptionLabel={(option) => {
                if (typeof option === 'string') {
                    return option;
                }
                if (option.inputValue) {
                    return option.inputValue;
                }
                return option.title;
            }}
            renderOption={(props, option) => (
                <AutocompleteOption {...props}>
                    {option.title?.startsWith('Add "') && (
                        <ListItemDecorator>
                            <Add />
                        </ListItemDecorator>
                    )}
                    {option.title}
                </AutocompleteOption>
            )}
        />
    )

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

    const ConditionEditor = ({ onDelete, action }) => {
        const [condition, setCondition] = useState({})
        const [attrOptions, setAttrOptions] = useState([])
        const [opOptions, setOpOptions] = useState([])

        useEffect(() => {
            if (condition.entity){
                const matched = attrMap.find(item => item.name === condition.entity)
                if (matched) {
                    setAttrOptions(matched.attributes)
                }
            }
        }, [condition.entity])

        useEffect(() => {
            if (condition.attribute){
                const matched = attrOptions.find(item => item.name === condition.attribute)
                if (matched) {
                    setOpOptions(operatorMap[matched.type])
                }
            }
        }, [condition.attribute])

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
                {/* entity select */}
                <Select
                    placeholder={placeholderMap['entity'] || 'Select...'}
                    size="sm"
                    sx={{ width: '8rem' }}
                    onChange={(e, newValue) => {
                        setCondition(prev => ({...prev, entity: newValue}))
                    }}
                >
                    {action === 'include' ? [...selectedEntities.includeOT, ...selectedEntities.includeAct].map((item) => (
                        <Option key={item} value={item}>{item}</Option>
                    )) : [...selectedEntities.excludeOT, ...selectedEntities.excludeAct].map((item) => (
                        <Option key={item} value={item}>{item}</Option>
                    ))}
                </Select>
                {/* attribute select */}
                <Select
                    placeholder={placeholderMap['attribute'] || 'Select...'}
                    size="sm"
                    sx={{ width: '8rem' }}
                    onChange={(e, newValue) => {
                        setCondition(prev => ({...prev, attribute: newValue}))
                    }}
                >
                    {attrOptions
                        .filter(item => item && item.name)
                        .map(item => (
                            <Option key={item.name} value={item.name}>{item.name}</Option>
                        ))
                    }
                </Select>
                {/* operator select */}
                <Select
                    placeholder={placeholderMap['operator'] || 'Select...'}
                    size="sm"
                    sx={{ width: '8rem' }}
                    onChange={(e, newValue) => {
                        setCondition(prev => ({...prev, operator: newValue}))
                    }}
                >
                    {opOptions.map(item => (
                        <Option key={item} value={item}>{item}</Option>
                    ))}
                </Select>
                <Input 
                    placeholder="value..."
                    name="condition"
                    sx={{ width: '8rem'}}
                    onChange={(e) => {
                        setCondition(prev => ({...prev, value: e.target.value}))
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

    const ConditionList = ({ items, setItems, action }) => {
        const handleDelete = (index) => {
            setItems(prev => prev.filter((_, i) => i !== index));
        };

        return (
            <Box>
                {items.map((id, index) => (
                    <ConditionEditor
                        key={id}
                        onDelete={() => handleDelete(index)}
                        action={action}
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

            {/* basic process editor */}
            <Modal open={open1} onClose={() => setOpen1(false)}>
                <ModalDialog sx={{ display: 'flex', width: '576px', overflowY: 'auto' }}>
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
                                <Box sx={{ width: '224px' }}>
                                    <ProcessNameInput width='224px' />
                                </Box>
                            </Stack>
                            <Stack 
                                direction='row' 
                                justifyContent='space-between' 
                                alignItems='center' 
                                sx={{ pt: 1, pb: 1 }}
                            >
                                <Typography level="title-md"> Rule name </Typography>
                                <Box sx={{ width: '224px' }}>
                                    <RuleNameInput ruleData={ruleData} setRuleData={setRuleData} />
                                </Box>
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
                                    value={selectedEntities['includeOT']}
                                    onChange={
                                        (e, newValue) => {
                                            setSelectedEntities(prev => ({ ...prev, includeOT: newValue}))
                                            setRuleData(prev => ({ ...prev, includeOT: {...prev.includeOT, entities: newValue}}))
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
                                    value={selectedEntities['includeAct']}
                                    onChange={
                                        (e, newValue) => {
                                            setSelectedEntities(prev => ({ ...prev, includeAct: newValue}))
                                            setRuleData(prev => ({ ...prev, includeAct: {...prev.includeAct, entities: newValue}}))
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
                                    value={selectedEntities['excludeOT']}
                                    onChange={
                                        (e, newValue) => {
                                            setSelectedEntities(prev => ({ ...prev, excludeOT: newValue}))
                                            setRuleData(prev => ({ ...prev, excludeOT: {...prev.excludeOT, entities: newValue}}))
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
                                    value={selectedEntities['excludeAct']}
                                    onChange={
                                        (e, newValue) => {
                                            setSelectedEntities(prev => ({ ...prev, excludeAct: newValue}))
                                            setRuleData(prev => ({ ...prev, excludeAct: {...prev.excludeAct, entities: newValue}}))
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
                        <EditorSummary />
                        <Stack 
                            direction='row' 
                            justifyContent='space-evenly' 
                            alignItems='center'
                            sx={{ m: 2, mt: 6 }}
                        >
                            <Button 
                                color='neutral' 
                                sx={{ width: 126 }} 
                                onClick={handleCancel1}
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
                                <Box sx={{ width: '16rem' }}>
                                    <ProcessNameInput width='16rem' />
                                </Box>
                            </Stack>
                            <Stack 
                                direction='row' 
                                justifyContent='space-between' 
                                alignItems='center' 
                                sx={{ pt: 1, pb: 1 }}
                            >
                                <Typography level="title-md"> Rule name </Typography>
                                <Box sx={{ width: '16rem' }}>
                                    <RuleNameInput ruleData={ruleData} setRuleData={setRuleData} />
                                </Box>
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
                                    value={selectedEntities['includeOT']}
                                    onChange={
                                        (e, newValue) => {
                                            setSelectedEntities(prev => ({ ...prev, includeOT: newValue}))
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
                                    value={selectedEntities['includeAct']}
                                    onChange={
                                        (e, newValue) => {
                                            setSelectedEntities(prev => ({ ...prev, includeAct: newValue}))
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
                            {/* advanced condition editor 1 */}
                            <ConditionList 
                                items={items1} 
                                setItems={setItems1} 
                                action={'include'}
                            />
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
                                    value={selectedEntities['excludeOT']}
                                    onChange={
                                        (e, newValue) => {
                                            setSelectedEntities(prev => ({ ...prev, excludeOT: newValue}))
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
                                    value={selectedEntities['excludeAct']}
                                    onChange={
                                        (e, newValue) => {
                                            setSelectedEntities(prev => ({ ...prev, excludeAct: newValue}))
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
                            {/* advanced condition editor 2 */}
                            <ConditionList 
                                items={items2} 
                                setItems={setItems2}
                                action={'exclude'}
                            />
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
                        <EditorSummary />
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