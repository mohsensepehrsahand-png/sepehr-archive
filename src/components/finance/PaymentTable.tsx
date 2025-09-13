"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box
} from "@mui/material";

interface Payment {
  id: string;
  paymentDate: string;
  amount: number;
  installmentTitle: string;
  description?: string;
}

interface PaymentTableProps {
  payments: Payment[];
}

export default function PaymentTable({ payments }: PaymentTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fa-IR").format(amount) + " ریال";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  if (payments.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          هیچ پرداختی ثبت نشده است
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
              تاریخ پرداخت
            </TableCell>
            <TableCell align="left" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
              مبلغ
            </TableCell>
            <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
              تخصیص به قسط
            </TableCell>
            <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
              توضیحات
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id} hover>
              <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                {formatDate(payment.paymentDate)}
              </TableCell>
              <TableCell sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                color: 'success.main',
                fontWeight: 'bold'
              }}>
                {formatCurrency(payment.amount)}
              </TableCell>
              <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                {payment.installmentTitle}
              </TableCell>
              <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                {payment.description || "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
