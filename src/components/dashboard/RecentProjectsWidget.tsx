"use client";
import { Box, Typography, Paper, IconButton, Tooltip } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import CompactProjectCard from "./CompactProjectCard";

interface RecentProjectsWidgetProps {
  projects: any[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function RecentProjectsWidget({ projects, onRefresh, isLoading }: RecentProjectsWidgetProps) {
  const activeProjects = projects.filter(project => project.status !== 'آرشیو' && project.status !== 'ARCHIVED');

  return (
    <Paper sx={{ p: 3, height: '100%', borderRadius: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          پروژه‌های اخیر
        </Typography>
        {onRefresh && (
          <Tooltip title="بروزرسانی">
            <IconButton size="small" onClick={onRefresh} disabled={isLoading} sx={{ color: 'primary.main' }}>
              <Refresh sx={{ 
                animation: isLoading ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {activeProjects.length === 0 ? (
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          border: '2px dashed',
          borderColor: 'divider',
          borderRadius: 2,
          p: 3
        }}>
          <Typography variant="h6" color="text.secondary" textAlign="center">
            هنوز پروژه‌ای ایجاد نشده است
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            برای شروع، پروژه جدیدی ایجاد کنید
          </Typography>
        </Box>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 2,
          maxHeight: '500px',
          overflow: 'auto'
        }}>
          {activeProjects.slice(0, 6).map((project) => (
            <CompactProjectCard key={project.id} project={project} />
          ))}
        </Box>
      )}
    </Paper>
  );
}


