import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { TodoItem } from "../types";
import { useHistoryStore } from "./useHistoryStore";

interface TodoState {
  todos: TodoItem[];
  title: string;
  newText: string;
  saveTimer: ReturnType<typeof setTimeout> | null;
  titleTimer: ReturnType<typeof setTimeout> | null;

  setTodos: (todos: TodoItem[]) => void;
  setTitle: (title: string) => void;
  setNewText: (text: string) => void;

  loadTodos: (desktopId: number) => Promise<void>;
  loadTitle: (desktopId: number) => Promise<void>;
  saveTodos: (desktopId: number, items: TodoItem[]) => void;
  saveTitle: (desktopId: number, title: string) => void;

  addTodo: (desktopId: number) => void;
  toggleDone: (id: string, desktopId: number) => void;
  updateText: (id: string, text: string, desktopId: number) => void;
  deleteTodo: (id: string, desktopId: number) => void;
  reorderTodos: (reordered: TodoItem[], desktopId: number) => void;
  updateTitle: (value: string, desktopId: number) => void;
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  title: "",
  newText: "",
  saveTimer: null,
  titleTimer: null,

  setTodos: (todos) => set({ todos }),
  setTitle: (title) => set({ title }),
  setNewText: (text) => set({ newText: text }),

  loadTodos: async (desktopId) => {
    try {
      const items = await invoke<TodoItem[]>("get_todos", { desktop: desktopId });
      set({ todos: items });
    } catch {
      set({ todos: [] });
    }
  },

  loadTitle: async (desktopId) => {
    try {
      const t = await invoke<string>("get_title", { desktop: desktopId });
      set({ title: t });
    } catch {
      set({ title: "" });
    }
  },

  saveTodos: (desktopId, items) => {
    invoke("save_todos", { desktop: desktopId, todos: items }).catch(() => {});
  },

  saveTitle: (desktopId, title) => {
    invoke("save_title", { desktop: desktopId, title }).catch(() => {});
  },

  addTodo: (desktopId) => {
    const { newText, todos, saveTodos } = get();
    const text = newText.trim();
    if (!text) return;

    const updated = [...todos, { id: crypto.randomUUID(), text, done: false }];
    set({ todos: updated, newText: "" });

    const timer = get().saveTimer;
    if (timer) clearTimeout(timer);
    const newTimer = setTimeout(() => {
      saveTodos(desktopId, updated);
    }, 300);
    set({ saveTimer: newTimer });
  },

  toggleDone: (id, desktopId) => {
    const { todos, saveTodos } = get();
    const item = todos.find((t) => t.id === id);
    if (!item) return;

    // Remove from todos and archive to history
    const updated = todos.filter((t) => t.id !== id);
    set({ todos: updated });
    useHistoryStore.getState().addCompleted(item.text, desktopId);

    const timer = get().saveTimer;
    if (timer) clearTimeout(timer);
    const newTimer = setTimeout(() => {
      saveTodos(desktopId, updated);
    }, 300);
    set({ saveTimer: newTimer });
  },

  updateText: (id, text, desktopId) => {
    const { todos, saveTodos } = get();
    const updated = todos.map((t) => (t.id === id ? { ...t, text } : t));
    set({ todos: updated });

    const timer = get().saveTimer;
    if (timer) clearTimeout(timer);
    const newTimer = setTimeout(() => {
      saveTodos(desktopId, updated);
    }, 300);
    set({ saveTimer: newTimer });
  },

  deleteTodo: (id, desktopId) => {
    const { todos, saveTodos } = get();
    const updated = todos.filter((t) => t.id !== id);
    set({ todos: updated });

    const timer = get().saveTimer;
    if (timer) clearTimeout(timer);
    const newTimer = setTimeout(() => {
      saveTodos(desktopId, updated);
    }, 300);
    set({ saveTimer: newTimer });
  },

  reorderTodos: (reordered, desktopId) => {
    const { todos, saveTodos } = get();
    const doneItems = todos.filter((t) => t.done);
    const updated = [...reordered, ...doneItems];
    set({ todos: updated });

    const timer = get().saveTimer;
    if (timer) clearTimeout(timer);
    const newTimer = setTimeout(() => {
      saveTodos(desktopId, updated);
    }, 300);
    set({ saveTimer: newTimer });
  },

  updateTitle: (value, desktopId) => {
    const { saveTitle } = get();
    set({ title: value });

    const timer = get().titleTimer;
    if (timer) clearTimeout(timer);
    const newTimer = setTimeout(() => saveTitle(desktopId, value), 300);
    set({ titleTimer: newTimer });
  },
}));
