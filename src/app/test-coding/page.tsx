"use client";
import { useState } from 'react';
import { Box, Typography, Paper, Divider, Grid } from '@mui/material';
import CodeInput from '@/components/accounting/CodeInput';

export default function TestCodingPage() {
  const [selectedCodes, setSelectedCodes] = useState<{[key: string]: string}>({});

  const handleCodeChange = (type: string) => (fullCode: string) => {
    setSelectedCodes(prev => ({
      ...prev,
      [type]: fullCode
    }));
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
        نمونه‌های کدینگ حسابداری
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              گروه حساب (1 رقم)
            </Typography>
            <CodeInput 
              label="کد گروه"
              prefix={[]}
              onCodeChange={handleCodeChange('group')}
              maxLength={1}
              placeholder="1"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              کل حساب (1 رقم)
            </Typography>
            <CodeInput 
              label="کد کل"
              prefix={["1"]}
              onCodeChange={handleCodeChange('class')}
              maxLength={1}
              placeholder="1"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              معین (2 رقم)
            </Typography>
            <CodeInput 
              label="کد معین"
              prefix={["1", "1"]}
              onCodeChange={handleCodeChange('subclass')}
              maxLength={2}
              placeholder="01"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              تفصیلی (2 رقم)
            </Typography>
            <CodeInput 
              label="کد تفصیلی"
              prefix={["1", "1", "01"]}
              onCodeChange={handleCodeChange('detail')}
              maxLength={2}
              placeholder="01"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          کدهای انتخاب شده:
        </Typography>
        
        <Box display="flex" flexDirection="column" gap={1}>
          {Object.entries(selectedCodes).map(([type, code]) => (
            <Box key={type} display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" sx={{ minWidth: 100, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                {type === 'group' && 'گروه:'}
                {type === 'class' && 'کل:'}
                {type === 'subclass' && 'معین:'}
                {type === 'detail' && 'تفصیلی:'}
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                {code || 'هنوز انتخاب نشده'}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}

