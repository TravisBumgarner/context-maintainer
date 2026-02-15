import { Box, InputBase, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Reorder } from "framer-motion";
import TodoItem from "./TodoItem";
import { useTodoStore } from "../../../stores";

interface QueuePanelProps {
  desktopId: number;
}

export default function QueuePanel({ desktopId }: QueuePanelProps) {
  const { tc, ui } = useTheme().custom;
  const {
    todos,
    newText,
    setNewText,
    addTodo,
    toggleDone,
    updateText,
    deleteTodo,
    reorderTodos,
  } = useTodoStore();

  const active = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

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
            "& input": { p: 0 },
            "& input::placeholder": { color: tc(0.3) },
          }}
        />
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
                    userSelect: "none",
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

      {done.length > 0 && (
        <Box
          component="details"
          sx={{
            flexShrink: 0,
            borderTop: `1px solid ${tc(0.08)}`,
            "& summary": {
              fontSize: ui.fontSize.sm,
              color: tc(0.35),
              px: `${ui.spacing.itemPx}px`,
              py: `${ui.spacing.itemPy}px`,
              cursor: "pointer",
              userSelect: "none",
              listStyle: "none",
              "&::-webkit-details-marker": { display: "none" },
              "&::before": { content: '"\\25B6  "', fontSize: 8 },
            },
            "&[open] summary::before": { content: '"\\25BC  "' },
          }}
        >
          <summary>Done ({done.length})</summary>
          <Box
            sx={{
              maxHeight: 80,
              overflowY: "auto",
              "&::-webkit-scrollbar": { width: 4 },
              "&::-webkit-scrollbar-thumb": {
                background: tc(0.1),
              },
            }}
          >
            {done.map((item) => (
              <TodoItem
                key={item.id}
                item={item}
                isDone
                onToggle={() => toggleDone(item.id, desktopId)}
                onUpdate={(text) => updateText(item.id, text, desktopId)}
                onDelete={() => deleteTodo(item.id, desktopId)}
              />
            ))}
          </Box>
        </Box>
      )}
    </>
  );
}
