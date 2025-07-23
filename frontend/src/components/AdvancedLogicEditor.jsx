import { Box, Tooltip, IconButton, Typography, Modal, Select, Option, ModalDialog, DialogTitle, Stack, Button, Card, List, ListItem, Checkbox, Dropdown, MenuButton, Menu } from "@mui/joy";
import { LogicIcon } from "../CustomIcons";
import { useState } from "react";

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
    const [logicData, setLogicData] = useState([
        {
            id: 0, 
            name: 'root', 
            leftGroup: 'group1', 
            rightGroup: 'group2', 
            operator: 'or'
        }
    ])
    const ruleList = rules.map(r => {return r.ruleName})

    const [index, setIndex] = useState(0)
    const [groupId, setGroupId] = useState(2)

    const [groupData, setGroupData] = useState(
        {
            root: ruleList,
            group1: [], 
            group2: []
        }
    )

    const [openEditor, setOpenEditor] = useState(false)

    const GroupButton = ({ groupName, rowName, rowId }) => {
        const logicDataNameList = logicData.map(item => (item.name))
        const ifDisabled = (logicDataNameList.includes(groupName)) || !(groupName in groupData)

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
                            leftGroup: 'group' + (groupId + 1),
                            rightGroup: 'group' + (groupId + 2),
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
                                leftGroup: 'group' + (groupId + 1),
                                rightGroup: 'group' + (groupId + 2),
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
                                leftGroup: 'group' + (groupId + 3),
                                rightGroup: 'group' + (groupId + 4),
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
                                leftGroup: 'group' + (groupId + 1),
                                rightGroup: 'group' + (groupId + 2),
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
                        '&:hover': {
                            backgroundColor: 'initial',
                            boxShadow: 'none',
                            color: 'inherit',
                        }
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
                    <Card sx={{ width: 220 }}>
                        <Typography level="body-sm" sx={{ fontWeight: 'lg', mb: 2 }}>
                            Select Rules for {groupName}
                        </Typography>
                        <Box>
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
                        <Stack direction='row' spacing={2} justifyContent='center'>
                            <Button sx={{ width: 62 }} onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button sx={{ width: 62 }} onClick={handleSave}>
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
                <Stack direction='row'>
                    <Typography> 
                        {row.name} 
                    </Typography>
                    <GroupButton 
                        groupName={row.leftGroup}
                        rowName={row.name}
                        rowId={row.id}
                    />
                    <LogicSelect 
                        op={row.operator}
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

    const LogicSelect = ({ op }) => {
        return (
            <Select
                sx={{ width: '6rem' }}
                defaultValue={op}

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
                name: 'root', 
                leftGroup: 'group1', 
                rightGroup: 'group2', 
                operator: 'or'
            }
        ])

        setGroupData(
            {
                root: ruleList,
                group1: [], 
                group2: []
            }
        )

        setIndex(0)
        setGroupId(2)
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
                            <RowList logicData={logicData}/>
                        </Box>
                        
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