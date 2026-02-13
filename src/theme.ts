import { createTheme, type Theme } from "@mui/material/styles";
import { textColorRgb, invertRgb } from "./utils";

declare module "@mui/material/styles" {
  interface Theme {
    custom: {
      tc: (alpha?: number) => string;
      tcInv: (alpha?: number) => string;
      bg: string;
    };
  }
  interface ThemeOptions {
    custom?: {
      tc?: (alpha?: number) => string;
      tcInv?: (alpha?: number) => string;
      bg?: string;
    };
  }
}

export function buildTheme(bgColor: string): Theme {
  const tcRgb = textColorRgb(bgColor);
  const tcInvRgb = invertRgb(tcRgb);

  const tc = (alpha = 1) => `rgba(${tcRgb}, ${alpha})`;
  const tcInv = (alpha = 1) => `rgba(${tcInvRgb}, ${alpha})`;

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
