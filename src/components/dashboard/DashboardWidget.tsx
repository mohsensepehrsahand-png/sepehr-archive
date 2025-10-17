"use client";
import { Box, IconButton, Paper, Tooltip } from "@mui/material";
import { DragIndicator, Close } from "@mui/icons-material";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DashboardWidgetProps {
  id: string;
  children: React.ReactNode;
  onRemove?: (id: string) => void;
}

export default function DashboardWidget({ id, children, onRemove }: DashboardWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{ 
        position: 'relative',
        height: '100%',
        '&:hover .drag-handle': {
          opacity: 1
        }
      }}
    >
      <Box
        className="drag-handle"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 10,
          display: 'flex',
          gap: 0.5,
          opacity: 0,
          transition: 'opacity 0.2s',
          bgcolor: 'background.paper',
          borderRadius: 1,
          boxShadow: 1
        }}
      >
        <Tooltip title="جابجایی">
          <IconButton 
            size="small" 
            {...attributes} 
            {...listeners}
            sx={{ 
              cursor: 'grab',
              '&:active': { cursor: 'grabbing' }
            }}
          >
            <DragIndicator fontSize="small" />
          </IconButton>
        </Tooltip>
        {onRemove && (
          <Tooltip title="حذف از داشبورد">
            <IconButton 
              size="small" 
              onClick={() => onRemove(id)}
              color="error"
            >
              <Close fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {children}
    </Box>
  );
}

