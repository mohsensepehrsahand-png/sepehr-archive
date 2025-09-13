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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Edit as EditIcon
} from '@mui/icons-material';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

interface ProjectUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  units?: any[];
}

interface ProjectUsersManagerProps {
  projectId: string;
  onUsersChange?: () => void;
}

const ProjectUsersManager: React.FC<ProjectUsersManagerProps> = ({
  projectId,
  onUsersChange
}) => {
  const [projectUsers, setProjectUsers] = useState<ProjectUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<ProjectUser | null>(null);
  const [formData, setFormData] = useState({
    userId: '',
    unitNumber: '',
    area: ''
  });

  useEffect(() => {
    fetchData();
    // Reset editing state when project changes
    setEditingUser(null);
    setFormData({
      userId: '',
      unitNumber: '',
      area: ''
    });
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching data for project:', projectId);
      
      // Fetch users and available users separately to better handle errors
      let usersData = [];
      let availableData = [];
      
      try {
        const usersResponse = await fetch(`/api/finance/projects/${projectId}/users`);
        console.log('Users response status:', usersResponse.status);
        
        if (usersResponse.ok) {
          usersData = await usersResponse.json();
          console.log('Project users:', usersData.length);
        } else {
          const errorData = await usersResponse.json();
          console.error('Users API error:', errorData);
          throw new Error(errorData.error || 'خطا در دریافت کاربران پروژه');
        }
      } catch (err) {
        console.error('Error fetching project users:', err);
        throw err;
      }
      
      try {
        const availableResponse = await fetch(`/api/finance/projects/${projectId}/available-users`);
        console.log('Available response status:', availableResponse.status);
        
        if (availableResponse.ok) {
          availableData = await availableResponse.json();
          console.log('Available users:', availableData.length);
        } else {
          const errorData = await availableResponse.json();
          console.error('Available users API error:', errorData);
          throw new Error(errorData.error || 'خطا در دریافت کاربران موجود');
        }
      } catch (err) {
        console.error('Error fetching available users:', err);
        throw err;
      }
      
      setProjectUsers(usersData);
      setAvailableUsers(availableData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'خطای نامشخص');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: ProjectUser) => {
    if (user && user.id) {
      setEditingUser(user);
      setFormData({
        userId: user.id,
        unitNumber: user.units && user.units.length > 0 ? user.units[0]?.unitNumber || '' : '',
        area: user.units && user.units.length > 0 ? user.units[0]?.area?.toString() || '' : ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        userId: '',
        unitNumber: '',
        area: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      userId: '',
      unitNumber: '',
      area: ''
    });
  };

  const handleSaveUser = async () => {
    try {
      if (!formData.userId) {
        setError('لطفاً کاربر را انتخاب کنید');
        return;
      }

      if (!formData.unitNumber) {
        setError('لطفاً شماره واحد را وارد کنید');
        return;
      }

      console.log('Saving user with data:', formData);

      const isEditing = editingUser !== null;
      
      // Simple approach: if editing, use PUT with editingUser.id, otherwise use POST
      const url = isEditing 
        ? `/api/finance/projects/${projectId}/users/${editingUser.id}`
        : `/api/finance/projects/${projectId}/users`;
      
      const method = isEditing ? 'PUT' : 'POST';

      // For editing, we need to send the original user's ID, not the selected one
      const requestData = isEditing 
        ? { ...formData, userId: editingUser.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('Save user response status:', response.status);

      if (!response.ok) {
        let errorMessage = `خطا در ${isEditing ? 'ویرایش' : 'اضافه کردن'} کاربر`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorMessage = `خطا در ارتباط با سرور (کد: ${response.status})`;
        }
        
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('User saved successfully:', responseData);

      // Show success message
      setError(null);
      const successMessage = responseData.message || `کاربر با موفقیت ${isEditing ? 'ویرایش' : 'اضافه'} شد`;
      
      await fetchData();
      handleCloseDialog();
      onUsersChange?.();
      
      // Show success message (you might want to use a toast notification here)
      alert(`✅ ${successMessage}`);
    } catch (err) {
      console.error('Error saving user:', err);
      setError(err instanceof Error ? err.message : 'خطای نامشخص');
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    if (!confirm(`آیا از حذف کاربر "${userName}" از پروژه اطمینان دارید؟\n\nاین عمل تمام اقساط و اطلاعات مالی کاربر را حذف خواهد کرد.`)) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(
        `/api/finance/projects/${projectId}/users?userId=${userId}`,
        { method: 'DELETE' }
      );

      const responseData = await response.json();

      if (!response.ok) {
        // Handle payment error with detailed message
        if (responseData.canDeletePayments && responseData.payments) {
          const paymentDetails = responseData.payments.map((p: any) => 
            `- ${new Date(p.date).toLocaleDateString('fa-IR')}: ${new Intl.NumberFormat('fa-IR').format(p.amount)} ریال`
          ).join('\n');
          
          const detailedMessage = `${responseData.error}\n\nجزئیات پرداخت‌ها:\n${paymentDetails}\n\nمجموع: ${new Intl.NumberFormat('fa-IR').format(responseData.totalAmount)} ریال\n\n${responseData.suggestion}`;
          
          const choice = confirm(`${detailedMessage}\n\nآیا می‌خواهید تمام اطلاعات مالی کاربر را حذف کنید؟\n\nاین عمل غیرقابل بازگشت است!`);
          
          if (choice) {
            // Clear all payments and delete user
            try {
              const clearResponse = await fetch(
                `/api/finance/projects/${projectId}/users/${userId}/clear-payments`,
                { method: 'DELETE' }
              );

              if (clearResponse.ok) {
                const clearData = await clearResponse.json();
                alert(`✅ ${clearData.message}\n\nحذف شده:\n- ${clearData.deletedPayments} پرداخت\n- ${clearData.deletedPenalties} جریمه\n- ${clearData.deletedInstallments} قسط\n- ${clearData.deletedUnits} واحد`);
                
                // Refresh data
                await fetchData();
                onUsersChange?.();
              } else {
                const errorData = await clearResponse.json();
                throw new Error(errorData.error || 'خطا در حذف اطلاعات مالی');
              }
            } catch (clearError) {
              console.error('Error clearing payments:', clearError);
              setError(clearError instanceof Error ? clearError.message : 'خطا در حذف اطلاعات مالی');
            }
          }
        } else {
          throw new Error(responseData.error || 'خطا در حذف کاربر');
        }
        return;
      }

      console.log('User removed successfully:', responseData);
      await fetchData();
      onUsersChange?.();
    } catch (err) {
      console.error('Error removing user:', err);
      setError(err instanceof Error ? err.message : 'خطای نامشخص');
    }
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
            مدیریت کاربران پروژه
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={availableUsers.length === 0}
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            افزودن کاربر
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            {error}
          </Alert>
        )}

        {availableUsers.length === 0 && (
          <Alert severity="info" sx={{ mb: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            تمام کاربران فعال در این پروژه عضو هستند
          </Alert>
        )}

        {projectUsers.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              هیچ کاربری در این پروژه عضو نیست
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>شماره</TableCell>
                  <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>نام کاربر</TableCell>
                  <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>واحدها</TableCell>
                  <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>متراژ</TableCell>
                  <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>عملیات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projectUsers.map((user, index) => (
                  <TableRow 
                    key={user.id}
                    sx={{ 
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#ffffff',
                      '&:hover': {
                        backgroundColor: '#f0f0f0'
                      }
                    }}
                  >
                    <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'medium' }}>
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {user.firstName} {user.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.username}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {user.units && user.units.length > 0 ? user.units.map((unit, unitIndex) => (
                        <Chip
                          key={unit.id}
                          label={`واحد ${unit.unitNumber}`}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5, fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                        />
                      )) : (
                        <Typography variant="caption" color="text.secondary">
                          بدون واحد
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {user.units && user.units.length > 0 ? user.units.map((unit, unitIndex) => (
                        <Box key={unit.id} sx={{ mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {unit.area ? `${unit.area} متر مربع` : 'نامشخص'}
                          </Typography>
                        </Box>
                      )) : (
                        <Typography variant="caption" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleOpenDialog(user);
                        }}
                        sx={{ mr: 1, color: 'primary.main' }}
                        title="ویرایش"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveUser(user.id, `${user.firstName} ${user.lastName}`)}
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

        {/* Add/Edit User Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            {editingUser ? 'ویرایش اطلاعات کاربر' : 'افزودن کاربر به پروژه'}
          </DialogTitle>
          <DialogContent>
            <FormControl fullWidth margin="normal" required>
              <InputLabel sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                انتخاب کاربر
              </InputLabel>
              <Select
                value={formData.userId || ''}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                label="انتخاب کاربر"
                sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
              >
                {availableUsers.map((user) => (
                  <MenuItem key={user.id} value={user.id} sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    {user.firstName} {user.lastName} ({user.username})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="شماره واحد"
              value={formData.unitNumber}
              onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
              margin="normal"
              required
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            />
            
            <TextField
              fullWidth
              label="متراژ (متر مربع) - اختیاری"
              type="number"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
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
              onClick={handleSaveUser}
              variant="contained"
              startIcon={<SaveIcon />}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              {editingUser ? 'ذخیره تغییرات' : 'افزودن'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ProjectUsersManager;
