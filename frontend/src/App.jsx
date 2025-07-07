import './App.css'
import { Box } from "@mui/joy";
import Editor from './components/Editor'
import Main from './components/Main'
import Side from './components/Side'
import Top from './components/Top'
import { GlobalProvider } from './GlobalContext'

function App() {

  return (
    <div >
      <GlobalProvider>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'clamp(220px, 24%, 360px) 1fr',
            position: 'fixed',
            top: 56,
            bottom: 0,
            left: 0,
            right: 0,
            overflow: 'hidden',
          }} 
        >
          <Side />
          <Main />
        </Box>
        <Editor />
        <Top />
      </GlobalProvider>
    </div>
  )

}

export default App