"use client";
import { Card, CardContent, Typography, Box, Chip, IconButton, useTheme } from "@mui/material";
import { Folder, MoreVert, Delete, Edit } from "@mui/icons-material";

interface MobileFolderCardProps {
  folder: {
    id: string;
    name: string;
    description?: string;
    documents: number;
    createdAt: string;
  };
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export default function MobileFolderCard({
  folder,
  onClick,
  onEdit,
  onDelete,
  showActions = false
}: MobileFolderCardProps) {
  const theme = useTheme();

  return (
    <Card 
      sx={{ 
        mb: 2,
        borderRadius: 3,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-1px)'
        }
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Folder 
              color="primary" 
              sx={{ fontSize: 32 }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="h6" 
                fontWeight="bold" 
                noWrap
                sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
              >
                {folder.name}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                noWrap
                sx={{ 
                  fontFamily: 'Vazirmatn, Arial, sans-serif',
                  mb: 1
                }}
              >
                {folder.description || 'بدون توضیحات'}
              </Typography>
              <Chip 
                label={`${folder.documents} سند`} 
                size="small" 
                variant="outlined"
                color="primary"
              />
            </Box>
          </Box>
          
          {showActions && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton 
                size="small" 
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
              >
                <Edit />
              </IconButton>
              <IconButton 
                size="small" 
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
              >
                <Delete />
              </IconButton>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

