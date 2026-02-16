import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { TodoItem } from "../types";
import { useHistoryStore } from "./useHistoryStore";
import { useUIStore } from "./useUIStore";

export const EMPTY_TODOS: TodoItem[] = [];

interface TodoState {
  allTodos: Record<number, TodoItem[]>;
  allTitles: Record<number, string>;
  activeDesktopId: number;
  newText: string;
  saveTimer: ReturnType<typeof setTimeout> | null;
  titleTimer: ReturnType<typeof setTimeout> | null;

  todos: () => TodoItem[];
  title: () => string;
  setNewText: (text: string) => void;

  loadAll: (desktopIds: number[]) => Promise<void>;
  switchTo: (desktopId: number) => void;
  clearAll: () => void;
  reloadDesktop: (desktopId: number) => Promise<void>;

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
  allTodos: {},
  allTitles: {},
  activeDesktopId: 0,
  newText: "",
  saveTimer: null,
  titleTimer: null,

  todos: () => {
    const { allTodos, activeDesktopId } = get();
    return allTodos[activeDesktopId] ?? [];
  },
  title: () => {
    const { allTitles, activeDesktopId } = get();
    return allTitles[activeDesktopId] ?? "";
  },
  setNewText: (text) => set({ newText: text }),

  loadAll: async (desktopIds) => {
    const results = await Promise.all(
      desktopIds.map(async (id) => {
        const [todos, title] = await Promise.all([
          invoke<TodoItem[]>("get_todos", { desktop: id }).catch(() => [] as TodoItem[]),
          invoke<string>("get_title", { desktop: id }).catch(() => ""),
        ]);
        return { id, todos, title };
      })
    );
    const allTodos: Record<number, TodoItem[]> = {};
    const allTitles: Record<number, string> = {};
    for (const r of results) {
      allTodos[r.id] = r.todos;
      allTitles[r.id] = r.title;
    }
    set({ allTodos, allTitles });
  },

  switchTo: (desktopId) => {
    set({ activeDesktopId: desktopId });
  },

  clearAll: () => {
    set({ allTodos: {}, allTitles: {} });
  },

  reloadDesktop: async (desktopId) => {
    const [todos, title] = await Promise.all([
      invoke<TodoItem[]>("get_todos", { desktop: desktopId }).catch(() => [] as TodoItem[]),
      invoke<string>("get_title", { desktop: desktopId }).catch(() => ""),
    ]);
    set((state) => ({
      allTodos: { ...state.allTodos, [desktopId]: todos },
      allTitles: { ...state.allTitles, [desktopId]: title },
    }));
  },

  saveTodos: (desktopId, items) => {
    invoke("save_todos", { desktop: desktopId, todos: items }).catch(() => {});
  },

  saveTitle: (desktopId, title) => {
    invoke("save_title", { desktop: desktopId, title }).catch(() => {});
  },

  addTodo: (desktopId) => {
    const { newText, allTodos, saveTodos } = get();
    const text = newText.trim();
    if (!text) return;

    const current = allTodos[desktopId] ?? [];
    const updated = [...current, { id: crypto.randomUUID(), text, done: false }];
    set((state) => ({
      allTodos: { ...state.allTodos, [desktopId]: updated },
      newText: "",
    }));

    const timer = get().saveTimer;
    if (timer) clearTimeout(timer);
    const newTimer = setTimeout(() => {
      saveTodos(desktopId, updated);
    }, 300);
    set({ saveTimer: newTimer });
  },

  toggleDone: (id, desktopId) => {
    const { allTodos, saveTodos } = get();
    const current = allTodos[desktopId] ?? [];
    const item = current.find((t) => t.id === id);
    if (!item) return;

    const updated = current.filter((t) => t.id !== id);
    set((state) => ({
      allTodos: { ...state.allTodos, [desktopId]: updated },
    }));
    useHistoryStore.getState().addCompleted(item.text, desktopId);

    const timer = get().saveTimer;
    if (timer) clearTimeout(timer);
    const newTimer = setTimeout(() => {
      saveTodos(desktopId, updated);
    }, 300);
    set({ saveTimer: newTimer });
  },

  updateText: (id, text, desktopId) => {
    const { allTodos, saveTodos } = get();
    const current = allTodos[desktopId] ?? [];
    const updated = current.map((t) => (t.id === id ? { ...t, text } : t));
    set((state) => ({
      allTodos: { ...state.allTodos, [desktopId]: updated },
    }));

    const timer = get().saveTimer;
    if (timer) clearTimeout(timer);
    const newTimer = setTimeout(() => {
      saveTodos(desktopId, updated);
    }, 300);
    set({ saveTimer: newTimer });
  },

  deleteTodo: (id, desktopId) => {
    const { allTodos, saveTodos } = get();
    const current = allTodos[desktopId] ?? [];
    const updated = current.filter((t) => t.id !== id);
    set((state) => ({
      allTodos: { ...state.allTodos, [desktopId]: updated },
    }));

    const timer = get().saveTimer;
    if (timer) clearTimeout(timer);
    const newTimer = setTimeout(() => {
      saveTodos(desktopId, updated);
    }, 300);
    set({ saveTimer: newTimer });
  },

  reorderTodos: (reordered, desktopId) => {
    const { allTodos, saveTodos } = get();
    const current = allTodos[desktopId] ?? [];
    const doneItems = current.filter((t) => t.done);
    const updated = [...reordered, ...doneItems];
    set((state) => ({
      allTodos: { ...state.allTodos, [desktopId]: updated },
    }));

    const timer = get().saveTimer;
    if (timer) clearTimeout(timer);
    const newTimer = setTimeout(() => {
      saveTodos(desktopId, updated);
    }, 300);
    set({ saveTimer: newTimer });
  },

  updateTitle: (value, desktopId) => {
    const { saveTitle } = get();
    set((state) => ({
      allTitles: { ...state.allTitles, [desktopId]: value },
    }));

    // Optimistically update the tab strip
    const ui = useUIStore.getState();
    ui.setDisplayGroups(
      ui.displayGroups.map((g) => ({
        ...g,
        desktops: g.desktops.map((d) =>
          d.space_id === desktopId ? { ...d, title: value } : d
        ),
      }))
    );

    const timer = get().titleTimer;
    if (timer) clearTimeout(timer);
    const newTimer = setTimeout(() => saveTitle(desktopId, value), 300);
    set({ titleTimer: newTimer });
  },
}));
