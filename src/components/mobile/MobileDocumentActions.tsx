"use client";
import { 
  Box, 
  Button, 
  IconButton, 
  useTheme, 
  useMediaQuery,
  Tooltip,
  Fade
} from "@mui/material";
import { 
  Visibility, 
  Download, 
  Delete, 
  MoreVert,
  Close
} from "@mui/icons-material";
import { useState } from "react";

interface MobileDocumentActionsProps {
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
  showDelete?: boolean;
  compact?: boolean;
}

export default function MobileDocumentActions({
  onView,
  onDownload,
  onDelete,
  showDelete = false,
  compact = false
}: MobileDocumentActionsProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showActions, setShowActions] = useState(false);

  if (compact && isMobile) {
    return (
      <Box sx={{ position: 'relative' }}>
        <IconButton
          onClick={() => setShowActions(!showActions)}
          sx={{
            bgcolor: 'background.paper',
            boxShadow: 2,
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          <MoreVert />
        </IconButton>
        
        <Fade in={showActions}>
          <Box sx={{
            position: 'absolute',
            top: '100%',
            right: 0,
            mt: 1,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 4,
            p: 1,
            zIndex: 1000,
            minWidth: 200
          }}>
            <Button
              fullWidth
              startIcon={<Visibility />}
              onClick={() => {
                onView();
                setShowActions(false);
              }}
              sx={{
                justifyContent: 'flex-start',
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                mb: 0.5
              }}
            >
              مشاهده
            </Button>
            <Button
              fullWidth
              startIcon={<Download />}
              onClick={() => {
                onDownload();
                setShowActions(false);
              }}
              sx={{
                justifyContent: 'flex-start',
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                mb: showDelete ? 0.5 : 0
              }}
            >
              دانلود
            </Button>
            {showDelete && (
              <Button
                fullWidth
                startIcon={<Delete />}
                onClick={() => {
                  onDelete();
                  setShowActions(false);
                }}
                color="error"
                sx={{
                  justifyContent: 'flex-start',
                  fontFamily: 'Vazirmatn, Arial, sans-serif'
                }}
              >
                حذف
              </Button>
            )}
          </Box>
        </Fade>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 1,
      flexDirection: 'column'
    }}>
      {/* Primary Action - View (Always Available) */}
      <Button
        variant="contained"
        startIcon={<Visibility />}
        onClick={onView}
        sx={{ 
          width: '100%',
          fontFamily: 'Vazirmatn, Arial, sans-serif',
          borderRadius: 2,
          py: 1.5,
          fontSize: '0.875rem',
          fontWeight: 'bold',
          bgcolor: 'primary.main',
          '&:hover': {
            bgcolor: 'primary.dark'
          }
        }}
      >
        مشاهده سند
      </Button>
      
      {/* Secondary Actions */}
      <Box sx={{ 
        display: 'flex', 
        gap: 1,
        justifyContent: 'space-between'
      }}>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={onDownload}
          sx={{ 
            flex: 1,
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            borderRadius: 2,
            py: 1,
            fontSize: '0.75rem',
            borderColor: 'secondary.main',
            color: 'secondary.main',
            '&:hover': {
              borderColor: 'secondary.dark',
              bgcolor: 'secondary.light',
              color: 'secondary.dark'
            }
          }}
        >
          دانلود
        </Button>
        {showDelete && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={onDelete}
            sx={{ 
              flex: 1,
              fontFamily: 'Vazirmatn, Arial, sans-serif',
              borderRadius: 2,
              py: 1,
              fontSize: '0.75rem',
              borderColor: 'error.main',
              color: 'error.main',
              '&:hover': {
                borderColor: 'error.dark',
                bgcolor: 'error.light',
                color: 'error.dark'
              }
            }}
          >
            حذف
          </Button>
        )}
      </Box>
    </Box>
  );
}

