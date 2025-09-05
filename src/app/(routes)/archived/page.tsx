"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Breadcrumbs,
  Link as MuiLink,
  Tooltip
} from "@mui/material";
import {
  Search,
  Edit,
  Delete,
  Visibility,
  Folder,
  Description,
  CalendarToday,
  Person,
  Sort,
  Home,
  Archive
} from "@mui/icons-material";
import Link from "next/link";
import { useProjects } from "@/contexts/ProjectContext";
import type { Project } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function ArchivedProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("همه");
  const [sortBy, setSortBy] = useState("name");
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const { refreshProjects } = useProjects();
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect non-admin users only after loading is complete
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/projects');
    }
  }, [isAdmin, authLoading, router]);

  // Fetch archived projects
  useEffect(() => {
    const fetchArchivedProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/projects?status=ARCHIVED');
        if (response.ok) {
          const data = await response.json();
          setArchivedProjects(data);
        } else {
          console.error('Failed to fetch archived projects');
        }
      } catch (error) {
        console.error('Error fetching archived projects:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchArchivedProjects();
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
        <LinearProgress sx={{ width: '200px' }} />
        <Typography variant="h6" color="text.secondary">
          در حال بررسی دسترسی...
        </Typography>
      </Box>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // Filter projects
  const filteredProjects = archivedProjects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRestoreProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });

      if (response.ok) {
        // Remove from archived list
        setArchivedProjects(prev => prev.filter(p => p.id !== projectId));
        
        // Refresh main projects list to include the restored project
        if (refreshProjects) {
          refreshProjects();
        }
        
        // Show success message
        alert('پروژه با موفقیت بازگردانی شد');
      } else {
        console.error('Failed to restore project');
        alert('خطا در بازگردانی پروژه');
      }
    } catch (error) {
      console.error('Error restoring project:', error);
      alert('خطا در بازگردانی پروژه');
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (confirm(`آیا از حذف دائمی پروژه "${projectName}" اطمینان دارید؟`)) {
      try {
        const response = await fetch(`/api/projects/${projectId}?force=true`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setArchivedProjects(prev => prev.filter(p => p.id !== projectId));
        } else {
          console.error('Failed to delete project');
          alert('خطا در حذف پروژه');
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('خطا در حذف پروژه');
      }
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 4, '& .MuiBreadcrumbs-separator': { mx: 1 } }}>
        <MuiLink 
          component={Link} 
          href="/dashboard" 
          color="inherit"
          sx={{ 
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          <Home fontSize="small" sx={{ mr: 0.5 }} />
          داشبورد
        </MuiLink>
        <Typography color="text.primary" fontWeight="bold">
          پروژه‌های آرشیو شده
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4 
      }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            پروژه‌های آرشیو شده
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            مدیریت پروژه‌های آرشیو شده
          </Typography>
        </Box>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="جستجو در پروژه‌های آرشیو شده..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ '& .MuiInputBase-input': { fontFamily: 'Vazirmatn, Arial, sans-serif' } }}
        />
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ width: '100%', mb: 3 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
            در حال بارگذاری پروژه‌های آرشیو شده...
          </Typography>
        </Box>
      )}

      {/* Projects Grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
        gap: 3 
      }}>
        {!loading && filteredProjects.map((project) => (
          <Box key={project.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: '2px solid #ff980020',
                bgcolor: '#fff3e0',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease-in-out'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                {/* Project Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: '#ff9800', 
                      mr: 2,
                      width: 40,
                      height: 40
                    }}
                  >
                    <Archive />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h3" gutterBottom noWrap sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {project.name}
                    </Typography>
                    <Chip 
                      label="آرشیو شده" 
                      size="small" 
                      color="warning"
                      icon={<Archive />}
                    />
                  </Box>
                </Box>

                {/* Project Description */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                  {project.description}
                </Typography>

                {/* Project Stats */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Description sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {project.documents} سند
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Person sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {project.createdBy}
                    </Typography>
                  </Box>
                </Box>

                {/* Project Date */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarToday sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    ایجاد شده در {project.createdAt}
                  </Typography>
                </Box>
              </CardContent>

              <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                <Button
                  component={Link}
                  href={`/projects/${project.id}`}
                  size="small"
                  startIcon={<Visibility />}
                  variant="outlined"
                  sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                >
                  مشاهده
                </Button>
                
                <Box>
                  <Tooltip title="بازگردانی پروژه">
                    <IconButton 
                      size="small" 
                      color="success"
                      onClick={() => handleRestoreProject(project.id)}
                    >
                      <Archive />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="حذف دائمی">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteProject(project.id, project.name)}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardActions>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Empty State */}
      {!loading && filteredProjects.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Archive sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            پروژه آرشیو شده‌ای یافت نشد
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            {searchTerm 
              ? "لطفاً عبارت جستجو را تغییر دهید" 
              : "هنوز پروژه‌ای آرشیو نشده است"
            }
          </Typography>
          {!searchTerm && (
            <Button
              component={Link}
              href="/projects"
              variant="contained"
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              بازگشت به پروژه‌ها
            </Button>
          )}
        </Box>
      )}
    </Container>
  );
}
