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
import { ErrorAlert } from "./Alert";
import EditorSummary from "./EditorSummary";

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
    string: ['==', '!=', 'in', 'not in'],
    integer: ['==', '!=', '>', '>=', '<', '<='],
    float: ['==', '!=', '>', '>=', '<', '<='],
    boolean: ['==', '!=']
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
    const { setProcessData, processData, processAcList, setProcessAcList, setProcesses, objectTypes, activities, attrMap, setProcessLogicData } = useGlobal()
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

    const [selectedConditions, setSelectedConditions] = useState({})

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

    {/* states for alert */}
    const [showAlert1, setShowAlert1] = useState(false)

    const allEmpty =
        ruleData.includeOT.entities.length === 0 &&
        ruleData.includeAct.entities.length === 0 &&
        ruleData.excludeOT.entities.length === 0 &&
        ruleData.excludeAct.entities.length === 0;

    const matchedProcess = processData.find(process => process.processName === processAcName.title)
    const existingRuleNames = matchedProcess ? matchedProcess.rules.map(rule => rule.ruleName) : []

    console.log(processAcName);

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

        setSelectedConditions({})
    }

    const handleCancel = () => {
        setOpen1(false)
        setOpen2(false)
        clearEditor()
    }

    const handleSave = () => {
        {/* update processes and process list for autocomplete component */}
        const originalProcessList = processAcList.map(item => item.title)
        if (!originalProcessList.includes(processAcName.title)) {
            setProcesses(prev => ([...prev, {name: processAcName.title, justCreated: true}]))
            setProcessAcList(prev => ([...prev, processAcName]))
        }

        const { title } = processAcName

        const tempRuleData = ruleData
        tempRuleData.parentProcess = title

        tempRuleData.includeOT.condition = Object.entries(selectedConditions)
        .map(([key, cond]) => {
            if (cond.action === 'include' && cond.type === 'objectType' && cond.entity && cond.attribute && cond.operator) {
                return {
                    entity: cond.entity,
                    attribute: cond.attribute,
                    operator: cond.operator,
                    value: cond.value
                }
            } else {
                return null
            }
        })
        .filter(Boolean)

        tempRuleData.includeAct.condition = Object.entries(selectedConditions)
        .map(([key, cond]) => {
            if (cond.action === 'include' && cond.type === 'eventType' && cond.entity && cond.attribute && cond.operator) {
                return {
                    entity: cond.entity,
                    attribute: cond.attribute,
                    operator: cond.operator,
                    value: cond.value
                }
            } else {
                return null
            }
        })
        .filter(Boolean)

        tempRuleData.excludeOT.condition = Object.entries(selectedConditions)
        .map(([key, cond]) => {
            if (cond.action === 'exclude' && cond.type === 'objectType' && cond.entity && cond.attribute && cond.operator) {
                return {
                    entity: cond.entity,
                    attribute: cond.attribute,
                    operator: cond.operator,
                    value: cond.value
                }
            } else {
                return null
            }
        })
        .filter(Boolean)

        tempRuleData.excludeAct.condition = Object.entries(selectedConditions)
        .map(([key, cond]) => {
            if (cond.action === 'exclude' && cond.type === 'eventType' && cond.entity && cond.attribute && cond.operator) {
                return {
                    entity: cond.entity,
                    attribute: cond.attribute,
                    operator: cond.operator,
                    value: cond.value
                }
            } else {
                return null
            }
        })
        .filter(Boolean)

        const updatedRuleData = tempRuleData

        setRuleData(updatedRuleData);
        if (updatedRuleData.ruleName && updatedRuleData.parentProcess && !allEmpty && !existingRuleNames.includes(updatedRuleData.ruleName)) {
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
                        relations: {}
                    }
                    return updatedProcesses;
                } else {
                    return [
                        ...prev,
                        {
                            processName: title,
                            justCreated: true,
                            rules: [updatedRuleData],
                            relations: {}
                        }
                    ]
                }
            })

            setProcessLogicData(prev => { 
                const { [title]: _, ...rest} = prev;
                return rest;
            })

            setOpen1(false)
            setOpen2(false)
            clearEditor()
        } else {
            setShowAlert1(true)
        }        
    }

    {/* for demo */}
    const handleSave2 = () => {
        setOpen2(false)
    }

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

    const ConditionEditor = ({ onDelete, action, id }) => {
        const [attrOptions, setAttrOptions] = useState([])
        const [opOptions, setOpOptions] = useState([])
        const [input, setInput] = useState(selectedConditions[id]?.value || '')

        useEffect(() => {
            if (selectedConditions[id]?.entity){
                const matched = attrMap.find(item => item.name === selectedConditions[id].entity)
                if (matched) {
                    setAttrOptions(matched.attributes)
                }
            }
        }, [selectedConditions[id]?.entity])

        useEffect(() => {
            if (selectedConditions[id]?.attribute){
                const matched = attrOptions.find(item => item.name === selectedConditions[id].attribute)
                if (matched) {
                    setOpOptions(operatorMap[matched.type])
                }
            }
        }, [selectedConditions[id]?.attribute, attrOptions])

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
                    value={selectedConditions[id]?.entity}
                    onChange={(e, newValue) => {
                        const item = attrMap.find(item => item.name === newValue)
                        setSelectedConditions(prev => ({...prev, [id]: {...prev[id], action: action, type: item?.type, entity: newValue}}))
                        console.log(selectedConditions)
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
                    value={selectedConditions[id]?.attribute}
                    onChange={(e, newValue) => {
                        setSelectedConditions(prev => ({...prev, [id]: {...prev[id], attribute: newValue}}))
                        console.log(selectedConditions)
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
                    value={selectedConditions[id]?.operator}
                    onChange={(e, newValue) => {
                        setSelectedConditions(prev => ({...prev, [id]: {...prev[id], operator: newValue}}))
                    }}
                >
                    {opOptions.map(item => (
                        <Option key={item} value={item}>{item}</Option>
                    ))}
                </Select>
                {/* value input */}
                <Input 
                    placeholder="value..."
                    name="condition"
                    sx={{ width: '8rem'}}
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value)
                    }}
                    onBlur={() => setSelectedConditions(prev => ({...prev, [id]: {...prev[id], value: input}}))}
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
        const handleDelete = (index, id) => {
            setItems(prev => prev.filter((_, i) => i !== index))
            setSelectedConditions(prev => {
                const newConditions = { ...prev }
                delete newConditions[id + action]
                return newConditions
            })
        };

        return (
            <Box>
                {items.map((id, index) => (
                    <ConditionEditor
                        key={id+action}
                        onDelete={() => handleDelete(index, id)}
                        action={action}
                        id={id+action}
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
            <Modal open={open1} onClose={() => {setOpen1(false); setShowAlert1(false)}}>
                <ModalDialog sx={{ display: 'flex', width: '576px', overflowY: 'auto' }}>
                    <ErrorAlert 
                        showAlert={showAlert1} 
                        setShowAlert={setShowAlert1} 
                        alertText='Please provide a process name, a unique rule name, and select at least one entity before saving.'
                    />
                    <DialogTitle sx={{ fontSize: 22, fontWeight: 'bold', ml: 2, mt: 2 }}>
                        Rule Editor
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
                        <EditorSummary allEmpty={allEmpty} ruleData={ruleData} />
                        <Stack 
                            direction='row' 
                            justifyContent='space-evenly' 
                            alignItems='center'
                            sx={{ m: 2, mt: 6 }}
                        >
                            <Button 
                                color='neutral' 
                                sx={{ width: 126 }} 
                                onClick={handleCancel}
                            >
                                Cancel
                            </Button>
                            <Button
                                sx={{ width: 126 }}
                                onClick={handleSave}
                            >
                                Save
                            </Button>
                        </Stack>
                    </form>
                </ModalDialog>
            </Modal>
            
            {/* advanced process editor */}
            <Modal open={open2} onClose={() => {setOpen2(false); setShowAlert1(false)}}>
                <ModalDialog sx={{ overflowY: 'auto' }}>
                    <ErrorAlert 
                        showAlert={showAlert1} 
                        setShowAlert={setShowAlert1} 
                        alertText='Please provide a process name, a rule name, and select at least one entity before saving.'
                    />
                    <DialogTitle sx={{ fontSize: 22, fontWeight: 'bold', ml: 2, mt: 2 }}>
                        Advanced Rule Editor
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
                                    sx={{ width: '16rem' }}
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
                                    sx={{ width: '16rem' }}
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
                        <EditorSummary allEmpty={allEmpty} ruleData={ruleData} />
                        <Stack 
                            direction='row' 
                            justifyContent='space-evenly' 
                            alignItems='center'
                            sx={{ m: 2, mt: 6 }}
                        >
                            <Button 
                                color='neutral' 
                                sx={{ width: 126 }} 
                                onClick={handleCancel}
                            >
                                Cancel
                            </Button>
                            <Button
                                sx={{ width: 126 }}
                                onClick={handleSave}
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