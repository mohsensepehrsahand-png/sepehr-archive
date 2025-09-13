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
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Alert,
  Snackbar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction
} from "@mui/material";
import {
  Search,
  Add,
  Edit,
  Delete,
  Security,
  AdminPanelSettings,
  Business,
  ShoppingCart,
  LocalShipping,
  ExpandMore,
  Save,
  Cancel,
  Refresh,
  Lock,
  LockOpen,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Warning
} from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

// Mock data for permissions
const mockRoles = [
  {
    id: 1,
    name: "ADMIN",
    label: "مدیر سیستم",
    description: "دسترسی کامل به تمام بخش‌های سیستم",
    color: "error",
    icon: <AdminPanelSettings />
  },
  {
    id: 2,
    name: "BUYER",
    label: "خریدار",
    description: "مدیریت پروژه‌ها و درخواست‌های خرید",
    color: "primary",
    icon: <Business />
  },
  {
    id: 3,
    name: "CONTRACTOR",
    label: "پیمانکار",
    description: "مدیریت قراردادها و پروژه‌های پیمانکاری",
    color: "success",
    icon: <ShoppingCart />
  },
  {
    id: 4,
    name: "SUPPLIER",
    label: "تامین‌کننده",
    description: "مدیریت کالاها و خدمات تامین",
    color: "warning",
    icon: <LocalShipping />
  }
];

const mockPermissions = {
  projects: {
    label: "پروژه‌ها",
    description: "مدیریت پروژه‌ها و وظایف",
    permissions: [
      { id: "projects.view", label: "مشاهده پروژه‌ها", description: "مشاهده لیست و جزئیات پروژه‌ها" },
      { id: "projects.create", label: "ایجاد پروژه", description: "ایجاد پروژه جدید" },
      { id: "projects.edit", label: "ویرایش پروژه", description: "ویرایش اطلاعات پروژه" },
      { id: "projects.delete", label: "حذف پروژه", description: "حذف پروژه" },
      { id: "projects.assign", label: "تخصیص پروژه", description: "تخصیص پروژه به کاربران" }
    ]
  },
  users: {
    label: "کاربران",
    description: "مدیریت کاربران و نقش‌ها",
    permissions: [
      { id: "users.view", label: "مشاهده کاربران", description: "مشاهده لیست کاربران" },
      { id: "users.create", label: "ایجاد کاربر", description: "ایجاد کاربر جدید" },
      { id: "users.edit", label: "ویرایش کاربر", description: "ویرایش اطلاعات کاربر" },
      { id: "users.delete", label: "حذف کاربر", description: "حذف کاربر" },
      { id: "users.roles", label: "مدیریت نقش‌ها", description: "تغییر نقش کاربران" }
    ]
  },
  documents: {
    label: "مستندات",
    description: "مدیریت فایل‌ها و مستندات",
    permissions: [
      { id: "documents.view", label: "مشاهده مستندات", description: "مشاهده فایل‌ها و مستندات" },
      { id: "documents.upload", label: "آپلود فایل", description: "آپلود فایل جدید" },
      { id: "documents.download", label: "دانلود فایل", description: "دانلود فایل‌ها" },
      { id: "documents.delete", label: "حذف فایل", description: "حذف فایل‌ها" }
    ]
  },
  reports: {
    label: "گزارشات",
    description: "مشاهده و تولید گزارشات",
    permissions: [
      { id: "reports.view", label: "مشاهده گزارشات", description: "مشاهده گزارشات موجود" },
      { id: "reports.generate", label: "تولید گزارش", description: "تولید گزارش جدید" },
      { id: "reports.export", label: "خروجی گزارش", description: "خروجی گرفتن از گزارشات" }
    ]
  },
  settings: {
    label: "تنظیمات",
    description: "تنظیمات سیستم و پیکربندی",
    permissions: [
      { id: "settings.view", label: "مشاهده تنظیمات", description: "مشاهده تنظیمات سیستم" },
      { id: "settings.edit", label: "ویرایش تنظیمات", description: "ویرایش تنظیمات سیستم" },
      { id: "settings.backup", label: "پشتیبان‌گیری", description: "مدیریت پشتیبان‌ها" }
    ]
  }
};

