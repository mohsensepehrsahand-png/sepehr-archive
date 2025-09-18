"use client";
import { useState } from 'react';
import {
  Box,
  Button,
  Grid
} from '@mui/material';
import BalanceSheetModal from './BalanceSheetModal';
import TrialBalanceModal from './TrialBalanceModal';

interface ReportsTabProps {
  projectId: string;
}

export default function ReportsTab({ projectId }: ReportsTabProps) {
  const [showBalanceSheet, setShowBalanceSheet] = useState(false);
  const [showTrialBalance, setShowTrialBalance] = useState(false);

  return (
    <Box>
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Grid container spacing={3} justifyContent="center" maxWidth="600px">
          <Grid item>
            <Button
              variant="contained"
              size="large"
              onClick={() => setShowBalanceSheet(true)}
              sx={{
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                fontSize: '1.2rem',
                padding: '12px 24px'
              }}
            >
              ترازنامه
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              size="large"
              onClick={() => setShowTrialBalance(true)}
              sx={{
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                fontSize: '1.2rem',
                padding: '12px 24px'
              }}
            >
              تراز آزمایشی
            </Button>
          </Grid>
        </Grid>
      </Box>

      <BalanceSheetModal
        open={showBalanceSheet}
        onClose={() => setShowBalanceSheet(false)}
        projectId={projectId}
      />

      <TrialBalanceModal
        open={showTrialBalance}
        onClose={() => setShowTrialBalance(false)}
        projectId={projectId}
      />
    </Box>
  );
}
