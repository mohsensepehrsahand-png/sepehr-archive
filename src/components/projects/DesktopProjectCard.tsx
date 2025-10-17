"use client";
import { Card, CardContent, Typography, Box, Chip, Button, Avatar, IconButton, useTheme, alpha } from "@mui/material";
import { Folder, Visibility, Edit, Delete, MoreVert } from "@mui/icons-material";
import Link from "next/link";
import { formatPersianDateShort } from "@/utils/dateUtils";

interface DesktopProjectCardProps {
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

export default function DesktopProjectCard({
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
}: DesktopProjectCardProps) {
  const theme = useTheme();

  return (
    <Card sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 3,
      border: `2px solid ${colorPrimary}20`,
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        boxShadow: 4,
        transform: 'translateY(-2px)',
        borderColor: colorPrimary
      }
    }}>
      <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Avatar 
              sx={{ 
                bgcolor: colorPrimary, 
                width: 48,
                height: 48
              }}
            >
              <Folder />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="h6" 
                fontWeight="bold" 
                sx={{ 
                  fontFamily: 'Vazirmatn, Arial, sans-serif',
                  mb: 0.5,
                  lineHeight: 1.2
                }}
              >
                {name}
              </Typography>
              <Chip 
                label={status} 
                size="small" 
                color={status === 'فعال' ? 'success' : 'default'}
                sx={{ 
                  fontFamily: 'Vazirmatn, Arial, sans-serif',
                  fontSize: '0.75rem'
                }}
              />
            </Box>
          </Box>
          
          {showActions && (
            <IconButton size="small" sx={{ ml: 1 }}>
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
            flex: 1,
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.5
          }}
        >
          {description || 'بدون توضیحات'}
        </Typography>

        {/* Stats */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2,
          py: 1,
          px: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          borderRadius: 2
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            {documents} سند
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            {formatPersianDateShort(createdAt)}
          </Typography>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
          <Button
            component={Link}
            href={`/projects/${id}`}
            size="small"
            startIcon={<Visibility />}
            variant="contained"
            sx={{ 
              flex: 1,
              fontFamily: 'Vazirmatn, Arial, sans-serif',
              borderRadius: 2,
              py: 1
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
                sx={{ 
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.primary.main}20`
                }}
              >
                <Edit />
              </IconButton>
              <IconButton 
                size="small" 
                color="error"
                onClick={() => onDelete?.(id, name)}
                sx={{ 
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.error.main}20`
                }}
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
