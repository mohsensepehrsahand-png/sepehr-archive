"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Checkbox,
  FormControlLabel,
  Button,
  Alert,
  LinearProgress,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from "@mui/material";
import { Security, Folder, Delete, Add } from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface FolderPermission {
  id: string;
  folderId: string;
  userId: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface FolderPermissionsProps {
  projectId: string;
  folders: any[];
  projectPermissions: any[];
  onPermissionsChanged?: () => void;
}

export default function FolderPermissions({ 
  projectId, 
  folders, 
  projectPermissions,
  onPermissionsChanged
}: FolderPermissionsProps) {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchFolderPermissions();
    }
  }, [isAdmin, projectId, folders, projectPermissions]);

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

  const fetchFolderPermissions = async () => {
    try {
      setLoading(true);
      
      // Get permissions for all folders in the project
      const promises = folders.map(folder => 
        fetch(`/api/folders/${folder.id}/permissions`)
      );
      
      const responses = await Promise.all(promises);
      const permMap: Record<string, Record<string, boolean>> = {};
      
      for (let i = 0; i < responses.length; i++) {
        if (responses[i].ok) {
          const data = await responses[i].json();
          data.forEach((perm: any) => {
            if (!permMap[perm.folderId]) {
              permMap[perm.folderId] = {};
            }
            permMap[perm.folderId][perm.userId] = perm.canView;
          });
        }
      }
      
      setPermissions(permMap);
    } catch (error) {
      console.error('Error fetching folder permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (folderId: string, userId: string, hasAccess: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [folderId]: {
        ...prev[folderId],
        [userId]: hasAccess
      }
    }));
    setHasChanges(true);
  };

  const handleSavePermissions = async () => {
    try {
      setSaving(true);
      
      console.log('Saving permissions:', permissions);
      
      // Save all permissions
      const promises = Object.entries(permissions).map(([folderId, userPermissions]) =>
        Object.entries(userPermissions).map(([userId, canView]) => {
          console.log(`Saving permission: folder=${folderId}, user=${userId}, canView=${canView}`);
          return fetch(`/api/folders/${folderId}/permissions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              canView,
              canEdit: canView,
              canDelete: false
            })
          });
        })
      ).flat();

      const responses = await Promise.all(promises);
      
      // Check if all requests were successful
      const failedRequests = responses.filter(response => !response.ok);
      if (failedRequests.length > 0) {
        console.error('Some permission updates failed:', failedRequests);
        throw new Error('برخی از دسترسی‌ها ذخیره نشدند');
      }
      
      setHasChanges(false);
      
      // Refresh permissions to ensure consistency
      await fetchFolderPermissions();
      
      // Notify parent component that permissions have changed
      if (onPermissionsChanged) {
        onPermissionsChanged();
      }

      // Dispatch event for FolderManager to listen to
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('permissionsChanged'));
      }
      
      alert('دسترسی‌ها با موفقیت ذخیره شدند');
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert(`خطا در ذخیره دسترسی‌ها: ${error instanceof Error ? error.message : 'خطای نامشخص'}`);
    } finally {
      setSaving(false);
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

  // فقط کاربرانی که به پروژه دسترسی دارند
  const projectUsers = users.filter(user => 
    projectPermissions.find(p => p.userId === user.id)
  );

  // فقط پوشه‌هایی که کاربر به آنها دسترسی دارد
  const getVisibleFolders = (userId: string) => {
    return folders.filter(folder => {
      const userPermissions = permissions[folder.id];
      return userPermissions && userPermissions[userId] === true;
    });
  };

  if (!isAdmin) return null;

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Security color="primary" />
            <Typography variant="h6" fontWeight="bold">
              مدیریت دسترسی پوشه‌ها
            </Typography>
          </Box>
          
          {hasChanges && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSavePermissions}
              disabled={saving}
              startIcon={saving ? <LinearProgress sx={{ width: 16, height: 16 }} /> : null}
            >
              {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </Button>
          )}
        </Box>

        {folders.length === 0 ? (
          <Alert severity="info">
            هیچ پوشه‌ای در این پروژه وجود ندارد
          </Alert>
        ) : projectUsers.length === 0 ? (
          <Alert severity="info">
            هیچ کاربری به این پروژه دسترسی ندارد
          </Alert>
        ) : (
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>کاربر / پوشه</TableCell>
                  {folders.map((folder) => (
                    <TableCell key={folder.id} align="center" sx={{ fontWeight: 'bold' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <Folder color="primary" />
                        <Typography variant="body2" noWrap>
                          {folder.name}
                        </Typography>
                        <Chip 
                          label={`${folder.documents || 0} سند`} 
                          size="small" 
                          variant="outlined" 
                        />
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {projectUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {user.firstName} {user.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.username} - {getRoleLabel(user.role)}
                        </Typography>
                      </Box>
                    </TableCell>
                    {folders.map((folder) => (
                      <TableCell key={folder.id} align="center">
                        <Checkbox
                          checked={permissions[folder.id]?.[user.id] || false}
                          onChange={(e) => handlePermissionChange(folder.id, user.id, e.target.checked)}
                          color="primary"
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>راهنما:</strong> چک‌باکس هر پوشه را فعال کنید تا کاربر بتواند به آن پوشه دسترسی داشته باشد.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
