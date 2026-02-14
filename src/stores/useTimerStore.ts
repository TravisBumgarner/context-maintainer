import { create } from "zustand";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

interface PerDesktopTimer {
  hours: number;
  minutes: number;
  seconds: number;
  running: boolean;
  remaining: number;
  flashing: boolean;
  timerRef: ReturnType<typeof setInterval> | null;
}

const defaultTimer = (): PerDesktopTimer => ({
  hours: 0,
  minutes: 0,
  seconds: 0,
  running: false,
  remaining: 0,
  flashing: false,
  timerRef: null,
});

interface TimerState {
  timers: Record<number, PerDesktopTimer>;
  activeDesktop: number;

  setActiveDesktop: (id: number) => void;
  getActiveTimer: () => PerDesktopTimer;

  setHours: (h: number) => void;
  setMinutes: (m: number) => void;
  setSeconds: (s: number) => void;
  setFlashing: (f: boolean) => void;

  startTimer: (notifySystem: boolean, notifyFlash: boolean) => void;
  cancelTimer: () => void;
  populateFromPreset: (seconds: number) => void;
  tick: (desktopId: number, notifySystem: boolean, notifyFlash: boolean) => void;
}

function getTimer(timers: Record<number, PerDesktopTimer>, id: number): PerDesktopTimer {
  return timers[id] ?? defaultTimer();
}

function updateTimer(
  timers: Record<number, PerDesktopTimer>,
  id: number,
  patch: Partial<PerDesktopTimer>,
): Record<number, PerDesktopTimer> {
  return { ...timers, [id]: { ...getTimer(timers, id), ...patch } };
}

export const useTimerStore = create<TimerState>((set, get) => ({
  timers: {},
  activeDesktop: 0,

  setActiveDesktop: (id) => set({ activeDesktop: id }),

  getActiveTimer: () => {
    const { timers, activeDesktop } = get();
    return getTimer(timers, activeDesktop);
  },

  setHours: (h) => {
    const { activeDesktop, timers } = get();
    set({ timers: updateTimer(timers, activeDesktop, { hours: h }) });
  },
  setMinutes: (m) => {
    const { activeDesktop, timers } = get();
    set({ timers: updateTimer(timers, activeDesktop, { minutes: m }) });
  },
  setSeconds: (s) => {
    const { activeDesktop, timers } = get();
    set({ timers: updateTimer(timers, activeDesktop, { seconds: s }) });
  },
  setFlashing: (f) => {
    const { activeDesktop, timers } = get();
    set({ timers: updateTimer(timers, activeDesktop, { flashing: f }) });
  },

  startTimer: (notifySystem, notifyFlash) => {
    const { activeDesktop, timers } = get();
    const timer = getTimer(timers, activeDesktop);
    const total = timer.hours * 3600 + timer.minutes * 60 + timer.seconds;
    if (total <= 0) return;

    const desktopId = activeDesktop;
    const intervalId = setInterval(() => {
      get().tick(desktopId, notifySystem, notifyFlash);
    }, 1000);

    set({
      timers: updateTimer(timers, activeDesktop, {
        remaining: total,
        running: true,
        timerRef: intervalId,
      }),
    });
  },

  cancelTimer: () => {
    const { activeDesktop, timers } = get();
    const timer = getTimer(timers, activeDesktop);
    if (timer.timerRef) clearInterval(timer.timerRef);
    set({
      timers: updateTimer(timers, activeDesktop, {
        running: false,
        remaining: 0,
        timerRef: null,
      }),
    });
  },

  populateFromPreset: (seconds) => {
    const { activeDesktop, timers } = get();
    set({
      timers: updateTimer(timers, activeDesktop, {
        hours: Math.floor(seconds / 3600),
        minutes: Math.floor((seconds % 3600) / 60),
        seconds: seconds % 60,
      }),
    });
  },

  tick: async (desktopId, notifySystem, notifyFlash) => {
    const { timers } = get();
    const timer = getTimer(timers, desktopId);

    if (timer.remaining <= 1) {
      if (timer.timerRef) clearInterval(timer.timerRef);
      set({
        timers: updateTimer(timers, desktopId, {
          running: false,
          remaining: 0,
          timerRef: null,
        }),
      });

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
        set({
          timers: updateTimer(get().timers, desktopId, { flashing: true }),
        });
        setTimeout(() => {
          set({
            timers: updateTimer(get().timers, desktopId, { flashing: false }),
          });
        }, 1500);
      }
    } else {
      set({
        timers: updateTimer(timers, desktopId, { remaining: timer.remaining - 1 }),
      });
    }
  },
}));
