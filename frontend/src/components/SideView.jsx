import { Box, List, ListItem, Typography } from "@mui/material"
import { useGlobal } from "../GlobalContext"

export default function SideView() {

    const { objectTypeList } = useGlobal();
    const objectTypes = [
        { name: 'Order', count: 320 },
        { name: 'Item', count: 982 },
        { name: 'Invoice', count: 317 },
        { name: 'Payment', count: 309 },
        { name: 'Shipment', count: 287 },
        { name: 'Support Ticket', count: 73 },
    ]

    return (
        <Box sx={{
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'flex-start',
            width: '30vw', 
            height: 'calc(100vh - 64px)', 
            position: 'fixed', 
            left: 0, 
            bottom: 0, 
            borderRight: '1.5px solid #757575',
            overflowY: 'auto'
        }}>
            <Box sx={{padding: '16px 12px'}}>
                <Typography variant="h6" sx={{fontWeight: 'bold', fontSize: '1.1rem'}}>
                    Entity List
                </Typography>
            </Box>

            <Box sx={{width: '30vw', display: 'flex', paddingBottom: '12px', borderBottom: '1.5px solid #757575'}}>
                <Typography variant="h5" sx={{fontWeight: 'bold', fontSize: '1rem', paddingLeft: '36px'}}>
                    Object List
                </Typography>
            </Box>

            <List sx={{mb: '32px'}}>
                {
                    objectTypeList.map(item => (
                        <ListItem 
                            key={item.name} 
                            sx={{
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                width: '30vw', 
                                paddingLeft: '58px', 
                                paddingRight: '30px', 
                                borderBottom: '1px solid #ADB5BD'
                            }}
                        >
                            <Typography>
                                {item.name}
                            </Typography>
                            <Typography>
                                {item.count}
                            </Typography>
                        </ListItem>
                    ))
                }
            </List>

            <Box sx={{width: '30vw', display: 'flex', paddingBottom: '12px', borderBottom: '1.5px solid #757575'}}>
                <Typography variant="h5" sx={{fontWeight: 'bold', fontSize: '1rem', paddingLeft: '36px'}}>
                    Process View List
                </Typography>
            </Box>
        </Box>
    )
}