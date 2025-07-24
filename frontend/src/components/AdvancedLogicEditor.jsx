import { Box, Tooltip, IconButton, Typography, Modal, Select, Option, ModalDialog, DialogTitle, Stack, Button, Card, List, ListItem, Checkbox, Alert } from "@mui/joy";
import { GroupIcon, LogicIcon, RootIcon } from "../CustomIcons";
import { useState } from "react";
import { useGlobal } from '../GlobalContext';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const demoLogicData = [
    {id: 0, name: 'root', leftGroup: 'group1', rightGroup: 'group2', operator: 'or'},
    {id: 1, name: 'group1', leftGroup: 'group3', rightGroup: 'rule1', operator: 'and'},
    {id: 2, name: 'group2', leftGroup: 'rule2', rightGroup: 'rule3', operator: 'or'},
    {id: 3, name: 'group3', leftGroup: 'rule4', rightGroup: 'rule5', operator: 'or'},
]

const demoGroupData = {
    group1: ['rule1', 'rule4', 'rule5'],
    group2: ['rule2', 'rule3'],
    group3: ['rule4', 'rule5']
}

export default function AdvancedLogicEditor({ rules, processName }) {
    const { setProcessData, processLogicData, setProcessLogicData } = useGlobal()
    const [logicData, setLogicData] = useState(() => {
        if (processName in processLogicData) {
            return processLogicData[processName]
        } else {
            return [
                {
                    id: 0, 
                    name: 'Root', 
                    leftGroup: 'Group1', 
                    rightGroup: 'Group2', 
                    operator: 'or'
                }
            ]
        }
    })
    const ruleList = rules.map(r => {return r.ruleName})

    const [index, setIndex] = useState(0)
    const [groupId, setGroupId] = useState(2)

    const [groupData, setGroupData] = useState(
        {
            Root: ruleList,
            Group1: [], 
            Group2: []
        }
    )

    const [openEditor, setOpenEditor] = useState(false)

    const GroupButton = ({ groupName, rowName, rowId }) => {
        const logicDataNameList = logicData.map(item => (item.name))
        const ifDisabled = (logicDataNameList.includes(groupName)) || (ruleList.includes(groupName))

        const [open, setOpen] = useState(null)

        const ruleOptions = groupData[rowName]
        const ruleOptionsCheckObj = Object.fromEntries(ruleOptions.map(key => [key, false]))
        const [tempCheckedRules, setTempCheckedRules] = useState(ruleOptionsCheckObj)
        const tempCheckedRuleList = Object.entries(tempCheckedRules).filter(([key, value]) => value === true).map(([key]) => key)

        const handleSave = () => {

            setGroupData(prev => ({
                    ...prev, 
                    [groupName]: tempCheckedRuleList
                })
            )

            const checkedRuleList = tempCheckedRuleList
            if (checkedRuleList.length < 1) {
                return
            } else if (checkedRuleList.length === 1) {
                setLogicData(prev =>
                    prev.map(item => {
                        if (item.id !== rowId) return item;

                        if (item.leftGroup === groupName) {
                            return {
                                ...item,
                                leftGroup: checkedRuleList[0]
                            };
                        } else {
                            return {
                                ...item,
                                rightGroup: checkedRuleList[0]
                            };
                        }
                    })
                )
            } else if (checkedRuleList.length === 2) {
                setIndex(prev => (prev + 1))
                setLogicData(prev => ([
                        ...prev, 
                        {
                            id: (index + 1), 
                            name: groupName,
                            leftGroup: checkedRuleList[0],
                            rightGroup: checkedRuleList[1],
                            operator: 'or'
                        }
                    ])
                )
            } else {
                setIndex(prev => (prev + 1))
                setGroupId(prev => (prev + 2))
                setLogicData(prev => ([
                        ...prev, 
                        {
                            id: (index + 1), 
                            name: groupName,
                            leftGroup: 'Group' + (groupId + 1),
                            rightGroup: 'Group' + (groupId + 2),
                            operator: 'or'
                        }
                    ])
                )
            }

            {/** update logic data for the corresponding other group */}
            const currentRow = logicData.find(item => item.name === rowName)
            const otherGroupName = currentRow.leftGroup === groupName ? currentRow.rightGroup : currentRow.leftGroup
            const leftRuleList = ruleOptions.filter(item => !tempCheckedRuleList.includes(item))
            setGroupData(prev => ({
                    ...prev, 
                    [otherGroupName]: leftRuleList
                })
            )
            if (leftRuleList.length < 1) {
                return
            } else if (leftRuleList.length === 1) {
                setLogicData(prev =>
                    prev.map(item => {
                        if (item.id !== rowId) return item;

                        if (item.leftGroup === otherGroupName) {
                            return {
                                ...item,
                                leftGroup: leftRuleList[0]
                            };
                        } else {
                            return {
                                ...item,
                                rightGroup: leftRuleList[0]
                            };
                        }
                    })
                )
            } else if (leftRuleList.length === 2) {
                if (checkedRuleList.length === 2) {
                    setIndex(prev => (prev + 1))
                    setLogicData(prev => ([
                            ...prev, 
                            {
                                id: (index + 2), 
                                name: otherGroupName,
                                leftGroup: leftRuleList[0],
                                rightGroup: leftRuleList[1],
                                operator: 'or'
                            }
                        ])
                    )
                } else if (checkedRuleList.length > 2) {
                    setIndex(prev => (prev + 1))
                    setLogicData(prev => ([
                            ...prev, 
                            {
                                id: (index + 2), 
                                name: otherGroupName,
                                leftGroup: leftRuleList[0],
                                rightGroup: leftRuleList[1],
                                operator: 'or'
                            }
                        ])
                    )
                } else {
                    setIndex(prev => (prev + 1))
                    setLogicData(prev => ([
                            ...prev, 
                            {
                                id: (index + 1), 
                                name: otherGroupName,
                                leftGroup: leftRuleList[0],
                                rightGroup: leftRuleList[1],
                                operator: 'or'
                            }
                        ])
                    )
                }
            } else {
                if (checkedRuleList.length === 2) {
                    setIndex(prev => (prev + 1))
                    setGroupId(prev => (prev + 2))
                    setLogicData(prev => ([
                            ...prev, 
                            {
                                id: (index + 2), 
                                name: otherGroupName,
                                leftGroup: 'Group' + (groupId + 1),
                                rightGroup: 'Group' + (groupId + 2),
                                operator: 'or'
                            }
                        ])
                    )
                } else if (checkedRuleList.length > 2) {
                    setIndex(prev => (prev + 1))
                    setGroupId(prev => (prev + 2))
                    setLogicData(prev => ([
                            ...prev, 
                            {
                                id: (index + 2), 
                                name: otherGroupName,
                                leftGroup: 'Group' + (groupId + 3),
                                rightGroup: 'Group' + (groupId + 4),
                                operator: 'or'
                            }
                        ])
                    )
                } else {
                    setIndex(prev => (prev + 1))
                    setGroupId(prev => (prev + 2))
                    setLogicData(prev => ([
                            ...prev, 
                            {
                                id: (index + 1), 
                                name: otherGroupName,
                                leftGroup: 'Group' + (groupId + 1),
                                rightGroup: 'Group' + (groupId + 2),
                                operator: 'or'
                            }
                        ])
                    )
                }
            }            

            setOpen(false)
        }

        const handleCancel = () => {
            setTempCheckedRules(uncheckedRules)
            setOpen(false)
        }

        return (
            <Box>
                <Button 
                    variant="plain" 
                    color="primary"
                    disabled={ifDisabled}
                    sx={{
                        fontSize: 'md',
                        '&:hover': {
                            backgroundColor: 'initial',
                            boxShadow: 'none',
                            color: 'inherit',
                        },
                        '&.Mui-disabled': {
                            opacity: 1,
                            color: '#43A047',
                            cursor: 'not-allowed'
                        },
                        width: 150
                    }}
                    onClick={() => setOpen(true)}
                >
                    {groupName}
                </Button>
                <Modal 
                    open={open} 
                    onClose={() => setOpen(!open)} 
                    sx={{
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center'
                    }}
                    slotProps={{
                        backdrop: {
                            sx: {
                                backdropFilter: 'none'
                            }
                        }
                    }}
                >
                    <Card sx={{ width: 220, p: 3 }}>
                        <Typography level="body-sm" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Select rules for {groupName}
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            <List
                                orientation="horizontal"
                                wrap
                                sx={{ '--List-gap': '8px', '--ListItem-radius': '20px' }}
                            >
                                {ruleOptions.map(item => (
                                    <ListItem key={item}>
                                        <Checkbox
                                            overlay
                                            disableIcon
                                            variant="solid"
                                            label={item}
                                            checked={tempCheckedRules[item]}
                                            onChange={(e) => setTempCheckedRules(prev => ({...prev, [item]: e.target.checked}))}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                        <Stack direction='row' spacing={3} justifyContent='center'>
                            <Button color='neutral' sx={{ width: 82 }} onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button sx={{ width: 82 }} onClick={handleSave}>
                                Save
                            </Button>
                        </Stack>
                    </Card>
                </Modal>
            </Box>
        )
    }

    const EditorRow = ({ row }) => {
        return (
            <Box>
                <Stack direction='row' alignItems='center' justifyContent='space-between'>
                    <Stack direction='row' alignItems='center' spacing={1} sx={{ width: 86 }}>
                        {row.name === 'Root' ? (
                            <RootIcon /> 
                        ) : (
                            <GroupIcon />
                        )}
                        <Typography level="title-md"> 
                            {row.name} 
                        </Typography>
                    </Stack>
                    
                    <GroupButton 
                        groupName={row.leftGroup}
                        rowName={row.name}
                        rowId={row.id}
                    />
                    <LogicSelect 
                        op={row.operator}
                        rowName={row.name}
                    />
                    <GroupButton 
                        groupName={row.rightGroup}
                        rowName={row.name}
                        rowId={row.id}
                    />
                </Stack>
            </Box>
        )
    }

    const RowList = ({ logicData }) => {
        return (
            <Box>
                {logicData.map((row) => (
                    <List>
                        <EditorRow key={row.id} row={row} />
                    </List>
                ))}
            </Box>
        )
    }

    const handleSubmit = (e) => {
        e.preventDefault()
    }

    const LogicSelect = ({ op, rowName }) => {
        const handleSelect = (newValue) => {
            setLogicData(prev => 
                prev.map(item => 
                    item.name === rowName
                        ? { ...item, operator: newValue }
                        : item
                )
            )
        }

        return (
            <Select
                sx={{ width: '6rem' }}
                defaultValue={op}
                onChange={(e, newValue) => handleSelect(newValue)}
            >
                <Option value='and'>AND</Option>
                <Option value='or'>OR</Option>
            </Select>
        )
    }

    const handleClear = () => {
        setLogicData([
            {
                id: 0, 
                name: 'Root', 
                leftGroup: 'Group1', 
                rightGroup: 'Group2', 
                operator: 'or'
            }
        ])

        setGroupData(
            {
                Root: ruleList,
                Group1: [], 
                Group2: []
            }
        )

        setIndex(0)
        setGroupId(2)
    }

    const groupList = logicData.map(item => item.name)
    const groupMap = Object.fromEntries(logicData.map(item => [item.name, item]))
    const buildLogicTree = (groupName) => {
        const group = groupMap[groupName]
        if (!group) {
            return groupName
        }

        const { operator, leftGroup, rightGroup } = group

        const left = groupList.includes(leftGroup)
            ? buildLogicTree(leftGroup)
            : leftGroup
        
        const right = groupList.includes(rightGroup)
            ? buildLogicTree(rightGroup)
            : rightGroup
        
        return {
            op: operator,
            left: left,
            right: right
        }
    }
    const handleSave = () => {
        const areAllRulesAssigned = (ruleList, logicData) => {
            const usedRules = new Set()

            for (const item of logicData) {
                const { leftGroup, rightGroup } = item
                if (ruleList.includes(leftGroup)) {
                    usedRules.add(leftGroup)
                }
                if (ruleList.includes(rightGroup)) {
                    usedRules.add(rightGroup)
                }
            }

            console.log(usedRules)

            return ruleList.every(rule => usedRules.has(rule))
        }

        const canSave = areAllRulesAssigned(ruleList, logicData)
        if (canSave) {
            const relations = buildLogicTree('Root')
            setProcessData(prev =>
                prev.map(item => 
                    item.processName === processName ? {
                        ...item,
                        relations: relations
                    } : item
                )
            )
            setProcessLogicData(prev => ({...prev, [processName]: logicData}))
            setOpenEditor(false)
        } else {
            return
        }
    }

    return (
        <Box>
            <Tooltip title='Edit logic relations'>
                <IconButton
                    onClick={() => setOpenEditor(true)}
                    sx={{ 
                        borderRadius: '50%'
                    }}
                >
                    <LogicIcon />
                </IconButton>
            </Tooltip>
            <Modal open={openEditor} onClose={() => setOpenEditor(false)}>
                <ModalDialog sx={{ overflowY: 'auto' }}>
                    <DialogTitle sx={{ fontSize: 22, fontWeight: 'bold', ml: 2, mt: 2 }}>
                        Advanced Logic Editor
                    </DialogTitle>
                    {ruleList.length > 1 ? 
                        (
                            <form onSubmit={handleSubmit}>
                            <Box 
                                sx={{ 
                                    m: 1.2,
                                    mb: 4, 
                                    width: 480,
                                    p: 1,
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignContent: 'flex-start',
                                    alignItems: 'flex-start',
                                    gap: 2
                                }}
                            >
                                <RowList logicData={logicData}/>
                            </Box>
                            <Stack
                                direction='row' 
                                justifyContent='flex-start' 
                                alignItems='flex-start'
                                spacing={2} 
                                sx={{ m: 2, pt: 1, pb: 1 }}
                            >
                                <TipsAndUpdatesOutlinedIcon />
                                <Typography >
                                    Click a group to start. Save only when all labels are green.
                                </Typography>
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
                                    onClick={() => {
                                        console.log(logicData)
                                        console.log(groupData)
                                        handleClear()
                                    }}        
                                >
                                    Clear
                                </Button>
                                <Button 
                                    color='neutral' 
                                    sx={{ width: 126 }}
                                    onClick={() => {
                                        handleClear()
                                        setOpenEditor(false)
                                    }}
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
                        ) : 
                        (
                            <Box>
                                <Stack direction='row' spacing={1} sx={{ m: 2, mt: 2 }}>
                                    <ErrorOutlineIcon />
                                    <Typography level="body-md">
                                        Define more than <strong>ONE rule</strong> to enable logic editor. 
                                    </Typography>
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
                                        onClick={() => {
                                            setOpenEditor(false)
                                        }}        
                                    >
                                        OK
                                    </Button>
                                </Stack>
                            </Box>
                        )
                    }
                </ModalDialog>
            </Modal>
        </Box>
    )
}