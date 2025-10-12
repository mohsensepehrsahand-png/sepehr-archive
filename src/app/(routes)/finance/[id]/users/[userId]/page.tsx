"use client";
import { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Tabs,
  Tab
} from "@mui/material";
import { ArrowBack, Edit, Delete, Add, Cancel, Save } from "@mui/icons-material";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import SummaryCard from "@/components/finance/SummaryCard";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import PenaltySettingsManager from "@/components/finance/PenaltySettingsManager";
import InstallmentTable from "@/components/finance/InstallmentTable";
import PersianDatePicker from "@/components/common/PersianDatePicker";
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
  order: number;
  installmentDefinitionId: string;
  payments: Payment[];
}

interface Payment {
  id: string;
  paymentDate: string;
  amount: number;
  description?: string;
  receiptImagePath?: string;
}

interface Penalty {
  id: string;
  installmentTitle?: string;
  installmentNumber?: number;
  daysLate: number;
  dailyRate: number;
  totalPenalty: number;
  createdAt: string;
  reason?: string;
}

interface ChartData {
  name: string;
  amount: number;
  type: string;
}

export default function FinanceUserPage({ params }: { params: Promise<{ id: string; userId: string }> }) {
  const [projectId, setProjectId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
  const [activeTab, setActiveTab] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { isAdmin } = useAuth();
  const router = useRouter();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    let isMounted = true;
    
    const initializePage = async () => {
      try {
        const resolvedParams = await params;
        if (!isMounted) return;
        
        setProjectId(resolvedParams.id);
        setUserId(resolvedParams.userId);
        await fetchUserData(resolvedParams.id, resolvedParams.userId);
      } catch (error) {
        if (isMounted) {
          console.error("Error initializing page:", error);
          setError("خطا در بارگذاری صفحه");
        }
      }
    };
    
    initializePage();
    
    return () => {
      isMounted = false;
    };
  }, [params, refreshTrigger]);

  const fetchUserData = async (projectId: string, userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/finance/projects/${projectId}/users/${userId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "خطا در دریافت اطلاعات کاربر");
      }
      
      const data = await response.json();
      
      // Check if component is still mounted before updating state
      if (projectId && userId) {
        setUserName(data.userName || "");
        setSummary(data.summary || {
          totalShareAmount: 0,
          totalPaidAmount: 0,
          remainingAmount: 0,
          totalPenaltyAmount: 0,
          paidPercentage: 0
        });
        setInstallments(data.installments || []);
        setPenalties(data.penalties || []);
        
        // Prepare chart data
        const chartData = [
          { name: "پرداخت شده", amount: data.summary?.totalPaidAmount || 0, type: "paid" },
          { name: "مانده", amount: data.summary?.remainingAmount || 0, type: "remaining" },
          { name: "جریمه", amount: data.summary?.totalPenaltyAmount || 0, type: "penalty" }
        ];
        setChartData(chartData);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError(err instanceof Error ? err.message : "خطای نامشخص");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fa-IR").format(amount) + " ریال";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      PAID: { label: "پرداخت شده", color: "success" as const },
      PARTIAL: { label: "بخشی پرداخت شده", color: "warning" as const },
      PENDING: { label: "در انتظار پرداخت", color: "default" as const },
      OVERDUE: { label: "معوق", color: "error" as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
      />
    );
  };

  const handleEditInstallment = (installment: Installment) => {
    setEditingInstallment(installment);
    setIsEditDialogOpen(true);
  };

  const handleAddInstallment = () => {
    setEditingInstallment(null);
    setIsAddDialogOpen(true);
  };

  const handleSaveInstallment = async (installmentData: any) => {
    try {
      const url = editingInstallment 
        ? `/api/finance/user-installments/${editingInstallment.id}`
        : `/api/finance/user-installments`;
      
      const method = editingInstallment ? "PUT" : "POST";
      
      // Prepare the request body based on whether we're editing or creating
      const requestBody = editingInstallment 
        ? {
            shareAmount: installmentData.shareAmount,
            paidAmount: installmentData.paidAmount,
            installmentDefinitionId: installmentData.installmentDefinitionId || null,
            title: installmentData.title,
            dueDate: installmentData.dueDate,
            paymentDate: installmentData.paymentDate || null
          }
        : {
            ...installmentData,
            userId,
            projectId
          };
      
      console.log('Sending installment data:', requestBody);
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "خطا در ذخیره قسط");
      }

      const result = await response.json();
      
      // Log console message if available
      if (result.consoleMessage) {
        console.log(result.consoleMessage);
      }
      
      // Log customization status
      if (result.wasCustomized) {
        console.log("✅ قسط با موفقیت شخصی‌سازی شد! (isCustomized: true)");
      } else if (result.isCustomized) {
        console.log("✅ قسط شخصی‌سازی شده با موفقیت به‌روزرسانی شد!");
      } else {
        console.log("ℹ️ هیچ تغییری در قسط اعمال نشد - قسط همچنان پیش‌فرض باقی ماند (isCustomized: false)");
      }

      setSnackbar({ open: true, message: result.message || "قسط با موفقیت ذخیره شد", severity: "success" });
      setIsEditDialogOpen(false);
      setIsAddDialogOpen(false);
      await fetchUserData(projectId, userId);
    } catch (err) {
      console.error("Error saving installment:", err);
      setSnackbar({ 
        open: true, 
        message: err instanceof Error ? err.message : "خطا در ذخیره قسط", 
        severity: "error" 
      });
    }
  };

  const handleDeleteInstallment = async (installmentId: string) => {
    if (!confirm("آیا از حذف این قسط اطمینان دارید؟")) return;

    try {
      console.log("Deleting installment:", installmentId);
      
      const response = await fetch(`/api/finance/user-installments/${installmentId}`, {
        method: "DELETE"
      });

      console.log("Delete response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Delete error:", errorData);
        throw new Error(errorData.error || "خطا در حذف قسط");
      }

      const result = await response.json();
      console.log("Delete result:", result);

      setSnackbar({ open: true, message: "قسط با موفقیت حذف شد", severity: "success" });
      await fetchUserData(projectId, userId);
    } catch (err) {
      console.error("Delete error:", err);
      setSnackbar({ 
        open: true, 
        message: err instanceof Error ? err.message : "خطا در حذف قسط", 
        severity: "error" 
      });
    }
  };


  if (loading) {
    return (
      <ErrorBoundary>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Box textAlign="center">
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              در حال بارگذاری...
            </Typography>
          </Box>
        </Box>
      </ErrorBoundary>
    );
  }

  if (error) {
    return (
      <ErrorBoundary>
        <Box p={3}>
          <Alert 
            severity="error" 
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => window.location.reload()}
                sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
              >
                تلاش مجدد
              </Button>
            }
          >
            {error}
          </Alert>
        </Box>
      </ErrorBoundary>
    );
  }

  if (!summary) {
    return (
      <Box p={3}>
        <Alert severity="info">اطلاعات کاربر یافت نشد</Alert>
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Box sx={{ p: 3 }}>
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Button
            startIcon={<ArrowBack sx={{ transform: 'rotate(180deg)' }} />}
            onClick={() => router.push(`/finance/${projectId}`)}
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
          مدیریت مالی کاربر: {userName}
        </Typography>
      </Box>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="کل سهم"
            amount={summary.totalShareAmount}
            color="primary"
            icon="💰"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="مجموع پرداختی"
            amount={summary.totalPaidAmount}
            color="success"
            icon="✅"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="مانده"
            amount={summary.remainingAmount}
            color="warning"
            icon="⏳"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="مجموع جریمه"
            amount={summary.totalPenaltyAmount}
            color="error"
            icon="⚠️"
          />
        </Grid>
      </Grid>

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
          <Tab label="جدول اقساط" />
          {isAdmin && <Tab label="تنظیمات جریمه" />}
        </Tabs>
      </Paper>

      {/* Installments Table */}
      {activeTab === 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            fontWeight: 'bold',
            mb: 3
          }}
        >
          جدول اقساط کاربر
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
                   installment.status === 'PAID_WITH_DELAY' ? 'پرداخت با تاخیر' :
                   installment.status === 'PARTIAL' ? 'بخشی پرداخت شده' :
                   installment.status === 'OVERDUE' ? 'معوق' : 'در انتظار پرداخت',
            order: installment.order,
            paymentDate: installment.payments.length > 0 
              ? installment.payments[installment.payments.length - 1].paymentDate
              : undefined,
            dailyDelay: installment.dailyDelay,
            payments: installment.payments.map(payment => ({
              id: payment.id,
              amount: payment.amount,
              paymentDate: payment.paymentDate,
              description: payment.description,
              receiptImagePath: payment.receiptImagePath
            }))
          }))}
          onRefresh={() => fetchUserData(projectId, userId)}
          projectId={projectId}
          onEditInstallment={handleEditInstallment}
          onDeleteInstallment={handleDeleteInstallment}
        />
        </Paper>
      )}

      {/* Penalty Settings Tab */}
      {activeTab === 1 && isAdmin && (
        <PenaltySettingsManager
          projectId={projectId}
          userId={userId}
          onSettingsChange={() => setRefreshTrigger(prev => prev + 1)}
        />
      )}


      {/* Penalties Table */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            fontWeight: 'bold',
            mb: 3,
            textAlign: 'center'
          }}
        >
          جدول جریمه‌ها
        </Typography>
        
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                  شماره قسط
                </TableCell>
                <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                  عنوان قسط
                </TableCell>
                <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                  روزهای تأخیر
                </TableCell>
                <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                  نرخ روزانه
                </TableCell>
                <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                  مبلغ کل جریمه
                </TableCell>
                <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                  بابت
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {penalties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    هیچ جریمه‌ای ثبت نشده است
                  </TableCell>
                </TableRow>
              ) : (
                penalties.map((penalty, index) => (
                  <TableRow key={penalty.id} hover>
                    <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {penalty.installmentNumber || index + 1}
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {penalty.installmentTitle || 'نامشخص'}
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {penalty.daysLate} روز
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {formatCurrency(penalty.dailyRate)}
                    </TableCell>
                    <TableCell align="center" sx={{ 
                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                      color: 'error.main',
                      fontWeight: 'bold'
                    }}>
                      {formatCurrency(penalty.totalPenalty)}
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {penalty.reason || 'تأخیر در پرداخت'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Total Penalties Summary */}
        {penalties.length > 0 && (
          <Box sx={{ 
            mt: 3, 
            p: 2, 
            backgroundColor: 'grey.50', 
            borderRadius: 1,
            textAlign: 'center'
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                fontWeight: 'bold',
                color: 'error.main'
              }}
            >
              جمع کل جریمه‌ها: {formatCurrency(penalties.reduce((sum, penalty) => sum + penalty.totalPenalty, 0))}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Installment Progress Chart */}
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
          نمودار پیشرفت اقساط
        </Typography>
        
        {/* Progress Summary */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Chip 
            label={`${installments.length} قسط کل`}
            color="default"
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          />
          <Chip 
            label={`${installments.filter(i => i.status === 'PAID').length} قسط پرداخت شده`}
            color="success"
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          />
          <Chip 
            label={`${installments.filter(i => i.status === 'PARTIAL').length} قسط جزئی`}
            color="warning"
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          />
          <Chip 
            label={`${installments.filter(i => i.status === 'PENDING' || i.status === 'OVERDUE').length} قسط معوق`}
            color="error"
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          />
        </Box>
        
        <Box sx={{ height: 500 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart 
              data={installments.map((installment, index) => ({
                name: `قسط ${index + 1}`,
                installment: installment.title,
                total: installment.shareAmount,
                paid: installment.paidAmount,
                remaining: installment.remainingAmount,
                status: installment.status,
                dueDate: new Date(installment.dueDate).toLocaleDateString('fa-IR')
              }))} 
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: 12 }}
                label={{ value: 'مبلغ (ریال)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatCurrency(value), 
                  name === 'paid' ? 'پرداخت شده' : 
                  name === 'remaining' ? 'مانده' : 'کل قسط'
                ]}
                labelStyle={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                contentStyle={{ 
                  fontFamily: 'Vazirmatn, Arial, sans-serif',
                  direction: 'rtl'
                }}
              />
              <Bar 
                dataKey="total" 
                stackId="a"
                fill="#e0e0e0"
                name="کل قسط"
              />
              <Bar 
                dataKey="paid" 
                stackId="a"
                fill="#4caf50"
                name="پرداخت شده"
              />
              <Bar 
                dataKey="remaining" 
                stackId="a"
                fill="#ff9800"
                name="مانده"
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        </Box>
        
        {/* Legend */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: '#4caf50', borderRadius: 1 }} />
            <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              پرداخت شده
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: '#ff9800', borderRadius: 1 }} />
            <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              مانده
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: '#e0e0e0', borderRadius: 1 }} />
            <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              کل قسط
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Edit/Add Installment Dialog */}
      <Dialog
        open={isEditDialogOpen || isAddDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setIsAddDialogOpen(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          {editingInstallment ? "ویرایش قسط" : "اضافه کردن قسط جدید"}
        </DialogTitle>
        <DialogContent>
          <InstallmentForm
            installment={editingInstallment}
            projectId={projectId}
            onSave={handleSaveInstallment}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setIsAddDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
    </ErrorBoundary>
  );
}

