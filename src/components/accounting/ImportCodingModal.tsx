"use client";
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Paper
} from '@mui/material';
import {
  AccountTree,
  CalendarToday,
  Business,
  CheckCircle,
  Warning
} from '@mui/icons-material';

interface FiscalYear {
  id: string;
  year: number;
  startDate: string;
  endDate: string;
  description?: string;
  accountsCount: number;
  displayName: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  fiscalYears: FiscalYear[];
}

interface ImportCodingModalProps {
  open: boolean;
  onClose: () => void;
  targetProjectId: string;
  targetFiscalYearId: string;
  onImportSuccess: () => void;
}

export default function ImportCodingModal({
  open,
  onClose,
  targetProjectId,
  targetFiscalYearId,
  onImportSuccess
}: ImportCodingModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<FiscalYear | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    if (open) {
      fetchImportSources();
    }
  }, [open]);

  const fetchImportSources = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/accounting/coding/import-sources');
      
      if (!response.ok) {
        throw new Error('خطا در دریافت منابع ایمپورت');
      }
      
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching import sources:', error);
      setError('خطا در دریافت منابع ایمپورت');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setSelectedFiscalYear(null);
  };

  const handleFiscalYearSelect = (fiscalYear: FiscalYear) => {
    setSelectedFiscalYear(fiscalYear);
  };

  const handleImport = async () => {
    if (!selectedProject || !selectedFiscalYear) {
      setError('لطفاً پروژه و سال مالی مبدأ را انتخاب کنید');
      return;
    }

    if (selectedFiscalYear.accountsCount === 0) {
      setError('سال مالی انتخاب شده هیچ کدینگی ندارد. لطفاً سال مالی دیگری انتخاب کنید.');
      return;
    }

    try {
      setImporting(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/accounting/coding/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetProjectId,
          targetFiscalYearId,
          sourceProjectId: selectedProject.id,
          sourceFiscalYearId: selectedFiscalYear.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در ایمپورت کدینگ');
      }

      const result = await response.json();
      setSuccess(`کدینگ با موفقیت از ${selectedProject.name} (سال مالی ${selectedFiscalYear.year}) ایمپورت شد. ${result.accountsImported} حساب ایجاد شد.`);
      
      // Call success callback after a short delay
      setTimeout(() => {
        onImportSuccess();
        onClose();
        setSelectedProject(null);
        setSelectedFiscalYear(null);
        setSuccess('');
      }, 2000);

    } catch (error) {
      console.error('Error importing coding:', error);
      setError(error instanceof Error ? error.message : 'خطا در ایمپورت کدینگ');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    if (!importing) {
      onClose();
      setSelectedProject(null);
      setSelectedFiscalYear(null);
      setError('');
      setSuccess('');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fa-IR');
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccountTree color="primary" />
        ایمپورت کدینگ از پروژه دیگر
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mr: 2 }}>
              در حال دریافت منابع ایمپورت...
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              انتخاب پروژه و سال مالی مبدأ
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              پروژه و سال مالی که کدینگ آن را می‌خواهید کپی کنید انتخاب کنید:
            </Typography>

            {/* Projects List */}
            <Paper variant="outlined" sx={{ mb: 3 }}>
              <Box sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Business color="primary" />
                  پروژه‌ها
                </Typography>
              </Box>
              
              <List disablePadding>
                {projects.map((project, index) => (
                  <ListItem 
                    key={project.id} 
                    disablePadding
                    sx={{
                      borderBottom: index < projects.length - 1 ? '1px solid' : 'none',
                      borderBottomColor: 'divider'
                    }}
                  >
                    <ListItemButton
                      onClick={() => handleProjectSelect(project)}
                      selected={selectedProject?.id === project.id}
                      sx={{
                        '&.Mui-selected': {
                          backgroundColor: 'primary.light',
                          '&:hover': {
                            backgroundColor: 'primary.main',
                            color: 'white'
                          }
                        }
                      }}
                    >
                      <ListItemIcon>
                        <Business color={selectedProject?.id === project.id ? 'inherit' : 'primary'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={project.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {project.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {project.fiscalYears.length} سال مالی با کدینگ
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip 
                        label={`${project.fiscalYears.length} سال مالی`}
                        size="small"
                        color={selectedProject?.id === project.id ? 'primary' : 'default'}
                        variant={selectedProject?.id === project.id ? 'filled' : 'outlined'}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>

            {/* Fiscal Years List */}
            {selectedProject && (
              <Paper variant="outlined">
                <Box sx={{ p: 2, backgroundColor: 'grey.50' }}>
                  <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday color="primary" />
                    سال‌های مالی {selectedProject.name}
                  </Typography>
                </Box>
                
                <List disablePadding>
                  {selectedProject.fiscalYears.map((fiscalYear, index) => (
                    <ListItem 
                      key={fiscalYear.id} 
                      disablePadding
                      sx={{
                        borderBottom: index < selectedProject.fiscalYears.length - 1 ? '1px solid' : 'none',
                        borderBottomColor: 'divider'
                      }}
                    >
                      <ListItemButton
                        onClick={() => handleFiscalYearSelect(fiscalYear)}
                        selected={selectedFiscalYear?.id === fiscalYear.id}
                        disabled={fiscalYear.id === targetFiscalYearId}
                        sx={{
                          '&.Mui-selected': {
                            backgroundColor: 'primary.light',
                            '&:hover': {
                              backgroundColor: 'primary.main',
                              color: 'white'
                            }
                          },
                          '&.Mui-disabled': {
                            opacity: 0.5
                          }
                        }}
                      >
                        <ListItemIcon>
                          <CalendarToday color={selectedFiscalYear?.id === fiscalYear.id ? 'inherit' : 'primary'} />
                        </ListItemIcon>
                        <ListItemText
                          primary={`سال مالی ${fiscalYear.year}`}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(fiscalYear.startDate)} تا {formatDate(fiscalYear.endDate)}
                              </Typography>
                              {fiscalYear.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {fiscalYear.description}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip 
                            label={`${fiscalYear.accountsCount} حساب`}
                            size="small"
                            color={selectedFiscalYear?.id === fiscalYear.id ? 'primary' : 'default'}
                            variant={selectedFiscalYear?.id === fiscalYear.id ? 'filled' : 'outlined'}
                          />
                        <Box display="flex" alignItems="center" gap={1}>
                          {fiscalYear.id === targetFiscalYearId && (
                            <Chip 
                              label="همان سال مالی" 
                              size="small" 
                              color="warning"
                              icon={<Warning />}
                            />
                          )}
                          {fiscalYear.accountsCount === 0 && (
                            <Chip 
                              label="بدون کدینگ" 
                              size="small" 
                              color="error"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            {/* Selection Summary */}
            {selectedProject && selectedFiscalYear && (
              <Alert 
                severity="info" 
                sx={{ mt: 3 }}
                icon={<CheckCircle />}
              >
                <Typography variant="body2">
                  کدینگ {selectedFiscalYear.accountsCount} حسابی از پروژه <strong>{selectedProject.name}</strong> 
                  سال مالی <strong>{selectedFiscalYear.year}</strong> ایمپورت خواهد شد.
                </Typography>
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={handleClose} 
          disabled={importing}
        >
          انصراف
        </Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={!selectedProject || !selectedFiscalYear || importing}
          startIcon={importing ? <CircularProgress size={20} /> : <AccountTree />}
        >
          {importing ? 'در حال ایمپورت...' : 'ایمپورت کدینگ'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
