"use client";
import { useState } from "react";
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
  Fab,
  Tooltip,
  Alert,
  LinearProgress,
  Grid,
  useTheme,
  useMediaQuery
} from "@mui/material";
import {
  Search,
  Add,
  Edit,
  Delete,
  Visibility,
  Folder,
  Description,
  CalendarToday,
  Person,
  Sort
} from "@mui/icons-material";
import Link from "next/link";
import { useProjects } from "@/contexts/ProjectContext";
import type { Project } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { dispatchProjectEvent } from "@/lib/events";
import MobileProjectCard from "@/components/mobile/MobileProjectCard";
import DesktopProjectCard from "@/components/projects/DesktopProjectCard";
import MobileSearchBar from "@/components/mobile/MobileSearchBar";
import MobileFAB from "@/components/mobile/MobileFAB";
import ConfirmationDialog from "@/components/common/ConfirmationDialog";
import { useProjects as useProjectsQuery } from "@/hooks/useProjects";
import { ProjectCardSkeleton } from "@/components/common/LoadingSkeleton";

export default function ProjectListPage() {
  const { 
    projects, 
    loading, 
    addProject, 
    deleteProject, 
    updateProject,
    confirmationDialog,
    showConfirmationDialog,
    hideConfirmationDialog,
    setConfirmationLoading
  } = useProjects();
  
  // Use React Query for better caching
  const { data: projectsData, isLoading: queryLoading, error } = useProjectsQuery();
  const { isAdmin } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("همه");
  const [sortBy, setSortBy] = useState("name");
  const [openNewProject, setOpenNewProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    status: "فعال"
  });
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);


  // Filter and search projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "همه" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "createdAt":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "documents":
        return b.documents - a.documents;
      default:
        return 0;
    }
  });

  const handleCreateProject = async () => {
    if (newProject.name.trim()) {
      try {
        await addProject({
          name: newProject.name.trim(),
          description: newProject.description.trim(),
          status: newProject.status
        });
        setNewProject({ name: "", description: "", status: "فعال" });
        setOpenNewProject(false);
      } catch (error) {
        console.error('Error creating project:', error);
        alert('خطا در ایجاد پروژه');
      }
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    const confirmMessage = `آیا مطمئن هستید که می‌خواهید پروژه "${projectName}" را حذف کنید؟\n\nاین پروژه به آرشیو منتقل خواهد شد و قابل بازگردانی است.`;
    
    showConfirmationDialog(
      "تایید حذف پروژه",
      confirmMessage,
      async () => {
        setConfirmationLoading(true);
        try {
          await deleteProject(projectId, true);
          dispatchProjectEvent('DELETED', { projectId, projectName });
          hideConfirmationDialog();
        } catch (deleteError) {
          console.error('Error deleting project:', deleteError);
          alert('خطا در حذف پروژه');
        } finally {
          setConfirmationLoading(false);
        }
      }
    );
  };

  const handleEditProject = (project: Project) => {
    setEditProject(project);
    setOpenEditDialog(true);
  };

  const handleUpdateProject = async () => {
    if (!editProject || !editProject.name.trim()) return;

    try {
      await updateProject(editProject.id, {
        name: editProject.name.trim(),
        description: editProject.description.trim(),
        status: editProject.status
      });
      setEditProject(null);
      setOpenEditDialog(false);
    } catch (error) {
      console.error('Error updating project:', error);
      alert('خطا در ویرایش پروژه');
    }
  };

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
            مدیریت پروژه‌ها
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            ایجاد، ویرایش و مدیریت پروژه‌های مختلف
          </Typography>
        </Box>
        
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenNewProject(true)}
            sx={{ 
              fontFamily: 'Vazirmatn, Arial, sans-serif',
              borderRadius: 2,
              px: 3,
              py: 1.5
            }}
          >
            ایجاد پروژه
          </Button>
        )}
      </Box>

      {/* Search and Filters */}
      <MobileSearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        placeholder="جستجو در پروژه‌ها..."
      />

      {/* Loading State */}
      {(loading || queryLoading) && (
        <Grid container spacing={2}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
              <ProjectCardSkeleton />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Projects List */}
      {isMobile ? (
        <Box>
          {!loading && !queryLoading && sortedProjects.map((project) => (
            <MobileProjectCard
              key={project.id}
              id={project.id}
              name={project.name}
              description={project.description}
              status={project.status}
              documents={project.documents}
              createdBy={project.createdBy}
              createdAt={project.createdAt}
              colorPrimary={project.colorPrimary}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              showActions={isAdmin}
            />
          ))}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {!loading && !queryLoading && sortedProjects.map((project) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={project.id}>
              <DesktopProjectCard
                id={project.id}
                name={project.name}
                description={project.description}
                status={project.status}
                documents={project.documents}
                createdBy={project.createdBy}
                createdAt={project.createdAt}
                colorPrimary={project.colorPrimary}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
                showActions={isAdmin}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Empty State */}
      {!loading && !queryLoading && sortedProjects.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Folder sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            پروژه‌ای یافت نشد
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            {searchTerm || statusFilter !== "همه" 
              ? "لطفاً فیلترهای جستجو را تغییر دهید" 
              : "هنوز پروژه‌ای ایجاد نشده است"
            }
          </Typography>
          {!searchTerm && statusFilter === "همه" && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenNewProject(true)}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              ایجاد اولین پروژه
            </Button>
          )}
        </Box>
      )}

      {/* Mobile Floating Action Button */}
      {isAdmin && (
        <MobileFAB
          onClick={() => setOpenNewProject(true)}
          tooltip="پروژه جدید"
        />
      )}

      {/* New Project Dialog */}
      <Dialog open={openNewProject} onClose={() => setOpenNewProject(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>ایجاد پروژه جدید</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="نام پروژه"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            margin="normal"
            required
            autoFocus
            sx={{ '& .MuiInputBase-input': { fontFamily: 'Vazirmatn, Arial, sans-serif' }, '& .MuiInputLabel-root': { fontFamily: 'Vazirmatn, Arial, sans-serif' } }}
          />
          <TextField
            fullWidth
            label="توضیحات"
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            sx={{ '& .MuiInputBase-input': { fontFamily: 'Vazirmatn, Arial, sans-serif' }, '& .MuiInputLabel-root': { fontFamily: 'Vazirmatn, Arial, sans-serif' } }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>وضعیت</InputLabel>
            <Select
              value={newProject.status}
              label="وضعیت"
              onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
              sx={{ '& .MuiSelect-select': { fontFamily: 'Vazirmatn, Arial, sans-serif' } }}
            >
              <MenuItem value="فعال" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>فعال</MenuItem>
              <MenuItem value="آرشیو" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>آرشیو</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewProject(false)} sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>انصراف</Button>
          <Button 
            onClick={handleCreateProject} 
            variant="contained"
            disabled={!newProject.name.trim()}
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            ایجاد پروژه
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>ویرایش پروژه</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="نام پروژه"
            value={editProject?.name || ""}
            onChange={(e) => setEditProject(prev => prev ? { ...prev, name: e.target.value } : null)}
            sx={{ mb: 2, mt: 1, '& .MuiInputBase-input': { fontFamily: 'Vazirmatn, Arial, sans-serif' } }}
          />
          <TextField
            fullWidth
            label="توضیحات"
            value={editProject?.description || ""}
            onChange={(e) => setEditProject(prev => prev ? { ...prev, description: e.target.value } : null)}
            multiline
            rows={3}
            sx={{ mb: 2, '& .MuiInputBase-input': { fontFamily: 'Vazirmatn, Arial, sans-serif' } }}
          />
          <FormControl fullWidth>
            <InputLabel sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>وضعیت</InputLabel>
            <Select
              value={editProject?.status || "فعال"}
              label="وضعیت"
              onChange={(e) => setEditProject(prev => prev ? { ...prev, status: e.target.value } : null)}
              sx={{ '& .MuiSelect-select': { fontFamily: 'Vazirmatn, Arial, sans-serif' } }}
            >
              <MenuItem value="فعال" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>فعال</MenuItem>
              <MenuItem value="آرشیو" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>آرشیو</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)} sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            انصراف
          </Button>
          <Button 
            onClick={handleUpdateProject} 
            variant="contained"
            disabled={!editProject?.name.trim()}
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            ذخیره تغییرات
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmationDialog.open}
        onClose={hideConfirmationDialog}
        onConfirm={() => confirmationDialog.onConfirm?.()}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        confirmText="حذف"
        cancelText="انصراف"
        severity="error"
        loading={confirmationDialog.loading}
      />
    </Container>
  );
}

