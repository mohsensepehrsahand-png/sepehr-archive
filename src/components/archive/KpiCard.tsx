"use client";
import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  LinearProgress, 
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
  progress: number;
  trend: 'up' | 'down';
  trendValue: string;
  color?: string; // This will be a theme palette key like "success.main"
}

export default function KpiCard({
  title,
  value,
  subtitle,
  progress,
  trend,
  trendValue,
  color = "primary.main" // Default color key
}: KpiCardProps) {
  const theme = useTheme();
  
  // Safe value handling to prevent NaN
  const getSafeString = (val: string): string => {
    if (val === null || val === undefined || isNaN(Number(val))) {
      return 'نامشخص';
    }
    return val;
  };

  const getSafeNumber = (val: number): number => {
    if (val === null || val === undefined || isNaN(val)) {
      return 0;
    }
    return val;
  };

  const safeValue = getSafeString(value);
  const safeProgress = getSafeNumber(progress);
  const safeTrendValue = getSafeString(trendValue);
  const safeTitle = getSafeString(title);
  const safeSubtitle = getSafeString(subtitle);

  // Get actual color value from theme
  const getColorValue = (colorKey: string) => {
    const keys = colorKey.split('.');
    let colorValue = theme.palette;
    for (const key of keys) {
      if (colorValue && typeof colorValue === 'object' && key in colorValue) {
        colorValue = (colorValue as any)[key];
      } else {
        return theme.palette.primary.main; // Fallback
      }
    }
    return typeof colorValue === 'string' ? colorValue : theme.palette.primary.main;
  };

  const actualColor = getColorValue(color);

  return (
    <Card sx={{ 
      height: '100%',
      background: `linear-gradient(135deg, ${alpha(actualColor, 0.1)} 0%, ${alpha(actualColor, 0.05)} 100%)`,
      border: `1px solid ${alpha(actualColor, 0.2)}`
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            {safeTitle}
          </Typography>
          <Chip
            icon={trend === 'up' ? <TrendingUp /> : <TrendingDown />}
            label={safeTrendValue}
            size="small"
            color={trend === 'up' ? 'success' : 'error'}
            variant="outlined"
          />
        </Box>

        <Typography variant="h3" fontWeight="bold" sx={{ mb: 1, color: actualColor }}>
          {safeValue}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {safeSubtitle}
        </Typography>

        <Box sx={{ mb: 1 }}>
          <LinearProgress
            variant="determinate"
            value={Math.min(safeProgress, 100)}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: alpha(actualColor, 0.2),
              '& .MuiLinearProgress-bar': {
                backgroundColor: actualColor,
                borderRadius: 4
              }
            }}
          />
        </Box>

        <Typography variant="caption" color="text.secondary">
          {safeProgress.toFixed(1)}% تکمیل شده
        </Typography>
      </CardContent>
    </Card>
  );
}
