"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  ListItemSecondaryAction,
} from '@mui/material';
import { CalendarMonth, AddCircleOutline, Delete, Edit } from '@mui/icons-material';

interface Project {
  id: string;
  name: string;
}

interface FiscalYear {
  id: string;
  year: number;
}

const ProjectFiscalYearManager: React.FC<{ project: Project }> = ({ project }) => {
  const router = useRouter();
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [newYear, setNewYear] = useState<number | ''>('');
  const [yearToDelete, setYearToDelete] = useState<FiscalYear | null>(null);
  const [editingYear, setEditingYear] = useState<FiscalYear | null>(null);
  const [editYear, setEditYear] = useState<number | ''>('');

  const fetchFiscalYears = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${project.id}/fiscal-years`);
      if (!response.ok) throw new Error('Failed to fetch fiscal years');
      const data = await response.json();
      setFiscalYears(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiscalYears();
  }, [project.id]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewYear('');
  };

  const handleCreateYear = async () => {
    if (!newYear) return;
    try {
      const response = await fetch(`/api/projects/${project.id}/fiscal-years`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: Number(newYear) }),
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to create fiscal year');
      }
      handleClose();
      fetchFiscalYears();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error');
    }
  };

  const handleDeleteClick = (fy: FiscalYear) => {
    setYearToDelete(fy);
  };

  const handleDeleteConfirm = async () => {
    if (!yearToDelete) return;
    try {
      const response = await fetch(`/api/projects/${project.id}/fiscal-years/${yearToDelete.year}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete fiscal year');
      }
      setYearToDelete(null);
      fetchFiscalYears();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error');
    }
  };

  const handleEditClick = (fy: FiscalYear) => {
    setEditingYear(fy);
    setEditYear(fy.year);
  };

  const handleEditClose = () => {
    setEditingYear(null);
    setEditYear('');
  };

  const handleEditConfirm = async () => {
    if (!editingYear || !editYear) return;
    try {
      const response = await fetch(`/api/projects/${project.id}/fiscal-years/${editingYear.year}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: Number(editYear) }),
      });
      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to update fiscal year');
      }
      handleEditClose();
      fetchFiscalYears();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error');
    }
  };

  if (loading) return <CircularProgress size={24} />;

  return (
    <Box mt={2}>
      <Typography variant="subtitle1" gutterBottom>
        سال‌های مالی
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <List dense>
        {fiscalYears.map((fy, index) => (
          <ListItem
            key={fy.id}
            secondaryAction={
              <Box>
                <IconButton
                  edge="end"
                  aria-label="edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick(fy);
                  }}
                  sx={{ mr: 1 }}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(fy);
                  }}
                >
                  <Delete />
                </IconButton>
              </Box>
            }
          >
            <ListItemButton onClick={() => router.push(`/accounting/${project.id}`)}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CalendarMonth fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={`ورود به سال مالی ${fy.year}`} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Button
        variant="outlined"
        size="small"
        startIcon={<AddCircleOutline />}
        onClick={handleOpen}
        sx={{ mt: 1 }}
      >
        تعریف سال مالی جدید
      </Button>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>تعریف سال مالی جدید برای {project.name}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="سال (مثلا 1403)"
            type="number"
            fullWidth
            variant="standard"
            value={newYear}
            onChange={(e) => setNewYear(e.target.value ? Number(e.target.value) : '')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>انصراف</Button>
          <Button onClick={handleCreateYear}>ایجاد</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!editingYear} onClose={handleEditClose}>
        <DialogTitle>ویرایش سال مالی</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="سال (مثلا 1403)"
            type="number"
            fullWidth
            variant="standard"
            value={editYear}
            onChange={(e) => setEditYear(e.target.value ? Number(e.target.value) : '')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>انصراف</Button>
          <Button onClick={handleEditConfirm}>ذخیره</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!yearToDelete} onClose={() => setYearToDelete(null)}>
        <DialogTitle>حذف سال مالی</DialogTitle>
        <DialogContent>
          <Typography>
            آیا از حذف سال مالی {yearToDelete?.year} مطمئن هستید؟ تمام اطلاعات حسابداری مربوط به این سال حذف خواهد شد.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setYearToDelete(null)}>انصراف</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectFiscalYearManager;
