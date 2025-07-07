import { IconButton } from '@mui/material';
import { useState } from 'react';
import { Add } from '@mui/icons-material';
import RuleEditor from './RuleEditor';

export default function AddButton() {
    const [editorOpen, setEditorOpen] = useState(false);

    const handleSave = () => {
        setEditorOpen(false);
    };

    return (
        <div>
            <IconButton 
                size="large" 
                sx={{ 
                    width: '80px', 
                    height: '80px',
                    position: 'fixed',
                    right: '52px',
                    bottom: '52px',
                    backgroundColor: 'grey.300',
                    '&:hover': {
                        backgroundColor: 'grey.400'
                    } 
                }}
                onClick={() => setEditorOpen(true)}
            >
                <Add fontSize="large" />
            </IconButton>
            <RuleEditor open={editorOpen} onClose={() => setEditorOpen(false)} onSave={handleSave} />
        </div>
    )
}