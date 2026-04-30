import { Button } from "@mui/joy";
import Add from "@mui/icons-material/Add";

interface NewButtonProps {
  setSelectOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function NewButton({ setSelectOpen }: NewButtonProps) {
  return (
    <Button
      size="lg"
      variant="soft"
      color="neutral"
      startDecorator={<Add />}
      sx={{
        width: "160px",
        height: "62px",
        borderRadius: "xl",
        bgcolor: "white",
        "&:hover": { bgcolor: "neutral.100" },
        position: "fixed",
        right: "68px",
        bottom: "68px",
        boxShadow: "0px 4px 10px rgba(0,0,0,0.3)",
        fontSize: "120",
        fontWeight: "bold",
        "--Button-gap": "12px",
      }}
      onClick={() => {
        setSelectOpen(true);
      }}
    >
      Add New
    </Button>
  );
}
