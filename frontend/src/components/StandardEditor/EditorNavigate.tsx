import { Button } from "@mui/joy";

interface EditorNavigateProps {
  setFromOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setToOpen: React.Dispatch<React.SetStateAction<boolean>>;
  text: string;
}

export default function EditorNavigate({
  setFromOpen,
  setToOpen,
  text,
}: EditorNavigateProps) {
  return (
    <Button
      variant="plain"
      color="primary"
      sx={{
        p: 0,
        m: 0,
        minWidth: "unset",
        background: "none",
        fontWeight: "bold",
        textDecoration: "underline",
        "&:hover": {
          background: "none",
          textDecoration: "underline",
        },
      }}
      onClick={() => {
        setFromOpen(false);
        setToOpen(true);
      }}
    >
      {text}
    </Button>
  );
}
