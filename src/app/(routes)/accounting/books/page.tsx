"use client";
import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Paper,
  Grid,
  Button,
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
  AccountBalanceWallet
} from '@mui/icons-material';
import Daybook from '@/components/accounting/Daybook';
import GeneralLedger from '@/components/accounting/GeneralLedger';
import SubsidiaryLedger from '@/components/accounting/SubsidiaryLedger';
import DetailLedger from '@/components/accounting/DetailLedger';
import BankIntegration from '@/components/accounting/BankIntegration';

interface BooksPageProps {
  params: {
    projectId: string;
  };
}

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
      id={`accounting-books-tabpanel-${index}`}
      aria-labelledby={`accounting-books-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AccountingBooksPage({ params }: BooksPageProps) {
  const [tabValue, setTabValue] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

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

  const tabs = [
    {
      label: 'دفتر روزنامه',
      icon: <Receipt />,
      component: <Daybook key={refreshKey} projectId={params.projectId} />
    },
    {
      label: 'دفتر کل',
      icon: <AccountBalance />,
      component: <GeneralLedger key={refreshKey} projectId={params.projectId} />
    },
    {
      label: 'دفتر معین',
      icon: <People />,
      component: <SubsidiaryLedger key={refreshKey} projectId={params.projectId} />
    },
    {
      label: 'دفتر تفصیلی',
      icon: <AccountBalance />,
      component: <DetailLedger key={refreshKey} projectId={params.projectId} />
    },
    {
      label: 'یکپارچه‌سازی بانکی',
      icon: <AccountBalanceWallet />,
      component: <BankIntegration key={refreshKey} projectId={params.projectId} />
    }
  ];

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4" component="h1">
              دفاتر سه گانه حسابداری
            </Typography>
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

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            مدیریت کامل دفاتر حسابداری شامل دفتر روزنامه، دفتر کل و دفتر معین
          </Typography>

          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  minHeight: 64,
                  fontSize: '1rem',
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
                      fontSize: '1.2rem'
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
