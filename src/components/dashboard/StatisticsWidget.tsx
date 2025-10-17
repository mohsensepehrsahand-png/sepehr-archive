"use client";
import { Box, Typography, Paper } from "@mui/material";

interface StatisticsWidgetProps {
  projects: any[];
}

export default function StatisticsWidget({ projects }: StatisticsWidgetProps) {
  const activeProjects = projects.filter(p => p.status !== 'آرشیو' && p.status !== 'ARCHIVED');
  const totalDocuments = activeProjects.reduce((total, project) => total + (project.documents || 0), 0);
  const activeCount = activeProjects.filter(p => p.status === 'فعال').length;
  const activeRate = activeProjects.length > 0 ? Math.round((activeCount / activeProjects.length) * 100) : 0;

  return (
    <Paper sx={{ p: 3, height: '100%', borderRadius: 3 }}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
        آمار کلی
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" color="primary" fontWeight="bold">{activeProjects.length}</Typography>
          <Typography variant="body2" color="text.secondary">پروژه‌ها</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" color="secondary" fontWeight="bold">{totalDocuments}</Typography>
          <Typography variant="body2" color="text.secondary">اسناد</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" color="success.main" fontWeight="bold">{activeCount}</Typography>
          <Typography variant="body2" color="text.secondary">فعال</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" color="info.main" fontWeight="bold">{activeRate}%</Typography>
          <Typography variant="body2" color="text.secondary">نرخ فعال</Typography>
        </Box>
      </Box>
    </Paper>
  );
}


