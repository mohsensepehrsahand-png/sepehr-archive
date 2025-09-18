"use client";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { useState, useEffect } from "react";
import PersianDatePicker from "../common/PersianDatePicker";

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  description?: string;
  receiptImagePath?: string;
}

interface EditPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  payment: Payment | null;
  onSave: (paymentId: string, data: { amount: number; paymentDate: string; description: string }) => Promise<void>;
}

export default function EditPaymentDialog({
  open,
  onClose,
  payment,
  onSave
}: EditPaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (payment) {
      setAmount(payment.amount.toString());
      setPaymentDate(new Date(payment.paymentDate).toISOString().split('T')[0]);
      setDescription(payment.description || "");
    }
  }, [payment]);

  const handleSave = async () => {
    if (!payment) return;

    // Validate amount and date for both receipts and payments
    if (!amount || !paymentDate) {
      alert("لطفاً مبلغ و تاریخ را وارد کنید");
      return;
    }

    setLoading(true);
    try {
      // For both receipts and payments, save all fields
      await onSave(payment.id, {
        amount: parseFloat(amount),
        paymentDate,
        description
      });
      onClose();
    } catch (error) {
      console.error("Error saving payment:", error);
      alert("خطا در ذخیره تغییرات");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
        {payment?.receiptImagePath ? "ویرایش فیش" : "ویرایش پرداخت"}
        <IconButton
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
          disabled={loading}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            fullWidth
            label={payment?.receiptImagePath ? "مبلغ فیش" : "مبلغ پرداخت (ریال)"}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            InputLabelProps={{ sx: { fontFamily: 'Vazirmatn, Arial, sans-serif' } }}
            inputProps={{ sx: { fontFamily: 'Vazirmatn, Arial, sans-serif' } }}
            helperText={payment?.receiptImagePath ? "مبلغ فیش روی محاسبات قسط تأثیر نمی‌گذارد" : undefined}
          />

          <PersianDatePicker
            value={paymentDate}
            onChange={setPaymentDate}
            label={payment?.receiptImagePath ? "تاریخ فیش" : "تاریخ پرداخت"}
            disabled={loading}
            helperText={payment?.receiptImagePath ? "تاریخ فیش روی محاسبات قسط تأثیر نمی‌گذارد" : undefined}
          />

          <TextField
            fullWidth
            label="توضیحات"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            InputLabelProps={{ sx: { fontFamily: 'Vazirmatn, Arial, sans-serif' } }}
            inputProps={{ sx: { fontFamily: 'Vazirmatn, Arial, sans-serif' } }}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          انصراف
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          {loading ? "در حال ذخیره..." : "ذخیره"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

