"use client";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert
} from "@mui/material";
import { Close, Download, ZoomIn, ZoomOut } from "@mui/icons-material";
import { useState } from "react";

interface ReceiptImageViewerProps {
  open: boolean;
  onClose: () => void;
  receiptImagePath: string;
  receiptNumber: string;
}

export default function ReceiptImageViewer({
  open,
  onClose,
  receiptImagePath,
  receiptNumber
}: ReceiptImageViewerProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [zoom, setZoom] = useState(1);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = receiptImagePath;
    link.download = `receipt-${receiptNumber}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          fontFamily: 'Vazirmatn, Arial, sans-serif',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        fontFamily: 'Vazirmatn, Arial, sans-serif'
      }}>
        <Typography variant="h6" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          نمایش فیش - {receiptNumber}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          minHeight: '400px',
          justifyContent: 'center'
        }}>
          {imageLoading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                در حال بارگذاری تصویر...
              </Typography>
            </Box>
          )}

          {imageError && (
            <Alert 
              severity="error" 
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              خطا در بارگذاری تصویر فیش
            </Alert>
          )}

          {!imageError && (
            <Box sx={{ 
              position: 'relative',
              overflow: 'auto',
              maxHeight: '70vh',
              maxWidth: '100%',
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              backgroundColor: '#f5f5f5'
            }}>
              <img
                src={receiptImagePath}
                alt={`فیش ${receiptNumber}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{
                  width: '100%',
                  height: 'auto',
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  transition: 'transform 0.3s ease',
                  display: imageLoading ? 'none' : 'block'
                }}
              />
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<ZoomOut />}
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          کوچک‌تر
        </Button>
        
        <Button
          variant="outlined"
          onClick={handleResetZoom}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          اندازه اصلی
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<ZoomIn />}
          onClick={handleZoomIn}
          disabled={zoom >= 3}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          بزرگ‌تر
        </Button>

        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleDownload}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          دانلود
        </Button>

        <Button
          onClick={onClose}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          بستن
        </Button>
      </DialogActions>
    </Dialog>
  );
}
