"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper
} from "@mui/material";
import {
  Security,
  Person,
  Folder,
  CheckCircle,
  Cancel,
  Info
} from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdBy: string;
  documents: number;
  folders: number;
}

export default function TestPermissionsPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserProjects();
    }
  }, [user]);

  const fetchUserProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
        setError(null);
      } else {
        setError('خطا در دریافت پروژه‌ها');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  const goToProjects = () => {
    router.push('/projects');
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info">
          لطفاً ابتدا وارد سیستم شوید
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" sx={{ mb: 4 }}>
        <Security sx={{ mr: 2, verticalAlign: 'middle' }} />
        تست سیستم دسترسی
      </Typography>

      {/* User Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Person sx={{ mr: 1 }} />
            اطلاعات کاربر
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1">
                <strong>نام کاربری:</strong> {user.username}
              </Typography>
              <Typography variant="body1">
                <strong>نام:</strong> {user.firstName} {user.lastName}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1">
                <strong>نقش:</strong> 
                <Chip 
                  label={isAdmin ? 'مدیر سیستم' : 'کاربر عادی'} 
                  color={isAdmin ? 'error' : 'primary'} 
                  size="small" 
                  sx={{ ml: 1 }}
                />
              </Typography>
              <Typography variant="body1">
                <strong>ایمیل:</strong> {user.email || 'تعریف نشده'}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Access Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Security sx={{ mr: 1 }} />
            خلاصه دسترسی‌ها
          </Typography>
          
          {isAdmin ? (
            <Alert severity="success" icon={<CheckCircle />}>
              شما به عنوان مدیر سیستم، دسترسی کامل به تمام بخش‌های سیستم دارید.
            </Alert>
          ) : (
            <Alert severity="info" icon={<Info />}>
              شما به عنوان کاربر عادی، فقط به پروژه‌هایی که مدیر برایتان تعریف کرده دسترسی دارید.
            </Alert>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>دسترسی‌های فعال:</strong>
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="مشاهده پروژه‌های مجاز" 
                  secondary="فقط پروژه‌هایی که دسترسی دارید"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Cancel color="disabled" />
                </ListItemIcon>
                <ListItemText 
                  primary="ایجاد/ویرایش پروژه" 
                  secondary="فقط برای مدیران"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Cancel color="disabled" />
                </ListItemIcon>
                <ListItemText 
                  primary="مدیریت دسترسی‌ها" 
                  secondary="فقط برای مدیران"
                />
              </ListItem>
            </List>
          </Box>
        </CardContent>
      </Card>

      {/* Projects Access Test */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <Folder sx={{ mr: 1 }} />
              تست دسترسی به پروژه‌ها
            </Typography>
            <Button variant="contained" onClick={goToProjects}>
              مشاهده در صفحه پروژه‌ها
            </Button>
          </Box>

          {loading ? (
            <Typography>در حال بارگذاری...</Typography>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                تعداد پروژه‌هایی که می‌توانید مشاهده کنید: <strong>{projects.length}</strong>
              </Typography>
              
              {projects.length === 0 ? (
                <Alert severity="warning">
                  هیچ پروژه‌ای برای نمایش ندارید. ممکن است مدیر هنوز دسترسی‌ای برایتان تعریف نکرده باشد.
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {projects.map((project) => (
                    <Box key={project.id} sx={{ width: '100%' }}>
                      <Paper sx={{ p: 2, border: '1px solid #e0e0e0' }}>
                        <Typography variant="h6" gutterBottom>
                          {project.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {project.description || 'بدون توضیحات'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip 
                            label={`${project.folders} پوشه`} 
                            size="small" 
                            variant="outlined" 
                          />
                          <Chip 
                            label={`${project.documents} سند`} 
                            size="small" 
                            variant="outlined" 
                          />
                          <Chip 
                            label={project.status === 'ACTIVE' ? 'فعال' : 'آرشیو'} 
                            size="small" 
                            color={project.status === 'ACTIVE' ? 'success' : 'default'} 
                          />
                        </Box>
                      </Paper>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            راهنمای تست
          </Typography>
          <Typography variant="body2" paragraph>
            برای تست کامل سیستم دسترسی:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText 
                primary="1. با کاربر testuser / test123 وارد شوید" 
                secondary="این کاربر فقط به ۲ پروژه دسترسی دارد"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="2. به صفحه پروژه‌ها بروید" 
                secondary="فقط پروژه‌های مجاز را خواهید دید"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="3. با کاربر admin / admin وارد شوید" 
                secondary="تمام پروژه‌ها را خواهید دید"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Container>
  );
}
