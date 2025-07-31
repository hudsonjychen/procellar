import { Stack, Typography } from '@mui/material';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';

export default function EditorSummary({ allEmpty, ruleData }) {
    const { includeOT, includeAct, excludeOT, excludeAct } = ruleData;

    const buildSummary = () => {
        const parts = [];

        if (includeOT.entities.length > 0 || includeAct.entities.length > 0) {
            const includeParts = [];

            if (includeOT.entities.length > 0) {
                includeParts.push(
                    `events involving object type(s) of <strong>${includeOT.entities.join(', and ')}</strong>`
                );
            }

            if (includeAct.entities.length > 0) {
                includeParts.push(
                    `events classified under activity type(s) <strong>${includeAct.entities.join(', or ')}</strong>`
                );
            }

            parts.push(`Will include ${includeParts.join(' or ')}`);
        }

        if (excludeOT.entities.length > 0 || excludeAct.entities.length > 0) {
            const excludeParts = [];

            if (excludeOT.entities.length > 0) {
                excludeParts.push(
                    `events involving object type(s) <strong>${excludeOT.entities.join(', and ')}</strong>`
                );
            }

            if (excludeAct.entities.length > 0) {
                excludeParts.push(
                    `events classified under activity type(s) <strong>${excludeAct.entities.join(', or ')}</strong>`
                );
            }

            parts.push(`Will exclude ${excludeParts.join(' or ')}`);
        }

        return parts.join('. ') + '.';
    };

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
                    <Typography
                        dangerouslySetInnerHTML={{ __html: buildSummary() }}
                    />
            }
        </Stack>
    );
}
