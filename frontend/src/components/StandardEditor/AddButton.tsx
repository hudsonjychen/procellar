import { IconButton } from '@mui/joy'
import Add from '@mui/icons-material/Add'

interface AddButtonProps {
    onClick: () => void
}

export default function AddButton({ onClick }: AddButtonProps) {
    return (
        <IconButton
            size="sm"
            sx={{ borderRadius: '50%', backgroundColor: 'neutral' }}
            onClick={onClick}
        >
            <Add />
        </IconButton>
    )
}
