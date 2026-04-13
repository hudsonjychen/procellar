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
import { EditingEditor } from "./Editor/index";
import SelectCard from "./SmartEditor/SelectBar";
import { useState } from "react";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import FlagCircleIcon from "@mui/icons-material/FlagCircle";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import BlockIcon from "@mui/icons-material/Block";
import StopCircleIcon from "@mui/icons-material/StopCircle";

export default function Main() {
  const { setProcessLogicData, setProcesses, setDeletedProcesses } =
    useGlobal();

  const processData = useProcessStore((state) => state.processData);
  const setProcessData = useProcessStore((state) => state.setProcessData);

  const handleDelete = ({ ruleName, parentProcess }) => {
    setProcessData((prev) => {
      return prev.map((process) => {
        if (process.processName === parentProcess) {
          return {
            ...process,
            rules: process.rules.filter((rule) => rule.ruleName != ruleName),
            relations: {},
          };
        } else {
          return process;
        }
      });
    });
    setProcessLogicData((prev) => {
      const { [parentProcess]: _, ...rest } = prev;
      return rest;
    });
  };

  const cleanEmptyProcess = () => {
    setProcessData((prev) => {
      const deletedProcesses = prev
        .filter((process) => process.rules.length == 0)
        .map((pr) => pr.processName);
      console.log(deletedProcesses);
      setDeletedProcesses((pr) => [...pr, ...deletedProcesses]);
      const newProcessData = prev.filter(
        (process) => process.rules.length != 0,
      );
      const updatedProcessList = newProcessData.map((data) => data.processName);
      setProcesses((pr) => {
        return pr.filter((p) => !deletedProcesses.includes(p.name));
      });
      return newProcessData;
    });
  };

  const ButtonBar = ({ ruleName, parentProcess }) => {
    return (
      <Stack>
        <EditingEditor ruleName={ruleName} processName={parentProcess} />
        <Divider sx={{ ml: 0.6, mr: 0.6 }} />
        <Tooltip title="Delete" variant="outlined" placement="left">
          <IconButton
            onClick={() => {
              console.log(processData);
              handleDelete({
                ruleName: ruleName,
                parentProcess: parentProcess,
              });
              cleanEmptyProcess();
            }}
          >
            <DeleteIcon sx={{ color: grey[600] }} />
          </IconButton>
        </Tooltip>
      </Stack>
    );
  };

  const RuleCard = ({ rule }) => {
    return (
      <Box
        sx={{
          display: "flex",
          direction: "row",
          justifyContent: "flex-start",
          gap: 2,
        }}
      >
        <Card
          variant="soft"
          sx={{
            display: "flex",
            direction: "column",
            alignItems: "flex-start",
            width: "91%",
            bgcolor: "white",
            boxShadow: "md",
            borderRadius: "xl",
            overflow: "hidden",
            p: 2,
            pb: 3,
            mb: 1.6,
            overflowX: "auto",
          }}
        >
          <Box sx={{ ml: 1 }}>
            <Typography level="title-lg">Rule: {rule.ruleName}</Typography>
          </Box>
          {/* include object type section */}
          {rule.includeOT.entities.length > 0 && (
            <Stack direction="row" spacing={1} m={1} mb={-1}>
              <Box sx={{ display: "flex", width: 162 }}>
                <Typography level="title-md" color="neutral">
                  Include
                </Typography>
              </Box>
              {rule.includeOT.entities.map((entity, index) => (
                <Chip
                  key={entity}
                  variant="outlined"
                  size="lg"
                  startDecorator={<ObjectIcon />}
                  sx={{
                    border: "1.6px solid",
                    fontWeight: "bold",
                    borderColor: "success.300",
                    color: "success.500",
                    backgroundColor: "transparent",
                  }}
                >
                  {entity}
                </Chip>
              ))}
            </Stack>
          )}
          {/* include object type condition section */}
          {rule.includeOT.condition.length > 0 && (
            <Box>
              {rule.includeOT.condition.map((cond, index) => (
                <Stack direction="row" spacing={1} ml={22.3} mb={0.2}>
                  <Chip
                    key={index}
                    variant="outlined"
                    size="md"
                    startDecorator={<FilterAltOutlinedIcon />}
                    sx={{
                      border: "1.6px solid",
                      fontWeight: "bold",
                      borderColor: "neutral.300",
                      color: "neutral.500",
                      backgroundColor: "transparent",
                    }}
                  >
                    <Chip
                      key={index}
                      variant="outlined"
                      size="md"
                      startDecorator={<ObjectIcon />}
                      sx={{
                        border: "1.6px solid",
                        fontWeight: "bold",
                        borderColor: "transparent",
                        color: "neutral.500",
                        backgroundColor: "transparent",
                      }}
                    >
                      {cond.entity}
                    </Chip>
                    <Chip
                      key={index}
                      variant="outlined"
                      size="md"
                      startDecorator={<AttributeIcon />}
                      sx={{
                        border: "1.6px solid",
                        fontWeight: "bold",
                        borderColor: "transparent",
                        color: "neutral.500",
                        backgroundColor: "transparent",
                      }}
                    >
                      {cond.attribute}
                    </Chip>
                    <Chip
                      key={index}
                      variant="outlined"
                      size="md"
                      sx={{
                        border: "1.6px solid",
                        fontWeight: "bold",
                        borderColor: "transparent",
                        color: "neutral.500",
                        backgroundColor: "transparent",
                      }}
                    >
                      {cond.operator + " " + cond.value}
                    </Chip>
                  </Chip>
                </Stack>
              ))}
            </Box>
          )}
          {/* include activity section */}
          {rule.includeAct.entities.length > 0 && (
            <Stack direction="row" spacing={1} m={1} mb={-1}>
              <Box sx={{ display: "flex", width: 162 }}>
                <Typography level="title-md" color="neutral">
                  Include
                </Typography>
              </Box>
              {rule.includeAct.entities.map((entity) => (
                <Chip
                  key={entity}
                  variant="outlined"
                  size="lg"
                  startDecorator={<ActivityIcon />}
                  sx={{
                    border: "1.6px solid",
                    fontWeight: "bold",
                    borderColor: "success.300",
                    color: "success.500",
                    backgroundColor: "transparent",
                  }}
                >
                  {entity}
                </Chip>
              ))}
            </Stack>
          )}
          {/* include activity condition section */}
          {rule.includeAct.condition.length > 0 && (
            <Box>
              {rule.includeAct.condition.map((cond, index) => (
                <Stack direction="row" spacing={1} ml={22.3} mb={0.2}>
                  <Chip
                    key={index}
                    variant="outlined"
                    size="md"
                    startDecorator={<FilterAltOutlinedIcon />}
                    sx={{
                      border: "1.6px solid",
                      fontWeight: "bold",
                      borderColor: "neutral.300",
                      color: "neutral.500",
                      backgroundColor: "transparent",
                    }}
                  >
                    <Chip
                      key={index}
                      variant="outlined"
                      size="md"
                      startDecorator={<ActivityIcon />}
                      sx={{
                        border: "1.6px solid",
                        fontWeight: "bold",
                        borderColor: "transparent",
                        color: "neutral.500",
                        backgroundColor: "transparent",
                      }}
                    >
                      {cond.entity}
                    </Chip>
                    <Chip
                      key={index}
                      variant="outlined"
                      size="md"
                      startDecorator={<AttributeIcon />}
                      sx={{
                        border: "1.6px solid",
                        fontWeight: "bold",
                        borderColor: "transparent",
                        color: "neutral.500",
                        backgroundColor: "transparent",
                      }}
                    >
                      {cond.attribute}
                    </Chip>
                    <Chip
                      key={index}
                      variant="outlined"
                      size="md"
                      sx={{
                        border: "1.6px solid",
                        fontWeight: "bold",
                        borderColor: "transparent",
                        color: "neutral.500",
                        backgroundColor: "transparent",
                      }}
                    >
                      {cond.operator + " " + cond.value}
                    </Chip>
                  </Chip>
                </Stack>
              ))}
            </Box>
          )}
          {/* exclude object type section */}
          {rule.excludeOT.entities.length > 0 && (
            <Stack direction="row" spacing={1} m={1} mb={-1}>
              <Box sx={{ display: "flex", width: 162 }}>
                <Typography level="title-md" color="neutral">
                  Exclude
                </Typography>
              </Box>
              {rule.excludeOT.entities.map((entity) => (
                <Chip
                  key={entity}
                  variant="outlined"
                  size="lg"
                  startDecorator={<ObjectIcon />}
                  sx={{
                    border: "1.6px solid",
                    fontWeight: "bold",
                    borderColor: "danger.300",
                    color: "danger.500",
                    backgroundColor: "transparent",
                  }}
                >
                  {entity}
                </Chip>
              ))}
            </Stack>
          )}
          {/* exclude object type condition section */}
          {rule.excludeOT.condition.length > 0 && (
            <Box>
              {rule.excludeOT.condition.map((cond, index) => (
                <Stack direction="row" spacing={1} ml={22.3} mb={0.2}>
                  <Chip
                    key={index}
                    variant="outlined"
                    size="md"
                    startDecorator={<FilterAltOutlinedIcon />}
                    sx={{
                      border: "1.6px solid",
                      fontWeight: "bold",
                      borderColor: "neutral.300",
                      color: "neutral.500",
                      backgroundColor: "transparent",
                    }}
                  >
                    <Chip
                      key={index}
                      variant="outlined"
                      size="md"
                      startDecorator={<ObjectIcon />}
                      sx={{
                        border: "1.6px solid",
                        fontWeight: "bold",
                        borderColor: "transparent",
                        color: "neutral.500",
                        backgroundColor: "transparent",
                      }}
                    >
                      {cond.entity}
                    </Chip>
                    <Chip
                      key={index}
                      variant="outlined"
                      size="md"
                      startDecorator={<AttributeIcon />}
                      sx={{
                        border: "1.6px solid",
                        fontWeight: "bold",
                        borderColor: "transparent",
                        color: "neutral.500",
                        backgroundColor: "transparent",
                      }}
                    >
                      {cond.attribute}
                    </Chip>
                    <Chip
                      key={index}
                      variant="outlined"
                      size="md"
                      sx={{
                        border: "1.6px solid",
                        fontWeight: "bold",
                        borderColor: "transparent",
                        color: "neutral.500",
                        backgroundColor: "transparent",
                      }}
                    >
                      {cond.operator + " " + cond.value}
                    </Chip>
                  </Chip>
                </Stack>
              ))}
            </Box>
          )}
          {/* exclude activiy section */}
          {rule.excludeAct.entities.length > 0 && (
            <Stack direction="row" spacing={1} m={1} mb={-1}>
              <Box sx={{ display: "flex", width: 162 }}>
                <Typography level="title-md" color="neutral">
                  Exclude
                </Typography>
              </Box>
              {rule.excludeAct.entities.map((entity) => (
                <Chip
                  key={entity}
                  variant="outlined"
                  size="lg"
                  startDecorator={<ActivityIcon />}
                  sx={{
                    border: "1.6px solid",
                    fontWeight: "bold",
                    borderColor: "danger.300",
                    color: "danger.500",
                    backgroundColor: "transparent",
                  }}
                >
                  {entity}
                </Chip>
              ))}
            </Stack>
          )}
          {/* exclude activity condition section */}
          {rule.excludeAct.condition.length > 0 && (
            <Box>
              {rule.excludeAct.condition.map((cond, index) => (
                <Stack direction="row" spacing={1} ml={22.3} mb={0.2}>
                  <Chip
                    key={index}
                    variant="outlined"
                    size="md"
                    startDecorator={<FilterAltOutlinedIcon />}
                    sx={{
                      border: "1.6px solid",
                      fontWeight: "bold",
                      borderColor: "neutral.300",
                      color: "neutral.500",
                      backgroundColor: "transparent",
                    }}
                  >
                    <Chip
                      key={index}
                      variant="outlined"
                      size="md"
                      startDecorator={<ActivityIcon />}
                      sx={{
                        border: "1.6px solid",
                        fontWeight: "bold",
                        borderColor: "transparent",
                        color: "neutral.500",
                        backgroundColor: "transparent",
                      }}
                    >
                      {cond.entity}
                    </Chip>
                    <Chip
                      key={index}
                      variant="outlined"
                      size="md"
                      startDecorator={<AttributeIcon />}
                      sx={{
                        border: "1.6px solid",
                        fontWeight: "bold",
                        borderColor: "transparent",
                        color: "neutral.500",
                        backgroundColor: "transparent",
                      }}
                    >
                      {cond.attribute}
                    </Chip>
                    <Chip
                      key={index}
                      variant="outlined"
                      size="md"
                      sx={{
                        border: "1.6px solid",
                        fontWeight: "bold",
                        borderColor: "transparent",
                        color: "neutral.500",
                        backgroundColor: "transparent",
                      }}
                    >
                      {cond.operator + " " + cond.value}
                    </Chip>
                  </Chip>
                </Stack>
              ))}
            </Box>
          )}
        </Card>
        <ButtonBar
          ruleName={rule.ruleName}
          parentProcess={rule.parentProcess}
        />
      </Box>
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
            <Typography
              level="h4"
              sx={{ fontWeight: "xl", color: "neutral.800" }}
            >
              Trace: {trace.traceName}
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
        {processData.map((process) => (
          <ProcessCard key={process.processName} process={process} />
        ))}
      </Box>
    </Sheet>
  );
}