// Installment Form Component
function InstallmentForm({ 
  installment, 
  projectId,
  onSave, 
  onCancel 
}: { 
  installment: Installment | null;
  projectId: string;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: installment?.title || "",
    shareAmount: installment?.shareAmount || 0,
    paidAmount: installment?.paidAmount || 0,
    dueDate: installment?.dueDate ? installment.dueDate.split('T')[0] : "",
    paymentDate: installment?.payments && installment.payments.length > 0 
      ? installment.payments[installment.payments.length - 1].paymentDate.split('T')[0] 
      : "",
    installmentDefinitionId: installment?.installmentDefinitionId || ""
  });
  const [installmentDefinitions, setInstallmentDefinitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInstallmentDefinitions();
  }, []);

  const fetchInstallmentDefinitions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/finance/projects/${projectId}/installment-definitions`);
      if (response.ok) {
        const data = await response.json();
        setInstallmentDefinitions(data);
      } else {
        // Fallback to mock data if API fails
        setInstallmentDefinitions([
          { id: "1", title: "پروانه ساختمان" },
          { id: "2", title: "تأسیسات" },
          { id: "3", title: "نازک‌کاری" }
        ]);
      }
    } catch (error) {
      console.error("Error fetching installment definitions:", error);
      // Fallback to mock data
      setInstallmentDefinitions([
        { id: "1", title: "پروانه ساختمان" },
        { id: "2", title: "تأسیسات" },
        { id: "3", title: "نازک‌کاری" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.shareAmount || !formData.dueDate) {
      alert("لطفاً تمام فیلدهای ضروری را پر کنید");
      return;
    }
    
    if (formData.shareAmount <= 0) {
      alert("مبلغ قسط باید بیشتر از صفر باشد");
      return;
    }
    
    if (formData.paidAmount < 0) {
      alert("مبلغ پرداختی نمی‌تواند منفی باشد");
      return;
    }
    
    if (formData.paidAmount > formData.shareAmount) {
      alert("مبلغ پرداختی نمی‌تواند بیشتر از مبلغ قسط باشد");
      return;
    }
    
    onSave(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {/* نوع قسط - اولین گزینه */}
      <FormControl fullWidth margin="normal">
        <InputLabel sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          نوع قسط
        </InputLabel>
        <Select
          value={formData.installmentDefinitionId || ''}
          displayEmpty
          onChange={(e) => {
            const selectedId = e.target.value;
            
            // If selecting an existing definition, auto-fill title, amount and due date
            if (selectedId) {
              const selectedDef = installmentDefinitions.find(def => def.id === selectedId);
              if (selectedDef) {
                setFormData(prev => ({
                  ...prev,
                  installmentDefinitionId: selectedId,
                  title: selectedDef.title,
                  shareAmount: selectedDef.amount, // Auto-fill amount
                  dueDate: selectedDef.dueDate ? selectedDef.dueDate.split('T')[0] : ""
                }));
              }
            } else {
              // When "ایجاد قسط جدید" is selected, only clear the definition ID
              // Keep other fields so user can enter custom values
              setFormData(prev => ({
                ...prev,
                installmentDefinitionId: "",
                // Reset only if we're switching from an existing definition
                ...(prev.installmentDefinitionId ? {
                  title: "",
                  shareAmount: 0,
                  dueDate: ""
                } : {})
              }));
            }
          }}
          label="نوع قسط"
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          <MenuItem value="" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            ایجاد قسط جدید (تعریف نوع جدید)
          </MenuItem>
          {installmentDefinitions.map((def) => (
            <MenuItem key={def.id} value={def.id} sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              {def.order}. {def.title} - {def.dueDate ? new Date(def.dueDate).toLocaleDateString('fa-IR') : 'بدون تاریخ'} - {new Intl.NumberFormat('fa-IR').format(def.amount)} ریال
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="عنوان قسط"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        margin="normal"
        required
        sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
      />
      
      <TextField
        fullWidth
        label="مبلغ قسط (ریال)"
        type="number"
        value={formData.shareAmount}
        onChange={(e) => setFormData({ ...formData, shareAmount: parseFloat(e.target.value) || 0 })}
        margin="normal"
        required
        sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
      />
      
      <TextField
        fullWidth
        label="مبلغ پرداختی (ریال)"
        type="number"
        value={formData.paidAmount}
        onChange={(e) => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })}
        margin="normal"
        sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
      />
      
      <PersianDatePicker
        value={formData.dueDate}
        onChange={(date) => setFormData({ ...formData, dueDate: date })}
        label="تاریخ سررسید"
      />
      
      <PersianDatePicker
        key={`payment-${installment?.id || 'new'}`} // Force re-render when installment changes
        value={formData.paymentDate}
        onChange={(date) => setFormData({ ...formData, paymentDate: date })}
        label="تاریخ پرداخت"
      />
      
      <DialogActions sx={{ mt: 3 }}>
        <Button
          onClick={onCancel}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          لغو
        </Button>
        <Button
          type="submit"
          variant="contained"
          startIcon={<Save />}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          ذخیره
        </Button>
      </DialogActions>
    </Box>
  );
}
