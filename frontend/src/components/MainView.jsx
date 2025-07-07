import { useEffect, useState } from "react";
import {
  Box,
  List,
  ListItem,
  Typography,
  Chip,
  Stack,
  IconButton
} from "@mui/material";
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useGlobal } from "../GlobalContext";
import RuleEditor from "./RuleEditor";

export default function MainView() {
  const { processes, setProcesses } = useGlobal();
  const [groupedRules, setGroupedRules] = useState({});
  const [editingRule, setEditingRule] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);


  const onRuleDelete = (processName, ruleName) => {
    setProcesses((prev) =>
      prev.filter((rule) => !(rule.processName === processName && rule.ruleName === ruleName))
    );
  };

  const onRuleEdit = (processName, ruleName) => {
    const ruleToEdit = processes.find(
      (rule) => rule.processName === processName && rule.ruleName === ruleName
    );
    if (ruleToEdit) {
      setEditingRule(ruleToEdit);
      setIsEditorOpen(true);
    }
  };


  useEffect(() => {
    const grouped = {};

    processes.forEach(rule => {
      const { processName, ruleName, includeObjectTypes, excludeObjectTypes, includeActivities, excludeActivities } = rule;

      if (!grouped[processName]) {
        grouped[processName] = [];
      }

      grouped[processName].push({
        ruleName,
        includeObjectTypes,
        excludeObjectTypes,
        includeActivities,
        excludeActivities
      });
    });

    setGroupedRules(grouped);
  }, [processes]);

  return (
    <div>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          width: "70vw",
          height: "calc(100vh - 64px)",
          position: "fixed",
          right: 0,
          bottom: 0,
          overflowY: "auto"
        }}
      >
        <Box
          sx={{
            width: "70vw",
            display: "flex",
            padding: "12px 0",
            borderBottom: "1.5px solid #757575"
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold", fontSize: "1.1rem", paddingLeft: "26px" }}
          >
            Process View Rule List
          </Typography>
        </Box>

        <List sx={{ mb: "32px" }}>
          {Object.entries(groupedRules).map(([processName, rules]) => (
            <ListItem
              key={processName}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                width: "70vw",
                paddingLeft: "38px",
                borderBottom: "1px solid #ADB5BD"
              }}
            >

              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", fontSize: "1rem", mb: 1 }}
              >
                {processName}
              </Typography>

              {rules.map((rule, index) => (
                <Box
                  key={`${rule.ruleName}-${index}`}
                  sx={{
                    width: "100%",
                    backgroundColor: "#f9f9f9",
                    padding: "12px",
                    marginBottom: "16px",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    position: "relative"
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 16,
                      display: "flex",
                      gap: 1,
                    }}
                  >
                    <IconButton
                      size="small"
                      aria-label="edit rule"
                      onClick={() => onRuleEdit(processName, rule.ruleName)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                      size="small"
                      aria-label="delete rule"
                      color="error"
                      onClick={() => onRuleDelete(processName, rule.ruleName)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    Rule: {rule.ruleName}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Include Objects:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" mb={1}>
                    {rule.includeObjectTypes.map((obj, i) => (
                      <Chip
                        key={i}
                        label={obj}
                        icon={<CategoryOutlinedIcon />}
                        color="success"
                        variant="outlined"
                      />
                    ))}
                  </Stack>

                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Exclude Objects:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" mb={1}>
                    {rule.excludeObjectTypes.map((obj, i) => (
                      <Chip
                        key={i}
                        label={obj}
                        icon={<CategoryOutlinedIcon />}
                        color="error"
                        variant="outlined"
                      />
                    ))}
                  </Stack>

                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Include Activities:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" mb={1}>
                    {rule.includeActivities.map((act, i) => (
                      <Chip
                        key={i}
                        label={act}
                        icon={<EventOutlinedIcon />}
                        color="success"
                        variant="outlined"
                      />
                    ))}
                  </Stack>

                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Exclude Activities:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {rule.excludeActivities.map((act, i) => (
                      <Chip
                        key={i}
                        label={act}
                        icon={<EventOutlinedIcon />}
                        color="error"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </Box>
              ))}
            </ListItem>
          ))}
        </List>
      </Box>
      <RuleEditor
        open={isEditorOpen && editingRule}
        rule={editingRule}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingRule(null);
        }}
        onSave={(updatedRule) => {
          setProcesses((prev) =>
            prev.map((r) =>
              r.processName === updatedRule.processName &&
              r.ruleName === updatedRule.ruleName
                ? updatedRule
                : r
            )
          );
          setIsEditorOpen(false);
          setEditingRule(null);
        }}
      />
    </div>
  );
}
