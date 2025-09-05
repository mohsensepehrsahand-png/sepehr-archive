"use client";
import { Card, CardContent, Typography, Box, Chip, LinearProgress, Button, Avatar, useTheme, alpha } from "@mui/material";
import { Folder, Visibility, Edit, Archive } from "@mui/icons-material";
import Link from "next/link";

interface ProjectCardProps {
  id: number;
  name: string;
  status: string;
  documents: number;
  lastActivity?: string;
  progress?: number;
  priority?: 'high' | 'medium' | 'low';
  description?: string;
}

export default function ProjectCard({
  id,
  name,
  status,
  documents,
  lastActivity = "بدون فعالیت",
  progress = 0,
  priority = 'medium',
  description
}: ProjectCardProps) {
  const theme = useTheme();

  // Safe value handling to prevent NaN
  const getSafeString = (val: any, defaultValue: string = ''): string => {
    if (val === null || val === undefined || isNaN(val)) {
      return defaultValue;
    }
    return String(val);
  };

  const getSafeNumber = (val: any, defaultValue: number = 0): number => {
    if (val === null || val === undefined || isNaN(val)) {
      return defaultValue;
    }
    const num = Number(val);
    return isNaN(num) ? defaultValue : num;
  };

  const safeName = getSafeString(name, 'نامشخص');
  const safeStatus = getSafeString(status, 'نامشخص');
  const safeDocuments = getSafeNumber(documents, 0);
  const safeLastActivity = getSafeString(lastActivity, 'بدون فعالیت');
  const safeProgress = getSafeNumber(progress, 0);
  const safeDescription = getSafeString(description, '');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'اولویت بالا';
      case 'medium': return 'اولویت متوسط';
      case 'low': return 'اولویت پایین';
      default: return priority;
    }
  };

  return (
    <Card sx={{ 
      height: '100%', 
      borderRadius: 3,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.15)}`
      }
    }}>
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
            label={getPriorityText(priority)} 
            size="small" 
            color={getPriorityColor(priority) as any}
            sx={{ borderRadius: 2 }}
          />
        </Box>
        
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, lineHeight: 1.3, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          {safeName}
        </Typography>
        
        {safeDescription && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            {safeDescription}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            {safeDocuments} سند
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            {safeLastActivity}
          </Typography>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              پیشرفت پروژه
            </Typography>
            <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              {safeProgress}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={safeProgress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                bgcolor: 'primary.main',
                borderRadius: 4
              }
            }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            component={Link}
            href={`/projects/${id}`}
            size="small"
            startIcon={<Visibility />}
            variant="outlined"
            sx={{ borderRadius: 2, flex: 1, fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            مشاهده
          </Button>
          <Button
            size="small"
            startIcon={<Edit />}
            variant="outlined"
            sx={{ borderRadius: 2, flex: 1, fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            ویرایش
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
