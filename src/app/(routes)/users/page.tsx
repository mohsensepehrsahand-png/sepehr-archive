"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from "@mui/material";
import {
  Add,
  Delete,
  Person,
  AdminPanelSettings
} from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  passwordHash: string;
}

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
    role: 'BUYER'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.username || !formData.password) {
      alert('نام کاربری و رمز عبور الزامی است');
      return;
    }

    try {
      console.log('Creating user with data:', { ...formData, password: '[HIDDEN]' });
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const responseData = await response.json();

      if (response.ok) {
        await fetchUsers();
        setOpenDialog(false);
        setFormData({
          username: '',
          password: '',
          firstName: '',
          lastName: '',
          email: '',
          role: 'BUYER'
        });
        alert('کاربر با موفقیت ایجاد شد');
      } else {
        console.error('API Error:', responseData);
        alert(`خطا در ایجاد کاربر: ${responseData.error || 'خطای نامشخص'}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert(`خطا در ایجاد کاربر: ${error instanceof Error ? error.message : 'خطای نامشخص'}`);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`آیا از حذف کاربر "${username}" اطمینان دارید؟`)) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchUsers();
        alert('کاربر با موفقیت حذف شد');
      } else {
        const errorData = await response.json();
        alert(`خطا در حذف کاربر: ${errorData.error || 'خطای نامشخص'}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`خطا در حذف کاربر: ${error instanceof Error ? error.message : 'خطای نامشخص'}`);
    }
  };

  const handleTestConnection = async () => {
    try {
      const response = await fetch('/api/test');
      const data = await response.json();
      
      if (response.ok) {
        alert(`تست اتصال موفق:\n${JSON.stringify(data, null, 2)}`);
      } else {
        alert(`خطا در تست اتصال:\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      alert(`خطا در تست اتصال: ${error instanceof Error ? error.message : 'خطای نامشخص'}`);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'مدیر';
      case 'BUYER': return 'خریدار';
      case 'CONTRACTOR': return 'پیمانکار';
      case 'SUPPLIER': return 'تامین کننده';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'error';
      case 'BUYER': return 'primary';
      case 'CONTRACTOR': return 'secondary';
      case 'SUPPLIER': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Page Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4 
      }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            مدیریت کاربران
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            تعریف و مدیریت کاربران سیستم
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleTestConnection}
            sx={{ borderRadius: 2, px: 3 }}
          >
            تست اتصال
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
            sx={{ borderRadius: 2, px: 3 }}
          >
            افزودن کاربر
          </Button>
        </Box>
      </Box>

      {/* Users Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table>
                             <TableHead>
                 <TableRow>
                   <TableCell>نام و نام خانوادگی</TableCell>
                   <TableCell>نام کاربری</TableCell>
                   <TableCell>ایمیل</TableCell>
                   <TableCell>نقش</TableCell>
                   <TableCell>رمز عبور</TableCell>
                   <TableCell>تاریخ ایجاد</TableCell>
                   <TableCell>عملیات</TableCell>
                 </TableRow>
               </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person color="primary" />
                        <Typography>
                          {user.firstName} {user.lastName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {user.username}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.email || '-'}
                      </Typography>
                    </TableCell>
                                         <TableCell>
                       <Chip 
                         label={getRoleLabel(user.role)} 
                         color={getRoleColor(user.role) as any}
                         size="small"
                         icon={user.role === 'ADMIN' ? <AdminPanelSettings /> : undefined}
                       />
                     </TableCell>
                     <TableCell>
                       <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                         {user.passwordHash.substring(0, 20)}...
                       </Typography>
                     </TableCell>
                     <TableCell>
                       <Typography variant="body2" color="text.secondary">
                         {new Date(user.createdAt).toLocaleDateString('fa-IR')}
                       </Typography>
                     </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        disabled={user.role === 'ADMIN'}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {users.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Person sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                هیچ کاربری یافت نشد
              </Typography>
              <Typography variant="body2" color="text.secondary">
                برای شروع، کاربر جدیدی اضافه کنید
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>افزودن کاربر جدید</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="نام کاربری *"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
            
            <TextField
              fullWidth
              label="رمز عبور *"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            
            <TextField
              fullWidth
              label="نام"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
            
            <TextField
              fullWidth
              label="نام خانوادگی"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
            
            <TextField
              fullWidth
              label="ایمیل"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            
            <FormControl fullWidth>
              <InputLabel>نقش کاربری</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                label="نقش کاربری"
              >
                <MenuItem value="ADMIN">مدیر</MenuItem>
                <MenuItem value="BUYER">خریدار</MenuItem>
                <MenuItem value="CONTRACTOR">پیمانکار</MenuItem>
                <MenuItem value="SUPPLIER">تامین کننده</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>انصراف</Button>
          <Button onClick={handleCreateUser} variant="contained">
            ایجاد کاربر
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
