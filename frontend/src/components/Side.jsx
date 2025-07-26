import { Stack, List, Sheet, ListItem, ListItemButton, Typography, ListItemContent, Divider, ListItemDecorator, ListDivider, Box, Dropdown, MenuButton, IconButton, Menu } from "@mui/joy";
import { useGlobal } from "../GlobalContext"
import { useRef, useState } from "react";
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import { Collapse } from "@mui/material";
import { NewIcon, ObjectIcon, ProcessIcon } from "../CustomIcons";

export default function Side() {
    const { fileInfo, objectTypeList, processData } = useGlobal()
    const [open1, setOpen1] = useState(true)
    const [open2, setOpen2] = useState(true)
    const [open3, setOpen3] = useState(false)

    const FileInfo = () => {

        return (
            <Box sx={{ position: 'fixed', bottom: 24, left: 24 }}>
                <Dropdown
                    open={open3}
                    onOpenChange={setOpen3}
                >
                    <MenuButton
                        onMouseEnter={() => setOpen3(true)}
                        onMouseLeave={() => setOpen3(false)}
                        slots={{ root: IconButton }}
                        slotProps={{ root: { variant: 'outlined', color: 'neutral' } }}
                        sx={{ backgroundColor: 'white' }}
                    >
                        <InfoOutlineIcon />
                    </MenuButton>
                    <Menu 
                        placement="top-start"
                    >
                        <Box sx={{ width: 260, ml: 1.8, mr: 1.8, mt: 0.6, mb: 0.6 }}>
                            <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 1 }}>
                                <Typography level="title-sm">
                                    File Information
                                </Typography>
                            </Stack>

                            <Stack direction='row' spacing={1} justifyContent='space-between'>
                                <Typography level="body-sm" color="neutral" fontSize={12}>
                                    Filename
                                </Typography>
                                <Typography level="body-sm" fontSize={12}>
                                    {'filename' in fileInfo ? fileInfo.filename : '-----'}
                                </Typography>
                            </Stack>

                            <Stack direction='row' spacing={1} justifyContent='space-between'>
                                <Typography level="body-sm" color="neutral" fontSize={12}>
                                    Size
                                </Typography>
                                <Typography level="body-sm" fontSize={12}>
                                    {'size' in fileInfo ? fileInfo.size + ' MB' : '-----'}
                                </Typography>
                            </Stack>

                            <Stack direction='row' spacing={1} justifyContent='space-between'>
                                <Typography level="body-sm" color="neutral" fontSize={12}>
                                    Upload time
                                </Typography>
                                <Typography level="body-sm" fontSize={12}>
                                    {'uploadtime' in fileInfo ? fileInfo.uploadtime : '-----'}
                                </Typography>
                            </Stack>
                        </Box>
                    </Menu>
                </Dropdown>
            </Box>
        )
    }

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
                <ListItem sx={{ pb: 2 }}>
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
                        {processData.length ? processData.map((item, index) => (
                            <Box>
                                <ListItem 
                                    key={item.processName}
                                    sx={{ display: 'flex', justifyContent: 'space-between', pr: 2.4}} 
                                >
                                    <Typography>
                                        {item.processName}
                                    </Typography>
                                    <Typography>
                                        {item.rules.length} <span style={{ color: '#999' }}>  rs</span>
                                    </Typography>
                                </ListItem>
                                {index != processData.length-1 && 
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
            <FileInfo />
        </Sheet>
    )
}