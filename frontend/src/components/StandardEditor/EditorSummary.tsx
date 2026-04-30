import { Stack, Typography } from "@mui/material";
import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/TipsAndUpdatesOutlined";
import { EntityList, SelectedEntities } from "./types";

interface EditorSummaryProps {
  includeOT: EntityList;
  includeAct: EntityList;
  excludeOT: EntityList;
  excludeAct: EntityList;
}

export default function EditorSummary({
  includeOT,
  includeAct,
  excludeOT,
  excludeAct,
}: EditorSummaryProps) {
  const allEmpty =
    includeOT.length +
      includeAct.length +
      excludeOT.length +
      excludeAct.length ===
    0;

  const buildSummary = () => {
    const parts = [];

    if (includeOT.length > 0 || includeAct.length > 0) {
      const includeParts = [];

      if (includeOT.length > 0) {
        includeParts.push(
          `events involving object type(s) of <strong>${includeOT.join(", and ")}</strong>`,
        );
      }

      if (includeAct.length > 0) {
        includeParts.push(
          `events classified under activity type(s) <strong>${includeAct.join(", or ")}</strong>`,
        );
      }

      parts.push(`Will include ${includeParts.join(" or ")}`);
    }

    if (excludeOT.length > 0 || excludeAct.length > 0) {
      const excludeParts = [];

      if (excludeOT.length > 0) {
        excludeParts.push(
          `events involving object type(s) <strong>${excludeOT.join(", and ")}</strong>`,
        );
      }

      if (excludeAct.length > 0) {
        excludeParts.push(
          `events classified under activity type(s) <strong>${excludeAct.join(", or ")}</strong>`,
        );
      }

      parts.push(`Will exclude ${excludeParts.join(" or ")}`);
    }

    return parts.join(". ") + ".";
  };

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
        <Typography dangerouslySetInnerHTML={{ __html: buildSummary() }} />
      )}
    </Stack>
  );
}
