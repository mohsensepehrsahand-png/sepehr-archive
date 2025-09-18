"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  DeleteSweep as DeleteSweepIcon
} from '@mui/icons-material';
import PersianDatePicker from '../common/PersianDatePicker';

interface InstallmentDefinition {
  id: string;
  title: string;
  dueDate: string | null;
  amount: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface InstallmentDefinitionsManagerProps {
  projectId: string;
  onDefinitionsChange?: () => void;
}

const InstallmentDefinitionsManager: React.FC<InstallmentDefinitionsManagerProps> = ({
  projectId,
  onDefinitionsChange
}) => {
  const [definitions, setDefinitions] = useState<InstallmentDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDefinition, setEditingDefinition] = useState<InstallmentDefinition | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    dueDate: '',
    amount: ''
  });

  useEffect(() => {
    fetchDefinitions();
  }, [projectId]);

  const fetchDefinitions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/finance/projects/${projectId}/installment-definitions`);
      
      if (!response.ok) {
        throw new Error('خطا در دریافت تعریف‌های اقساط');
      }
      
      const data = await response.json();
      setDefinitions(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching definitions:', err);
      setError(err instanceof Error ? err.message : 'خطای نامشخص');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (definition?: InstallmentDefinition) => {
    if (definition) {
      setEditingDefinition(definition);
      setFormData({
        title: definition.title,
        dueDate: definition.dueDate ? definition.dueDate.split('T')[0] : '',
        amount: definition.amount.toString()
      });
    } else {
      setEditingDefinition(null);
      setFormData({
        title: '',
        dueDate: '',
        amount: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDefinition(null);
    setFormData({
      title: '',
      dueDate: '',
      amount: ''
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.title) {
        setError('لطفاً عنوان قسط را وارد کنید');
        return;
      }

      const url = `/api/finance/projects/${projectId}/installment-definitions`;
      const method = editingDefinition ? 'PUT' : 'POST';
      const body = editingDefinition 
        ? {
            installmentDefinitionId: editingDefinition.id,
            title: formData.title,
            dueDate: formData.dueDate,
            amount: formData.amount
          }
        : {
            title: formData.title,
            dueDate: formData.dueDate,
            amount: formData.amount
          };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در ذخیره تعریف قسط');
      }

      await fetchDefinitions();
      handleCloseDialog();
      onDefinitionsChange?.();
    } catch (err) {
      console.error('Error saving definition:', err);
      setError(err instanceof Error ? err.message : 'خطای نامشخص');
    }
  };

  const handleDelete = async (definitionId: string) => {
    if (!confirm('آیا از حذف این تعریف قسط اطمینان دارید؟')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/finance/projects/${projectId}/installment-definitions?installmentDefinitionId=${definitionId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در حذف تعریف قسط');
      }

      await fetchDefinitions();
      onDefinitionsChange?.();
    } catch (err) {
      console.error('Error deleting definition:', err);
      setError(err instanceof Error ? err.message : 'خطای نامشخص');
    }
  };

  const handleAddDefaultInstallments = async () => {
    if (!confirm('آیا می‌خواهید اقساط پیش فرض را اضافه کنید؟ این عمل قابل بازگشت نیست.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/finance/projects/${projectId}/installment-definitions/default`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در اضافه کردن اقساط پیش فرض');
      }

      const data = await response.json();
      await fetchDefinitions();
      onDefinitionsChange?.();
      
      // Show success message
      alert(`اقساط پیش فرض با موفقیت اضافه شدند. تعداد: ${data.createdInstallments}`);
    } catch (err) {
      console.error('Error adding default installments:', err);
      setError(err instanceof Error ? err.message : 'خطای نامشخص');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllDefaultInstallments = async () => {
    if (!confirm('آیا می‌خواهید تمام اقساط پیش فرض را حذف کنید؟ این عمل قابل بازگشت نیست و تمام اقساط کاربران نیز حذف خواهند شد.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/finance/projects/${projectId}/installment-definitions/default`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در حذف اقساط پیش فرض');
      }

      const data = await response.json();
      await fetchDefinitions();
      onDefinitionsChange?.();
      
      // Show success message
      alert(`تمام اقساط پیش فرض با موفقیت حذف شدند. تعداد: ${data.deletedInstallments}`);
    } catch (err) {
      console.error('Error deleting default installments:', err);
      setError(err instanceof Error ? err.message : 'خطای نامشخص');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            اقساط پیش فرض
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddDefaultInstallments}
              disabled={loading}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              افزودن اقساط پیش فرض
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteSweepIcon />}
              onClick={handleDeleteAllDefaultInstallments}
              disabled={loading}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              حذف اقساط پیش فرض
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              افزودن قسط
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            {error}
          </Alert>
        )}

        {definitions.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              هیچ قسط پیش فرضی تعریف نشده است
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table sx={{ 
              '& .MuiTableCell-root': { 
                textAlign: 'center',
                verticalAlign: 'middle'
              }
            }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>شماره</TableCell>
                  <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>عنوان</TableCell>
                  <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>تاریخ سررسید</TableCell>
                  <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>مبلغ</TableCell>
                  <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>عملیات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {definitions.map((definition, index) => (
                  <TableRow 
                    key={definition.id}
                    sx={{ 
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#ffffff',
                      '&:hover': {
                        backgroundColor: '#f0f0f0'
                      }
                    }}
                  >
                    <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'medium' }}>
                      {definition.order}
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {definition.title}
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {definition.dueDate ? formatDate(definition.dueDate) : 'تعیین نشده'}
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {formatCurrency(definition.amount)}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(definition)}
                        sx={{ mr: 1, color: 'primary.main' }}
                        title="ویرایش"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(definition.id)}
                        color="error"
                        title="حذف"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            {editingDefinition ? 'ویرایش قسط' : 'افزودن قسط جدید'}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="عنوان قسط"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              margin="normal"
              required
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            />
            
            <PersianDatePicker
              value={formData.dueDate}
              onChange={(date) => setFormData({ ...formData, dueDate: date })}
              label="تاریخ سررسید"
            />
            
            <TextField
              fullWidth
              label="مبلغ کل (ریال)"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              margin="normal"
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleCloseDialog}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              لغو
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              startIcon={<SaveIcon />}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              ذخیره
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default InstallmentDefinitionsManager;
