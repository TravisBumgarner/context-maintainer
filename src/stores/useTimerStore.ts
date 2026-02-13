import { create } from "zustand";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

interface TimerState {
  hours: number;
  minutes: number;
  seconds: number;
  running: boolean;
  remaining: number;
  flashing: boolean;
  timerRef: ReturnType<typeof setInterval> | null;

  setHours: (h: number) => void;
  setMinutes: (m: number) => void;
  setSeconds: (s: number) => void;
  setFlashing: (f: boolean) => void;

  startTimer: (notifySystem: boolean, notifyFlash: boolean) => void;
  cancelTimer: () => void;
  populateFromPreset: (seconds: number) => void;
  tick: (notifySystem: boolean, notifyFlash: boolean) => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  hours: 0,
  minutes: 0,
  seconds: 0,
  running: false,
  remaining: 0,
  flashing: false,
  timerRef: null,

  setHours: (h) => set({ hours: h }),
  setMinutes: (m) => set({ minutes: m }),
  setSeconds: (s) => set({ seconds: s }),
  setFlashing: (f) => set({ flashing: f }),

  startTimer: (notifySystem, notifyFlash) => {
    const { hours, minutes, seconds } = get();
    const total = hours * 3600 + minutes * 60 + seconds;
    if (total <= 0) return;

    set({ remaining: total, running: true });

    const intervalId = setInterval(() => {
      get().tick(notifySystem, notifyFlash);
    }, 1000);
    set({ timerRef: intervalId });
  },

  cancelTimer: () => {
    const { timerRef } = get();
    if (timerRef) {
      clearInterval(timerRef);
      set({ timerRef: null });
    }
    set({ running: false, remaining: 0 });
  },

  populateFromPreset: (seconds) => {
    set({
      hours: Math.floor(seconds / 3600),
      minutes: Math.floor((seconds % 3600) / 60),
      seconds: seconds % 60,
    });
  },

  tick: async (notifySystem, notifyFlash) => {
    const { remaining, timerRef } = get();

    if (remaining <= 1) {
      if (timerRef) {
        clearInterval(timerRef);
        set({ timerRef: null });
      }
      set({ running: false, remaining: 0 });

      // Fire notification
      if (notifySystem) {
        let granted = await isPermissionGranted();
        if (!granted) {
          const permission = await requestPermission();
          granted = permission === "granted";
        }
        if (granted) {
          sendNotification({ title: "Timer Done", body: "Your timer has finished!" });
        }
      }
      if (notifyFlash) {
        set({ flashing: true });
        setTimeout(() => set({ flashing: false }), 1500);
      }
    } else {
      set({ remaining: remaining - 1 });
    }
  },
}));
