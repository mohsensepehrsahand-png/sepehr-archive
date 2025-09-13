"use client";
import { Card, CardContent, Typography, Box, Chip, Avatar, useTheme, alpha } from "@mui/material";
import { Folder, Description, Person, CalendarToday } from "@mui/icons-material";
import Link from "next/link";
import type { Project } from "@/contexts/ProjectContext";

interface CompactProjectCardProps {
  project: Project;
}

export default function CompactProjectCard({ project }: CompactProjectCardProps) {
  const theme = useTheme();

  // Safe value handling
  const safeName = project.name || 'نامشخص';
  const safeStatus = project.status === 'ACTIVE' ? 'فعال' : 
                     project.status === 'ARCHIVED' ? 'آرشیو' : 
                     project.status || 'نامشخص';
  const safeDocuments = project.documents || 0;
  const safeDescription = project.description || 'بدون توضیحات';
  const safeCreatedBy = project.createdBy || 'نامشخص';
  
  // Handle createdAt - it might be a Date object or string
  let safeCreatedAt = 'نامشخص';
  if (project.createdAt) {
    if (typeof project.createdAt === 'string') {
      safeCreatedAt = project.createdAt;
    } else if (project.createdAt instanceof Date) {
      safeCreatedAt = project.createdAt.toLocaleDateString('fa-IR');
    } else {
      safeCreatedAt = new Date(project.createdAt).toLocaleDateString('fa-IR');
    }
  }

  return (
    <Card 
      component={Link}
      href={`/projects/${project.id}`}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: `2px solid ${project.colorPrimary}20`,
        textDecoration: 'none',
        color: 'inherit',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 2,
          transform: 'translateY(-2px)'
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        {/* Project Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Avatar 
            sx={{ 
              bgcolor: project.colorPrimary, 
              mr: 1.5,
              width: 32,
              height: 32
            }}
          >
            <Folder sx={{ fontSize: 18 }} />
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography 
              variant="subtitle1" 
              component="h3" 
              noWrap 
              sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                fontWeight: 'bold',
                fontSize: '0.95rem'
              }}
            >
              {safeName}
            </Typography>
            <Chip 
              label={safeStatus} 
              size="small" 
              color={safeStatus === 'فعال' ? 'success' : 'default'}
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          </Box>
        </Box>

        {/* Project Description */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 1.5, 
            minHeight: 32, 
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            fontSize: '0.8rem',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {safeDescription}
        </Typography>

        {/* Project Stats */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Description sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: '0.7rem' }}
            >
              {safeDocuments} سند
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Person sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
            <Typography 
              variant="caption" 
              color="text.secondary" 
              noWrap 
              sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif', 
                fontSize: '0.7rem',
                maxWidth: 60
              }}
            >
              {safeCreatedBy}
            </Typography>
          </Box>
        </Box>

        {/* Project Date */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CalendarToday sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              fontFamily: 'Vazirmatn, Arial, sans-serif',
              fontSize: '0.7rem'
            }}
          >
            {safeCreatedAt}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
