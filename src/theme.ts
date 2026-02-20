import { createTheme, type Theme } from "@mui/material/styles";
import { detectColorMode } from "./utils";

export const BG_OVERLAY_LIGHT = "rgba(0,0,0,0.04)";
export const BG_OVERLAY = "rgba(0,0,0,0.06)";

// Focus UI constants — dense, monospace, sharp edges
const ui = {
  fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
  timerFontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
  fontSize: { xs: 8, sm: 9, md: 10, lg: 12, xl: 18, timer: 28 },
  spacing: { panelPx: 8, panelPy: 4, itemPx: 2, itemPy: 1, gap: 2 },
  weights: { normal: 400, semibold: 500, bold: 600, heavy: 700 },
  letterSpacing: { tight: "0px", normal: "0.5px", wide: "2px" },
} as const;

export type UIConstants = typeof ui;

declare module "@mui/material/styles" {
  interface Theme {
    custom: {
      tc: (amount?: number) => string;
      tcInv: (amount?: number) => string;
      bg: string;
      ui: UIConstants;
    };
  }
  interface ThemeOptions {
    custom?: {
      tc?: (amount?: number) => string;
      tcInv?: (amount?: number) => string;
      bg?: string;
      ui?: UIConstants;
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

  const textColor = (amount = 1) => mix(fgRgb, bgRgb, boost(amount));
  const textColorInverse = (amount = 1) => mix(fgInvRgb, bgRgb, boost(amount));

  return createTheme({
    shape: { borderRadius: 0 },
    typography: {
      fontFamily: ui.fontFamily,
      fontSize: ui.fontSize.sm,
      // Default variant — most common text style
      body1: { fontSize: ui.fontSize.sm, color: textColor(0.5) },
      // Secondary / muted text
      body2: { fontSize: ui.fontSize.sm, color: textColor(0.4) },
      // Tiny meta text
      caption: { fontSize: ui.fontSize.xs, color: textColor(0.3) },
      // Modal / section headings
      h6: { fontSize: ui.fontSize.lg, fontWeight: ui.weights.bold, color: textColor(0.6) },
      // Emphasized labels
      subtitle1: { fontSize: ui.fontSize.sm, fontWeight: ui.weights.semibold, color: textColor(0.6) },
      // Softer labels
      subtitle2: { fontSize: ui.fontSize.sm, fontWeight: ui.weights.semibold, color: textColor(0.5) },
      // Disabled / placeholder text
      overline: { fontSize: ui.fontSize.sm, color: textColor(0.35), textTransform: "none", letterSpacing: "normal" },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            overflow: "hidden",
            WebkitFontSmoothing: "antialiased",
            backgroundColor: bgColor,
            userSelect: "none",
            WebkitUserSelect: "none",
            cursor: "default",
          },
          "input, textarea, [contenteditable]": {
            userSelect: "text",
            WebkitUserSelect: "text",
          },
        },
      },
      MuiTypography: {
        defaultProps: {
          variant: "body1",
          variantMapping: {
            h6: "span",
            subtitle1: "span",
            subtitle2: "span",
            body1: "span",
            body2: "span",
            caption: "span",
            overline: "span",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            background: "none",
            textTransform: "none",
            minWidth: 0,
            fontWeight: ui.weights.semibold,
            fontSize: ui.fontSize.md,
            color: textColor(0.45),
            boxShadow: "none",
            "&:hover": { background: "none" },
          },
        },
        variants: [
          {
            props: { variant: "contained" },
            style: {
              marginTop: 0.5,
              paddingLeft: "10px",
              paddingRight: "10px",
              paddingTop: "3px",
              paddingBottom: "3px",
              fontSize: ui.fontSize.sm,
              color: textColorInverse(),
              backgroundColor: textColor(0.45),
              "&:hover": { backgroundColor: textColor(0.6) },
              "&.Mui-disabled": { color: textColor(0.2), backgroundColor: textColor(0.15) },
            },
          },
        ],
      },
      MuiLink: {
        styleOverrides: {
          root: {
            fontSize: "inherit",
            color: "inherit",
            textDecorationColor: "inherit",
            verticalAlign: "baseline",
            "&:hover": { color: textColor(0.7) },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            background: "none",
            borderRadius: 0,
            "&:hover": { background: "none" },
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            fontSize: ui.fontSize.md,
            fontFamily: "inherit",
            color: textColor(0.7),
            "& input::placeholder": { color: textColor(0.35), opacity: 1 },
          },
        },
      },
      MuiAccordion: {
        defaultProps: { disableGutters: true },
        styleOverrides: {
          root: {
            background: "transparent",
            boxShadow: "none",
            "&:before": { display: "none" },
            "&.Mui-expanded": { margin: 0 },
          },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: {
            minHeight: "28px !important",
            paddingLeft: 10,
            paddingRight: 10,
            "& .MuiAccordionSummary-content": {
              margin: "4px 0 !important",
              alignItems: "center",
              overflow: "hidden",
            },
            "& .MuiAccordionSummary-expandIconWrapper": {
              color: textColor(0.3),
              fontSize: 16,
            },
          },
        },
      },
      MuiAccordionDetails: {
        styleOverrides: {
          root: {
            paddingLeft: 10,
            paddingRight: 10,
            paddingTop: 4,
            paddingBottom: 4,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: 0,
            "& .MuiTabs-indicator": { backgroundColor: textColor(0.45) },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontSize: ui.fontSize.md,
            fontWeight: ui.weights.semibold,
            color: textColor(0.35),
            textTransform: "none",
            minHeight: 0,
            padding: "5px 0",
            "&.Mui-selected": { color: textColor(0.65) },
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            "& .MuiSwitch-switchBase.Mui-checked": { color: textColor(0.6) },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
              backgroundColor: textColor(0.3),
            },
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: { backgroundColor: textColor(0.12) },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            color: textColor(0.3),
            "&.Mui-checked": { color: textColor(0.5) },
          },
        },
      },
    },
    custom: { tc: textColor, tcInv: textColorInverse, bg: bgColor, ui },
  });
}
