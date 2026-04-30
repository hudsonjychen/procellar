import { Chip } from "@mui/joy";
import { ActivityIcon, ObjectIcon } from "../../CustomIcons";

interface Props {
  entityType: "objectType" | "activity";
  label: string;
  color?: string;
}
export default function EntityChip({ entityType, label, color }: Props) {
  const startDecorator =
    entityType === "objectType" ? <ObjectIcon /> : <ActivityIcon />;
  return (
    <Chip
      key={label}
      variant="outlined"
      size="md"
      startDecorator={startDecorator}
      sx={{
        border: "1.6px solid",
        fontWeight: "bold",
        borderColor: color ? `${color}.300` : "primary.300",
        color: color ? `${color}.500` : "primary.500",
        backgroundColor: "transparent",
      }}
    >
      {label}
    </Chip>
  );
}
