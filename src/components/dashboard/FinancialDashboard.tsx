"use client";
import { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  LinearProgress,
  Chip,
  useTheme,
  alpha
} from "@mui/material";
import { 
  TrendingUp, 
  AccountBalance, 
  Payment, 
  Warning,
  CheckCircle,
  Timeline
} from "@mui/icons-material";
import SummaryCard from "@/components/finance/SummaryCard";
import ProjectPaymentChart from "./ProjectPaymentChart";

interface FinancialData {
  totalProjects: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  overdueAmount: number;
  projects: Array<{
    id: string;
    name: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    userCount: number;
    paymentProgress: number;
  }>;
}

interface FinancialDashboardProps {
  isAdmin: boolean;
}

export default function FinancialDashboard({ isAdmin }: FinancialDashboardProps) {
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
          overdueAmount: summary.overdueAmount,
          projects: summary.projects.map((project: any) => ({
            id: project.id,
            name: project.name,
            totalAmount: project.totalAmount,
            paidAmount: project.paidAmount,
            remainingAmount: project.remainingAmount,
            userCount: project.userCount,
            paymentProgress: project.paymentProgress
          }))
        };

        setFinancialData(transformedData);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fa-IR").format(amount) + " ریال";
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          آمار مالی پروژه‌ها
        </Typography>
        <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
      </Paper>
    );
  }

  if (!financialData) {
    return (
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, textAlign: 'center' }}>
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
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={2}>
        {/* Financial Summary Cards */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AccountBalance sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                آمار مالی پروژه‌ها
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <SummaryCard
                  title="کل پروژه‌ها"
                  amount={financialData.totalProjects}
                  color="info"
                  icon="📊"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <SummaryCard
                  title="کل مبلغ"
                  amount={financialData.totalAmount}
                  color="primary"
                  icon="💰"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <SummaryCard
                  title="پرداخت شده"
                  amount={financialData.paidAmount}
                  color="success"
                  icon="✅"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <SummaryCard
                  title="باقی‌مانده"
                  amount={financialData.remainingAmount}
                  color="warning"
                  icon="⏳"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Project Payment Progress */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Timeline sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                پیشرفت پرداخت پروژه‌ها
              </Typography>
            </Box>

            <ProjectPaymentChart projects={financialData.projects} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
