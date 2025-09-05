"use client";
import { Card, CardContent, Typography, Box, SxProps } from "@mui/material";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
  sx?: SxProps;
}

export default function StatCard({ title, value, icon, color = "primary.main", sx }: StatCardProps) {
  // Safe value handling to prevent NaN
  const getSafeValue = (val: string | number): string | number => {
    if (val === null || val === undefined || isNaN(Number(val))) {
      return typeof val === 'string' ? 'نامشخص' : 0;
    }
    return val;
  };

  const safeValue = getSafeValue(value);

  return (
    <Card sx={{ height: "100%", ...sx }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={color} sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              {safeValue}
            </Typography>
          </Box>
          {icon && (
            <Box sx={{ color: color, opacity: 0.7 }}>
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
