"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress,
  IconButton,
  Snackbar
} from "@mui/material";
import { AccountBalance, Visibility, TrendingUp, People, ArrowBack } from "@mui/icons-material";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  unitsCount: number;
  totalInstallments: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  userCount?: number;
  progressPercentage?: number;
}

export default function FinancePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/finance/projects");
      if (!response.ok) {
        throw new Error("خطا در دریافت اطلاعات پروژه‌ها");
      }
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطای نامشخص");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fa-IR").format(amount) + " ریال";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "success";
    if (percentage >= 50) return "warning";
    return "error";
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

  return (
    <Box p={3}>
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Button
            startIcon={<ArrowBack sx={{ transform: 'rotate(180deg)' }} />}
            onClick={() => router.push("/dashboard")}
            sx={{ 
              fontFamily: 'Vazirmatn, Arial, sans-serif', 
              direction: 'rtl',
              '& .MuiButton-startIcon': { ml: 1 }
            }}
          >
            بازگشت
          </Button>
        </Box>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          محاسبات مالی
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          {isAdmin ? "مدیریت اقساط و پرداخت‌های پروژه‌ها" : "مشاهده وضعیت مالی پروژه‌های شما"}
        </Typography>
      </Box>

      {projects.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <AccountBalance sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              هیچ پروژه‌ای یافت نشد
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              {isAdmin 
                ? "ابتدا پروژه‌ای ایجاد کنید و سپس اقساط آن را تعریف کنید"
                : "شما در هیچ پروژه‌ای عضو نیستید"
              }
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => {
            const progressPercentage = project.totalAmount > 0 
              ? Math.round((project.paidAmount / project.totalAmount) * 100) 
              : 0;
            
            return (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={project.id}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="h2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        {project.name}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={project.status === "ACTIVE" ? "فعال" : "آرشیو شده"}
                          color={project.status === "ACTIVE" ? "success" : "default"}
                          size="small"
                        />
                      </Box>
                    </Box>

                    {project.description && (
                      <Typography variant="body2" color="text.secondary" mb={2} sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        {project.description}
                      </Typography>
                    )}

                    <Grid container spacing={2} mb={3}>
                      <Grid size={{ xs: 6 }}>
                        <Box textAlign="center">
                          <Typography variant="h6" color="primary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            {project.unitsCount}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            تعداد واحدها
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Box textAlign="center">
                          <Typography variant="h6" color="primary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            {project.userCount || project.unitsCount}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            تعداد کاربران
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Box mb={2}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                          مجموع اقساط:
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                          {formatCurrency(project.totalAmount)}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                          پرداخت شده:
                        </Typography>
                        <Typography variant="body2" color="success.main" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                          {formatCurrency(project.paidAmount)}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                          مانده:
                        </Typography>
                        <Typography variant="body2" color="error.main" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                          {formatCurrency(project.remainingAmount)}
                        </Typography>
                      </Box>
                      
                      <Box mb={1}>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            پیشرفت پرداخت:
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            {progressPercentage}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={progressPercentage}
                          color={getProgressColor(progressPercentage)}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Box>
                  </CardContent>

                  <Box p={2} pt={0}>
                    <Grid container spacing={1}>
                      <Grid size={{ xs: 12 }}>
                        <Button
                          component={Link}
                          href={isAdmin ? `/finance/${project.id}` : `/finance/${project.id}/my-finance`}
                          variant="contained"
                          fullWidth
                          startIcon={<Visibility />}
                          size="small"
                          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                        >
                          {isAdmin ? "مشاهده جزئیات" : "وضعیت مالی من"}
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}


      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}
