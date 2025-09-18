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
  Alert,
  Chip,
  Divider
} from "@mui/material";
import { Close, Add, AttachFile, Delete } from "@mui/icons-material";
import { useState } from "react";
import DocumentSelector from "./DocumentSelector";
import PersianDatePicker from "../common/PersianDatePicker";

interface Document {
  id: string;
  name: string;
  mimeType: string;
  fileExt: string;
}

interface AddReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (receiptData: {
    amount: number;
    receiptDate: string;
    description: string;
    receiptImagePath?: string;
  }) => Promise<void>;
  installmentTitle: string;
  projectId?: string;
}

export default function AddReceiptDialog({
  open,
  onClose,
  onSave,
  installmentTitle,
  projectId
}: AddReceiptDialogProps) {
  const [amount, setAmount] = useState<number>(0);
  const [receiptDate, setReceiptDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documentSelectorOpen, setDocumentSelectorOpen] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");
      
      await onSave({
        amount,
        receiptDate,
        description,
        receiptImagePath: selectedDocument ? `/api/documents/${selectedDocument.id}/download` : undefined,
      });
      
      // Reset form
      setAmount(0);
      setReceiptDate("");
      setDescription("");
      setSelectedDocument(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ذخیره فیش");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAmount(0);
      setReceiptDate("");
      setDescription("");
      setSelectedDocument(null);
      setError("");
      onClose();
    }
  };

  const handleDocumentSelected = async (documentId: string) => {
    try {
      // Fetch document details from the API
      const response = await fetch(`/api/documents/${documentId}`);
      if (response.ok) {
        const document = await response.json();
        setSelectedDocument({
          id: document.id,
          name: document.name,
          mimeType: document.mimeType,
          fileExt: document.fileExt
        });
      } else {
        // Fallback to mock document object
        setSelectedDocument({
          id: documentId,
          name: `سند انتخاب شده (${documentId})`,
          mimeType: 'application/pdf',
          fileExt: 'pdf'
        });
      }
      setDocumentSelectorOpen(false);
    } catch (error) {
      console.error('Error fetching document details:', error);
      // Fallback to mock document object
      setSelectedDocument({
        id: documentId,
        name: `سند انتخاب شده (${documentId})`,
        mimeType: 'application/pdf',
        fileExt: 'pdf'
      });
      setDocumentSelectorOpen(false);
    }
  };

  const handleRemoveDocument = () => {
    setSelectedDocument(null);
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
          <Add color="primary" />
          <Typography variant="h6" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            اضافه کردن فیش جدید
          </Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={loading}>
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            قسط: {installmentTitle}
          </Typography>
        </Box>
        
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
          
          <PersianDatePicker
            value={receiptDate}
            onChange={setReceiptDate}
            label="تاریخ فیش"
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

          <Divider sx={{ my: 2 }} />

          {/* Document Selection */}
          <Box>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif', 
                mb: 1,
                fontWeight: 'bold'
              }}
            >
              انتخاب سند فیش:
            </Typography>
            
            {selectedDocument ? (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                p: 2,
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                backgroundColor: '#f5f5f5'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachFile color="primary" />
                  <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    {selectedDocument.name}
                  </Typography>
                  <Chip 
                    label={selectedDocument.fileExt.toUpperCase()} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
                <IconButton 
                  onClick={handleRemoveDocument}
                  size="small"
                  color="error"
                >
                  <Delete />
                </IconButton>
              </Box>
            ) : (
              <Button
                variant="outlined"
                startIcon={<AttachFile />}
                onClick={() => setDocumentSelectorOpen(true)}
                fullWidth
                sx={{ 
                  fontFamily: 'Vazirmatn, Arial, sans-serif',
                  py: 1.5
                }}
              >
                انتخاب سند از پروژه
              </Button>
            )}
          </Box>
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
          startIcon={<Add />}
          sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        >
          {loading ? "در حال ذخیره..." : "ذخیره فیش"}
        </Button>
      </DialogActions>

      {/* Document Selector Dialog */}
      {projectId && (
        <DocumentSelector
          open={documentSelectorOpen}
          onClose={() => setDocumentSelectorOpen(false)}
          projectId={projectId}
          installmentId="" // We don't need installmentId for receipt document selection
          onDocumentSelected={handleDocumentSelected}
        />
      )}
    </Dialog>
  );
}
