"use client";
import { Box, Typography, useTheme, alpha, Paper, Chip } from "@mui/material";
import { LinearProgress } from "@mui/material";
import StatCard from "./StatCard";
import KpiCard from "./KpiCard";
import StatisticsChart from "./StatisticsChart";
import StatisticsNumbers from "./StatisticsNumbers";

interface DashboardStatsProps {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalDocuments: number;
  archivedDocuments: number;
  totalUsers: number;
  activeUsers: number;
  storageUsed: number;
  storageTotal: number;
  monthlyStats: Array<{ month: string; projects: number; documents: number }>;
}

export default function DashboardStats({
  totalProjects = 0,
  activeProjects = 0,
  completedProjects = 0,
  totalDocuments = 0,
  archivedDocuments = 0,
  totalUsers = 0,
  activeUsers = 0,
  storageUsed = 0,
  storageTotal = 0,
  monthlyStats = []
}: DashboardStatsProps) {
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

  // Calculate safe values
  const safeTotalProjects = getSafeNumber(totalProjects);
  const safeActiveProjects = getSafeNumber(activeProjects);
  const safeCompletedProjects = getSafeNumber(completedProjects);
  const safeTotalDocuments = getSafeNumber(totalDocuments);
  const safeArchivedDocuments = getSafeNumber(archivedDocuments);
  const safeTotalUsers = getSafeNumber(totalUsers);
  const safeActiveUsers = getSafeNumber(activeUsers);
  const safeStorageUsed = getSafeNumber(storageUsed);
  const safeStorageTotal = getSafeNumber(storageTotal);

  // Calculate percentages safely
  const completionRate = safeTotalProjects > 0 ? (safeCompletedProjects / safeTotalProjects) * 100 : 0;
  const activeRate = safeTotalProjects > 0 ? (safeActiveProjects / safeTotalProjects) * 100 : 0;
  const archiveRate = safeTotalDocuments > 0 ? (safeArchivedDocuments / safeTotalDocuments) * 100 : 0;
  const userActivityRate = safeTotalUsers > 0 ? (safeActiveUsers / safeTotalUsers) * 100 : 0;
  const storageUsageRate = safeStorageTotal > 0 ? (safeStorageUsed / safeStorageTotal) * 100 : 0;

  // Safe monthly stats
  const safeMonthlyStats = monthlyStats
    .filter(stat => stat && stat.month && !isNaN(stat.projects) && !isNaN(stat.documents))
    .map(stat => ({
      month: getSafeString(stat.month),
      projects: getSafeNumber(stat.projects),
      documents: getSafeNumber(stat.documents)
    }));

  // Chart data for projects
  const projectChartData = safeMonthlyStats.map(stat => ({
    label: stat.month,
    value: stat.projects,
    color: theme.palette.primary.main
  }));

  // Chart data for documents
  const documentChartData = safeMonthlyStats.map(stat => ({
    label: stat.month,
    value: stat.documents,
    color: theme.palette.secondary.main
  }));

  return (
    <Box>
      {/* Main Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 12px)' } }}>
          <StatCard
            title="کل پروژه‌ها"
            value={safeTotalProjects}
            color="primary.main"
          />
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 12px)' } }}>
          <StatCard
            title="پروژه‌های فعال"
            value={safeActiveProjects}
            color="success.main"
          />
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 12px)' } }}>
          <StatCard
            title="پروژه‌های تکمیل شده"
            value={safeCompletedProjects}
            color="info.main"
          />
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 12px)' } }}>
          <StatCard
            title="کل اسناد"
            value={safeTotalDocuments}
            color="warning.main"
          />
        </Box>
      </Box>

      {/* KPI Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <KpiCard
            title="نرخ تکمیل پروژه‌ها"
            value={`${completionRate.toFixed(1)}%`}
            subtitle={`${safeCompletedProjects} از ${safeTotalProjects} پروژه`}
            progress={completionRate}
            trend="up"
            trendValue={`+${(completionRate - 50).toFixed(1)}%`}
            color="success.main"
          />
        </Box>
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <KpiCard
            title="نرخ آرشیو اسناد"
            value={`${archiveRate.toFixed(1)}%`}
            subtitle={`${safeArchivedDocuments} از ${safeTotalDocuments} سند`}
            progress={archiveRate}
            trend="up"
            trendValue={`+${(archiveRate - 30).toFixed(1)}%`}
            color="info.main"
          />
        </Box>
      </Box>

      {/* Charts Section */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <StatisticsChart
            title="تعداد پروژه‌ها در ماه‌های اخیر"
            data={projectChartData}
            trend="up"
            trendValue="+15.2%"
          />
        </Box>
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
          <StatisticsChart
            title="تعداد اسناد در ماه‌های اخیر"
            data={documentChartData}
            trend="up"
            trendValue="+8.7%"
          />
        </Box>
      </Box>

      {/* Additional Stats */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ width: { xs: '100%', md: 'calc(33.333% - 12px)' } }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              فعالیت کاربران
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {safeActiveUsers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                کاربر فعال از {safeTotalUsers} کاربر کل
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={userActivityRate} 
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {userActivityRate.toFixed(1)}% نرخ فعالیت
            </Typography>
          </Paper>
        </Box>

        <Box sx={{ width: { xs: '100%', md: 'calc(33.333% - 12px)' } }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              استفاده از فضای ذخیره
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h4" color="warning" fontWeight="bold">
                {(safeStorageUsed / (1024 * 1024 * 1024)).toFixed(1)} GB
              </Typography>
              <Typography variant="body2" color="text.secondary">
                از {(safeStorageTotal / (1024 * 1024 * 1024)).toFixed(1)} GB کل
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={storageUsageRate} 
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {storageUsageRate.toFixed(1)}% استفاده شده
            </Typography>
          </Paper>
        </Box>

        <Box sx={{ width: { xs: '100%', md: 'calc(33.333% - 12px)' } }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              آمار کلی
            </Typography>
            <StatisticsNumbers
              data={[
                { label: 'پروژه‌های فعال', value: safeActiveProjects, color: 'success.main' },
                { label: 'اسناد آرشیو شده', value: safeArchivedDocuments, color: 'info.main' },
                { label: 'کاربران فعال', value: safeActiveUsers, color: 'primary.main' }
              ]}
            />
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
