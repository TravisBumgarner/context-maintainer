import { createTheme, type Theme } from "@mui/material/styles";
import { detectColorMode } from "./utils";

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
      MuiTypography: {
        styleOverrides: {
          root: { fontSize: ui.fontSize.md, color: textColor(0.55) },
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
            },
          },
        ],
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
          root: { fontSize: ui.fontSize.md, fontFamily: "inherit", color: textColor(0.7) },
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
