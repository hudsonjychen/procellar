import { List, Sheet, ListItem, ListItemButton, Typography, ListItemContent, Divider, ListItemDecorator, ListDivider, Box } from "@mui/joy";
import { useGlobal } from "../GlobalContext"
import { useState } from "react";
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import { Collapse } from "@mui/material";
import { NewIcon, ObjectIcon, ProcessIcon } from "../CustomIcons";

export default function Side() {
    const { objectTypeList, processes } = useGlobal()
    const [open1, setOpen1] = useState(false)
    const [open2, setOpen2] = useState(false)

    return (
        <Sheet
            variant="plain"
            color="neutral"
            sx={{
                bgcolor: 'white',
                borderRight: '1.2px solid',
                borderTop: '1px solid',
                borderColor: 'neutral.outlinedBorder',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                p: 2.5,
                overflowY: 'auto',
                overflowX: 'hidden'
            }}
        >
            <List sx={{ width: '100%', minWidth: 180, maxWidth: 360 }}>
                <ListItem sx={{ mb: 2 }}>
                    <Typography sx={{ fontSize: 22, fontWeight: 'bold' }}> Entity List </Typography>
                </ListItem>
                {/* object type collapsible list */}
                <ListItem>
                    <ListItemButton onClick={() => setOpen1(!open1)}>
                        <ListItemDecorator sx={{ mr: -2 }}>
                            <ObjectIcon sx={{ fontSize: '1.6rem' }}/>
                        </ListItemDecorator>   
                        <ListItemContent sx={{ fontWeight: 'bold' }}>
                            Object Types
                        </ListItemContent>
                        <ExpandMoreOutlinedIcon 
                            sx={{
                                transform: !open1 ? 'rotate(0deg)' : 'rotate(-180deg)',
                                transition: '0.2s'
                            }}
                        />
                    </ListItemButton>
                </ListItem>
                <Collapse in={open1}>
                    <List sx={{ ml: 4.5 }}>
                        {objectTypeList.length ? objectTypeList.map((item, index) => (
                            <Box>
                                <ListItem 
                                    key={item.name}
                                    sx={{ display: 'flex', justifyContent: 'space-between', pr: 2.4}} 
                                >
                                    <Typography>
                                        {item.name}
                                    </Typography>
                                    <Typography>
                                        {item.count}
                                    </Typography>
                                </ListItem>
                                {index != objectTypeList.length-1 && 
                                    <ListDivider inset="gutter"/>
                                }
                            </Box>
                        )) :
                            <ListItem>
                                <Typography>
                                    No entities
                                </Typography>
                            </ListItem>
                        }
                    </List>
                </Collapse>

                <Divider sx={{ m: 1, mt: 2, mb: 2 }}/>

                {/* process collapsible list */}
                <ListItem>
                    <ListItemButton onClick={() => setOpen2(!open2)}>
                        <ListItemDecorator sx={{ mr: -2 }}>
                            <ProcessIcon sx={{ fontSize: '1.6rem' }}/>
                        </ListItemDecorator>
                        <ListItemContent sx={{ fontWeight: 'bold' }}>
                            Processes
                        </ListItemContent>
                        <ExpandMoreOutlinedIcon 
                            sx={{
                                transform: !open2 ? 'rotate(0deg)' : 'rotate(-180deg)',
                                transition: '0.2s'
                            }}
                        />
                    </ListItemButton>
                </ListItem>
                <Collapse in={open2}>
                    <List sx={{ ml: 4.5 }}>
                        {processes.length ? processes.map((item, index) => (
                            <Box>
                                <ListItem 
                                    key={item}
                                    sx={{ display: 'flex', justifyContent: 'space-between', pr: 2.4}} 
                                >
                                    <Typography>
                                        {item.name}
                                    </Typography>
                                    {item.justCreated ?
                                        <Box sx={{ mr: '1px' }}>
                                            <NewIcon />
                                        </Box> :
                                        <Box sx={{ visibility: 'hidden' }}>
                                            <NewIcon />
                                        </Box>
                                    }
                                </ListItem>
                                {index != processes.length-1 && 
                                    <ListDivider inset="gutter"/>
                                }
                            </Box>
                        )) :
                            <ListItem>
                                <Typography>
                                    No entities
                                </Typography>
                            </ListItem>
                        }
                    </List>
                </Collapse>
            </List>
        </Sheet>
    )
}