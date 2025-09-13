"use client";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Alert,
  IconButton
} from "@mui/material";
import {
  CloudUpload,
  Close,
  Image
} from "@mui/icons-material";
import { useState, useRef } from "react";

interface ReceiptUploadDialogProps {
  open: boolean;
  onClose: () => void;
  paymentId: string;
  onSuccess: () => void;
}

export default function ReceiptUploadDialog({
  open,
  onClose,
  paymentId,
  onSuccess
}: ReceiptUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError("نوع فایل مجاز نیست. فقط تصاویر JPEG, PNG و GIF مجاز است");
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (selectedFile.size > maxSize) {
        setError("حجم فایل نباید بیشتر از 5 مگابایت باشد");
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("لطفاً یک فایل انتخاب کنید");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("receipt", file);

      const response = await fetch(`/api/finance/payments/${paymentId}/receipt`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "خطا در آپلود فایل");
      }

      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "خطا در آپلود فایل");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      const fakeEvent = {
        target: { files: [droppedFile] }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(fakeEvent);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ 
        fontFamily: 'Vazirmatn, Arial, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Image color="primary" />
          آپلود تصویر فیش پرداخت
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          sx={{
            border: '2px dashed #ccc',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.3s',
            '&:hover': {
              borderColor: 'primary.main'
            }
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography 
            variant="h6" 
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', mb: 1 }}
          >
            فایل را اینجا بکشید یا کلیک کنید
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', mb: 2 }}
          >
            فرمت‌های مجاز: JPEG, PNG, GIF (حداکثر 5 مگابایت)
          </Typography>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </Box>

        {file && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              فایل انتخاب شده:
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} مگابایت)
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            {error}
          </Alert>
        )}

        {uploading && (
          <Box sx={{ mt: 2 }}>
            <Typography 
              variant="body2" 
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', mb: 1 }}
            >
              در حال آپلود...
            </Typography>
            <LinearProgress />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={handleClose}
          disabled={uploading}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          انصراف
        </Button>
        <Button 
          onClick={handleUpload}
          variant="contained"
          disabled={!file || uploading}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          آپلود
        </Button>
      </DialogActions>
    </Dialog>
  );
}

