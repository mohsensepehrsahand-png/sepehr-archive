"use client";
import { Box, Typography, Card, CardContent, LinearProgress, Chip, useTheme, alpha } from "@mui/material";
import { TrendingUp, CheckCircle, Warning, Payment } from "@mui/icons-material";

interface ProjectData {
  id: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  userCount: number;
  paymentProgress: number;
}

interface ProjectPaymentChartProps {
  projects: ProjectData[];
}

export default function ProjectPaymentChart({ projects }: ProjectPaymentChartProps) {
  const theme = useTheme();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fa-IR").format(amount) + " ریال";
  };

  const getStatusColor = (progress: number) => {
    if (progress === 100) return theme.palette.success.main;
    if (progress >= 75) return theme.palette.info.main;
    if (progress >= 50) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getStatusIcon = (progress: number) => {
    if (progress === 100) return <CheckCircle sx={{ fontSize: 16 }} />;
    if (progress >= 75) return <TrendingUp sx={{ fontSize: 16 }} />;
    if (progress >= 50) return <Payment sx={{ fontSize: 16 }} />;
    return <Warning sx={{ fontSize: 16 }} />;
  };

  const getStatusText = (progress: number) => {
    if (progress === 100) return 'تکمیل شده';
    if (progress >= 75) return 'در حال تکمیل';
    if (progress >= 50) return 'در حال پیشرفت';
    if (progress >= 25) return 'شروع شده';
    return 'نیاز به توجه';
  };

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            هیچ پروژه مالی‌ای برای نمایش وجود ندارد
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {projects.map((project) => (
        <Card 
          key={project.id}
          sx={{ 
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            '&:hover': {
              boxShadow: theme.shadows[2],
              borderColor: getStatusColor(project.paymentProgress)
            },
            transition: 'all 0.3s ease'
          }}
        >
          <CardContent sx={{ py: 1.5, px: 2 }}>
            {/* Project Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ 
                  fontFamily: 'Vazirmatn, Arial, sans-serif',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  mb: 0.5
                }}>
                  {project.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    label={`${project.userCount} کاربر`}
                    size="small"
                    color="info"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {getStatusIcon(project.paymentProgress)}
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        color: getStatusColor(project.paymentProgress),
                        fontWeight: 'bold',
                        fontSize: '0.7rem'
                      }}
                    >
                      {getStatusText(project.paymentProgress)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontFamily: 'Vazirmatn, Arial, sans-serif',
                  fontWeight: 'bold',
                  color: getStatusColor(project.paymentProgress),
                  fontSize: '0.9rem'
                }}
              >
                {Math.round(project.paymentProgress)}%
              </Typography>
            </Box>

            {/* Progress Bar */}
            <Box sx={{ mb: 1.5 }}>
              <LinearProgress
                variant="determinate"
                value={project.paymentProgress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getStatusColor(project.paymentProgress),
                    borderRadius: 3
                  }
                }}
              />
            </Box>

            {/* Financial Details */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: 1 
            }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: '0.7rem' }}>
                  کل مبلغ
                </Typography>
                <Typography variant="caption" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: '0.75rem' }}>
                  {formatCurrency(project.totalAmount)}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: '0.7rem' }}>
                  پرداخت شده
                </Typography>
                <Typography variant="caption" fontWeight="bold" color="success.main" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: '0.75rem' }}>
                  {formatCurrency(project.paidAmount)}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: '0.7rem' }}>
                  باقی‌مانده
                </Typography>
                <Typography variant="caption" fontWeight="bold" color="warning.main" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: '0.75rem' }}>
                  {formatCurrency(project.remainingAmount)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
