import { IconButton, DialogTitle, Divider, Autocomplete, AutocompleteOption, ListItemDecorator, Input, Modal, ModalDialog, Box, Stack, Typography, Button } from "@mui/joy";
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';

export default function EditorSummary({ allEmpty }) {
    return (
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
}