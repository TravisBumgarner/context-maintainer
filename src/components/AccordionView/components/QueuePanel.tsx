import { Box, IconButton, InputBase, Typography } from "@mui/material";
import { Add } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { Reorder } from "framer-motion";
import TodoItem from "./TodoItem";
import { useTodoStore, EMPTY_TODOS } from "../../../stores";

interface QueuePanelProps {
  desktopId: number;
}

export default function QueuePanel({ desktopId }: QueuePanelProps) {
  const { tc, ui } = useTheme().custom;
  const todos = useTodoStore((s) => s.allTodos[s.activeDesktopId] ?? EMPTY_TODOS);
  const newText = useTodoStore((s) => s.newText);
  const setNewText = useTodoStore((s) => s.setNewText);
  const addTodo = useTodoStore((s) => s.addTodo);
  const toggleDone = useTodoStore((s) => s.toggleDone);
  const updateText = useTodoStore((s) => s.updateText);
  const deleteTodo = useTodoStore((s) => s.deleteTodo);
  const reorderTodos = useTodoStore((s) => s.reorderTodos);

  const active = todos.filter((t) => !t.done);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: `${ui.spacing.itemPx}px`,
          py: `${ui.spacing.itemPy}px`,
          gap: `${ui.spacing.gap}px`,
        }}
      >
        <InputBase
          placeholder="Add task..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo(desktopId)}
          sx={{
            flex: 1,
            minWidth: 0,
            p: 0,
            border: `1px solid ${tc(0.2)}`,
            px: "6px",
            "& input": { p: "3px 0" },
            "& input::placeholder": { color: tc(0.35) },
            "&.Mui-focused": { borderColor: tc(0.45) },
          }}
        />
        <IconButton
          onClick={() => addTodo(desktopId)}
          disabled={!newText.trim()}
          sx={{
            flex: "0 0 auto",
            fontSize: ui.fontSize.lg,
            color: newText.trim() ? tc(0.45) : tc(0.15),
          }}
        >
          <Add fontSize="inherit" />
        </IconButton>
      </Box>

      <Reorder.Group
        axis="y"
        values={active}
        onReorder={(reordered) => reorderTodos(reordered, desktopId)}
        style={{
          overflowY: "auto",
          padding: "2px 0",
          minHeight: 0,
          listStyle: "none",
          margin: 0,
        }}
      >
        {active.map((item) => (
          <Reorder.Item key={item.id} value={item} style={{ listStyle: "none" }}>
            <TodoItem
              item={item}
              dragHandle={
                <Typography
                  sx={{
                    flexShrink: 0,
                    cursor: "grab",
                    color: tc(0.2),
                    fontSize: ui.fontSize.sm,
                    px: "2px",
                    "&:active": { cursor: "grabbing" },
                  }}
                >
                  ⠿
                </Typography>
              }
              onToggle={() => toggleDone(item.id, desktopId)}
              onUpdate={(text) => updateText(item.id, text, desktopId)}
              onDelete={() => deleteTodo(item.id, desktopId)}
            />
          </Reorder.Item>
        ))}
      </Reorder.Group>

    </>
  );
}
