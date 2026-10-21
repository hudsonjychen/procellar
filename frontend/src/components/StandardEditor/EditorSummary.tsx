import { Fragment, ReactNode } from "react";
import { Stack, Typography } from "@mui/material";
import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/TipsAndUpdatesOutlined";
import { DraftSelectors, DraftSelector } from "./types";
import { isEmptySelector } from "./selectors";

interface EditorSummaryProps {
  selectors: DraftSelectors;
}

const joinNodes = (nodes: ReactNode[], separator: string) =>
  nodes.map((node, i) => (
    <Fragment key={i}>
      {i > 0 && separator}
      {node}
    </Fragment>
  ));

const describeSelector = (selector: DraftSelector) => {
  const objectTypes = joinNodes(
    selector.objectTypes.map((ot) => <strong>{ot}</strong>),
    ", and ",
  );
  if (selector.activity && selector.objectTypes.length > 0) {
    return (
      <>
        events of activity <strong>{selector.activity}</strong> involving object
        type(s) {objectTypes}
      </>
    );
  }
  if (selector.activity) {
    return (
      <>
        events of activity <strong>{selector.activity}</strong>
      </>
    );
  }
  return <>events involving object type(s) {objectTypes}</>;
};

export default function EditorSummary({ selectors }: EditorSummaryProps) {
  const include = selectors.include.filter((s) => !isEmptySelector(s));
  const exclude = selectors.exclude.filter((s) => !isEmptySelector(s));
  const allEmpty = include.length + exclude.length === 0;

  const parts: ReactNode[] = [];
  if (include.length > 0) {
    parts.push(
      <>Will include {joinNodes(include.map(describeSelector), ", or ")}</>,
    );
  }
  if (exclude.length > 0) {
    parts.push(
      <>Will exclude {joinNodes(exclude.map(describeSelector), ", or ")}</>,
    );
  }

  return (
    <Stack
      direction="row"
      justifyContent="flex-start"
      alignItems="flex-start"
      spacing={2}
      sx={{ m: 2, pt: 1, pb: 1 }}
    >
      <TipsAndUpdatesOutlinedIcon />
      {allEmpty ? (
        <Typography>
          Start configuring and reviewing the defined scope of the selected
          events in this section.
        </Typography>
      ) : (
        <Typography>
          {joinNodes(parts, ". ")}.
        </Typography>
      )}
    </Stack>
  );
}
