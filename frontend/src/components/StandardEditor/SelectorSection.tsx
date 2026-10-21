import { Stack, Tooltip, Typography } from "@mui/joy";
import HelpOutlinedIcon from "@mui/icons-material/HelpOutlined";
import SelectorList from "./SelectorList";
import {
  ActionType,
  AttributeMapList,
  DraftSelectors,
  EntityList,
} from "./types";

interface SelectorSectionProps {
  action: ActionType;
  selectors: DraftSelectors;
  setSelectors: React.Dispatch<React.SetStateAction<DraftSelectors>>;
  objectTypeList: EntityList;
  activityList: EntityList;
  showConditions?: boolean;
  attrMapList?: AttributeMapList;
}

export default function SelectorSection({
  action,
  selectors,
  setSelectors,
  objectTypeList,
  activityList,
  showConditions = false,
  attrMapList,
}: SelectorSectionProps) {
  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="flex-start"
      sx={{ pt: 1, pb: action === "include" ? 2 : 1 }}
    >
      <Stack direction="row" alignItems="center" sx={{ width: 86, mt: 1 }}>
        <Typography level="title-md">
          {action === "include" ? "Include" : "Exclude"}
        </Typography>
        <Tooltip
          variant="outlined"
          title={
            <>
              A selector matches events of its activity (at most one)
              <br />
              that are related to all of its object types.
              <br />
              Multiple selectors are combined with OR.
            </>
          }
        >
          <HelpOutlinedIcon fontSize="small" sx={{ color: "#999", ml: 0.5 }} />
        </Tooltip>
      </Stack>

      <SelectorList
        selectors={selectors[action]}
        onChange={(next) =>
          setSelectors((prev) => ({ ...prev, [action]: next }))
        }
        objectTypeList={objectTypeList}
        activityList={activityList}
        color={action === "include" ? "success" : "danger"}
        showConditions={showConditions}
        attrMapList={attrMapList}
      />
    </Stack>
  );
}
