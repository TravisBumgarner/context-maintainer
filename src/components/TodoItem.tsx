import { Box, Checkbox, InputBase, IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { TodoItem as TodoItemType } from "../types";

interface TodoItemProps {
  item: TodoItemType;
  isDone?: boolean;
  dragHandle?: React.ReactNode;
  onToggle: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

export default function TodoItem({
  item,
  isDone,
  dragHandle,
  onToggle,
  onUpdate,
  onDelete,
}: TodoItemProps) {
  const theme = useTheme();
  const tc = theme.custom.tc;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        px: "10px",
        py: "2px",
        gap: "4px",
        transition: "background 0.1s",
        "&:hover": { bgcolor: tc(0.04) },
        "&:hover .delete-btn": { opacity: 1 },
      }}
    >
      {dragHandle}
      <Checkbox
        size="small"
        checked={item.done}
        onChange={() => onToggle(item.id)}
        sx={{
          flexShrink: 0,
          p: 0,
          width: 13,
          height: 13,
          "& .MuiSvgIcon-root": { fontSize: 15 },
          color: tc(0.3),
          "&.Mui-checked": { color: tc(0.5) },
        }}
      />
      <InputBase
        value={item.text}
        onChange={(e) => onUpdate(item.id, e.target.value)}
        readOnly={isDone}
        placeholder="empty"
        sx={{
          flex: 1,
          minWidth: 0,
          fontSize: 11,
          fontFamily: "inherit",
          color: tc(isDone ? 0.35 : 0.7),
          p: "2px 0",
          textDecoration: isDone ? "line-through" : "none",
          "& input::placeholder": { color: tc(0.25) },
        }}
      />
      <IconButton
        className="delete-btn"
        onClick={() => onDelete(item.id)}
        sx={{
          flexShrink: 0,
          background: "none",
          color: tc(0.2),
          fontSize: 12,
          p: "0 2px",
          lineHeight: 1,
          opacity: 0,
          transition: "opacity 0.15s",
          borderRadius: 0,
          minWidth: 0,
          "&:hover": { color: tc(0.5), background: "none" },
        }}
      >
        ✕
      </IconButton>
    </Box>
  );
}
