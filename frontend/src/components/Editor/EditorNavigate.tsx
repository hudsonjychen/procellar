import { Button } from '@mui/joy'

interface EditorNavigateProps {
    setOpen1: React.Dispatch<React.SetStateAction<boolean>>
    setOpen2: React.Dispatch<React.SetStateAction<boolean>>
    text: string
}

export default function EditorNavigate({
    setOpen1,
    setOpen2,
    text,
}: EditorNavigateProps) {
    return (
        <Button
            variant="plain"
            color="primary"
            sx={{
                p: 0,
                m: 0,
                minWidth: 'unset',
                background: 'none',
                fontWeight: 'bold',
                textDecoration: 'underline',
                '&:hover': {
                    background: 'none',
                    textDecoration: 'underline',
                },
            }}
            onClick={() => {
                setOpen1(false)
                setOpen2(true)
            }}
        >
            {text}
        </Button>
    )
}
