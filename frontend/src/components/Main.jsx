import {
  Box,
  ButtonGroup,
  IconButton,
  Card,
  Chip,
  Divider,
  Sheet,
  Stack,
  Typography,
  Tooltip,
} from "@mui/joy";
import { ActivityIcon, AttributeIcon, ObjectIcon } from "../CustomIcons";
import LogicEditor from "./LogicEditor";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useProcessStore } from "../stores/processStore";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import { grey } from "@mui/material/colors";
import { useGlobal } from "../GlobalContext";
import SelectCard from "./AdvancedEditor/SelectBar";
import { useState } from "react";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import FlagCircleIcon from "@mui/icons-material/FlagCircle";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import BlockIcon from "@mui/icons-material/Block";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import PolylineRoundedIcon from "@mui/icons-material/PolylineRounded";
import RuleRoundedIcon from "@mui/icons-material/RuleRounded";

export default function Main() {
  const { setProcessLogicData, setProcesses, setDeletedProcesses } =
    useGlobal();

  const processData = useProcessStore((state) => state.processData);
  const setProcessData = useProcessStore((state) => state.setProcessData);
  const requestEditRule = useProcessStore((state) => state.requestEditRule);
  const requestEditTrace = useProcessStore((state) => state.requestEditTrace);

  const handleDelete = ({ ruleName, parentProcess }) => {
    const updatedProcesses = (Array.isArray(processData) ? processData : []).map(
      (process) => {
        if (process.processName === parentProcess) {
          if (Array.isArray(process.rules)) {
            return {
              ...process,
              rules: process.rules.filter((rule) => rule.ruleName != ruleName),
              relations: {},
            };
          }
          if (Array.isArray(process.traces)) {
            return {
              ...process,
              traces: process.traces.filter((trace) => trace.traceName != ruleName),
              relations: {},
            };
          }
          return {
            ...process,
            relations: {},
          };
        } else {
          return process;
        }
      },
    );

    const deletedProcesses = updatedProcesses
      .filter(
        (process) =>
          (Array.isArray(process.rules) && process.rules.length === 0) ||
          (Array.isArray(process.traces) && process.traces.length === 0),
      )
      .map((process) => process.processName);

    setDeletedProcesses((pr) => [...pr, ...deletedProcesses]);

    setProcessLogicData((prevLogic) => {
      const safeLogic = prevLogic ?? {};
      const nextLogic = { ...safeLogic };
      deletedProcesses.forEach((processName) => {
        delete nextLogic[processName];
      });
      return nextLogic;
    });

    const newProcessData = updatedProcesses.filter((process) => {
      if (Array.isArray(process.rules)) return process.rules.length !== 0;
      if (Array.isArray(process.traces)) return process.traces.length !== 0;
      return true;
    });

    setProcesses((pr) => {
      return pr.filter((p) => !deletedProcesses.includes(p.name));
    });
    setProcessData(newProcessData);
  };

  const ButtonBar = ({
    ruleName,
    parentProcess,
    editable = true,
    editType = "rule",
  }) => {
    return (
      <Stack>
        {editable && (
          <>
            <Tooltip title="Edit" variant="outlined" placement="left">
              <IconButton
                onClick={() => {
                  if (editType === "trace") {
                    requestEditTrace(parentProcess, ruleName);
                  } else {
                    requestEditRule(parentProcess, ruleName);
                  }
                }}
              >
                <EditIcon sx={{ color: grey[600] }} />
              </IconButton>
            </Tooltip>
            <Divider sx={{ ml: 0.6, mr: 0.6 }} />
          </>
        )}
        <Tooltip title="Delete" variant="outlined" placement="left">
          <IconButton
            onClick={() => {
              console.log(processData);
              handleDelete({
                ruleName: ruleName,
                parentProcess: parentProcess,
              });
            }}
          >
            <DeleteIcon sx={{ color: grey[600] }} />
          </IconButton>
        </Tooltip>
      </Stack>
    );
  };

  const TimelineNode = ({ title, icon, color, children, isLast }) => (
    <Box sx={{ display: "flex", mb: isLast ? 0 : -0.8 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: 40,
          mr: 2.5,
          ml: 1,
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: `${color}.softBg`,
            color: `${color}.500`,
            boxShadow: "sm",
            mb: 0.5,
            zIndex: 1,
          }}
        >
          {icon}
        </Box>
        {!isLast && (
          <Box
            sx={{
              width: 2,
              flexGrow: 1,
              bgcolor: "neutral.200",
              my: 0.5,
              borderRadius: 1,
              minHeight: 24,
            }}
          />
        )}
      </Box>

      <Box sx={{ flexGrow: 1, pb: 1.5 }}>
        <Typography
          level="title-sm"
          color={color}
          sx={{
            mb: 0.5,
            mt: 0,
            ml: 12,
            lineHeight: "32px",
            textAlign: "left",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            fontWeight: "xl",
          }}
        >
          {title}
        </Typography>
        {children}
      </Box>
    </Box>
  );

  const EntityRow = ({ label, items, icon, color }) => {
    if (!items || items.length === 0) return null;
    return (
      <Stack
        direction="row"
        spacing={1}
        mb={0.5}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
      >
        <Box sx={{ display: "flex", width: 100 }}>
          <Typography
            level="body-sm"
            sx={{ color: "neutral.500", fontWeight: "md" }}
          >
            {label}
          </Typography>
        </Box>

        {items.map((entity) => (
          <Chip
            key={entity}
            variant="outlined"
            size="lg"
            startDecorator={icon}
            sx={{
              border: "1.6px solid",
              fontWeight: "bold",
              borderColor: `${color}.300`,
              color: `${color}.500`,
              backgroundColor: "transparent",
              boxShadow: "xs",
              transition: "all 0.2s",
              "&:hover": {
                backgroundColor: `${color}.50`,
              },
            }}
          >
            {entity}
          </Chip>
        ))}
      </Stack>
    );
  };

  const TraceCard = ({ trace }) => {
    const hasInclude =
      trace.includeOT?.length > 0 || trace.includeAct?.length > 0;
    const hasExclude =
      trace.excludeOT?.length > 0 || trace.excludeAct?.length > 0;

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-start",
          gap: 2,
        }}
      >
        <Card
          variant="soft"
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            width: "91%",
            bgcolor: "white",
            boxShadow: "md",
            borderRadius: "xl",
            p: 2.5,
            pb: 1,
            mb: 1.6,
            overflowX: "auto",
          }}
        >
          <Box
            sx={{
              ml: 1,
              mb: 0.5,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <PolylineRoundedIcon />
            <Typography
              level="h4"
              sx={{ fontWeight: "xl", color: "neutral.800" }}
            >
              Rule: {trace.traceName}
            </Typography>
          </Box>

          <TimelineNode
            title="Start Point"
            icon={<PlayCircleIcon />}
            color="primary"
          >
            <EntityRow
              label="Objects"
              items={trace.startOT}
              icon={<ObjectIcon />}
              color="primary"
            />
            <EntityRow
              label="Activities"
              items={trace.startAct}
              icon={<ActivityIcon />}
              color="primary"
            />
          </TimelineNode>

          {hasInclude && (
            <TimelineNode
              title="To Include"
              icon={<TaskAltIcon />}
              color="success"
            >
              <EntityRow
                label="Objects"
                items={trace.includeOT}
                icon={<ObjectIcon />}
                color="success"
              />
              <EntityRow
                label="Activities"
                items={trace.includeAct}
                icon={<ActivityIcon />}
                color="success"
              />
            </TimelineNode>
          )}

          {hasExclude && (
            <TimelineNode
              title="To Exclude"
              icon={<BlockIcon />}
              color="danger"
            >
              <EntityRow
                label="Objects"
                items={trace.excludeOT}
                icon={<ObjectIcon />}
                color="danger"
              />
              <EntityRow
                label="Activities"
                items={trace.excludeAct}
                icon={<ActivityIcon />}
                color="danger"
              />
            </TimelineNode>
          )}

          <TimelineNode
            title="End Point"
            icon={<StopCircleIcon />}
            color="primary"
            isLast={true}
          >
            <EntityRow
              label="Objects"
              items={trace.endOT}
              icon={<ObjectIcon />}
              color="primary"
            />
            <EntityRow
              label="Activities"
              items={trace.endAct}
              icon={<ActivityIcon />}
              color="primary"
            />
          </TimelineNode>
        </Card>

        <ButtonBar
          ruleName={trace.traceName}
          parentProcess={trace.parentProcess}
          editType="trace"
        />
      </Box>
    );
  };

  const RuleCard = ({ rule }) => {
    const hasInclude =
      rule.includeOT?.entities?.length > 0 ||
      rule.includeAct?.entities?.length > 0;
    const hasExclude =
      rule.excludeOT?.entities?.length > 0 ||
      rule.excludeAct?.entities?.length > 0;

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-start",
          gap: 2,
        }}
      >
        <Card
          variant="soft"
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            width: "91%",
            bgcolor: "white",
            boxShadow: "md",
            borderRadius: "xl",
            p: 2.5,
            pb: 1,
            mb: 1.6,
            overflowX: "auto",
          }}
        >
          <Box
            sx={{
              ml: 1,
              mb: 0.5,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <RuleRoundedIcon />
            <Typography
              level="h4"
              sx={{ fontWeight: "xl", color: "neutral.800" }}
            >
              Rule: {rule.ruleName}
            </Typography>
          </Box>

          {hasInclude && (
            <TimelineNode
              title="To Include"
              icon={<TaskAltIcon />}
              color="success"
              isLast={!hasExclude}
            >
              <EntityRow
                label="Objects"
                items={rule.includeOT?.entities}
                icon={<ObjectIcon />}
                color="success"
              />
              <EntityRow
                label="Activities"
                items={rule.includeAct?.entities}
                icon={<ActivityIcon />}
                color="success"
              />
            </TimelineNode>
          )}

          {hasExclude && (
            <TimelineNode
              title="To Exclude"
              icon={<BlockIcon />}
              color="danger"
              isLast={true}
            >
              <EntityRow
                label="Objects"
                items={rule.excludeOT?.entities}
                icon={<ObjectIcon />}
                color="danger"
              />
              <EntityRow
                label="Activities"
                items={rule.excludeAct?.entities}
                icon={<ActivityIcon />}
                color="danger"
              />
            </TimelineNode>
          )}
        </Card>

        <ButtonBar
          ruleName={rule.ruleName}
          parentProcess={rule.parentProcess}
        />
      </Box>
    );
  };

  const ProcessCard = ({ process }) => {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
          }}
        >
          <Typography level="h4" sx={{ pl: 1, mb: 1 }}>
            Process: {process.processName}
          </Typography>
        </Box>
        <Box sx={{ width: "100%" }}>
          {"rules" in process
            ? process.rules.map((rule) => (
                <RuleCard key={rule.ruleName} rule={rule} />
              ))
            : process.traces.map((trace) => (
                <TraceCard key={trace.traceName} trace={trace} />
              ))}
        </Box>
        <Divider sx={{ width: "100%", mt: 2, mb: 2 }} />
      </Box>
    );
  };

  const [checkedOTList, setCheckedOTList] = useState([]);
  const [checkedActList, setCheckedActList] = useState([]);

  return (
    <Sheet
      variant="plain"
      color="neutral"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        p: 2.5,
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <Box sx={{ mb: -1 }}>
        <Typography sx={{ fontSize: 22, fontWeight: "bold", p: 1.2 }}>
          {" "}
          Process View List{" "}
        </Typography>
      </Box>
      <Box sx={{ p: 1.2, width: "100%" }}>
        {(Array.isArray(processData) ? processData : []).map((process) => (
          <ProcessCard key={process.processName} process={process} />
        ))}
      </Box>
    </Sheet>
  );
}
