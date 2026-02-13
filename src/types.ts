export type AnchorPosition =
  | "top-left" | "top-center" | "top-right"
  | "middle-left" | "middle-center" | "middle-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

export interface DesktopInfo {
  space_id: number;
  position: number;
  name: string;
  color: string;
}

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

export interface DesktopSummary {
  space_id: number;
  position: number;
  name: string;
  title: string;
  color: string;
  todo_count: number;
}

export interface SpaceInfo {
  space_id: number;
  position: number;
  name: string;
  title: string;
  color: string;
}

export interface SavedContext {
  title: string;
  todos: TodoItem[];
  saved_at: string;
}

export type ContextHistory = Record<number, SavedContext[]>;

export interface Settings {
  custom_colors: Record<number, string>;
  setup_complete: boolean;
  desktop_count: number;
  timer_presets: number[];
  notify_system: boolean;
  notify_flash: boolean;
}

export interface DisplayGroup {
  display_index: number;
  desktops: DesktopSummary[];
}

export type ViewType =
  | "loading"
  | "setup"
  | "session-chooser"
  | "todos"
  | "history-picker"
  | "settings";

export type AccordionPanel = "queue" | "timer" | "anchor" | "desktops";
