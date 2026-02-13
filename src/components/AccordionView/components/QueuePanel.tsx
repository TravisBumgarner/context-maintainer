import { Box, InputBase, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Reorder } from "framer-motion";
import TodoItem from "./TodoItem";
import type { TodoItem as TodoItemType } from "../../../types";

interface QueuePanelProps {
  todos: TodoItemType[];
  newText: string;
  onNewTextChange: (v: string) => void;
  onAddTodo: () => void;
  onToggleDone: (id: string) => void;
  onUpdateText: (id: string, text: string) => void;
  onDeleteTodo: (id: string) => void;
  onReorder: (items: TodoItemType[]) => void;
}

export default function QueuePanel({
  todos,
  newText,
  onNewTextChange,
  onAddTodo,
  onToggleDone,
  onUpdateText,
  onDeleteTodo,
  onReorder,
}: QueuePanelProps) {
  const tc = useTheme().custom.tc;
  const active = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  return (
    <>
      <Reorder.Group
        axis="y"
        values={active}
        onReorder={onReorder}
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
              onToggle={onToggleDone}
              onUpdate={onUpdateText}
              onDelete={onDeleteTodo}
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
          onChange={(e) => onNewTextChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAddTodo()}
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
                onToggle={onToggleDone}
                onUpdate={onUpdateText}
                onDelete={onDeleteTodo}
              />
            ))}
          </Box>
        </Box>
      )}
    </>
  );
}
