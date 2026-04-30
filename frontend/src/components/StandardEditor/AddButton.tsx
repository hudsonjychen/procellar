import { IconButton } from '@mui/joy'
import Add from '@mui/icons-material/Add'

interface AddButtonProps {
    setItems: React.Dispatch<React.SetStateAction<number[]>>
}

export default function AddButton({ setItems }: AddButtonProps) {
    return (
        <IconButton
            size="sm"
            sx={{ borderRadius: '50%', backgroundColor: 'neutral' }}
            onClick={() => setItems((prev) => [...prev, Date.now()])}
        >
            <Add />
        </IconButton>
    )
}
