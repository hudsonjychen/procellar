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
  Slide
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useGlobal } from '../GlobalContext';

const Transition = React.forwardRef(function Transition(props, ref) {
   return <Slide direction="up" ref={ref} {...props} />;
});


export default function RuleEditor({ open, onClose, onSave, rule=null }) {
  const { setProcesses, objectTypes, activities } = useGlobal();
  const [processName, setProcessName] = useState(rule?rule.processName:'');
  const [ruleName, setRuleName] = useState(rule?rule.ruleName:'');
  const [includeObjects, setIncludeObjects] = useState(rule?rule.includeObjects:[]);
  const [excludeObjects, setExcludeObjects] = useState(rule?rule.excludeObjects:[]);
  const [includeActivities, setIncludeActivities] = useState(rule?rule.includeActivities:[]);
  const [excludeActivities, setExcludeActivities] = useState(rule?rule.excludeActivities:[]);

  const handleSave = () => {
    setProcesses(prevData => {
      if (rule) {
        return prevData.map((r) => {
          if (r.processName === rule.processName && r.ruleName === rule.ruleName) {
            return {
              processName,
              ruleName,
              includeObjects,
              excludeObjects,
              includeActivities,
              excludeActivities
            };
          }
          return r;
        });
      } else {
        return [
          ...prevData,
          {
            processName,
            ruleName,
            includeObjects,
            excludeObjects,
            includeActivities,
            excludeActivities
          }
        ];
      }
    })
    
    setProcessName('');
    setRuleName('');
    setIncludeObjects([]);
    setExcludeObjects([]);
    setIncludeActivities([]);
    setExcludeActivities([]);
    onSave();
  };

  return (
    <Dialog fullScreen open={open} onClose={onClose} TransitionComponent={Transition}>
      <AppBar position="relative">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            Rule Editor
          </Typography>
          <Button autoFocus color="inherit" onClick={handleSave}>
            Save
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 4 }}>
        {/* Top input fields */}
        <Grid container spacing={2} mb={4}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Process Name"
              value={processName}
              onChange={(e) => setProcessName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Rule Name"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
            />
          </Grid>
        </Grid>

        {/* Middle dropdowns */}
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" gutterBottom>Include</Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Object Type</InputLabel>
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

            <FormControl fullWidth margin="normal">
              <InputLabel>Activity</InputLabel>
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
            <Typography variant="h6" gutterBottom>Exclude</Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Object Type</InputLabel>
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

            <FormControl fullWidth margin="normal">
              <InputLabel>Activity</InputLabel>
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

        {/* Bottom buttons */}
        <Box sx={{ mt: 6, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSave}>Save</Button>
        </Box>
      </Box>
    </Dialog>
  );
}
