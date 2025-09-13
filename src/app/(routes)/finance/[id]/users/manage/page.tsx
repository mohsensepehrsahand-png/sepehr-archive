import { Typography, Box, Paper, Button, Grid } from "@mui/material";

export default async function ManageFinanceUsersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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
        مدیریت کاربران مالی
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                fontWeight: 'bold',
                mb: 2
              }}
            >
              افزودن کاربر جدید
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                mb: 3
              }}
            >
              کاربر جدیدی را به پروژه اضافه کنید و سهم مالی او را تعیین کنید.
            </Typography>
            <Button 
              variant="contained" 
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              افزودن کاربر
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                fontWeight: 'bold',
                mb: 2
              }}
            >
              تنظیمات مالی
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                mb: 3
              }}
            >
              تنظیمات مربوط به اقساط، نرخ جریمه و سایر پارامترهای مالی.
            </Typography>
            <Button 
              variant="outlined" 
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              تنظیمات
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
