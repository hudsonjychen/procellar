import * as React from 'react'
import { Box, Alert, IconButton, Typography } from '@mui/joy'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded'

interface ErrorBoundaryProps {
    fallback: React.ReactNode
    children: React.ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
}

class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true }
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('Error caught by ErrorBoundary:', error, info)
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback
        }

        return this.props.children
    }
}

const FallbackUI: React.FC = () => {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
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
                        onClick={() => window.location.reload()}
                    >
                        <CloseRoundedIcon />
                    </IconButton>
                }
                sx={{ p: 2 }}
            >
                <Typography
                    textAlign="left"
                    level="body-md"
                    sx={{ whiteSpace: 'pre-line' }}
                >
                    {'Something went wrong. Please refresh the page.'}
                </Typography>
            </Alert>
        </Box>
    )
}

export { ErrorBoundary, FallbackUI }
