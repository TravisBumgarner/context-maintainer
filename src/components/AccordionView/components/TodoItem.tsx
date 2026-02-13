import { Box, Checkbox, InputBase, IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { TodoItem as TodoItemType } from "../../../types";

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
        px: "4px",
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
          p: "2px 0",
          ...(isDone && { color: tc(0.35), textDecoration: "line-through" }),
          "& input::placeholder": { color: tc(0.25) },
        }}
      />
      <IconButton
        className="delete-btn"
        onClick={() => onDelete(item.id)}
        sx={{
          flexShrink: 0,
          color: tc(0.2),
          fontSize: 12,
          p: "0 2px",
          lineHeight: 1,
          opacity: 0,
          transition: "opacity 0.15s",
          "&:hover": { color: tc(0.5) },
        }}
      >
        ✕
      </IconButton>
    </Box>
  );
}
