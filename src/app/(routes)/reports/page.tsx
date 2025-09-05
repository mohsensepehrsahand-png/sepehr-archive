"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  LinearProgress,
  Alert,
  Snackbar,
  Tooltip,
  Divider
} from "@mui/material";
import {
  Search,
  Download,
  Visibility,
  Assessment,
  TrendingUp,
  TrendingDown,
  FileDownload,
  PictureAsPdf,
  TableChart,
  BarChart,
  PieChart,
  Timeline,
  CalendarToday,
  FilterList,
  Refresh,
  GetApp,
  Share,
  Print
} from "@mui/icons-material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

// Mock data for reports
const mockReportData = {
  projectStats: [
    { month: 'فروردین', projects: 12, documents: 156, users: 8 },
    { month: 'اردیبهشت', projects: 15, documents: 203, users: 10 },
    { month: 'خرداد', projects: 18, documents: 245, users: 12 },
    { month: 'تیر', projects: 22, documents: 312, users: 15 },
    { month: 'مرداد', projects: 25, documents: 378, users: 18 },
    { month: 'شهریور', projects: 28, documents: 445, users: 20 }
  ],
  documentTypes: [
    { name: 'PDF', value: 45, color: '#ef5350' },
    { name: 'تصاویر', value: 30, color: '#26a69a' },
    { name: 'Word', value: 15, color: '#42a5f5' },
    { name: 'Excel', value: 10, color: '#66bb6a' }
  ],
  userActivity: [
    { user: 'احمد محمدی', role: 'ADMIN', projects: 12, documents: 156, lastActivity: '2 ساعت پیش' },
    { user: 'فاطمه احمدی', role: 'BUYER', projects: 8, documents: 89, lastActivity: '1 روز پیش' },
    { user: 'علی رضایی', role: 'CONTRACTOR', projects: 6, documents: 67, lastActivity: '3 روز پیش' },
    { user: 'مریم کریمی', role: 'SUPPLIER', projects: 4, documents: 45, lastActivity: '1 هفته پیش' }
  ],
  systemMetrics: {
    totalProjects: 28,
    totalDocuments: 445,
    activeUsers: 20,
    storageUsed: 2.4,
    storageTotal: 10,
    uptime: 99.8,
    lastBackup: '2 روز پیش'
  }
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [projectFilter, setProjectFilter] = useState('همه');
  const [userFilter, setUserFilter] = useState('همه');
  const [reportType, setReportType] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as any });

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      router.push('/projects');
    }
  }, [isAdmin, router]);

  // Don't render the page if user is not admin
  if (!isAdmin) {
    return null;
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleGenerateReport = () => {
    setLoading(true);
    // Simulate report generation
    setTimeout(() => {
      setLoading(false);
      showSnackbar('گزارش با موفقیت تولید شد', 'success');
    }, 2000);
  };

  const handleExportReport = (format: string) => {
    showSnackbar(`گزارش در حال آماده‌سازی به فرمت ${format}...`, 'info');
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          گزارش‌ها و تحلیل‌ها
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          تولید و مشاهده گزارش‌های مختلف سیستم
        </Typography>
      </Box>

      {/* Report Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 3 }}>
            <Box>
              <TextField
                fullWidth
                type="date"
                label="از تاریخ"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiInputBase-input': { fontFamily: 'Vazirmatn, Arial, sans-serif' }, '& .MuiInputLabel-root': { fontFamily: 'Vazirmatn, Arial, sans-serif' } }}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                type="date"
                label="تا تاریخ"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiInputBase-input': { fontFamily: 'Vazirmatn, Arial, sans-serif' }, '& .MuiInputLabel-root': { fontFamily: 'Vazirmatn, Arial, sans-serif' } }}
              />
            </Box>
            <Box>
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>پروژه</InputLabel>
                <Select
                  value={projectFilter}
                  label="پروژه"
                  onChange={(e) => setProjectFilter(e.target.value)}
                  sx={{ '& .MuiSelect-select': { fontFamily: 'Vazirmatn, Arial, sans-serif' } }}
                >
                  <MenuItem value="همه" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>همه پروژه‌ها</MenuItem>
                  <MenuItem value="فعال" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>پروژه‌های فعال</MenuItem>
                  <MenuItem value="آرشیو" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>پروژه‌های آرشیو</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>نوع گزارش</InputLabel>
                <Select
                  value={reportType}
                  label="نوع گزارش"
                  onChange={(e) => setReportType(e.target.value)}
                  sx={{ '& .MuiSelect-select': { fontFamily: 'Vazirmatn, Arial, sans-serif' } }}
                >
                  <MenuItem value="summary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>خلاصه کلی</MenuItem>
                  <MenuItem value="detailed" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>تفصیلی</MenuItem>
                  <MenuItem value="comparison" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>مقایسه‌ای</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Assessment />}
                onClick={handleGenerateReport}
                disabled={loading}
                sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
              >
                {loading ? 'در حال تولید...' : 'تولید گزارش'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="report tabs">
          <Tab label="خلاصه کلی" icon={<Assessment />} sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }} />
          <Tab label="آمار پروژه‌ها" icon={<TrendingUp />} sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }} />
          <Tab label="فعالیت کاربران" icon={<Timeline />} sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }} />
          <Tab label="تحلیل اسناد" icon={<BarChart />} sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }} />
          <Tab label="معیارهای سیستم" icon={<TableChart />} sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }} />
        </Tabs>

        {/* Summary Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
            {/* System Overview Cards */}
            <Box>
              <Card sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" component="div" fontWeight="bold" color="primary.main" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        {mockReportData.systemMetrics.totalProjects}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        کل پروژه‌ها
                      </Typography>
                    </Box>
                    <TrendingUp sx={{ fontSize: 40, color: 'primary.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>
            
            <Box>
              <Card sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" component="div" fontWeight="bold" color="success.main" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        {mockReportData.systemMetrics.totalDocuments}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        کل اسناد
                      </Typography>
                    </Box>
                    <FileDownload sx={{ fontSize: 40, color: 'success.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>
            
            <Box>
              <Card sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" component="div" fontWeight="bold" color="warning.main" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        {mockReportData.systemMetrics.activeUsers}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        کاربران فعال
                      </Typography>
                    </Box>
                    <Timeline sx={{ fontSize: 40, color: 'warning.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>
            
            <Box>
              <Card sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" component="div" fontWeight="bold" color="info.main" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        {mockReportData.systemMetrics.uptime}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        آپتایم سیستم
                      </Typography>
                    </Box>
                    <TrendingUp sx={{ fontSize: 40, color: 'info.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Charts */}
            <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    روند رشد پروژه‌ها و اسناد
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mockReportData.projectStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="projects" stroke="#8884d8" strokeWidth={2} />
                      <Line type="monotone" dataKey="documents" stroke="#82ca9d" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 1' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    توزیع انواع اسناد
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={mockReportData.documentTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {mockReportData.documentTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </TabPanel>

        {/* Project Statistics Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(1, 1fr)' }, gap: 3 }}>
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    آمار ماهانه پروژه‌ها
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <RechartsBarChart data={mockReportData.projectStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="projects" fill="#8884d8" />
                      <Bar dataKey="documents" fill="#82ca9d" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </TabPanel>

        {/* User Activity Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(1, 1fr)' }, gap: 3 }}>
            <Box>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      فعالیت کاربران
                    </Typography>
                    <Box>
                      <Button
                        size="small"
                        startIcon={<Download />}
                        onClick={() => handleExportReport('Excel')}
                        sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                      >
                        خروجی Excel
                      </Button>
                      <Button
                        size="small"
                        startIcon={<PictureAsPdf />}
                        onClick={() => handleExportReport('PDF')}
                        sx={{ ml: 1, fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                      >
                        خروجی PDF
                      </Button>
                    </Box>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>کاربر</TableCell>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>نقش</TableCell>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>تعداد پروژه‌ها</TableCell>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>تعداد اسناد</TableCell>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>آخرین فعالیت</TableCell>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>عملیات</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {mockReportData.userActivity.map((user, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="subtitle2" fontWeight="medium" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                                {user.user}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={user.role} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>{user.projects}</TableCell>
                            <TableCell>{user.documents}</TableCell>
                            <TableCell>{user.lastActivity}</TableCell>
                            <TableCell>
                              <IconButton size="small" color="primary">
                                <Visibility />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </TabPanel>

        {/* Document Analysis Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
            <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 1' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    توزیع انواع اسناد
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={mockReportData.documentTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {mockReportData.documentTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>
            
            <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 1' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    آمار ذخیره‌سازی
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>فضای استفاده شده</Typography>
                      <Typography variant="body2" fontWeight="medium" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        {mockReportData.systemMetrics.storageUsed} GB
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(mockReportData.systemMetrics.storageUsed / mockReportData.systemMetrics.storageTotal) * 100}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      از {mockReportData.systemMetrics.storageTotal} GB کل فضا
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>آخرین پشتیبان‌گیری</Typography>
                    <Typography variant="body2" fontWeight="medium" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {mockReportData.systemMetrics.lastBackup}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </TabPanel>

        {/* System Metrics Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(1, 1fr)' }, gap: 3 }}>
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    معیارهای عملکرد سیستم
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 'bold', fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            تعداد کل پروژه‌ها
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>{mockReportData.systemMetrics.totalProjects}</TableCell>
                          <TableCell>
                            <Chip label="فعال" color="success" size="small" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 'bold', fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            تعداد کل اسناد
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>{mockReportData.systemMetrics.totalDocuments}</TableCell>
                          <TableCell>
                            <Chip label="در حال رشد" color="primary" size="small" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 'bold', fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            کاربران فعال
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>{mockReportData.systemMetrics.activeUsers}</TableCell>
                          <TableCell>
                            <Chip label="پایدار" color="success" size="small" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 'bold', fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            آپتایم سیستم
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>{mockReportData.systemMetrics.uptime}%</TableCell>
                          <TableCell>
                            <Chip label="عالی" color="success" size="small" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 'bold', fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            فضای ذخیره‌سازی
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                            {mockReportData.systemMetrics.storageUsed} GB / {mockReportData.systemMetrics.storageTotal} GB
                          </TableCell>
                          <TableCell>
                            <Chip label="کافی" color="warning" size="small" />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </TabPanel>
      </Paper>

      {/* Export Options */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<GetApp />}
          onClick={() => handleExportReport('Excel')}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          خروجی Excel
        </Button>
        <Button
          variant="outlined"
          startIcon={<PictureAsPdf />}
          onClick={() => handleExportReport('PDF')}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          خروجی PDF
        </Button>
        <Button
          variant="outlined"
          startIcon={<Share />}
          onClick={() => showSnackbar('قابلیت اشتراک‌گذاری در حال توسعه است', 'info')}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          اشتراک‌گذاری
        </Button>
        <Button
          variant="outlined"
          startIcon={<Print />}
          onClick={() => window.print()}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          چاپ
        </Button>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

