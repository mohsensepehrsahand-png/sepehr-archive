'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { ArrowBack, Edit, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import InstallmentDefinitionsManager from '@/components/finance/InstallmentDefinitionsManager';
import ProjectUsersManager from '@/components/finance/ProjectUsersManager';
import PenaltySettingsManager from '@/components/finance/PenaltySettingsManager';

interface ProjectSummary {
  totalShareAmount: number;
  totalPaidAmount: number;
  totalRemainingAmount: number;
  totalPenaltyAmount: number;
  paidPercentage: number;
}

interface UserFinancialData {
  id: string;
  name: string;
  totalShareAmount: number;
  totalPaidAmount: number;
  remainingAmount: number;
  penaltyAmount: number;
  progressPercentage: number;
  paidInstallmentsCount: number;
  status: string;
  installmentDetails?: {
    id: string;
    title: string;
    dueDate: string;
    shareAmount: number;
    paidAmount: number;
    payments: {
      id: string;
      amount: number;
      paymentDate: string;
      description?: string;
    }[];
  }[];
}

interface ChartData {
  name: string;
  progress: number;
  paid: number;
  remaining: number;
}

export default function FinanceProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [users, setUsers] = useState<UserFinancialData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [lineChartData, setLineChartData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const isAdmin = user?.role === 'ADMIN';

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/finance/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('خطا در دریافت اطلاعات پروژه');
      }

      const data = await response.json();
      setProject(data);
      setSummary(data.summary);
      setUsers(data.users);

      // Prepare chart data
      const chartData = data.users.map((user: UserFinancialData) => ({
        name: user.name,
        progress: user.progressPercentage,
        paid: user.totalPaidAmount,
        remaining: user.remainingAmount
      }));
      setChartData(chartData);

      // Prepare combined user charts data
      const allDates = new Set<string>();
      const userDataMap: { [userId: string]: { [date: string]: { amount: number, paidAmount: number, title: string } } } = {};
      
      data.users.forEach((user: UserFinancialData) => {
        userDataMap[user.id] = {};
        
        if (user.installmentDetails) {
          user.installmentDetails.forEach(installment => {
            const date = installment.dueDate;
            allDates.add(date);
            userDataMap[user.id][date] = {
              amount: installment.shareAmount,
              paidAmount: installment.paidAmount,
              title: installment.title
            };
          });
        }
      });
      
      // Create combined chart data
      const sortedDates = Array.from(allDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      const combinedChartData = sortedDates.map(date => {
        const dataPoint: any = { date };
        
        data.users.forEach(user => {
          const userData = userDataMap[user.id][date];
          if (userData) {
            dataPoint[`${user.name}_amount`] = userData.amount;
            dataPoint[`${user.name}_paid`] = userData.paidAmount;
          } else {
            dataPoint[`${user.name}_amount`] = 0;
            dataPoint[`${user.name}_paid`] = 0;
          }
        });
        
        return dataPoint;
      });
      
      setLineChartData(combinedChartData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطای نامشخص");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId, refreshTrigger]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleUsersChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const toggleRowExpansion = (userId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
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
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => router.push('/finance')}
          sx={{ mt: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          بازگشت
        </Button>
      </Box>
    );
  }

  if (!project) {
    return (
      <Box p={3}>
        <Alert severity="warning">پروژه یافت نشد</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => router.push('/finance')}
          sx={{ mt: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          بازگشت
        </Button>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3, px: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack sx={{ transform: 'rotate(180deg)' }} />}
          onClick={() => router.push('/finance')}
          sx={{ 
            fontFamily: 'Vazirmatn, Arial, sans-serif', 
            mr: 2, 
            direction: 'rtl',
            '& .MuiButton-startIcon': { ml: 1 }
          }}
        >
          بازگشت
        </Button>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Typography variant="h4" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
            پروژه {project.name}
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              fontFamily: 'Vazirmatn, Arial, sans-serif',
              fontWeight: 'bold'
            }
          }}
        >
          <Tab label="گام اول: مدیریت انواع قسط" />
          <Tab label="گام دوم: مدیریت کاربران پروژه" />
          <Tab label="گام سوم: جدول مقایسه‌ای کاربران" />
          <Tab label="گام چهارم: مشاهده نمودارها" />
        </Tabs>
      </Paper>

      {/* Step 1: Installment Definitions Manager */}
      {activeTab === 0 && isAdmin && (
        <InstallmentDefinitionsManager
          projectId={projectId}
          onDefinitionsChange={() => setRefreshTrigger(prev => prev + 1)}
        />
      )}

      {/* Step 2: Project Users Manager */}
      {activeTab === 1 && isAdmin && (
        <ProjectUsersManager
          projectId={projectId}
          onUsersChange={handleUsersChange}
        />
      )}

      {/* Step 3: Users Comparison Table */}
      {activeTab === 2 && (
        <Paper sx={{ mb: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    نام کاربر
                  </TableCell>
                  <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    مبلغ کل سهم
                  </TableCell>
                  <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    مجموع پرداختی
                  </TableCell>
                  <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    مانده
                  </TableCell>
                  <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    درصد پیشرفت
                  </TableCell>
                  <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    تعداد اقساط پرداخت‌شده
                  </TableCell>
                  <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                    وضعیت
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                      عملیات
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => {
                  const isExpanded = expandedRows.has(user.id);
                  return (
                    <React.Fragment key={user.id}>
                      <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => toggleRowExpansion(user.id)}>
                        <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <IconButton size="small">
                              {isExpanded ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                            {user.name}
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                          {new Intl.NumberFormat('fa-IR').format(user.totalShareAmount)} ریال
                        </TableCell>
                        <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                          {new Intl.NumberFormat('fa-IR').format(user.totalPaidAmount)} ریال
                        </TableCell>
                        <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                          {new Intl.NumberFormat('fa-IR').format(user.remainingAmount)} ریال
                        </TableCell>
                        <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress
                              variant="determinate"
                              value={user.progressPercentage}
                              sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', minWidth: 35 }}>
                              {user.progressPercentage}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                          {user.paidInstallmentsCount}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={user.status}
                            color={
                              user.status === "پرداخت شده" ? "success" :
                              user.status === "بخشی پرداخت شده" ? "warning" : "error"
                            }
                            size="small"
                          />
                        </TableCell>
                        {isAdmin && (
                          <TableCell align="center">
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Edit />}
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/finance/${projectId}/users/${user.id}`);
                              }}
                              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                            >
                              ویرایش
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}


      {/* Step 4: Charts and Statistics */}
      {activeTab === 3 && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} mb={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    مجموع سهم
                  </Typography>
                  <Typography variant="h5" component="h2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    {new Intl.NumberFormat('fa-IR').format(summary?.totalShareAmount || 0)} ریال
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    مجموع پرداختی
                  </Typography>
                  <Typography variant="h5" component="h2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    {new Intl.NumberFormat('fa-IR').format(summary?.totalPaidAmount || 0)} ریال
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    مجموع مانده
                  </Typography>
                  <Typography variant="h5" component="h2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    {new Intl.NumberFormat('fa-IR').format(summary?.totalRemainingAmount || 0)} ریال
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    مجموع جریمه
                  </Typography>
                  <Typography variant="h5" component="h2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    {new Intl.NumberFormat('fa-IR').format(summary?.totalPenaltyAmount || 0)} ریال
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3}>
            {/* Progress Chart */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 4 }}>
                <Typography 
                  variant="h5" 
                  gutterBottom 
                  sx={{ 
                    fontFamily: 'Vazirmatn, Arial, sans-serif',
                    fontWeight: 'bold',
                    mb: 4
                  }}
                >
                  درصد پیشرفت کاربران
                </Typography>
              
                <Box sx={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: 14 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        tick={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: 14 }}
                        label={{ value: 'درصد پیشرفت', angle: -90, position: 'insideLeft', style: { fontSize: 16 } }}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value}%`, 'درصد پیشرفت']}
                        labelStyle={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: 14 }}
                        contentStyle={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          fontSize: 14,
                          direction: 'rtl'
                        }}
                      />
                      <Bar 
                        dataKey="progress" 
                        fill="#4caf50"
                        radius={[6, 6, 0, 0]}
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* User Installments Chart */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 4 }}>
                <Typography 
                  variant="h5" 
                  gutterBottom 
                  sx={{ 
                    fontFamily: 'Vazirmatn, Arial, sans-serif',
                    fontWeight: 'bold',
                    mb: 4
                  }}
                >
                  نمودار اقساط کاربران
                </Typography>
              
                <Box sx={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={chartData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 80,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: 14 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        tick={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: 14 }}
                        tickFormatter={(value) => new Intl.NumberFormat('fa-IR', { notation: 'compact' }).format(value)}
                        label={{ value: 'مبلغ (ریال)', angle: -90, position: 'insideLeft', style: { fontSize: 16 } }}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          new Intl.NumberFormat('fa-IR').format(value) + ' ریال', 
                          name === 'paid' ? 'پرداخت شده' : 'مانده'
                        ]}
                        labelStyle={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: 14 }}
                        contentStyle={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          fontSize: 14,
                          direction: 'rtl'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          fontSize: 14,
                          paddingTop: 20
                        }}
                      />
                      <Bar 
                        dataKey="paid" 
                        stackId="a"
                        fill="#4caf50"
                        name="پرداخت شده"
                        radius={[0, 0, 6, 6]}
                      />
                      <Bar 
                        dataKey="remaining" 
                        stackId="a"
                        fill="#ff9800"
                        name="مانده"
                        radius={[6, 6, 0, 0]}
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Overall Status Chart */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 4 }}>
                <Typography 
                  variant="h5" 
                  gutterBottom 
                  sx={{ 
                    fontFamily: 'Vazirmatn, Arial, sans-serif',
                    fontWeight: 'bold',
                    mb: 4
                  }}
                >
                  وضعیت کلی اقساط
                </Typography>
              
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={[
                        {
                          name: 'پرداخت شده',
                          value: summary?.totalPaidAmount || 0,
                          color: '#4caf50'
                        },
                        {
                          name: 'مانده',
                          value: summary?.totalRemainingAmount || 0,
                          color: '#ff9800'
                        },
                        {
                          name: 'جریمه',
                          value: summary?.totalPenaltyAmount || 0,
                          color: '#f44336'
                        }
                      ]}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: 16 }}
                      />
                      <YAxis 
                        tick={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: 14 }}
                        tickFormatter={(value) => new Intl.NumberFormat('fa-IR', { notation: 'compact' }).format(value)}
                        label={{ value: 'مبلغ (ریال)', angle: -90, position: 'insideLeft', style: { fontSize: 16 } }}
                      />
                      <Tooltip 
                        formatter={(value: number) => [new Intl.NumberFormat('fa-IR').format(value) + ' ریال', 'مبلغ']}
                        labelStyle={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: 14 }}
                        contentStyle={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          fontSize: 14,
                          direction: 'rtl'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#8884d8"
                        radius={[6, 6, 0, 0]}
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
}