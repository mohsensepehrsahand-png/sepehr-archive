import { Typography, Box } from "@mui/material";
import InstallmentTable from "@/components/finance/InstallmentTable";

export default async function InstallmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Mock data - در آینده از API دریافت خواهد شد
  const installments = [
    {
      id: "1",
      title: "قسط اول",
      dueDate: "2024-01-15",
      shareAmount: 10000000,
      paidAmount: 10000000,
      remainingAmount: 0,
      status: "PAID"
    },
    {
      id: "2", 
      title: "قسط دوم",
      dueDate: "2024-02-15",
      shareAmount: 10000000,
      paidAmount: 5000000,
      remainingAmount: 5000000,
      status: "PARTIAL"
    },
    {
      id: "3",
      title: "قسط سوم", 
      dueDate: "2024-03-15",
      shareAmount: 10000000,
      paidAmount: 0,
      remainingAmount: 10000000,
      status: "PENDING"
    },
    {
      id: "4",
      title: "قسط چهارم",
      dueDate: "2024-04-15", 
      shareAmount: 10000000,
      paidAmount: 0,
      remainingAmount: 10000000,
      status: "OVERDUE"
    },
    {
      id: "5",
      title: "قسط پنجم",
      dueDate: "2024-05-15",
      shareAmount: 10000000,
      paidAmount: 0,
      remainingAmount: 10000000,
      status: "PENDING"
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
        مدیریت اقساط
      </Typography>
      
      <InstallmentTable installments={installments} />
    </Box>
  );
}
