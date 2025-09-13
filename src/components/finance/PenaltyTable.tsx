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
  Box,
  Chip
} from "@mui/material";

interface Penalty {
  id: string;
  installmentTitle: string;
  installmentNumber?: number;
  dueDate: string;
  daysLate: number;
  dailyRate: number;
  totalPenalty: number;
  reason?: string;
}

interface PenaltyTableProps {
  penalties: Penalty[];
}

export default function PenaltyTable({ penalties }: PenaltyTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fa-IR").format(amount) + " ریال";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  if (penalties.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          هیچ جریمه‌ای ثبت نشده است
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
              شماره قسط
            </TableCell>
            <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
              عنوان قسط
            </TableCell>
            <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
              تاریخ سررسید
            </TableCell>
            <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
              روزهای تأخیر
            </TableCell>
            <TableCell align="left" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
              نرخ روزانه
            </TableCell>
            <TableCell align="left" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
              مبلغ جریمه
            </TableCell>
            <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
              بابت
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {penalties.map((penalty, index) => (
            <TableRow key={penalty.id} hover>
              <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                {penalty.installmentNumber || index + 1}
              </TableCell>
              <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                {penalty.installmentTitle}
              </TableCell>
              <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                {formatDate(penalty.dueDate)}
              </TableCell>
              <TableCell align="center">
                <Chip
                  label={`${penalty.daysLate} روز`}
                  color={penalty.daysLate > 30 ? "error" : penalty.daysLate > 7 ? "warning" : "default"}
                  size="small"
                  sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                />
              </TableCell>
              <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                {formatCurrency(penalty.dailyRate)}
              </TableCell>
              <TableCell sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                color: 'error.main',
                fontWeight: 'bold'
              }}>
                {formatCurrency(penalty.totalPenalty)}
              </TableCell>
              <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                {penalty.reason || 'تأخیر در پرداخت'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
