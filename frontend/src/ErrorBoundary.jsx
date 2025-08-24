import { Box, Alert, IconButton, Typography } from "@mui/joy";
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import * as React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error('Error caught by ErrorBoundary:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }

        return this.props.children;
    }
}

function FallbackUI() {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Alert
                variant="soft"
                color="neutral"
                startDecorator={<ErrorRoundedIcon />}
                endDecorator={
                    <IconButton 
                        variant="soft" 
                        size="sm" 
                        color="neutral"
                        onClick={() => {
                            window.location.reload();
                        }}
                    >
                        <CloseRoundedIcon />
                    </IconButton>
                }
                sx={{
                    p: 2
                }}
            >
                <Typography textAlign="left" level="body-md" sx={{ whiteSpace: 'pre-line'}} >
                    {'Something went wrong. Please refresh the page.'}
                </Typography>
            </Alert>
        </Box>
    )
}

export { ErrorBoundary, FallbackUI };