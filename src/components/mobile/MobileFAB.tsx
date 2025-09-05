"use client";
import { Fab, useMediaQuery, useTheme } from "@mui/material";
import { Add } from "@mui/icons-material";

interface MobileFABProps {
  onClick: () => void;
  icon?: React.ReactNode;
  tooltip?: string;
  color?: 'primary' | 'secondary' | 'default';
}

export default function MobileFAB({ 
  onClick, 
  icon = <Add />, 
  tooltip = "افزودن",
  color = 'primary'
}: MobileFABProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!isMobile) return null;

  return (
    <Fab
      color={color}
      sx={{ 
        position: 'fixed', 
        bottom: 16, 
        right: 16,
        zIndex: 1000,
        boxShadow: 4,
        '&:hover': {
          boxShadow: 6,
          transform: 'scale(1.05)'
        },
        transition: 'all 0.2s ease-in-out'
      }}
      onClick={onClick}
      aria-label={tooltip}
    >
      {icon}
    </Fab>
  );
}

