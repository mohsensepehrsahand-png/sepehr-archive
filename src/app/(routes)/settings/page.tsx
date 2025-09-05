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
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  InputAdornment,
  CircularProgress
} from "@mui/material";
import {
  Security,
  Save,
  Refresh,
  Shield,
  Lock
} from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";


export default function SettingsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as any });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 30,
    requirePasswordChange: 90,
    maxLoginAttempts: 5,
    ipWhitelist: '',
    ipBlacklist: '',
    auditLogging: true
  });

  // Redirect non-admin users only after loading is complete
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/projects');
    }
  }, [isAdmin, authLoading, router]);

  // Load existing settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setSecuritySettings({
              sessionTimeout: data.sessionTimeout || 30,
              requirePasswordChange: data.requirePasswordChange || 90,
              maxLoginAttempts: data.maxLoginAttempts || 5,
              ipWhitelist: data.ipWhitelist || '',
              ipBlacklist: data.ipBlacklist || '',
              auditLogging: data.auditLogging !== undefined ? data.auditLogging : true
            });
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    if (isAdmin) {
      loadSettings();
    }
  }, [isAdmin]);

  // Show loading or don't render if user is not admin
  if (authLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          gap: 2
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          در حال بررسی دسترسی...
        </Typography>
      </Box>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(securitySettings),
      });

      if (response.ok) {
        showSnackbar('تنظیمات امنیت با موفقیت ذخیره شد', 'success');
      } else {
        showSnackbar('خطا در ذخیره تنظیمات', 'error');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showSnackbar('خطا در ذخیره تنظیمات', 'error');
    } finally {
    setLoading(false);
    }
  };

  const handleResetSettings = () => {
    if (confirm('آیا از بازنشانی تنظیمات امنیت اطمینان دارید؟')) {
      setSecuritySettings({
        sessionTimeout: 30,
        requirePasswordChange: 90,
        maxLoginAttempts: 5,
        ipWhitelist: '',
        ipBlacklist: '',
        auditLogging: true
      });
      showSnackbar('تنظیمات امنیت بازنشانی شد', 'info');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          تنظیمات امنیت
        </Typography>
        <Typography variant="body1" color="text.secondary">
          مدیریت تنظیمات امنیتی سیستم
        </Typography>
      </Box>

      {/* Security Settings */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Shield sx={{ mr: 1 }} />
                    تنظیمات جلسه
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="مدت زمان جلسه (دقیقه)"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                    margin="normal"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">دقیقه</InputAdornment>,
                    }}
                  />
                  
                  <TextField
                    fullWidth
                    label="تغییر اجباری رمز عبور (روز)"
                    type="number"
                    value={securitySettings.requirePasswordChange}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, requirePasswordChange: parseInt(e.target.value) })}
                    margin="normal"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">روز</InputAdornment>,
                    }}
                  />
                  
                  <TextField
                    fullWidth
                    label="حداکثر تلاش ورود"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) })}
                    margin="normal"
                  />
                </CardContent>
              </Card>
            </Box>
            
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Lock sx={{ mr: 1 }} />
                    تنظیمات امنیتی پیشرفته
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="لیست سفید IP (هر IP در خط جدید)"
                    value={securitySettings.ipWhitelist}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, ipWhitelist: e.target.value })}
                    margin="normal"
                    multiline
                    rows={3}
                    placeholder="192.168.1.1&#10;10.0.0.1"
                  />
              
              <TextField
                fullWidth
                label="لیست سیاه IP (هر IP در خط جدید)"
                value={securitySettings.ipBlacklist}
                onChange={(e) => setSecuritySettings({ ...securitySettings, ipBlacklist: e.target.value })}
                margin="normal"
                multiline
                rows={3}
                placeholder="192.168.1.100&#10;10.0.0.50"
                helperText="IP هایی که به صورت خودکار یا دستی مسدود شده‌اند"
              />
              
              {securitySettings.ipBlacklist && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>توجه:</strong> IP های موجود در لیست سیاه از دسترسی به سیستم محروم هستند. 
                    برای حذف IP از لیست سیاه، آن را از فیلد بالا حذف کنید و تنظیمات را ذخیره کنید.
                  </Typography>
                </Alert>
              )}
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={securitySettings.auditLogging}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, auditLogging: e.target.checked })}
                      />
                    }
                    label="ثبت لاگ فعالیت‌ها"
                    sx={{ mt: 2 }}
                  />
                  
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>توجه:</strong> تغییرات امنیتی ممکن است نیاز به راه‌اندازی مجدد سیستم داشته باشد.
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            </Box>
          </Box>
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Save />}
          onClick={handleSaveSettings}
              disabled={loading}
            >
              {loading ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
          onClick={handleResetSettings}
            >
              بازنشانی
            </Button>
          </Box>

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

