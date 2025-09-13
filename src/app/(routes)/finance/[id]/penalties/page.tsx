import { Typography, Box } from "@mui/material";
import PenaltyTable from "@/components/finance/PenaltyTable";

export default async function PenaltiesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Mock data - در آینده از API دریافت خواهد شد
  const penalties = [
    {
      id: "1",
      installmentNumber: 4,
      installmentTitle: "قسط چهارم",
      dueDate: "2024-04-15",
      daysLate: 45,
      dailyRate: 10000,
      totalPenalty: 450000,
      reason: "تأخیر در پرداخت"
    },
    {
      id: "2",
      installmentNumber: 5,
      installmentTitle: "قسط پنجم",
      dueDate: "2024-05-15",
      daysLate: 15,
      dailyRate: 10000,
      totalPenalty: 150000,
      reason: "تأخیر در پرداخت"
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
        مدیریت جریمه‌ها
      </Typography>
      
      <PenaltyTable penalties={penalties} />
    </Box>
  );
}
