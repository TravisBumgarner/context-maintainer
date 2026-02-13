import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";
import { useTheme } from "@mui/material/styles";

interface CollapsibleSectionProps {
    label: string;
    isExpanded: boolean;
    onToggle: () => void;
    children: ReactNode;
    preview?: string;
}

export default function CollapsibleSection({
    label,
    isExpanded,
    onToggle,
    children,
    preview,
}: CollapsibleSectionProps) {
    const tc = useTheme().custom.tc;

    const sectionLabelSx = {
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        color: tc(0.45),
    } as const;

    const summaryPreviewSx = {
        color: tc(0.35),
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        ml: "8px",
        flex: 1,
    } as const;

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                flexGrow: isExpanded ? 1 : 0,
                minHeight: isExpanded ? 0 : "auto",
                backgroundColor: isExpanded ? tc(0.08) : "transparent",
            }}
        >
            {/* Header */}
            <Box
                onClick={onToggle}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    padding: "4px 16px",
                    cursor: "pointer",
                    userSelect: "none",
                    "&:hover": {
                        backgroundColor: tc(0.05),
                    },
                }}
            >
                <Typography sx={sectionLabelSx}>{label}</Typography>
                {!isExpanded && preview && (
                    <Typography sx={summaryPreviewSx}>{preview}</Typography>
                )}
            </Box>

            {/* Content */}
            {isExpanded && (
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        minHeight: 0,
                        overflow: "hidden",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {children}
                </Box>
            )}
        </Box>
    );
}
