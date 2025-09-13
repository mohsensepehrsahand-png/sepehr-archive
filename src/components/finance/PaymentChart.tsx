"use client";
import { Box, Typography } from "@mui/material";

interface Installment {
  id: string;
  title: string;
  shareAmount: number;
  paidAmount: number;
}

interface PaymentChartProps {
  data: Installment[];
}

export default function PaymentChart({ data }: PaymentChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fa-IR").format(amount) + " ریال";
  };

  if (data.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          داده‌ای برای نمایش وجود ندارد
        </Typography>
      </Box>
    );
  }

  const maxAmount = Math.max(...data.map(item => item.shareAmount));

  return (
    <Box>
      {data.map((installment) => {
        const paidPercentage = installment.shareAmount > 0 
          ? (installment.paidAmount / installment.shareAmount) * 100 
          : 0;
        
        return (
          <Box key={installment.id} mb={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                {installment.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                {Math.round(paidPercentage)}%
              </Typography>
            </Box>
            
            <Box 
              sx={{ 
                width: '100%', 
                height: 20, 
                backgroundColor: 'grey.200', 
                borderRadius: 1,
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <Box 
                sx={{ 
                  width: `${paidPercentage}%`, 
                  height: '100%', 
                  backgroundColor: paidPercentage === 100 ? 'success.main' : 'primary.main',
                  transition: 'width 0.3s ease'
                }}
              />
            </Box>
            
            <Box display="flex" justifyContent="space-between" mt={1}>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                پرداخت شده: {formatCurrency(installment.paidAmount)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                کل: {formatCurrency(installment.shareAmount)}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
