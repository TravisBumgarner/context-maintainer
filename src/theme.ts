import { createTheme, type Theme } from "@mui/material/styles";
import { detectColorMode } from "./utils";

declare module "@mui/material/styles" {
  interface Theme {
    custom: {
      tc: (amount?: number) => string;
      tcInv: (amount?: number) => string;
      bg: string;
    };
  }
  interface ThemeOptions {
    custom?: {
      tc?: (amount?: number) => string;
      tcInv?: (amount?: number) => string;
      bg?: string;
    };
  }
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function mix(fg: [number, number, number], bg: [number, number, number], t: number): string {
  const r = Math.round(bg[0] + (fg[0] - bg[0]) * t);
  const g = Math.round(bg[1] + (fg[1] - bg[1]) * t);
  const b = Math.round(bg[2] + (fg[2] - bg[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export function buildTheme(bgColor: string): Theme {
  const mode = detectColorMode(bgColor);
  const bgRgb = hexToRgb(bgColor);
  const fgRgb: [number, number, number] = mode === "dark" ? [0, 0, 0] : [255, 255, 255];
  const fgInvRgb: [number, number, number] = mode === "dark" ? [255, 255, 255] : [0, 0, 0];

  // Boost contrast: push mix amounts harder toward the foreground.
  // 0.3 → 0.55, 0.5 → 0.71, 0.7 → 0.84, 0.9 → 0.95
  const boost = (t: number) => Math.pow(t, 0.5);

  const tc = (amount = 1) => mix(fgRgb, bgRgb, boost(amount));
  const tcInv = (amount = 1) => mix(fgInvRgb, bgRgb, boost(amount));

  return createTheme({
    typography: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "SF Pro Rounded", sans-serif',
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            overflow: "hidden",
            WebkitFontSmoothing: "antialiased",
          },
        },
      },
    },
    custom: { tc, tcInv, bg: bgColor },
  });
}
