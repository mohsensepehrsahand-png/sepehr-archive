"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Chip,
  IconButton,
  Typography,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Close
} from "@mui/icons-material";

interface CustomRole {
  id: string;
  name: string;
  label: string;
  description?: string;
  color: string;
  isActive: boolean;
  createdAt: string;
}

interface CustomRoleManagerProps {
  open: boolean;
  onClose: () => void;
  onRoleSelect: (role: CustomRole | null) => void;
  selectedRoleId?: string;
  onRoleCreated?: () => void; // Callback when roles are created, updated, or deleted
}

export default function CustomRoleManager({ 
  open, 
  onClose, 
  onRoleSelect, 
  selectedRoleId,
  onRoleCreated
}: CustomRoleManagerProps) {
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [openNewRole, setOpenNewRole] = useState(false);
  const [openEditRole, setOpenEditRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null);
  const [newRole, setNewRole] = useState({
    name: "",
    label: "",
    description: "",
    color: "#1976d2"
  });
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: "", 
    severity: "success" as "success" | "error" | "info" | "warning" 
  });

  // دریافت نقش‌های سفارشی
  useEffect(() => {
    if (open) {
      fetchCustomRoles();
    }
  }, [open]);

  const fetchCustomRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/custom-roles');
      if (response.ok) {
        const roles = await response.json();
        setCustomRoles(roles);
      }
    } catch (error) {
      console.error('Error fetching custom roles:', error);
      showSnackbar('خطا در دریافت نقش‌های سفارشی', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRole.name.trim() || !newRole.label.trim()) {
      showSnackbar('نام و برچسب نقش الزامی است', 'error');
      return;
    }

    try {
      const response = await fetch('/api/custom-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRole),
      });

      if (response.ok) {
        const createdRole = await response.json();
        setCustomRoles([...customRoles, createdRole]);
        setNewRole({ name: "", label: "", description: "", color: "#1976d2" });
        setOpenNewRole(false);
        showSnackbar('نقش جدید با موفقیت ایجاد شد', 'success');
        // Call the callback to refresh the parent component
        if (onRoleCreated) {
          onRoleCreated();
        }
      } else {
        const error = await response.json();
        showSnackbar(error.error || 'خطا در ایجاد نقش', 'error');
      }
    } catch (error) {
      console.error('Error creating role:', error);
      showSnackbar('خطا در ایجاد نقش', 'error');
    }
  };

  const handleEditRole = async () => {
    if (!selectedRole) return;

    try {
      const response = await fetch(`/api/custom-roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedRole),
      });

      if (response.ok) {
        const updatedRole = await response.json();
        setCustomRoles(customRoles.map(r => r.id === updatedRole.id ? updatedRole : r));
        setOpenEditRole(false);
        setSelectedRole(null);
        showSnackbar('نقش با موفقیت بروزرسانی شد', 'success');
        // Call the callback to refresh the parent component
        if (onRoleCreated) {
          onRoleCreated();
        }
      } else {
        const error = await response.json();
        showSnackbar(error.error || 'خطا در بروزرسانی نقش', 'error');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      showSnackbar('خطا در بروزرسانی نقش', 'error');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('آیا از حذف این نقش اطمینان دارید؟')) return;

    try {
      const response = await fetch(`/api/custom-roles/${roleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCustomRoles(customRoles.filter(r => r.id !== roleId));
        showSnackbar('نقش با موفقیت حذف شد', 'success');
        // Call the callback to refresh the parent component
        if (onRoleCreated) {
          onRoleCreated();
        }
      } else {
        const error = await response.json();
        showSnackbar(error.error || 'خطا در حذف نقش', 'error');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      showSnackbar('خطا در حذف نقش', 'error');
    }
  };

  const handleRoleSelect = (role: CustomRole) => {
    onRoleSelect(role);
    onClose();
  };

  const showSnackbar = (message: string, severity: "success" | "error" | "info" | "warning") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          مدیریت نقش‌های سفارشی
          <IconButton
            onClick={onClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenNewRole(true)}
              sx={{ mb: 2 }}
            >
              ایجاد نقش جدید
            </Button>
          </Box>

          <Grid container spacing={2}>
            {customRoles.map((role) => (
              <Grid item xs={12} sm={6} md={4} key={role.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: selectedRoleId === role.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                    '&:hover': { boxShadow: 3 }
                  }}
                  onClick={() => handleRoleSelect(role)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Chip
                        label={role.label}
                        size="small"
                        sx={{ 
                          backgroundColor: role.color,
                          color: 'white',
                          mr: 1
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {role.name}
                      </Typography>
                    </Box>
                    {role.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {role.description}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRole(role);
                        setOpenEditRole(true);
                      }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRole(role.id);
                      }}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {customRoles.length === 0 && !loading && (
            <Alert severity="info" sx={{ mt: 2 }}>
              هیچ نقش سفارشی تعریف نشده است
            </Alert>
          )}
        </DialogContent>
      </Dialog>

      {/* Create New Role Dialog */}
      <Dialog open={openNewRole} onClose={() => setOpenNewRole(false)} maxWidth="sm" fullWidth>
        <DialogTitle>ایجاد نقش جدید</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="نام نقش (انگلیسی)"
              value={newRole.name}
              onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
              sx={{ mb: 2 }}
              placeholder="مثل: SHAREHOLDER"
            />
            <TextField
              fullWidth
              label="برچسب نقش (فارسی)"
              value={newRole.label}
              onChange={(e) => setNewRole({ ...newRole, label: e.target.value })}
              sx={{ mb: 2 }}
              placeholder="مثل: سهامدار"
            />
            <TextField
              fullWidth
              label="توضیحات"
              value={newRole.description}
              onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="رنگ"
              type="color"
              value={newRole.color}
              onChange={(e) => setNewRole({ ...newRole, color: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewRole(false)}>انصراف</Button>
          <Button onClick={handleCreateRole} variant="contained">
            ایجاد نقش
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={openEditRole} onClose={() => setOpenEditRole(false)} maxWidth="sm" fullWidth>
        <DialogTitle>ویرایش نقش</DialogTitle>
        <DialogContent>
          {selectedRole && (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="نام نقش (انگلیسی)"
                value={selectedRole.name}
                InputProps={{ readOnly: true }}
                helperText="نام نقش قابل تغییر نیست"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="برچسب نقش (فارسی)"
                value={selectedRole.label}
                onChange={(e) => setSelectedRole({ ...selectedRole, label: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="توضیحات"
                value={selectedRole.description || ''}
                onChange={(e) => setSelectedRole({ ...selectedRole, description: e.target.value })}
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="رنگ"
                type="color"
                value={selectedRole.color}
                onChange={(e) => setSelectedRole({ ...selectedRole, color: e.target.value })}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditRole(false)}>انصراف</Button>
          <Button onClick={handleEditRole} variant="contained">
            ذخیره تغییرات
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
