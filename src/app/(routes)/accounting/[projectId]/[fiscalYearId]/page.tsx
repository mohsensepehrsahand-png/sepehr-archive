"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Breadcrumbs,
  Link,
  Chip
} from '@mui/material';
import {
  AccountBalance,
  Print,
  Download,
  Refresh,
  Assessment,
  AccountTree,
  Description,
  PlayArrow,
  Stop,
  Payment,
  People,
  ArrowBack,
  CalendarMonth
} from '@mui/icons-material';
import AccountingBooksTab from '@/components/accounting/AccountingBooksTab';
import InstallmentDefinitionsManager from '@/components/finance/InstallmentDefinitionsManager';
import ProjectUsersManager from '@/components/finance/ProjectUsersManager';
import HierarchicalCodingDefinition from '@/components/accounting/HierarchicalCodingDefinition';
import ReportsTab from '@/components/accounting/ReportsTab';
import DocumentsTab from '@/components/accounting/DocumentsTab';
import OpeningEntryTab from '@/components/accounting/OpeningEntryTab';
import ClosingEntryTab from '@/components/accounting/ClosingEntryTab';

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
      id={`accounting-tabpanel-${index}`}
      aria-labelledby={`accounting-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface FiscalYear {
  id: string;
  year: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isClosed: boolean;
}

interface Project {
  id: string;
  name: string;
}

export default function FiscalYearAccountingPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const fiscalYearId = params.fiscalYearId as string;
  
  const [tabValue, setTabValue] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [project, setProject] = useState<Project | null>(null);
  const [fiscalYear, setFiscalYear] = useState<FiscalYear | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [installmentTabValue, setInstallmentTabValue] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch project info
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        if (!projectResponse.ok) {
          throw new Error('پروژه یافت نشد');
        }
        const projectData = await projectResponse.json();
        setProject(projectData);

        // Fetch fiscal year info
        const fiscalYearResponse = await fetch(`/api/projects/${projectId}/fiscal-years/${fiscalYearId}`);
        if (!fiscalYearResponse.ok) {
          throw new Error('سال مالی یافت نشد');
        }
        const fiscalYearData = await fiscalYearResponse.json();
        setFiscalYear(fiscalYearData);
        
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'خطا در دریافت اطلاعات');
      } finally {
        setLoading(false);
      }
    };

    if (projectId && fiscalYearId) {
      fetchData();
    }
  }, [projectId, fiscalYearId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInstallmentTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setInstallmentTabValue(newValue);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Implement export functionality
    console.log('Export functionality to be implemented');
  };

  const handleBackToProject = () => {
    router.push(`/accounting/${projectId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  if (!projectId || !fiscalYearId || !project || !fiscalYear) {
    return (
      <Box p={3}>
        <Alert severity="error">
          اطلاعات مورد نیاز یافت نشد
        </Alert>
      </Box>
    );
  }

  const tabs = [
    {
      label: 'کدینگ حسابداری',
      icon: <AccountTree />,
      component: <HierarchicalCodingDefinition key={refreshKey} projectId={projectId} fiscalYearId={fiscalYearId} />
    },
    {
      label: 'اسناد حسابداری',
      icon: <Description />,
      component: <DocumentsTab key={refreshKey} projectId={projectId} fiscalYearId={fiscalYearId} />
    },
    {
      label: 'سند افتتاحیه',
      icon: <PlayArrow />,
      component: <OpeningEntryTab key={`opening-${refreshKey}`} projectId={projectId} fiscalYearId={fiscalYearId} />
    },
    {
      label: 'سند اختتامیه',
      icon: <Stop />,
      component: <ClosingEntryTab key={refreshKey} projectId={projectId} fiscalYearId={fiscalYearId} />
    },
    {
      label: 'دفاتر حسابداری',
      icon: <AccountBalance />,
      component: <AccountingBooksTab key={refreshKey} projectId={projectId} fiscalYearId={fiscalYearId} refreshKey={refreshKey} />
    },
    {
      label: 'گزارش‌ها',
      icon: <Assessment />,
      component: <ReportsTab key={refreshKey} projectId={projectId} fiscalYearId={fiscalYearId} />
    },
    {
      label: 'مدیریت اقساط',
      icon: <Payment />,
      component: (
        <Box>
          <Paper sx={{ mb: 2 }}>
            <Tabs
              value={installmentTabValue}
              onChange={handleInstallmentTabChange}
              sx={{
                '& .MuiTab-root': {
                  fontFamily: 'Vazirmatn, Arial, sans-serif',
                  fontWeight: 'bold'
                }
              }}
            >
              <Tab label="مدیریت انواع قسط" />
              <Tab label="مدیریت کاربران پروژه" />
            </Tabs>
          </Paper>
          
          {installmentTabValue === 0 && (
            <InstallmentDefinitionsManager
              projectId={projectId}
              onDefinitionsChange={() => setRefreshKey(prev => prev + 1)}
            />
          )}
          
          {installmentTabValue === 1 && (
            <ProjectUsersManager
              projectId={projectId}
              onUsersChange={() => setRefreshKey(prev => prev + 1)}
            />
          )}
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Card>
        <CardContent>
          {/* Breadcrumbs */}
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link 
              color="inherit" 
              href="/accounting"
              sx={{ textDecoration: 'none', cursor: 'pointer' }}
            >
              حسابداری
            </Link>
            <Link 
              color="inherit" 
              href={`/accounting/${projectId}`}
              sx={{ textDecoration: 'none', cursor: 'pointer' }}
            >
              {project.name}
            </Link>
            <Typography color="text.primary">
              سال مالی {fiscalYear.year}
            </Typography>
          </Breadcrumbs>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <IconButton onClick={handleBackToProject} size="small">
                <ArrowBack />
              </IconButton>
              <Box>
                <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {project.name}
                  <Chip 
                    icon={<CalendarMonth />}
                    label={`سال مالی ${fiscalYear.year}`}
                    color={fiscalYear.isActive ? 'primary' : 'default'}
                    variant={fiscalYear.isClosed ? 'outlined' : 'filled'}
                    size="small"
                  />
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(fiscalYear.startDate)} - {formatDate(fiscalYear.endDate)}
                </Typography>
              </Box>
            </Box>
            <Box>
              <Tooltip title="بروزرسانی">
                <IconButton onClick={handleRefresh}>
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Tooltip title="چاپ">
                <IconButton onClick={handlePrint}>
                  <Print />
                </IconButton>
              </Tooltip>
              <Tooltip title="خروجی">
                <IconButton onClick={handleExport}>
                  <Download />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  minHeight: 64,
                  fontSize: '0.9rem',
                  fontWeight: 600
                }
              }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  icon={tab.icon}
                  label={tab.label}
                  iconPosition="start"
                  sx={{
                    flexDirection: 'row',
                    gap: 1,
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.1rem'
                    }
                  }}
                />
              ))}
            </Tabs>

            {tabs.map((tab, index) => (
              <TabPanel key={index} value={tabValue} index={index}>
                {tab.component}
              </TabPanel>
            ))}
          </Paper>
        </CardContent>
      </Card>
    </Box>
  );
}
