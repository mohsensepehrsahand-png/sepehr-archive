"use client";
import { useState, useEffect } from "react";
import { Box, Typography, Paper, LinearProgress, useTheme, Grid } from "@mui/material";
import { AccountBalance } from "@mui/icons-material";
import SummaryCard from "@/components/finance/SummaryCard";

interface FinancialData {
  totalProjects: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  overdueAmount: number;
}

interface FinancialSummaryWidgetProps {
  isAdmin: boolean;
}

export default function FinancialSummaryWidget({ isAdmin }: FinancialSummaryWidgetProps) {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    if (isAdmin) {
      fetchFinancialData();
    }
  }, [isAdmin]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/financial-summary');
      if (response.ok) {
        const summary = await response.json();
        
        const transformedData: FinancialData = {
          totalProjects: summary.totalProjects,
          totalAmount: summary.totalAmount,
          paidAmount: summary.paidAmount,
          remainingAmount: summary.remainingAmount,
          overdueAmount: summary.overdueAmount
        };

        setFinancialData(transformedData);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <Paper sx={{ p: 3, height: '100%', borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          آمار مالی پروژه‌ها
        </Typography>
        <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
      </Paper>
    );
  }

  if (!financialData) {
    return (
      <Paper sx={{ p: 3, height: '100%', borderRadius: 3, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          آمار مالی پروژه‌ها
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          خطا در بارگذاری اطلاعات مالی
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: '100%', borderRadius: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <AccountBalance sx={{ color: 'primary.main', fontSize: 24 }} />
        <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          آمار مالی پروژه‌ها
        </Typography>
      </Box>
      
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 6 }}>
          <SummaryCard
            title="کل پروژه‌ها"
            amount={financialData.totalProjects}
            color="info"
            icon="📊"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6 }}>
          <SummaryCard
            title="کل مبلغ"
            amount={financialData.totalAmount}
            color="primary"
            icon="💰"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6 }}>
          <SummaryCard
            title="پرداخت شده"
            amount={financialData.paidAmount}
            color="success"
            icon="✅"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6 }}>
          <SummaryCard
            title="باقی‌مانده"
            amount={financialData.remainingAmount}
            color="warning"
            icon="⏳"
          />
        </Grid>
      </Grid>
    </Paper>
  );
}




