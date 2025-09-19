"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab,
  Tooltip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  Checkbox,
  TablePagination,
  Snackbar,
  Menu,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from "@mui/material";
import {
  Search,
  Add,
  Edit,
  Delete,
  Visibility,
  Person,
  AdminPanelSettings,
  Business,
  ShoppingCart,
  LocalShipping,
  Block,
  CheckCircle,
  MoreVert,
  Download,
  Upload,
  Refresh,
  Security,
  Lock,
  LockOpen
} from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import CustomRoleManager from "@/components/admin/CustomRoleManager";

const roleLabels = {
  ADMIN: "مدیر سیستم",
  BUYER: "خریدار",
  CONTRACTOR: "پیمانکار",
  SUPPLIER: "تامین‌کننده"
};

const roleColors = {
  ADMIN: "error",
  BUYER: "primary", 
  CONTRACTOR: "success",
  SUPPLIER: "warning"
};

export default function UsersPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("همه");
  const [statusFilter, setStatusFilter] = useState("همه");
  const [openNewUser, setOpenNewUser] = useState(false);
  const [openEditUser, setOpenEditUser] = useState(false);
  const [openUserDetails, setOpenUserDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as any });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [actionUser, setActionUser] = useState<any>(null);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const [newUser, setNewUser] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    role: "BUYER",
    customRoleId: null as string | null,
    password: "",
    phone: "",
    department: ""
  });
  const [customRoles, setCustomRoles] = useState<any[]>([]);
  const [openCustomRoleManager, setOpenCustomRoleManager] = useState(false);

  // دریافت کاربران از دیتابیس
  useEffect(() => {
    fetchUsers();
    fetchCustomRoles();
  }, []);

  // Refresh custom roles when forms open
  useEffect(() => {
    if (openNewUser || openEditUser) {
      fetchCustomRoles();
    }
  }, [openNewUser, openEditUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        // Ensure each user has proper customRole data
        const usersWithCustomRoles = data.map((user: any) => {
          if (user.customRoleId && user.role === "CUSTOM") {
            const customRole = customRoles.find(r => r.id === user.customRoleId);
            return {
              ...user,
              customRole: customRole || null
            };
          }
          return user;
        });
        setUsers(usersWithCustomRoles);
      } else {
        console.error('Failed to fetch users');
        showSnackbar('خطا در دریافت کاربران', 'error');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showSnackbar('خطا در دریافت کاربران', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomRoles = async () => {
    try {
      const response = await fetch('/api/custom-roles');
      if (response.ok) {
        const data = await response.json();
        setCustomRoles(data);
      }
    } catch (error) {
      console.error('Error fetching custom roles:', error);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "همه" || 
      user.role === roleFilter || 
      (user.customRole && user.customRole.name === roleFilter) ||
      (user.customRole && user.customRole.id === roleFilter);
    const matchesStatus = statusFilter === "همه" || 
      (statusFilter === "فعال" && user.isActive) ||
      (statusFilter === "غیرفعال" && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case "username":
        aValue = a.username.toLowerCase();
        bValue = b.username.toLowerCase();
        break;
      case "firstName":
        aValue = a.firstName?.toLowerCase() || '';
        bValue = b.firstName?.toLowerCase() || '';
        break;
      case "email":
        aValue = a.email?.toLowerCase() || '';
        bValue = b.email?.toLowerCase() || '';
        break;
      case "createdAt":
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      default:
        aValue = a.username.toLowerCase();
        bValue = b.username.toLowerCase();
    }
    
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const paginatedUsers = sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleCreateUser = async () => {
    if (newUser.username.trim() && newUser.password.trim()) {
      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: newUser.username,
            password: newUser.password,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            role: newUser.role === "CUSTOM" ? "BUYER" : newUser.role, // Use BUYER as default for custom roles
            customRoleId: newUser.role === "CUSTOM" ? newUser.customRoleId : null
          }),
        });

        if (response.ok) {
          const createdUser = await response.json();
          setUsers([createdUser, ...users]);
          setNewUser({ username: "", firstName: "", lastName: "", email: "", role: "BUYER", customRoleId: null, password: "", phone: "", department: "" });
          setOpenNewUser(false);
          showSnackbar("کاربر جدید با موفقیت ایجاد شد", "success");
          // بروزرسانی خودکار لیست کاربران
          setTimeout(() => fetchUsers(), 500);
        } else {
          const error = await response.json();
          showSnackbar(error.error || "خطا در ایجاد کاربر", "error");
        }
      } catch (error) {
        console.error('Error creating user:', error);
        showSnackbar("خطا در ایجاد کاربر", "error");
      }
    }
  };

  const handleEditUser = async () => {
    if (selectedUser) {
      try {
        const response = await fetch(`/api/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: selectedUser.username,
            firstName: selectedUser.firstName,
            lastName: selectedUser.lastName,
            email: selectedUser.email,
            role: selectedUser.role === "CUSTOM" ? "BUYER" : selectedUser.role, // Use BUYER as default for custom roles
            customRoleId: selectedUser.role === "CUSTOM" ? selectedUser.customRoleId : null
          }),
        });

        if (response.ok) {
          const responseData = await response.json();
          const updatedUser = responseData.user;
          
          // Update the users list immediately
          setUsers(prevUsers => 
            prevUsers.map(u => u.id === selectedUser.id ? updatedUser : u)
          );
          
          showSnackbar("اطلاعات کاربر با موفقیت بروزرسانی شد", "success");
          
          setOpenEditUser(false);
          setSelectedUser(null);
        } else {
          const error = await response.json();
          showSnackbar(error.error || "خطا در بروزرسانی کاربر", "error");
        }
      } catch (error) {
        console.error('Error updating user:', error);
        showSnackbar("خطا در بروزرسانی کاربر", "error");
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      // بررسی وجود اطلاعات مالی قبل از حذف
      const userResponse = await fetch(`/api/users/${id}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        
        let confirmMessage = "آیا از حذف این کاربر اطمینان دارید؟";
        if (userData.hasFinancialData) {
          confirmMessage = `کاربر "${userData.user.firstName} ${userData.user.lastName}" دارای اطلاعات مالی است:
          
• ${userData.financialDataCount.units} واحد
• ${userData.financialDataCount.installments} قسط

در صورت حذف، اطلاعات مالی در بخش آرشیو نگهداری خواهد شد.

آیا از حذف این کاربر اطمینان دارید؟`;
        }

        if (confirm(confirmMessage)) {
          const response = await fetch(`/api/users/${id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            const result = await response.json();
            setUsers(users.filter(u => u.id !== id));
            showSnackbar(result.message, "success");
            // بروزرسانی خودکار لیست کاربران
            setTimeout(() => fetchUsers(), 500);
          } else {
            const error = await response.json();
            showSnackbar(error.error || "خطا در حذف کاربر", "error");
          }
        }
      } else {
        showSnackbar("خطا در بررسی اطلاعات کاربر", "error");
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showSnackbar("خطا در حذف کاربر", "error");
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`آیا از حذف ${selectedUsers.length} کاربر انتخاب شده اطمینان دارید؟`)) {
      setUsers(users.filter(u => !selectedUsers.includes(u.id)));
      setSelectedUsers([]);
      showSnackbar(`${selectedUsers.length} کاربر با موفقیت حذف شدند`, "success");
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const user = users.find(u => u.id === id);
      if (!user) return;

      const newStatus = !user.isActive;
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (response.ok) {
        const result = await response.json();
        setUsers(users.map(u => 
          u.id === id ? { ...u, isActive: newStatus } : u
        ));
        showSnackbar(result.message, "success");
      } else {
        const error = await response.json();
        showSnackbar(error.error || "خطا در تغییر وضعیت کاربر", "error");
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      showSnackbar("خطا در تغییر وضعیت کاربر", "error");
    }
  };

  const handleResetPassword = async (id: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;

    const newPassword = prompt(`رمز عبور جدید برای کاربر "${user.username}":`);
    if (!newPassword || newPassword.trim().length < 4) {
      showSnackbar("رمز عبور باید حداقل 4 کاراکتر باشد", "error");
      return;
    }

    if (confirm(`آیا از تغییر رمز عبور کاربر "${user.username}" اطمینان دارید؟`)) {
      try {
        const response = await fetch(`/api/users/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ newPassword: newPassword.trim() }),
        });

        if (response.ok) {
          const result = await response.json();
          showSnackbar(result.message, "success");
        } else {
          const error = await response.json();
          showSnackbar(error.error || "خطا در تغییر رمز عبور", "error");
        }
      } catch (error) {
        console.error('Error changing password:', error);
        showSnackbar("خطا در تغییر رمز عبور", "error");
      }
    }
  };

  const handleBulkRoleChange = (newRole: string) => {
    if (confirm(`آیا از تغییر نقش ${selectedUsers.length} کاربر انتخاب شده به ${roleLabels[newRole as keyof typeof roleLabels]} اطمینان دارید؟`)) {
      setUsers(users.map(u => 
        selectedUsers.includes(u.id) ? { ...u, role: newRole } : u
      ));
      setSelectedUsers([]);
      showSnackbar(`نقش ${selectedUsers.length} کاربر تغییر کرد`, "success");
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedUsers(paginatedUsers.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (id: string) => {
    setSelectedUsers(prev => 
      prev.includes(id) 
        ? prev.filter(userId => userId !== id)
        : [...prev, id]
    );
  };

  const showSnackbar = (message: string, severity: "success" | "error" | "info" | "warning") => {
    setSnackbar({ open: true, message, severity });
  };

  // Helper function to get role display info
  const getRoleDisplayInfo = (user: any) => {
    // Check if user has a custom role
    if (user.customRoleId && user.role === "CUSTOM") {
      const customRole = customRoles.find(r => r.id === user.customRoleId);
      if (customRole) {
        return {
          label: customRole.label,
          color: customRole.color,
          name: customRole.name
        };
      }
    }
    
    // Check if user.customRole exists (for backward compatibility)
    if (user.customRole) {
      return {
        label: user.customRole.label,
        color: user.customRole.color,
        name: user.customRole.name
      };
    }
    
    return {
      label: roleLabels[user.role as keyof typeof roleLabels] || user.role,
      color: roleColors[user.role as keyof typeof roleColors] || "primary",
      name: user.role
    };
  };

  // Helper function to get selected role display for dropdowns
  const getSelectedRoleDisplay = (user: any) => {
    if (user.customRoleId && user.role === "CUSTOM") {
      const customRole = customRoles.find(r => r.id === user.customRoleId);
      return customRole ? customRole.id : user.role;
    }
    return user.role;
  };

  // Helper function to ensure user object has all necessary properties
  const ensureUserWithCustomRole = (user: any) => {
    let customRole = user.customRole || null;
    
    // If user has customRoleId but no customRole, find it from customRoles array
    if (user.customRoleId && !customRole) {
      customRole = customRoles.find(r => r.id === user.customRoleId) || null;
    }
    
    return {
      ...user,
      customRoleId: user.customRoleId || null,
      customRole: customRole
    };
  };

  // Handle custom role selection
  const handleCustomRoleSelect = (role: any) => {
    if (role) {
      if (selectedUser) {
        setSelectedUser({ ...selectedUser, customRoleId: role.id, role: "CUSTOM" });
      } else {
        setNewUser({ ...newUser, customRoleId: role.id, role: "CUSTOM" });
      }
    } else {
      if (selectedUser) {
        setSelectedUser({ ...selectedUser, customRoleId: null, role: "BUYER" });
      } else {
        setNewUser({ ...newUser, customRoleId: null, role: "BUYER" });
      }
    }
    // Close the custom role manager after selection
    setOpenCustomRoleManager(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <AdminPanelSettings />;
      case "BUYER":
        return <Business />;
      case "CONTRACTOR":
        return <ShoppingCart />;
      case "SUPPLIER":
        return <LocalShipping />;
      default:
        return <Person />;
    }
  };

  const handleExportUsers = () => {
    // TODO: Implement export functionality
    showSnackbar("در حال آماده‌سازی فایل خروجی...", "info");
  };

  const handleImportUsers = () => {
    // TODO: Implement import functionality
    showSnackbar("قابلیت وارد کردن کاربران در حال توسعه است", "info");
  };

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      router.push('/projects');
    }
  }, [isAdmin, router]);

  // Don't render the page if user is not admin
  if (!isAdmin) {
    return null;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          مدیریت کاربران
        </Typography>
        <Typography variant="body1" color="text.secondary">
          مدیریت کاربران سیستم، نقش‌ها و مجوزهای دسترسی
        </Typography>
      </Box>

      {/* User Statistics */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' },
        gap: 2, 
        mb: 3 
      }}>
        <Card sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" component="div" fontWeight="bold" color="primary.main">
                  {users.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  کل کاربران
                </Typography>
              </Box>
              <Person sx={{ fontSize: 24, color: 'primary.main' }} />
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" component="div" fontWeight="bold" color="success.main">
                  {users.filter(u => u.isActive).length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  فعال
                </Typography>
              </Box>
              <CheckCircle sx={{ fontSize: 24, color: 'success.main' }} />
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" component="div" fontWeight="bold" color="info.main">
                  {users.filter(u => u.role === 'ADMIN').length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  مدیران
                </Typography>
              </Box>
              <AdminPanelSettings sx={{ fontSize: 24, color: 'info.main' }} />
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" component="div" fontWeight="bold" color="warning.main">
                  {users.filter(u => u.role === 'BUYER').length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  خریداران
                </Typography>
              </Box>
              <Business sx={{ fontSize: 24, color: 'warning.main' }} />
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" component="div" fontWeight="bold" color="success.main">
                  {users.filter(u => u.role === 'CONTRACTOR').length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  پیمانکاران
                </Typography>
              </Box>
              <LocalShipping sx={{ fontSize: 24, color: 'success.main' }} />
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ bgcolor: 'secondary.50', border: '1px solid', borderColor: 'secondary.200' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" component="div" fontWeight="bold" color="secondary.main">
                  {users.filter(u => u.role === 'SUPPLIER').length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  تامین‌کنندگان
                </Typography>
              </Box>
              <ShoppingCart sx={{ fontSize: 24, color: 'secondary.main' }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr 1fr' },
        gap: 3, 
        mb: 4 
      }}>
        <TextField
          fullWidth
          placeholder="جستجو در کاربران..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl fullWidth>
          <InputLabel>نقش</InputLabel>
          <Select
            value={roleFilter}
            label="نقش"
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <MenuItem value="همه">همه</MenuItem>
            <MenuItem value="ADMIN">مدیر</MenuItem>
            <MenuItem value="BUYER">خریدار</MenuItem>
            <MenuItem value="CONTRACTOR">پیمانکار</MenuItem>
            <MenuItem value="SUPPLIER">تامین‌کننده</MenuItem>
            {customRoles.map((role) => (
              <MenuItem key={role.id} value={role.name}>
                {role.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>وضعیت</InputLabel>
          <Select
            value={statusFilter}
            label="وضعیت"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="همه">همه</MenuItem>
            <MenuItem value="فعال">فعال</MenuItem>
            <MenuItem value="غیرفعال">غیرفعال</MenuItem>
          </Select>
        </FormControl>


        <Button
          fullWidth
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchUsers}
          color="info"
        >
          بروزرسانی
        </Button>

        <Button
          fullWidth
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenNewUser(true)}
        >
          کاربر جدید
        </Button>
      </Box>


      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" fontWeight="medium">
              {selectedUsers.length} کاربر انتخاب شده
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Delete />}
              onClick={handleBulkDelete}
              color="error"
            >
              حذف گروهی
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Block />}
              onClick={() => {
                setUsers(users.map(u => 
                  selectedUsers.includes(u.id) ? { ...u, isActive: false } : u
                ));
                setSelectedUsers([]);
                showSnackbar("کاربران انتخاب شده غیرفعال شدند", "info");
              }}
            >
              غیرفعال کردن
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<CheckCircle />}
              onClick={() => {
                setUsers(users.map(u => 
                  selectedUsers.includes(u.id) ? { ...u, isActive: true } : u
                ));
                setSelectedUsers([]);
                showSnackbar("کاربران انتخاب شده فعال شدند", "info");
              }}
            >
              فعال کردن
            </Button>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>تغییر نقش</InputLabel>
              <Select
                value=""
                label="تغییر نقش"
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkRoleChange(e.target.value);
                  }
                }}
              >
                <MenuItem value="BUYER">خریدار</MenuItem>
                <MenuItem value="CONTRACTOR">پیمانکار</MenuItem>
                <MenuItem value="SUPPLIER">تامین‌کننده</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>
      )}

      {/* Users Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedUsers.length > 0 && selectedUsers.length < paginatedUsers.length}
                    checked={paginatedUsers.length > 0 && selectedUsers.length === paginatedUsers.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => {
                      setSortBy("firstName");
                      setSortOrder(sortBy === "firstName" && sortOrder === "asc" ? "desc" : "asc");
                    }}
                    sx={{ textTransform: 'none', color: 'inherit', fontWeight: 'inherit' }}
                  >
                    کاربر
                    {sortBy === "firstName" && (
                      <Box component="span" sx={{ ml: 0.5 }}>
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </Box>
                    )}
                  </Button>
                </TableCell>
                <TableCell>نقش</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => {
                      setSortBy("email");
                      setSortOrder(sortBy === "email" && sortOrder === "asc" ? "desc" : "asc");
                    }}
                    sx={{ textTransform: 'none', color: 'inherit', fontWeight: 'inherit' }}
                  >
                    ایمیل
                    {sortBy === "email" && (
                      <Box component="span" sx={{ ml: 0.5 }}>
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </Box>
                    )}
                  </Button>
                </TableCell>
                <TableCell>وضعیت</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => {
                      setSortBy("createdAt");
                      setSortOrder(sortBy === "createdAt" && sortOrder === "asc" ? "desc" : "asc");
                    }}
                    sx={{ textTransform: 'none', color: 'inherit', fontWeight: 'inherit' }}
                  >
                    تاریخ ایجاد
                    {sortBy === "createdAt" && (
                      <Box component="span" sx={{ ml: 0.5 }}>
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </Box>
                    )}
                  </Button>
                </TableCell>
                <TableCell>عملیات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Person sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      کاربری یافت نشد
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {searchTerm || roleFilter !== "همه" || statusFilter !== "همه"
                        ? "لطفاً فیلترهای جستجو را تغییر دهید" 
                        : "هنوز کاربری ایجاد نشده است"
                      }
                    </Typography>
                    {!searchTerm && roleFilter === "همه" && statusFilter === "همه" && (
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setOpenNewUser(true)}
                      >
                        ایجاد اولین کاربر
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user, index) => (
                  <TableRow 
                    key={user.id} 
                    hover
                    sx={{ 
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#ffffff',
                      '&:hover': {
                        backgroundColor: '#f0f0f0'
                      }
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {getRoleIcon(user.role)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="medium">
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            @{user.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={getRoleDisplayInfo(user).label} 
                        color={getRoleDisplayInfo(user).color.startsWith('#') ? undefined : getRoleDisplayInfo(user).color}
                        size="small"
                        sx={{
                          backgroundColor: getRoleDisplayInfo(user).color.startsWith('#') ? getRoleDisplayInfo(user).color : undefined,
                          color: getRoleDisplayInfo(user).color.startsWith('#') ? 'white' : undefined,
                        }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">{user.email}</Typography>
                    </TableCell>
                    
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={user.isActive}
                            onChange={() => handleToggleStatus(user.id)}
                            color="success"
                          />
                        }
                        label={
                          <Chip 
                            label={user.isActive ? "فعال" : "غیرفعال"} 
                            color={user.isActive ? "success" : "default"}
                            size="small"
                          />
                        }
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(user.createdAt).toLocaleDateString('fa-IR')}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton 
                          size="small" 
                          color="info"
                          onClick={() => {
                            setSelectedUser(ensureUserWithCustomRole(user));
                            setOpenUserDetails(true);
                          }}
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => {
                            setSelectedUser(ensureUserWithCustomRole(user));
                            setOpenEditUser(true);
                          }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="secondary"
                          onClick={(e) => {
                            setAnchorEl(e.currentTarget);
                            setActionUser(user);
                          }}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <TablePagination
          component="div"
          count={filteredUsers.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="تعداد در صفحه:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} از ${count}`}
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          if (actionUser) {
            handleToggleStatus(actionUser.id);
          }
          setAnchorEl(null);
        }}>
          <ListItemIcon>
            {actionUser?.isActive ? <Block /> : <CheckCircle />}
          </ListItemIcon>
          <ListItemText>
            {actionUser?.isActive ? "غیرفعال کردن" : "فعال کردن"}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (actionUser) {
            setSelectedUser(ensureUserWithCustomRole(actionUser));
            setOpenUserDetails(true);
          }
          setAnchorEl(null);
        }}>
          <ListItemIcon>
            <Visibility />
          </ListItemIcon>
          <ListItemText>مشاهده جزئیات</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (actionUser) {
            setSelectedUser(ensureUserWithCustomRole(actionUser));
            setOpenEditUser(true);
          }
          setAnchorEl(null);
        }}>
          <ListItemIcon>
            <Edit />
          </ListItemIcon>
          <ListItemText>ویرایش</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (actionUser) {
            handleResetPassword(actionUser.id);
          }
          setAnchorEl(null);
        }}>
          <ListItemIcon>
            <Lock />
          </ListItemIcon>
          <ListItemText>بازنشانی رمز عبور</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (actionUser) {
            handleDeleteUser(actionUser.id);
          }
          setAnchorEl(null);
        }}>
          <ListItemIcon>
            <Delete />
          </ListItemIcon>
          <ListItemText>حذف</ListItemText>
        </MenuItem>
      </Menu>

      {/* New User Dialog */}
      <Dialog open={openNewUser} onClose={() => setOpenNewUser(false)} maxWidth="sm" fullWidth>
        <DialogTitle>ایجاد کاربر جدید</DialogTitle>
        <DialogContent>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 2, 
            mt: 1 
          }}>
            <TextField
              fullWidth
              label="نام کاربری"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              required
              autoFocus
            />
            <TextField
              fullWidth
              label="رمز عبور"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="نام"
              value={newUser.firstName}
              onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
            />
            <TextField
              fullWidth
              label="نام خانوادگی"
              value={newUser.lastName}
              onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
            />
            <TextField
              fullWidth
              label="ایمیل"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}
            />
            <FormControl fullWidth sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}>
              <InputLabel>نقش</InputLabel>
              <Select
                value={getSelectedRoleDisplay(newUser)}
                label="نقش"
                onChange={(e) => {
                  if (e.target.value === "CUSTOM") {
                    setOpenCustomRoleManager(true);
                  } else if (customRoles.find(r => r.id === e.target.value)) {
                    setNewUser({ ...newUser, role: "CUSTOM", customRoleId: e.target.value });
                  } else {
                    setNewUser({ ...newUser, role: e.target.value, customRoleId: null });
                  }
                }}
              >
                <MenuItem value="BUYER">خریدار</MenuItem>
                <MenuItem value="CONTRACTOR">پیمانکار</MenuItem>
                <MenuItem value="SUPPLIER">تامین‌کننده</MenuItem>
                {customRoles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.label}
                  </MenuItem>
                ))}
                <MenuItem 
                  value="CUSTOM"
                  sx={{ 
                    color: 'primary.main',
                    fontWeight: 'bold',
                    borderTop: '1px solid #e0e0e0',
                    marginTop: '4px',
                    paddingTop: '8px'
                  }}
                >
                  افزودن نقش +
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewUser(false)}>انصراف</Button>
          <Button 
            onClick={handleCreateUser} 
            variant="contained"
            disabled={!newUser.username.trim() || !newUser.password.trim()}
          >
            ایجاد کاربر
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={openEditUser} onClose={() => setOpenEditUser(false)} maxWidth="sm" fullWidth>
        <DialogTitle>ویرایش کاربر</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 2, 
              mt: 1 
            }}>
              <TextField
                fullWidth
                label="نام کاربری"
                value={selectedUser.username}
                onChange={(e) => setSelectedUser({ ...selectedUser, username: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="نام"
                value={selectedUser.firstName || ""}
                onChange={(e) => setSelectedUser({ ...selectedUser, firstName: e.target.value })}
              />
              <TextField
                fullWidth
                label="نام خانوادگی"
                value={selectedUser.lastName || ""}
                onChange={(e) => setSelectedUser({ ...selectedUser, lastName: e.target.value })}
              />
              <TextField
                fullWidth
                label="ایمیل"
                type="email"
                value={selectedUser.email || ""}
                onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}
              />
              <FormControl fullWidth sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}>
                <InputLabel>نقش</InputLabel>
                <Select
                  value={getSelectedRoleDisplay(selectedUser)}
                  label="نقش"
                  onChange={(e) => {
                    if (e.target.value === "CUSTOM") {
                      setOpenCustomRoleManager(true);
                    } else if (customRoles.find(r => r.id === e.target.value)) {
                      setSelectedUser({ ...selectedUser, role: "CUSTOM", customRoleId: e.target.value });
                    } else {
                      setSelectedUser({ ...selectedUser, role: e.target.value, customRoleId: null });
                    }
                  }}
                >
                  <MenuItem value="ADMIN">مدیر</MenuItem>
                  <MenuItem value="BUYER">خریدار</MenuItem>
                  <MenuItem value="CONTRACTOR">پیمانکار</MenuItem>
                  <MenuItem value="SUPPLIER">تامین‌کننده</MenuItem>
                  {customRoles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.label}
                    </MenuItem>
                  ))}
                  <MenuItem 
                    value="CUSTOM"
                    sx={{ 
                      color: 'primary.main',
                      fontWeight: 'bold',
                      borderTop: '1px solid #e0e0e0',
                      marginTop: '4px',
                      paddingTop: '8px'
                    }}
                  >
                    افزودن نقش +
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditUser(false)}>انصراف</Button>
          <Button 
            onClick={handleEditUser} 
            variant="contained"
          >
            ذخیره تغییرات
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={openUserDetails} onClose={() => setOpenUserDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>جزئیات کاربر</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 3, 
              mt: 1 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, width: 64, height: 64, bgcolor: 'primary.main' }}>
                  {getRoleIcon(selectedUser.role)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    @{selectedUser.username}
                  </Typography>
                  <Chip 
                    label={getRoleDisplayInfo(selectedUser).label} 
                    color={getRoleDisplayInfo(selectedUser).color.startsWith('#') ? undefined : getRoleDisplayInfo(selectedUser).color}
                    sx={{ 
                      mt: 1,
                      backgroundColor: getRoleDisplayInfo(selectedUser).color.startsWith('#') ? getRoleDisplayInfo(selectedUser).color : undefined,
                      color: getRoleDisplayInfo(selectedUser).color.startsWith('#') ? 'white' : undefined,
                    }}
                  />
                </Box>
              </Box>
              
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  اطلاعات کاربر
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">وضعیت:</Typography>
                  <Chip 
                    label={selectedUser.isActive ? "فعال" : "غیرفعال"} 
                    color={selectedUser.isActive ? "success" : "default"}
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">تاریخ ایجاد:</Typography>
                  <Typography variant="body2">
                    {new Date(selectedUser.createdAt).toLocaleDateString('fa-IR')}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  اطلاعات تماس
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  gap: 2 
                }}>
                  <TextField
                    fullWidth
                    label="ایمیل"
                    value={selectedUser.email || "تعیین نشده"}
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    fullWidth
                    label="نام کاربری"
                    value={selectedUser.username}
                    InputProps={{ readOnly: true }}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUserDetails(false)}>بستن</Button>
          <Button 
            variant="contained"
            onClick={() => {
              setOpenUserDetails(false);
              setOpenEditUser(true);
            }}
          >
            ویرایش کاربر
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Role Manager */}
      <CustomRoleManager
        open={openCustomRoleManager}
        onClose={() => setOpenCustomRoleManager(false)}
        onRoleSelect={handleCustomRoleSelect}
        selectedRoleId={newUser.customRoleId || selectedUser?.customRoleId}
        onRoleCreated={() => {
          // Refresh custom roles list when roles are created, updated, or deleted
          fetchCustomRoles();
        }}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

