import { IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import {
  Add,
  Close,
  History,
  InfoOutlined,
  LightbulbOutlined,
  OpenWith,
  Pause,
  PlayArrow,
  Remove,
  Replay,
  Tune,
} from "@mui/icons-material";

const ICONS = {
  add: Add,
  close: Close,
  history: History,
  info: InfoOutlined,
  lightbulb: LightbulbOutlined,
  openWith: OpenWith,
  pause: Pause,
  play: PlayArrow,
  remove: Remove,
  replay: Replay,
  tune: Tune,
} as const;

export type AppIcon = keyof typeof ICONS;

interface AppIconButtonProps {
  icon: AppIcon;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  sx?: SxProps<Theme>;
}

export default function AppIconButton({ icon, onClick, disabled, className, sx }: AppIconButtonProps) {
  const { tc } = useTheme().custom;
  const Icon = ICONS[icon];

  return (
    <IconButton
      onClick={onClick}
      disabled={disabled}
      size="small"
      className={className}
      sx={{
        p: "2px",
        color: tc(0.4),
        "&:hover": { color: tc(0.6) },
        ...sx as object,
      }}
    >
      <Icon fontSize="inherit" />
    </IconButton>
  );
}
