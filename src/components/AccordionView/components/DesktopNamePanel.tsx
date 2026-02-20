import { InputBase } from "@mui/material";
import { useTodoStore } from "../../../stores";

interface DesktopNamePanelProps {
  desktopId: number;
}

export default function DesktopNamePanel({ desktopId }: DesktopNamePanelProps) {
  const title = useTodoStore((s) => s.allTitles[s.activeDesktopId] ?? "");
  const updateTitle = useTodoStore((s) => s.updateTitle);

  return (
    <InputBase
      placeholder="Name this desktop"
      value={title}
      onChange={(e) => updateTitle(e.target.value, desktopId)}
      sx={{
        width: "100%",
        px: "14px",
        "& input": { p: "3px 0" },
      }}
    />
  );
}
