"use client";
import { Box, Paper, Typography, useTheme, alpha } from "@mui/material";
import { TrendingUp, TrendingDown } from "@mui/icons-material";

interface StatisticsChartProps {
  title: string;
  data: Array<{ label: string; value: number; color?: string }>;
  trend?: 'up' | 'down';
  trendValue?: string;
  compact?: boolean;
}

export default function StatisticsChart({ 
  title, 
  data, 
  trend = 'up', 
  trendValue = '+12.5%',
  compact = false
}: StatisticsChartProps) {
  const theme = useTheme();
  
  // Safe data handling to prevent NaN values
  const safeData = data.filter(item => 
    item && 
    item.value !== null && 
    item.value !== undefined && 
    !isNaN(item.value) &&
    item.label
  );
  
  const maxValue = safeData.length > 0 ? Math.max(...safeData.map(item => item.value)) : 0;
  
  // Safe value handling to prevent NaN
  const getSafeNumber = (val: any, defaultValue: number = 0): number => {
    if (val === null || val === undefined || isNaN(val)) {
      return defaultValue;
    }
    const num = Number(val);
    return isNaN(num) ? defaultValue : num;
  };

  const getSafeString = (val: any, defaultValue: string = ''): string => {
    if (val === null || val === undefined || isNaN(val)) {
      return defaultValue;
    }
    return String(val);
  };

  if (safeData.length === 0) {
    return (
      <Paper sx={{ p: 3, height: compact ? 'auto' : 300 }}>
        <Typography variant="h6" gutterBottom>
          {getSafeString(title, 'نامشخص')}
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: compact ? 100 : 200,
          color: 'text.secondary'
        }}>
          <Typography variant="body2">
            داده‌ای برای نمایش وجود ندارد
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: compact ? 'auto' : 300 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          {getSafeString(title, 'نامشخص')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {trend === 'up' ? (
            <TrendingUp color="success" fontSize="small" />
          ) : (
            <TrendingDown color="error" fontSize="small" />
          )}
          <Typography 
            variant="caption" 
            color={trend === 'up' ? 'success.main' : 'error.main'}
            fontWeight="bold"
          >
            {getSafeString(trendValue, '0%')}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        alignItems: 'end', 
        gap: 1, 
        height: compact ? 80 : 180,
        mt: 2
      }}>
        {safeData.map((item, index) => {
          const height = maxValue > 0 ? (getSafeNumber(item.value, 0) / maxValue) * 100 : 0;
          const safeHeight = Math.max(height, 5); // Minimum height for visibility
          
          return (
            <Box key={index} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box
                sx={{
                  width: '100%',
                  height: `${safeHeight}%`,
                  backgroundColor: item.color || theme.palette.primary.main,
                  borderRadius: '4px 4px 0 0',
                  minHeight: '4px',
                  transition: 'height 0.3s ease'
                }}
              />
              <Typography 
                variant="caption" 
                sx={{ 
                  mt: 1, 
                  fontSize: '0.7rem',
                  textAlign: 'center',
                  color: 'text.secondary'
                }}
              >
                {getSafeString(item.label, 'نامشخص')}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.6rem',
                  color: 'text.secondary',
                  fontWeight: 'bold'
                }}
              >
                {getSafeNumber(item.value, 0)}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
