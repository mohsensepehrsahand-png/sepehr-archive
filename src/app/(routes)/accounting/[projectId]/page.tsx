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
  Grid,
  Button,
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
  CalendarMonth,
  ArrowForward
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

export default function ProjectAccountingPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [tabValue, setTabValue] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [projectName, setProjectName] = useState('');
  const [installmentTabValue, setInstallmentTabValue] = useState(0);
  const [fiscalYears, setFiscalYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch project name
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        if (projectResponse.ok) {
          const project = await projectResponse.json();
          setProjectName(project.name);
        }

        // Fetch fiscal years
        const fiscalYearsResponse = await fetch(`/api/projects/${projectId}/fiscal-years`);
        if (fiscalYearsResponse.ok) {
          const fiscalYearsData = await fiscalYearsResponse.json();
          setFiscalYears(fiscalYearsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchData();
    }
  }, [projectId]);

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

  if (!projectId) {
    return (
      <Box p={3}>
        <Alert severity="error">
          شناسه پروژه مورد نیاز است
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  const tabs = [
    {
      label: 'کدینگ حسابداری',
      icon: <AccountTree />,
      component: <HierarchicalCodingDefinition key={refreshKey} projectId={projectId} />
    },
    {
      label: 'اسناد حسابداری',
      icon: <Description />,
      component: <DocumentsTab key={refreshKey} projectId={projectId} />
    },
    {
      label: 'سند افتتاحیه',
      icon: <PlayArrow />,
      component: <OpeningEntryTab key={`opening-${refreshKey}`} projectId={projectId} />
    },
    {
      label: 'سند اختتامیه',
      icon: <Stop />,
      component: <ClosingEntryTab key={refreshKey} projectId={projectId} />
    },
    {
      label: 'دفاتر حسابداری',
      icon: <AccountBalance />,
      component: <AccountingBooksTab key={refreshKey} projectId={projectId} refreshKey={refreshKey} />
    },
    {
      label: 'گزارش‌ها',
      icon: <Assessment />,
      component: <ReportsTab key={refreshKey} projectId={projectId} />
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              {projectName && (
                <Typography variant="h4" component="h1">
                  {projectName}
                </Typography>
              )}
            </Box>
            <Box>
              <Tooltip title="بروزرسانی">
                <IconButton onClick={handleRefresh}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Typography variant="h6" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonth />
            انتخاب سال مالی
          </Typography>

          {fiscalYears.length === 0 ? (
            <Alert severity="info">
              هیچ سال مالی برای این پروژه تعریف نشده است. لطفاً ابتدا سال مالی تعریف کنید.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {fiscalYears.map((fiscalYear) => (
                <Grid item xs={12} sm={6} md={4} key={fiscalYear.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 4
                      }
                    }}
                    onClick={() => router.push(`/accounting/${projectId}/${fiscalYear.id}`)}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="h6" component="h3">
                          سال مالی {fiscalYear.year}
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          endIcon={<ArrowForward />}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/accounting/${projectId}/${fiscalYear.id}`);
                          }}
                        >
                          ورود
                        </Button>
                      </Box>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {formatDate(fiscalYear.startDate)} - {formatDate(fiscalYear.endDate)}
                      </Typography>
                      <Box display="flex" gap={1}>
                        {fiscalYear.isActive && (
                          <Chip 
                            label="فعال" 
                            color="success" 
                            size="small" 
                          />
                        )}
                        {fiscalYear.isClosed && (
                          <Chip 
                            label="بسته" 
                            color="default" 
                            size="small" 
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
