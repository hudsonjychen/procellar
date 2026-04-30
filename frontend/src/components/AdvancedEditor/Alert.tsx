import { Box, Alert, IconButton, Typography } from '@mui/joy'
import { useEffect } from 'react'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'

interface AlertProps {
    showAlert: boolean
    setShowAlert: React.Dispatch<React.SetStateAction<boolean>>
    alertText: string
}

export function ErrorAlert({ showAlert, setShowAlert, alertText }: AlertProps) {
    useEffect(() => {
        if (showAlert) {
            const timer = setTimeout(() => {
                setShowAlert(false)
            }, 18000)
            return () => clearTimeout(timer)
        }
    }, [showAlert])

    return (
        <Box sx={{ ml: 1.6, mr: 1.6 }}>
            {showAlert && (
                <Alert
                    sx={{ alignItems: 'flex-start', p: 1.6 }}
                    variant="soft"
                    color="danger"
                    endDecorator={
                        <IconButton
                            variant="soft"
                            color="danger"
                            sx={{
                                '--IconButton-size': '22px',
                                height: '22px',
                                width: '22px',
                                minWidth: '22px',
                            }}
                            onClick={() => setShowAlert(false)}
                        >
                            <CloseRoundedIcon sx={{ width: 18, height: 18 }} />
                        </IconButton>
                    }
                >
                    <Typography level="body-sm" color="danger">
                        {alertText}
                    </Typography>
                </Alert>
            )}
        </Box>
    )
}
