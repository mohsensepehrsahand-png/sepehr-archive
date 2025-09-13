"use client";
import { Card, CardContent, Typography, Box, Chip, Avatar, useTheme, alpha, IconButton, Tooltip } from "@mui/material";
import { Folder, Description, Delete, Edit, Visibility, Settings } from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";

interface FolderCardProps {
  folder: {
    id: string;
    name: string;
    description?: string;
    documents: number;
    depth: number;
    createdAt: string;
  };
  onClick: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  showActions?: boolean;
}

export default function FolderCard({
  folder,
  onClick,
  onDelete,
  onEdit,
  showActions = false
}: FolderCardProps) {
  const theme = useTheme();
  const { isAdmin } = useAuth();

  const safeName = folder.name || 'پوشه بدون نام';
  const safeDescription = folder.description || '';
  const safeDocuments = folder.documents || 0;
  const safeDepth = folder.depth || 0;

  return (
    <Card sx={{ 
      height: '100%', 
      borderRadius: 3,
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.15)}`
      }
    }}
    onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Avatar sx={{ 
            bgcolor: alpha(theme.palette.primary.main, 0.1), 
            color: 'primary.main',
            width: 48,
            height: 48
          }}>
            <Folder />
          </Avatar>
          <Chip 
            label={`سطح ${safeDepth}`} 
            size="small" 
            color="secondary"
            sx={{ borderRadius: 2 }}
          />
        </Box>
        
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, lineHeight: 1.3 }}>
          {safeName}
        </Typography>
        
        {safeDescription && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
            {safeDescription}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {safeDocuments} سند
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date(folder.createdAt).toLocaleDateString('fa-IR')}
          </Typography>
        </Box>
        
        {showActions && isAdmin && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="مشاهده">
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                <Visibility />
              </IconButton>
            </Tooltip>
            {onEdit && (
              <Tooltip title="ویرایش">
                <IconButton
                  size="small"
                  color="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Settings />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title="حذف">
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
