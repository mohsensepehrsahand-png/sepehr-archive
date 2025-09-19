"use client";
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import PersianDatePicker from '../common/PersianDatePicker';

interface Stage {
  id: string;
  title: string;
}

interface Document {
  id: string;
  documentNumber: string;
  documentDate: string;
  description: string;
  totalDebit: number;
  totalCredit: number;
  status: 'TEMPORARY' | 'PERMANENT';
}

interface StageReportsModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

export default function StageReportsModal({ open, onClose, projectId }: StageReportsModalProps) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      fetchStages();
    }
  }, [open, projectId]);

  const fetchStages = async () => {
    try {
      const response = await fetch(`/api/finance/projects/${projectId}/installment-definitions`);
      if (response.ok) {
        const data = await response.json();
        setStages(data);
      }
    } catch (error) {
      console.error('Error fetching stages:', error);
    }
  };

  const fetchStageDocuments = async () => {
    if (!selectedStage) {
      setError('لطفاً مرحله را انتخاب کنید');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        projectId,
        stageId: selectedStage
      });

      if (dateFrom) {
        params.append('dateFrom', dateFrom);
      }
      if (dateTo) {
        params.append('dateTo', dateTo);
      }

      const response = await fetch(`/api/accounting/documents?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else {
        setError('خطا در دریافت اسناد');
      }
    } catch (error) {
      console.error('Error fetching stage documents:', error);
      setError('خطا در دریافت اسناد');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR');
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fa-IR');
  };

  const totalDebit = documents.reduce((sum, doc) => sum + doc.totalDebit, 0);
  const totalCredit = documents.reduce((sum, doc) => sum + doc.totalCredit, 0);
  const documentCount = documents.length;

  const selectedStageTitle = stages.find(s => s.id === selectedStage)?.title || '';

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { fontFamily: 'Vazirmatn, Arial, sans-serif' }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
        گزارش مراحل پروژه
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>انتخاب مرحله</InputLabel>
                <Select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  label="انتخاب مرحله"
                >
                  {stages.map((stage) => (
                    <MenuItem key={stage.id} value={stage.id}>
                      {stage.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <PersianDatePicker
                value={dateFrom}
                onChange={setDateFrom}
                label="از تاریخ"
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <PersianDatePicker
                value={dateTo}
                onChange={setDateTo}
                label="تا تاریخ"
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="contained"
                onClick={fetchStageDocuments}
                disabled={!selectedStage || loading}
                fullWidth
              >
                {loading ? <CircularProgress size={20} /> : 'جستجو'}
              </Button>
            </Grid>
          </Grid>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {documents.length > 0 && (
          <Box>
            {/* خلاصه گزارش */}
            <Paper sx={{ p: 2, mb: 3, backgroundColor: 'grey.50' }}>
              <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                خلاصه گزارش مرحله: {selectedStageTitle}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="body2" color="text.secondary">
                      تعداد اسناد
                    </Typography>
                    <Typography variant="h5" color="primary">
                      {documentCount}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="body2" color="text.secondary">
                      مجموع بدهکار
                    </Typography>
                    <Typography variant="h5" color="error">
                      {formatCurrency(totalDebit)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="body2" color="text.secondary">
                      مجموع بستانکار
                    </Typography>
                    <Typography variant="h5" color="success.main">
                      {formatCurrency(totalCredit)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* جدول اسناد */}
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      ردیف
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      شماره سند
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      تاریخ سند
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      توضیحات
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      بدهکار
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      بستانکار
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      وضعیت
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.map((document, index) => (
                    <TableRow key={document.id}>
                      <TableCell sx={{ textAlign: 'center' }}>{index + 1}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>{document.documentNumber}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>{formatDate(document.documentDate)}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>{document.description || '-'}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip 
                          label={formatCurrency(document.totalDebit)} 
                          color="error" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip 
                          label={formatCurrency(document.totalCredit)} 
                          color="success" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip 
                          label={document.status === 'PERMANENT' ? 'دائم' : 'موقت'} 
                          color={document.status === 'PERMANENT' ? 'success' : 'warning'} 
                          size="small" 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {documents.length === 0 && selectedStage && !loading && (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary">
              هیچ سندی برای مرحله انتخابی یافت نشد
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          بستن
        </Button>
      </DialogActions>
    </Dialog>
  );
}
