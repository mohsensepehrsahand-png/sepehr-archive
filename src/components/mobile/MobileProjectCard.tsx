"use client";
import { Card, CardContent, Typography, Box, Chip, Button, Avatar, IconButton, useTheme, alpha } from "@mui/material";
import { Folder, Visibility, Edit, Delete, MoreVert } from "@mui/icons-material";
import Link from "next/link";
import { formatPersianDateShort } from "@/utils/dateUtils";

interface MobileProjectCardProps {
  id: string;
  name: string;
  description: string;
  status: string;
  documents: number;
  createdBy: string;
  createdAt: string;
  colorPrimary: string;
  onEdit?: (project: any) => void;
  onDelete?: (projectId: string, projectName: string) => void;
  showActions?: boolean;
}

export default function MobileProjectCard({
  id,
  name,
  description,
  status,
  documents,
  createdBy,
  createdAt,
  colorPrimary,
  onEdit,
  onDelete,
  showActions = false
}: MobileProjectCardProps) {
  const theme = useTheme();

  return (
    <Card sx={{ 
      mb: 2,
      borderRadius: 3,
      border: `2px solid ${colorPrimary}20`,
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        boxShadow: 4,
        transform: 'translateY(-1px)'
      }
    }}>
      <CardContent sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Avatar 
              sx={{ 
                bgcolor: colorPrimary, 
                width: 40,
                height: 40
              }}
            >
              <Folder />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="h6" 
                fontWeight="bold" 
                noWrap
                sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
              >
                {name}
              </Typography>
              <Chip 
                label={status} 
                size="small" 
                color={status === 'فعال' ? 'success' : 'default'}
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>
          
          {showActions && (
            <IconButton size="small">
              <MoreVert />
            </IconButton>
          )}
        </Box>

        {/* Description */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 2, 
            minHeight: 40,
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {description}
        </Typography>

        {/* Stats */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            {documents} سند
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            {formatPersianDateShort(createdAt)}
          </Typography>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            component={Link}
            href={`/projects/${id}`}
            size="small"
            startIcon={<Visibility />}
            variant="contained"
            sx={{ 
              flex: 1,
              fontFamily: 'Vazirmatn, Arial, sans-serif',
              borderRadius: 2
            }}
          >
            مشاهده
          </Button>
          
          {showActions && (
            <>
              <IconButton 
                size="small" 
                color="primary"
                onClick={() => onEdit?.({ id, name, description, status })}
                sx={{ borderRadius: 2 }}
              >
                <Edit />
              </IconButton>
              <IconButton 
                size="small" 
                color="error"
                onClick={() => onDelete?.(id, name)}
                sx={{ borderRadius: 2 }}
              >
                <Delete />
              </IconButton>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

