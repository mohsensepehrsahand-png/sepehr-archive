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
  IconButton,
  Alert
} from "@mui/material";
import { Close, Edit } from "@mui/icons-material";
import { useState, useEffect } from "react";

interface Receipt {
  id: string;
  receiptNumber: string;
  amount: number;
  receiptDate: string | null;
  description: string | null;
  receiptImagePath: string | null;
}

interface EditReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (receiptId: string, receiptData: {
    amount: number;
    receiptDate: string;
    description: string;
  }) => Promise<void>;
  receipt: Receipt | null;
}

export default function EditReceiptDialog({
  open,
  onClose,
  onSave,
  receipt
}: EditReceiptDialogProps) {
  const [amount, setAmount] = useState<number>(0);
  const [receiptDate, setReceiptDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (receipt) {
      setAmount(receipt.amount);
      setReceiptDate(receipt.receiptDate ? new Date(receipt.receiptDate).toISOString().split('T')[0] : "");
      setDescription(receipt.description || "");
    }
  }, [receipt]);

  const handleSave = async () => {
    if (!receipt) return;
    
    try {
      setLoading(true);
      setError("");
      
      await onSave(receipt.id, {
        amount,
        receiptDate,
        description,
      });
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ذخیره تغییرات فیش");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError("");
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          fontFamily: 'Vazirmatn, Arial, sans-serif'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        fontFamily: 'Vazirmatn, Arial, sans-serif'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Edit color="primary" />
          <Typography variant="h6" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            ویرایش فیش
          </Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={loading}>
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {receipt && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              شماره فیش: {receipt.receiptNumber}
            </Typography>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="مبلغ فیش (ریال)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            fullWidth
            variant="outlined"
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            inputProps={{
              min: 0,
              step: 1000
            }}
          />
          
          <TextField
            label="تاریخ فیش"
            type="date"
            value={receiptDate}
            onChange={(e) => setReceiptDate(e.target.value)}
            fullWidth
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          />
          
          <TextField
            label="توضیحات"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          />
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
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
          startIcon={<Edit />}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          {loading ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
