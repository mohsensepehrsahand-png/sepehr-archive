"use client";
import { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  AccountBalance,
  Receipt,
  People
} from '@mui/icons-material';
import Daybook from './Daybook';
import GeneralLedger from './GeneralLedger';
import SubsidiaryLedger from './SubsidiaryLedger';
import DetailLedger from './DetailLedger';

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
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

interface AccountingBooksTabProps {
  projectId: string;
  refreshKey?: number;
}

export default function AccountingBooksTab({ projectId, refreshKey = 0 }: AccountingBooksTabProps) {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const tabs = [
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
    }
  ];

  return (
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
            minHeight: 48,
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
                fontSize: '1rem'
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
  );
}