const mockRolePermissions = {
  ADMIN: Object.keys(mockPermissions).flatMap(module => 
    mockPermissions[module as keyof typeof mockPermissions].permissions.map(p => p.id)
  ),
  BUYER: [
    "projects.view", "projects.create", "projects.edit", "projects.assign",
    "documents.view", "documents.upload", "documents.download",
    "reports.view", "reports.generate", "reports.export"
  ],
  CONTRACTOR: [
    "projects.view", "projects.edit",
    "documents.view", "documents.upload", "documents.download",
    "reports.view"
  ],
  SUPPLIER: [
    "projects.view",
    "documents.view", "documents.upload",
    "reports.view"
  ]
};

export default function PermissionManagementPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [roles, setRoles] = useState(mockRoles);
  const [rolePermissions, setRolePermissions] = useState(mockRolePermissions);
  const [openNewRole, setOpenNewRole] = useState(false);
  const [openEditRole, setOpenEditRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [newRole, setNewRole] = useState({
    name: "",
    label: "",
    description: ""
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as any });
  const [expandedModule, setExpandedModule] = useState<string | false>("projects");

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

  const handleCreateRole = () => {
    if (newRole.name.trim() && newRole.label.trim()) {
      const role = {
        id: Date.now(),
        ...newRole,
        color: "default" as any,
        icon: <Security />
      };
      setRoles([...roles, role]);
      setRolePermissions({
        ...rolePermissions,
        [newRole.name]: []
      });
      setNewRole({ name: "", label: "", description: "" });
      setOpenNewRole(false);
      showSnackbar("نقش جدید با موفقیت ایجاد شد", "success");
    }
  };

  const handleEditRole = () => {
    if (selectedRole) {
      setRoles(roles.map(r => r.id === selectedRole.id ? { ...r, ...selectedRole } : r));
      setOpenEditRole(false);
      setSelectedRole(null);
      showSnackbar("نقش با موفقیت بروزرسانی شد", "success");
    }
  };

  const handleDeleteRole = (roleName: string) => {
    if (confirm("آیا از حذف این نقش اطمینان دارید؟")) {
      setRoles(roles.filter(r => r.name !== roleName));
      const newRolePermissions = { ...rolePermissions };
      delete newRolePermissions[roleName as keyof typeof newRolePermissions];
      setRolePermissions(newRolePermissions);
      showSnackbar("نقش با موفقیت حذف شد", "success");
    }
  };

  const handlePermissionChange = (roleName: string, permissionId: string, checked: boolean) => {
    setRolePermissions(prev => ({
      ...prev,
      [roleName]: checked
        ? [...(prev[roleName as keyof typeof prev] || []), permissionId]
        : (prev[roleName as keyof typeof prev] || []).filter((p: string) => p !== permissionId)
    }));
  };

  const handleSavePermissions = (roleName: string) => {
    showSnackbar(`مجوزهای نقش ${roleName} با موفقیت ذخیره شد`, "success");
  };

  const showSnackbar = (message: string, severity: "success" | "error" | "info" | "warning") => {
    setSnackbar({ open: true, message, severity });
  };

  const getRoleIcon = (roleName: string) => {
    const role = roles.find(r => r.name === roleName);
    return role?.icon || <Security />;
  };

  const getRoleColor = (roleName: string) => {
    const role = roles.find(r => r.name === roleName);
    return role?.color || "default";
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          مدیریت دسترسی‌ها
        </Typography>
        <Typography variant="body1" color="text.secondary">
          تعریف نقش‌ها و مجوزهای دسترسی برای کاربران سیستم
        </Typography>
      </Box>

      {/* Roles Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {roles.map((role) => (
          <Grid item xs={12} sm={6} md={3} key={role.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: `${role.color}.main` }}>
                    {role.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {role.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {role.name}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {role.description}
                </Typography>
                <Chip 
                  label={`${rolePermissions[role.name as keyof typeof rolePermissions]?.length || 0} مجوز`}
                  size="small"
                  variant="outlined"
                />
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  startIcon={<Edit />}
                  onClick={() => {
                    setSelectedRole(role);
                    setOpenEditRole(true);
                  }}
                >
                  ویرایش
                </Button>
                {role.name !== "ADMIN" && (
                  <Button 
                    size="small" 
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => handleDeleteRole(role.name)}
                  >
                    حذف
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setOpenNewRole(true)}
              sx={{ height: '100%', width: '100%' }}
            >
              نقش جدید
            </Button>
          </Card>
        </Grid>
      </Grid>

      {/* Permissions Management */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
          مدیریت مجوزها
        </Typography>
        
        {Object.entries(mockPermissions).map(([moduleKey, module]) => (
          <Accordion 
            key={moduleKey}
            expanded={expandedModule === moduleKey}
            onChange={(_, isExpanded) => setExpandedModule(isExpanded ? moduleKey : false)}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  {module.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {module.description}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>مجوز</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>توضیحات</TableCell>
                      {roles.map((role) => (
                        <TableCell key={role.name} align="center">
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Avatar sx={{ width: 32, height: 32, mb: 1, bgcolor: `${role.color}.main` }}>
                              {role.icon}
                            </Avatar>
                            <Typography variant="caption" fontWeight="medium">
                              {role.label}
                            </Typography>
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {module.permissions.map((permission, index) => (
                      <TableRow 
                        key={permission.id}
                        sx={{ 
                          backgroundColor: index % 2 === 0 ? '#fafafa' : '#ffffff',
                          '&:hover': {
                            backgroundColor: '#f0f0f0'
                          }
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {permission.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {permission.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {permission.description}
                          </Typography>
                        </TableCell>
                        {roles.map((role) => (
                          <TableCell key={role.name} align="center">
                            <Checkbox
                              checked={rolePermissions[role.name as keyof typeof rolePermissions]?.includes(permission.id)}
                              onChange={(e) => handlePermissionChange(role.name, permission.id, e.target.checked)}
                              color={role.color as any}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Save Button for each module */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={() => handleSavePermissions(moduleKey)}
                >
                  ذخیره تغییرات
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>

      {/* New Role Dialog */}
      <Dialog open={openNewRole} onClose={() => setOpenNewRole(false)} maxWidth="sm" fullWidth>
        <DialogTitle>ایجاد نقش جدید</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="نام نقش (انگلیسی)"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value.toUpperCase() })}
                placeholder="مثال: MANAGER"
                required
                autoFocus
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="عنوان نقش (فارسی)"
                value={newRole.label}
                onChange={(e) => setNewRole({ ...newRole, label: e.target.value })}
                placeholder="مثال: مدیر"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="توضیحات"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                multiline
                rows={3}
                placeholder="توضیح مختصر درباره نقش و مسئولیت‌های آن"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewRole(false)}>انصراف</Button>
          <Button 
            onClick={handleCreateRole} 
            variant="contained"
            disabled={!newRole.name.trim() || !newRole.label.trim()}
          >
            ایجاد نقش
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={openEditRole} onClose={() => setOpenEditRole(false)} maxWidth="sm" fullWidth>
        <DialogTitle>ویرایش نقش</DialogTitle>
        <DialogContent>
          {selectedRole && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="نام نقش (انگلیسی)"
                  value={selectedRole.name}
                  InputProps={{ readOnly: true }}
                  helperText="نام نقش قابل تغییر نیست"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="عنوان نقش (فارسی)"
                  value={selectedRole.label}
                  onChange={(e) => setSelectedRole({ ...selectedRole, label: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="توضیحات"
                  value={selectedRole.description}
                  onChange={(e) => setSelectedRole({ ...selectedRole, description: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditRole(false)}>انصراف</Button>
          <Button 
            onClick={handleEditRole} 
            variant="contained"
          >
            ذخیره تغییرات
          </Button>
        </DialogActions>
      </Dialog>

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

