import { Typography, Box, Grid, Paper } from "@mui/material";
import PaymentTable from "@/components/finance/PaymentTable";
import PaymentChart from "@/components/finance/PaymentChart";

export default async function PaymentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Mock data - در آینده از API دریافت خواهد شد
  const payments = [
    {
      id: "1",
      paymentDate: "2024-01-10",
      amount: 10000000,
      installmentTitle: "قسط اول",
      description: "پرداخت کامل قسط اول"
    },
    {
      id: "2",
      paymentDate: "2024-02-05",
      amount: 5000000,
      installmentTitle: "قسط دوم",
      description: "پرداخت جزئی قسط دوم"
    }
  ];

  const chartData = [
    {
      id: "1",
      title: "قسط اول",
      shareAmount: 10000000,
      paidAmount: 10000000
    },
    {
      id: "2",
      title: "قسط دوم", 
      shareAmount: 10000000,
      paidAmount: 5000000
    },
    {
      id: "3",
      title: "قسط سوم",
      shareAmount: 10000000,
      paidAmount: 0
    },
    {
      id: "4",
      title: "قسط چهارم",
      shareAmount: 10000000,
      paidAmount: 0
    },
    {
      id: "5",
      title: "قسط پنجم",
      shareAmount: 10000000,
      paidAmount: 0
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          fontFamily: 'Vazirmatn, Arial, sans-serif',
          fontWeight: 'bold',
          mb: 3
        }}
      >
        مدیریت پرداخت‌ها
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                fontWeight: 'bold',
                mb: 2
              }}
            >
              تاریخچه پرداخت‌ها
            </Typography>
            <PaymentTable payments={payments} />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                fontWeight: 'bold',
                mb: 2
              }}
            >
              نمودار پیشرفت پرداخت
            </Typography>
            <PaymentChart data={chartData} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
