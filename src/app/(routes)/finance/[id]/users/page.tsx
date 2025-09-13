import { Typography, Box, Grid, Card, CardContent, Chip, Button } from "@mui/material";
import Link from "next/link";

export default async function FinanceUsersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Mock data - در آینده از API دریافت خواهد شد
  const users = [
    {
      id: "user1",
      name: "احمد محمدی",
      email: "ahmad@example.com",
      totalShare: 10000000,
      paidAmount: 5000000,
      remainingAmount: 5000000,
      status: "ACTIVE"
    },
    {
      id: "user2", 
      name: "فاطمه احمدی",
      email: "fateme@example.com",
      totalShare: 15000000,
      paidAmount: 10000000,
      remainingAmount: 5000000,
      status: "ACTIVE"
    },
    {
      id: "user3",
      name: "علی رضایی",
      email: "ali@example.com", 
      totalShare: 8000000,
      paidAmount: 0,
      remainingAmount: 8000000,
      status: "PENDING"
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fa-IR").format(amount) + " ریال";
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: "فعال", color: "success" as const },
      PENDING: { label: "در انتظار", color: "warning" as const },
      INACTIVE: { label: "غیرفعال", color: "error" as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
      />
    );
  };

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
        کاربران مالی پروژه
      </Typography>
      
      <Grid container spacing={3}>
        {users.map((user) => (
          <Grid item xs={12} md={6} lg={4} key={user.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                      fontWeight: 'bold'
                    }}
                  >
                    {user.name}
                  </Typography>
                  {getStatusChip(user.status)}
                </Box>
                
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    fontFamily: 'Vazirmatn, Arial, sans-serif',
                    mb: 2
                  }}
                >
                  {user.email}
                </Typography>
                
                <Box mb={2}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                      mb: 1
                    }}
                  >
                    سهم کل: {formatCurrency(user.totalShare)}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                      mb: 1,
                      color: 'success.main'
                    }}
                  >
                    پرداخت شده: {formatCurrency(user.paidAmount)}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                      color: 'error.main'
                    }}
                  >
                    مانده: {formatCurrency(user.remainingAmount)}
                  </Typography>
                </Box>
                
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    component={Link}
                    href={`/finance/${id}/users/${user.id}`}
                    sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                  >
                    جزئیات
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    component={Link}
                    href={`/finance/${id}/users/${user.id}/payments`}
                    sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                  >
                    پرداخت‌ها
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
