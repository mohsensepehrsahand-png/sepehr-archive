"use client";
import { Box, useTheme } from "@mui/material";
import StatCard from "./StatCard";

interface StatisticsNumbersProps {
  data: Array<{
    label: string;
    value: number;
    color: string;
  }>;
}

export default function StatisticsNumbers({
  data = []
}: StatisticsNumbersProps) {
  const theme = useTheme();

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

  return (
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
      gap: 2 
    }}>
      {data.map((item, index) => (
        <StatCard
          key={index}
          title={getSafeString(item.label, 'نامشخص')}
          value={getSafeNumber(item.value, 0)}
          color={getSafeString(item.color, 'primary.main')}
        />
      ))}
    </Box>
  );
}
