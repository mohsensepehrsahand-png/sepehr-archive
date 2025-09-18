"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
  Tooltip
} from '@mui/material';
import {
  AccountBalance,
  Receipt,
  People,
  Print,
  Download,
  Refresh,
  AccountBalanceWallet,
  Assessment,
  AccountTree,
  Description,
  PlayArrow,
  Stop
} from '@mui/icons-material';
import Daybook from '@/components/accounting/Daybook';
import GeneralLedger from '@/components/accounting/GeneralLedger';
import SubsidiaryLedger from '@/components/accounting/SubsidiaryLedger';
import DetailLedger from '@/components/accounting/DetailLedger';
import BankIntegration from '@/components/accounting/BankIntegration';
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
  const projectId = params.projectId as string;
  const [tabValue, setTabValue] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [projectName, setProjectName] = useState('');

  useEffect(() => {
    // Fetch project name
    const fetchProjectName = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (response.ok) {
          const project = await response.json();
          setProjectName(project.name);
        }
      } catch (error) {
        console.error('Error fetching project name:', error);
      }
    };

    if (projectId) {
      fetchProjectName();
    }
  }, [projectId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
      label: 'دفتر روزنامه',
      icon: <Receipt />,
      component: <Daybook key={refreshKey} projectId={projectId} />
    },
    {
      label: 'دفتر کل',
      icon: <AccountBalance />,
      component: <GeneralLedger key={refreshKey} projectId={projectId} />
    },
    {
      label: 'دفتر معین',
      icon: <People />,
      component: <SubsidiaryLedger key={refreshKey} projectId={projectId} />
    },
    {
      label: 'دفتر تفصیلی',
      icon: <AccountBalance />,
      component: <DetailLedger key={refreshKey} projectId={projectId} />
    },
    {
      label: 'گزارش‌ها',
      icon: <Assessment />,
      component: <ReportsTab key={refreshKey} projectId={projectId} />
    },
    {
      label: 'یکپارچه‌سازی بانکی',
      icon: <AccountBalanceWallet />,
      component: <BankIntegration key={refreshKey} projectId={projectId} />
    }
  ];

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
