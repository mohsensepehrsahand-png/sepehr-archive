"use client";
import { useState } from "react";
import { 
  Box, 
  Button, 
  useTheme, 
  alpha, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import { Add, CloudUpload } from "@mui/icons-material";
import Link from "next/link";

export default function ActionButtons({ onAddProject }: { onAddProject: (projectName: string, projectDescription: string, projectStatus: string) => void }) {
  const theme = useTheme();
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    status: "فعال"
  });

  const handleCreateProject = () => {
    setOpenProjectDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenProjectDialog(false);
    setNewProject({ name: "", description: "", status: "فعال" });
  };

  const handleSubmitProject = () => {
    if (newProject.name.trim()) {
      onAddProject(newProject.name.trim(), newProject.description.trim(), newProject.status);
      handleCloseDialog();
    }
  };

  return (
    <>
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 3, 
          mb: 3, 
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
          minHeight: '120px'
        }}
      >
        <Button
          onClick={handleCreateProject}
          variant="contained"
          startIcon={<Add />}
          size="large"
          sx={{
            borderRadius: 3,
            px: 4,
            py: 1.5,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            '&:hover': {
              background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
              boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}`
            }
          }}
        >
          ایجاد پروژه
        </Button>
        
        <Button
          component={Link}
          href="/documents/upload"
          variant="contained"
          startIcon={<CloudUpload />}
          size="large"
          sx={{
            borderRadius: 3,
            px: 4,
            py: 1.5,
            background: `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
            boxShadow: `0 8px 32px ${alpha(theme.palette.success.main, 0.3)}`,
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            '&:hover': {
              background: `linear-gradient(45deg, ${theme.palette.success.dark}, ${theme.palette.success.main})`,
              boxShadow: `0 12px 40px ${alpha(theme.palette.success.main, 0.4)}`
            }
          }}
        >
          بارگذاری سند
        </Button>
      </Box>

      {/* Project Creation Dialog - Complete Form */}
      <Dialog open={openProjectDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', textAlign: 'center' }}>
          ایجاد پروژه جدید
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="نام پروژه"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            margin="normal"
            required
            autoFocus
            sx={{ 
              '& .MuiInputBase-input': { fontFamily: 'Vazirmatn, Arial, sans-serif' }, 
              '& .MuiInputLabel-root': { fontFamily: 'Vazirmatn, Arial, sans-serif' } 
            }}
          />
          <TextField
            fullWidth
            label="توضیحات"
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            sx={{ 
              '& .MuiInputBase-input': { fontFamily: 'Vazirmatn, Arial, sans-serif' }, 
              '& .MuiInputLabel-root': { fontFamily: 'Vazirmatn, Arial, sans-serif' } 
            }}
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
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button onClick={handleCloseDialog} variant="outlined" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            انصراف
          </Button>
          <Button 
            onClick={handleSubmitProject} 
            variant="contained" 
            disabled={!newProject.name.trim()}
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            ایجاد پروژه
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
