"use client";
import { useState, useEffect } from "react";
import {
  Grid,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Alert
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import SummaryCard from "@/components/finance/SummaryCard";
import InstallmentTable from "@/components/finance/InstallmentTable";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface UserSummary {
  totalShareAmount: number;
  totalPaidAmount: number;
  remainingAmount: number;
  totalPenaltyAmount: number;
  paidPercentage: number;
}

interface Installment {
  id: string;
  title: string;
  dueDate: string;
  shareAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  order?: number;
  payments: Payment[];
}

interface Payment {
  id: string;
  paymentDate: string;
  amount: number;
  description?: string;
  receiptImagePath?: string;
}

interface ChartData {
  name: string;
  amount: number;
  type: string;
}

export default function MyFinancePage({ params }: { params: Promise<{ id: string }> }) {
  const [projectId, setProjectId] = useState<string>("");
  const [projectName, setProjectName] = useState<string>("");
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fa-IR").format(amount) + " ریال";
  };

  useEffect(() => {
    const initializePage = async () => {
      const resolvedParams = await params;
      setProjectId(resolvedParams.id);
      await fetchMyFinanceData(resolvedParams.id);
    };
    initializePage();
  }, [params]);

  const fetchMyFinanceData = async (projectId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/finance/projects/${projectId}/users/${user?.id}`);
      if (!response.ok) {
        throw new Error("خطا در دریافت اطلاعات مالی");
      }
      const data = await response.json();
      
      setProjectName(data.projectName || "پروژه");
      setSummary(data.summary);
      setInstallments(data.installments);
      
      // Prepare chart data
      const chartData = [
        { name: "پرداخت شده", amount: data.summary.totalPaidAmount, type: "paid" },
        { name: "مانده", amount: data.summary.remainingAmount, type: "remaining" },
        { name: "جریمه", amount: data.summary.totalPenaltyAmount, type: "penalty" }
      ];
      setChartData(chartData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطای نامشخص");
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!summary) {
    return (
      <Box p={3}>
        <Alert severity="info">اطلاعات مالی یافت نشد</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Button
            startIcon={<ArrowBack sx={{ transform: 'rotate(180deg)' }} />}
            onClick={() => router.push("/finance")}
            sx={{ 
              fontFamily: 'Vazirmatn, Arial, sans-serif', 
              direction: 'rtl',
              '& .MuiButton-startIcon': { ml: 1 }
            }}
          >
            بازگشت
          </Button>
        </Box>
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            fontWeight: 'bold',
            mb: 3
          }}
        >
          وضعیت مالی من در پروژه: {projectName}
        </Typography>
      </Box>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="کل سهم"
            amount={summary.totalShareAmount}
            color="primary"
            icon="💰"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="مجموع پرداختی"
            amount={summary.totalPaidAmount}
            color="success"
            icon="✅"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="مانده"
            amount={summary.remainingAmount}
            color="warning"
            icon="⏳"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="مجموع جریمه"
            amount={summary.totalPenaltyAmount}
            color="error"
            icon="⚠️"
          />
        </Grid>
      </Grid>

      {/* Payment History Table */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            fontWeight: 'bold',
            mb: 3
          }}
        >
          تاریخچه پرداخت‌ها
        </Typography>
        
        <InstallmentTable 
          installments={installments.map(installment => ({
            id: installment.id,
            title: installment.title,
            dueDate: installment.dueDate,
            shareAmount: installment.shareAmount,
            paidAmount: installment.paidAmount,
            remainingAmount: installment.remainingAmount,
            status: installment.status === 'PAID' ? 'پرداخت شده' : 
                   installment.status === 'PARTIAL' ? 'بخشی پرداخت شده' :
                   installment.status === 'OVERDUE' ? 'معوق' : 'در انتظار پرداخت',
            order: installment.order || 0,
            paymentDate: installment.payments && installment.payments.length > 0 
              ? installment.payments[installment.payments.length - 1].paymentDate
              : undefined,
            payments: installment.payments ? installment.payments.map(payment => ({
              id: payment.id,
              amount: payment.amount,
              paymentDate: payment.paymentDate,
              description: payment.description,
              receiptImagePath: payment.receiptImagePath
            })) : []
          }))}
          projectId={projectId}
          onRefresh={() => fetchMyFinanceData(projectId)}
          onUpdateInstallments={setInstallments}
        />
      </Paper>

      {/* Progress Chart */}
      <Paper sx={{ p: 3 }}>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            fontWeight: 'bold',
            mb: 3
          }}
        >
          نمودار پیشرفت پرداخت‌ها
        </Typography>
        
        <Box sx={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: 12 }}
                label={{ value: 'مبلغ (ریال)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'مبلغ']}
                labelStyle={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
              />
              <Bar 
                dataKey="amount" 
                fill="#4caf50"
                radius={[4, 4, 0, 0]}
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
}
