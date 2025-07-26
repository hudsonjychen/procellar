import { Box, Alert, IconButton, Typography } from '@mui/joy';
import { useEffect } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

export function ErrorAlert({ showAlert, setShowAlert, alertText }) {

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
                    variant='soft'
                    color='danger'
                    endDecorator={
                        <IconButton 
                            variant='soft' 
                            color='danger'
                            sx={{
                                '--IconButton-size': '22px',
                                height: '22px',
                                width: '22px',
                                minWidth: '22px',
                            }}
                            onClick={() => setShowAlert(false)}
                        >
                            <CloseRoundedIcon sx={{ width: 18, height: 18 }}/>
                        </IconButton>
                    }
                >   
                    <Typography level="body-sm" color='danger'>
                        {alertText}
                    </Typography>
                </Alert>
            )}
        </Box>
    )
}

export function SuccessImportAlert({ showAlert, setShowAlert, alertText }) {

    useEffect(() => {
        if (showAlert) {
            const timer = setTimeout(() => {
                setShowAlert(false)
            }, 6000)
            return () => clearTimeout(timer)
        }
    }, [showAlert])

    return (
        <Box 
            sx={{ 
                ml: 1.6, 
                mr: 1.6,
                height: 56, 
                display: 'flex',
                direction: 'row', 
                justifyContent: 'center',
                alignItems: 'center' 
            }}
        >
            {showAlert && (
                <Alert 
                    sx={{ alignItems: 'flex-start', p: 1, pl: 2, width: 320, height: 20 }}
                    variant='soft'
                    color='success'
                    endDecorator={
                        <IconButton 
                            variant='soft' 
                            color='success'
                            sx={{
                                '--IconButton-size': '20px',
                                height: '20px',
                                width: '20px',
                                minWidth: '20px',
                            }}
                            onClick={() => setShowAlert(false)}
                        >
                            <CloseRoundedIcon sx={{ width: 18, height: 18 }}/>
                        </IconButton>
                    }
                >   
                    <Typography level="body-sm" color='success'>
                        {alertText}
                    </Typography>
                </Alert>
            )}
        </Box>
    )
}

export function FailureImportAlert({ showAlert, setShowAlert, alertText }) {

    useEffect(() => {
        if (showAlert) {
            const timer = setTimeout(() => {
                setShowAlert(false)
            }, 6000)
            return () => clearTimeout(timer)
        }
    }, [showAlert])

    return (
        <Box 
            sx={{ 
                ml: 1.6, 
                mr: 1.6,
                height: 56, 
                display: 'flex',
                direction: 'row', 
                justifyContent: 'center',
                alignItems: 'center' 
            }}
        >
            {showAlert && (
                <Alert 
                    sx={{ alignItems: 'flex-start', p: 1, pl: 2, width: 320, height: 20 }}
                    variant='soft'
                    color='danger'
                    endDecorator={
                        <IconButton 
                            variant='soft' 
                            color='danger'
                            sx={{
                                '--IconButton-size': '20px',
                                height: '20px',
                                width: '20px',
                                minWidth: '20px',
                            }}
                            onClick={() => setShowAlert(false)}
                        >
                            <CloseRoundedIcon sx={{ width: 18, height: 18 }}/>
                        </IconButton>
                    }
                >   
                    <Typography level="body-sm" color='danger'>
                        {alertText}
                    </Typography>
                </Alert>
            )}
        </Box>
    )
}