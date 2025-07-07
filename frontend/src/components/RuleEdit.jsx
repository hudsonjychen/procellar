import React, { useState } from 'react';
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  TextField,
  Grid,
  Box,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Checkbox,
  ListItemText,
  Slide,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useGlobal } from '../GlobalContext';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function RuleEditor({ open, onClose, onSave }) {
  const { setProcesses, processes, objectTypes, activities } = useGlobal();

  const [processName, setProcessName] = useState('');
  const [ruleName, setRuleName] = useState('');
  const [includeObjects, setIncludeObjects] = useState([]);
  const [excludeObjects, setExcludeObjects] = useState([]);
  const [includeActivities, setIncludeActivities] = useState([]);
  const [excludeActivities, setExcludeActivities] = useState([]);

  const handleSave = () => {
    setProcesses(prevData => ([
      ...prevData,
      {
        processName,
        ruleName,
        includeObjects,
        excludeObjects,
        includeActivities,
        excludeActivities
      }
    ]));
  };

  return (
    <Dialog fullScreen open={open} onClose={onClose} TransitionComponent={Transition}>
      <AppBar position="relative" color="primary" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6">
            Rule Editor
          </Typography>
          <Button color="inherit" onClick={handleSave}>
            Save
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 4 }}>

        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Define Rule
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Process Name"
              variant="outlined"
              value={processName}
              onChange={(e) => setProcessName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Rule Name"
              variant="outlined"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Grid container spacing={4}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" gutterBottom>
              Include
            </Typography>
            <FormControl fullWidth margin="dense">
              <InputLabel>Object Types</InputLabel>
              <Select
                multiple
                value={includeObjects}
                onChange={(e) => setIncludeObjects(e.target.value)}
                renderValue={(selected) => selected.join(', ')}
              >
                {objectTypes.map((name) => (
                  <MenuItem key={name} value={name}>
                    <Checkbox checked={includeObjects.indexOf(name) > -1} />
                    <ListItemText primary={name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="dense">
              <InputLabel>Activities</InputLabel>
              <Select
                multiple
                value={includeActivities}
                onChange={(e) => setIncludeActivities(e.target.value)}
                renderValue={(selected) => selected.join(', ')}
              >
                {activities.map((name) => (
                  <MenuItem key={name} value={name}>
                    <Checkbox checked={includeActivities.indexOf(name) > -1} />
                    <ListItemText primary={name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="h6" gutterBottom>
              Exclude
            </Typography>
            <FormControl fullWidth margin="dense">
              <InputLabel>Object Types</InputLabel>
              <Select
                multiple
                value={excludeObjects}
                onChange={(e) => setExcludeObjects(e.target.value)}
                renderValue={(selected) => selected.join(', ')}
              >
                {objectTypes.map((name) => (
                  <MenuItem key={name} value={name}>
                    <Checkbox checked={excludeObjects.indexOf(name) > -1} />
                    <ListItemText primary={name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="dense">
              <InputLabel>Activities</InputLabel>
              <Select
                multiple
                value={excludeActivities}
                onChange={(e) => setExcludeActivities(e.target.value)}
                renderValue={(selected) => selected.join(', ')}
              >
                {activities.map((name) => (
                  <MenuItem key={name} value={name}>
                    <Checkbox checked={excludeActivities.indexOf(name) > -1} />
                    <ListItemText primary={name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSave}>
            Save Rule
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
