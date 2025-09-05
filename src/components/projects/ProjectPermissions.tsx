"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
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
  LinearProgress
} from "@mui/material";
import { Delete, Security } from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface Permission {
  id: string;
  userId: string;
  accessLevel: string;
  user: User;
}

type AccessLevel = 'VIEW' | 'ADD' | 'ADMIN';

interface ProjectPermissionsProps {
  projectId: string;
}

export default function ProjectPermissions({ projectId }: ProjectPermissionsProps) {
  const { isAdmin } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAddPermission, setOpenAddPermission] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<AccessLevel>('VIEW');

  useEffect(() => {
    fetchPermissions();
    fetchUsers();
  }, [projectId]);

  const fetchPermissions = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/permissions`);
      if (response.ok) {
        const data = await response.json();
        setPermissions(data);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddPermission = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser,
          accessLevel: selectedAccessLevel
        })
      });

      if (response.ok) {
        await fetchPermissions();
        setOpenAddPermission(false);
        setSelectedUser("");
        setSelectedAccessLevel("VIEW");
      }
    } catch (error) {
      console.error('Error adding permission:', error);
    }
  };

  const handleDeletePermission = async (userId: string) => {
    if (!confirm('آیا از حذف این دسترسی اطمینان دارید؟')) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/permissions/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchPermissions();
      }
    } catch (error) {
      console.error('Error deleting permission:', error);
    }
  };

  const getAccessLevelLabel = (level: string) => {
    switch (level) {
      case 'VIEW': return 'مشاهده';
      case 'ADD': return 'افزودن';
      case 'ADMIN': return 'مدیریت';
      default: return level;
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

  if (loading) {
    return <LinearProgress />;
  }

  // Don't render the component if user is not admin
  if (!isAdmin) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <Security sx={{ mr: 1 }} />
            مدیریت دسترسی‌ها
          </Typography>
          <Button
            variant="contained"
            onClick={() => setOpenAddPermission(true)}
            size="small"
          >
            افزودن دسترسی
          </Button>
        </Box>

        {permissions.length === 0 ? (
          <Alert severity="info">
            هیچ دسترسی‌ای برای این پروژه تعریف نشده است
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {permissions.map((permission) => (
              <Box
                key={permission.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {permission.user.firstName} {permission.user.lastName} ({permission.user.username})
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip label={getRoleLabel(permission.user.role)} size="small" color="primary" />
                    <Chip label={getAccessLevelLabel(permission.accessLevel)} size="small" color="secondary" />
                  </Box>
                </Box>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeletePermission(permission.userId)}
                >
                  <Delete />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        {/* Dialog for adding permission */}
        <Dialog open={openAddPermission} onClose={() => setOpenAddPermission(false)} maxWidth="sm" fullWidth>
          <DialogTitle>افزودن دسترسی جدید</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>کاربر</InputLabel>
                <Select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  label="کاربر"
                >
                  {users
                    .filter(user => !permissions.find(p => p.userId === user.id))
                    .map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.username}) - {getRoleLabel(user.role)}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>سطح دسترسی</InputLabel>
                <Select
                  value={selectedAccessLevel}
                  onChange={(e) => setSelectedAccessLevel(e.target.value)}
                  label="سطح دسترسی"
                >
                  <MenuItem value="VIEW">مشاهده</MenuItem>
                  <MenuItem value="ADD">افزودن</MenuItem>
                  <MenuItem value="ADMIN">مدیریت</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddPermission(false)}>انصراف</Button>
            <Button onClick={handleAddPermission} variant="contained">
              افزودن
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
