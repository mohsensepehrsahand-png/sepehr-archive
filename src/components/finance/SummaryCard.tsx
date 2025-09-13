"use client";
import { Card, CardContent, Box, Typography } from "@mui/material";

interface SummaryCardProps {
  title: string;
  amount: number;
  color: "primary" | "secondary" | "success" | "error" | "warning" | "info";
  icon: string;
}

export default function SummaryCard({ title, amount, color, icon }: SummaryCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fa-IR").format(amount) + " ریال";
  };

  const getColorValue = (color: string) => {
    const colors = {
      primary: "#1976d2",
      secondary: "#9c27b0",
      success: "#2e7d32",
      error: "#d32f2f",
      warning: "#ed6c02",
      info: "#0288d1"
    };
    return colors[color as keyof typeof colors] || colors.primary;
  };

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ py: 1.5, px: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              gutterBottom
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: '0.7rem' }}
            >
              {title}
            </Typography>
            <Typography 
              variant="subtitle1" 
              component="div"
              sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                fontWeight: 'bold',
                color: getColorValue(color),
                fontSize: '0.9rem'
              }}
            >
              {formatCurrency(amount)}
            </Typography>
          </Box>
          <Box
            sx={{
              fontSize: "1.5rem",
              opacity: 0.7
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
