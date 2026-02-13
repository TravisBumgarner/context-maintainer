import { Box, InputBase, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Reorder } from "framer-motion";
import TodoItem from "./TodoItem";
import { useTodoStore } from "../../../stores";

interface QueuePanelProps {
  desktopId: number;
}

export default function QueuePanel({ desktopId }: QueuePanelProps) {
  const tc = useTheme().custom.tc;
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
      <Reorder.Group
        axis="y"
        values={active}
        onReorder={(reordered) => reorderTodos(reordered, desktopId)}
        style={{
          flex: 1,
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
                    fontSize: 10,
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

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: "10px",
          py: "2px",
          gap: "4px",
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
            p: "2px 0",
            "& input::placeholder": { color: tc(0.3) },
          }}
        />
      </Box>

      {done.length > 0 && (
        <Box
          component="details"
          sx={{
            flexShrink: 0,
            borderTop: `1px solid ${tc(0.08)}`,
            "& summary": {
              fontSize: 10,
              color: tc(0.35),
              px: "10px",
              py: "4px",
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
                borderRadius: "2px",
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
