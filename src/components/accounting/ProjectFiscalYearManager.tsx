"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  ListItemSecondaryAction,
  Card,
  CardContent,
  CardActions,
  Chip,
  Grid,
  Menu,
  MenuItem,
} from '@mui/material';
import { CalendarMonth, AddCircleOutline, Delete, Edit, MoreVert } from '@mui/icons-material';
import PersianDatePicker from '../common/PersianDatePicker';

interface Project {
  id: string;
  name: string;
}

interface FiscalYear {
  id: string;
  year: number;
  startDate: string;
  endDate: string;
  description?: string;
  isActive: boolean;
  isClosed: boolean;
}

const ProjectFiscalYearManager: React.FC<{ project: Project }> = ({ project }) => {
  const router = useRouter();
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [newYear, setNewYear] = useState<string>('');
  const [newStartDate, setNewStartDate] = useState<string>('');
  const [newEndDate, setNewEndDate] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [yearToDelete, setYearToDelete] = useState<FiscalYear | null>(null);
  const [editingYear, setEditingYear] = useState<FiscalYear | null>(null);
  const [editYear, setEditYear] = useState<string>('');
  const [editStartDate, setEditStartDate] = useState<string>('');
  const [editEndDate, setEditEndDate] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [originalYear, setOriginalYear] = useState<number | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<FiscalYear | null>(null);

  const fetchFiscalYears = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${project.id}/fiscal-years`);
      if (!response.ok) throw new Error('Failed to fetch fiscal years');
      const data = await response.json();
      setFiscalYears(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiscalYears();
  }, [project.id]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewYear('');
    setNewStartDate('');
    setNewEndDate('');
    setNewDescription('');
  };

  const handleCreateYear = async () => {
    if (!newYear || !newStartDate || !newEndDate) return;
    
    // Validate date range
    if (!validateDateRange(newStartDate, newEndDate)) {
      setError('تاریخ پایان باید بعد از تاریخ شروع باشد');
      return;
    }
    
    try {
      const response = await fetch(`/api/projects/${project.id}/fiscal-years`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          year: Number(newYear),
          startDate: newStartDate,
          endDate: newEndDate,
          description: newDescription || null
        }),
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to create fiscal year');
      }
      handleClose();
      fetchFiscalYears();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error');
    }
  };

  const handleDeleteClick = (fy: FiscalYear) => {
    setYearToDelete(fy);
  };

  const handleDeleteConfirm = async () => {
    if (!yearToDelete) return;
    try {
      const response = await fetch(`/api/projects/${project.id}/fiscal-years?year=${yearToDelete.year}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete fiscal year');
      }
      setYearToDelete(null);
      fetchFiscalYears();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error');
    }
  };

  const handleEditClick = (fy: FiscalYear) => {
    setEditingYear(fy);
    setEditYear(fy.year.toString());
    setEditStartDate(fy.startDate.split('T')[0]);
    setEditEndDate(fy.endDate.split('T')[0]);
    setEditDescription(fy.description || '');
    setOriginalYear(fy.year); // Store original year for API lookup
  };

  const handleEditClose = () => {
    setEditingYear(null);
    setEditYear('');
    setEditStartDate('');
    setEditEndDate('');
    setEditDescription('');
    setOriginalYear(null);
  };

  const handleEditConfirm = async () => {
    if (!editingYear || !editYear || !editStartDate || !editEndDate || !originalYear) return;
    
    // Validate date range
    if (!validateDateRange(editStartDate, editEndDate)) {
      setError('تاریخ پایان باید بعد از تاریخ شروع باشد');
      return;
    }
    
    try {
      const response = await fetch(`/api/projects/${project.id}/fiscal-years`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          originalYear: originalYear, // Use original year for lookup
          year: Number(editYear),
          startDate: editStartDate,
          endDate: editEndDate,
          description: editDescription || null
        }),
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to update fiscal year');
      }
      handleEditClose();
      fetchFiscalYears();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };


  const validateDateRange = (startDate: string, endDate: string): boolean => {
    if (!startDate || !endDate) return true; // Allow empty dates for individual validation
    return new Date(startDate) < new Date(endDate);
  };

  const getDateRangeError = (startDate: string, endDate: string): string => {
    if (!startDate || !endDate) return '';
    if (!validateDateRange(startDate, endDate)) {
      return 'تاریخ پایان باید بعد از تاریخ شروع باشد';
    }
    return '';
  };

  const handleYearChange = (year: string) => {
    setNewYear(year);
  };

  const handleEditYearChange = (year: string) => {
    setEditYear(year);
  };

  const formatFiscalYearDisplay = (fiscalYear: FiscalYear) => {
    const baseDisplay = `${fiscalYear.year} (${formatDate(fiscalYear.startDate)} - ${formatDate(fiscalYear.endDate)})`;
    return fiscalYear.description ? `${baseDisplay} - ${fiscalYear.description}` : baseDisplay;
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, fiscalYear: FiscalYear) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedFiscalYear(fiscalYear);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedFiscalYear(null);
  };

  const handleEditFromMenu = () => {
    if (selectedFiscalYear) {
      handleEditClick(selectedFiscalYear);
    }
    handleMenuClose();
  };

  const handleDeleteFromMenu = () => {
    if (selectedFiscalYear) {
      handleDeleteClick(selectedFiscalYear);
    }
    handleMenuClose();
  };

  if (loading) return <CircularProgress size={24} />;

  return (
    <Box mt={1}>
      <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
        سال‌های مالی
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box display="flex" flexDirection="column" gap={1}>
        {fiscalYears.map((fy) => (
          <Box
            key={fy.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              backgroundColor: 'background.paper',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'action.hover',
                borderColor: 'primary.main'
              }
            }}
            onClick={() => router.push(`/accounting/${project.id}/${fy.id}`)}
          >
            <CalendarMonth color="primary" fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
              {formatFiscalYearDisplay(fy)}
            </Typography>
            {fy.isActive && (
              <Chip 
                label="فعال" 
                color="success" 
                size="small" 
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            )}
            {fy.isClosed && (
              <Chip 
                label="بسته" 
                color="default" 
                size="small" 
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            )}
            <IconButton
              size="small"
              onClick={(e) => handleMenuClick(e, fy)}
              sx={{ p: 0.5 }}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>

      <Button
        variant="outlined"
        size="small"
        startIcon={<AddCircleOutline />}
        onClick={handleOpen}
        sx={{ mt: 1, fontSize: '0.75rem', py: 0.5 }}
      >
        سال مالی جدید
      </Button>

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth 
        PaperProps={{ 
          sx: { 
            minHeight: '750px',
            maxHeight: '90vh',
            '& .MuiDialog-paper': {
              overflow: 'visible'
            }
          } 
        }}
      >
        <DialogTitle sx={{ 
          fontFamily: 'Vazirmatn, Arial, sans-serif',
          fontSize: '1.25rem',
          fontWeight: 'bold',
          textAlign: 'center',
          pb: 2
        }}>
          تعریف سال مالی جدید برای {project.name}
        </DialogTitle>
        
        <DialogContent sx={{ 
          px: 3,
          py: 2,
          '& .MuiFormControl-root': {
            mb: 2
          }
        }}>
          <Box sx={{ mb: 3 }}>
            <TextField
              label="سال مالی"
              type="number"
              fullWidth
              variant="outlined"
              value={newYear}
              onChange={(e) => handleYearChange(e.target.value)}
              error={!newYear}
              helperText={!newYear ? 'سال مالی الزامی است' : ''}
              inputProps={{ min: 1300, max: 1500 }}
              sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                '& .MuiInputBase-input': { fontFamily: 'Vazirmatn, Arial, sans-serif' },
                '& .MuiInputLabel-root': { fontFamily: 'Vazirmatn, Arial, sans-serif' }
              }}
            />
          </Box>

          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
            gap: 2,
            mb: 2
          }}>
            <Box sx={{ position: 'relative', zIndex: 1000 }}>
              <PersianDatePicker
                value={newStartDate}
                onChange={setNewStartDate}
                label="تاریخ شروع"
                error={!newStartDate}
                helperText={!newStartDate ? 'تاریخ شروع الزامی است' : ''}
              />
            </Box>
            
            <Box sx={{ position: 'relative', zIndex: 1000 }}>
              <PersianDatePicker
                value={newEndDate}
                onChange={setNewEndDate}
                label="تاریخ پایان"
                error={!newEndDate}
                helperText={!newEndDate ? 'تاریخ پایان الزامی است' : ''}
              />
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              label="توضیحات (اختیاری)"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                '& .MuiInputBase-input': { fontFamily: 'Vazirmatn, Arial, sans-serif' },
                '& .MuiInputLabel-root': { fontFamily: 'Vazirmatn, Arial, sans-serif' }
              }}
            />
          </Box>

          {newStartDate && newEndDate && (
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              backgroundColor: validateDateRange(newStartDate, newEndDate) ? 'primary.50' : 'error.50', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: validateDateRange(newStartDate, newEndDate) ? 'primary.200' : 'error.200'
            }}>
              <Typography variant="body2" sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                textAlign: 'center',
                color: validateDateRange(newStartDate, newEndDate) ? 'primary.main' : 'error.main',
                fontWeight: 'bold'
              }}>
                {validateDateRange(newStartDate, newEndDate) 
                  ? `سال مالی: ${formatDate(newStartDate)} تا ${formatDate(newEndDate)}`
                  : 'تاریخ پایان باید بعد از تاریخ شروع باشد'
                }
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ 
          px: 3, 
          pb: 3,
          gap: 1
        }}>
          <Button 
            onClick={handleClose}
            variant="outlined"
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            انصراف
          </Button>
          <Button 
            onClick={handleCreateYear}
            variant="contained"
            disabled={!newYear || !newStartDate || !newEndDate || !validateDateRange(newStartDate, newEndDate)}
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            ایجاد سال مالی
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={!!editingYear} 
        onClose={handleEditClose} 
        maxWidth="sm" 
        fullWidth 
        PaperProps={{ 
          sx: { 
            minHeight: '750px',
            maxHeight: '90vh',
            '& .MuiDialog-paper': {
              overflow: 'visible'
            }
          } 
        }}
      >
        <DialogTitle sx={{ 
          fontFamily: 'Vazirmatn, Arial, sans-serif',
          fontSize: '1.25rem',
          fontWeight: 'bold',
          textAlign: 'center',
          pb: 2
        }}>
          ویرایش سال مالی
        </DialogTitle>
        
        <DialogContent sx={{ 
          px: 3,
          py: 2,
          '& .MuiFormControl-root': {
            mb: 2
          }
        }}>
          <Box sx={{ mb: 3 }}>
            <TextField
              label="سال مالی"
              type="number"
              fullWidth
              variant="outlined"
              value={editYear}
              onChange={(e) => handleEditYearChange(e.target.value)}
              error={!editYear}
              helperText={!editYear ? 'سال مالی الزامی است' : ''}
              inputProps={{ min: 1300, max: 1500 }}
              sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                '& .MuiInputBase-input': { fontFamily: 'Vazirmatn, Arial, sans-serif' },
                '& .MuiInputLabel-root': { fontFamily: 'Vazirmatn, Arial, sans-serif' }
              }}
            />
          </Box>

          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
            gap: 2,
            mb: 2
          }}>
            <Box sx={{ position: 'relative', zIndex: 1000 }}>
              <PersianDatePicker
                value={editStartDate}
                onChange={setEditStartDate}
                label="تاریخ شروع"
                error={!editStartDate}
                helperText={!editStartDate ? 'تاریخ شروع الزامی است' : ''}
              />
            </Box>
            
            <Box sx={{ position: 'relative', zIndex: 1000 }}>
              <PersianDatePicker
                value={editEndDate}
                onChange={setEditEndDate}
                label="تاریخ پایان"
                error={!editEndDate}
                helperText={!editEndDate ? 'تاریخ پایان الزامی است' : ''}
              />
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              label="توضیحات (اختیاری)"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                '& .MuiInputBase-input': { fontFamily: 'Vazirmatn, Arial, sans-serif' },
                '& .MuiInputLabel-root': { fontFamily: 'Vazirmatn, Arial, sans-serif' }
              }}
            />
          </Box>

          {editStartDate && editEndDate && (
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              backgroundColor: validateDateRange(editStartDate, editEndDate) ? 'primary.50' : 'error.50', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: validateDateRange(editStartDate, editEndDate) ? 'primary.200' : 'error.200'
            }}>
              <Typography variant="body2" sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                textAlign: 'center',
                color: validateDateRange(editStartDate, editEndDate) ? 'primary.main' : 'error.main',
                fontWeight: 'bold'
              }}>
                {validateDateRange(editStartDate, editEndDate) 
                  ? `سال مالی: ${formatDate(editStartDate)} تا ${formatDate(editEndDate)}`
                  : 'تاریخ پایان باید بعد از تاریخ شروع باشد'
                }
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ 
          px: 3, 
          pb: 3,
          gap: 1
        }}>
          <Button 
            onClick={handleEditClose}
            variant="outlined"
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            انصراف
          </Button>
          <Button 
            onClick={handleEditConfirm}
            variant="contained"
            disabled={!editYear || !editStartDate || !editEndDate || !validateDateRange(editStartDate, editEndDate)}
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            ذخیره تغییرات
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!yearToDelete} onClose={() => setYearToDelete(null)}>
        <DialogTitle>حذف سال مالی</DialogTitle>
        <DialogContent>
          <Typography>
            آیا از حذف سال مالی {yearToDelete?.year} مطمئن هستید؟ تمام اطلاعات حسابداری مربوط به این سال حذف خواهد شد.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setYearToDelete(null)}>انصراف</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            حذف
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleEditFromMenu}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          ویرایش
        </MenuItem>
        <MenuItem onClick={handleDeleteFromMenu} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          حذف
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ProjectFiscalYearManager;
