"use client";
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
  Menu
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  AccountTree,
  Save,
  Cancel,
  MoreVert
} from '@mui/icons-material';

interface AccountGroup {
  id: string;
  code: string;
  name: string;
  classes: AccountClass[];
}

interface AccountClass {
  id: string;
  code: string;
  name: string;
  nature: 'DEBIT' | 'CREDIT' | 'DEBIT_CREDIT';
  subClasses: AccountSubClass[];
}

interface AccountSubClass {
  id: string;
  code: string;
  name: string;
  hasDetails: boolean;
  details: AccountDetail[];
}

interface AccountDetail {
  id: string;
  code: string;
  name: string;
  description?: string;
}

interface AccountSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (accountCode: string, accountName: string, accountNature?: 'DEBIT' | 'CREDIT' | 'DEBIT_CREDIT') => void;
  projectId: string;
}

// Simple Code Input Component
const SimpleCodeInput = ({ 
  value, 
  onChange, 
  maxLength, 
  placeholder, 
  error = false, 
  helperText 
}: {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder: string;
  error?: boolean;
  helperText?: string;
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (/^\d*$/.test(inputValue) && inputValue.length <= maxLength) {
      onChange(inputValue);
    }
  };

  return (
    <Box>
      <TextField
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        inputProps={{ 
          maxLength,
          style: { textAlign: 'center', fontFamily: 'monospace' }
        }}
        error={error}
        helperText={helperText}
        size="small"
        sx={{ width: 80 }}
      />
    </Box>
  );
};

export default function AccountSelectorModal({
  open,
  onClose,
  onSelect,
  projectId
}: AccountSelectorModalProps) {
  const [groups, setGroups] = useState<AccountGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selection states
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubClass, setSelectedSubClass] = useState<string>('');
  const [selectedDetail, setSelectedDetail] = useState<string>('');

  // Form states for adding new accounts
  const [newGroupCode, setNewGroupCode] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newClassNature, setNewClassNature] = useState<'DEBIT' | 'CREDIT' | 'DEBIT_CREDIT'>('DEBIT');
  const [newSubClassCode, setNewSubClassCode] = useState('');
  const [newSubClassName, setNewSubClassName] = useState('');
  const [newSubClassHasDetails, setNewSubClassHasDetails] = useState(false);
  const [newDetailCode, setNewDetailCode] = useState('');
  const [newDetailName, setNewDetailName] = useState('');
  const [newDetailDescription, setNewDetailDescription] = useState('');

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogLevel, setAddDialogLevel] = useState<'group' | 'class' | 'subclass' | 'detail'>('group');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogLevel, setEditDialogLevel] = useState<'class' | 'subclass' | 'detail'>('class');
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Context menu states
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    type: 'class' | 'subclass' | 'detail';
    item?: any;
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCodingData();
    }
  }, [open, projectId]);

  const fetchCodingData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/accounting/coding/groups?projectId=${projectId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'خطا در دریافت کدینگ' }));
        throw new Error(errorData.error || 'خطا در دریافت کدینگ');
      }
      const data = await response.json();
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching coding data:', error);
      setError(error instanceof Error ? error.message : 'خطا در دریافت اطلاعات کدینگ');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedGroup = () => groups.find(g => g.id === selectedGroup);
  const getSelectedClass = () => {
    const group = getSelectedGroup();
    return group?.classes.find(c => c.id === selectedClass);
  };
  const getSelectedSubClass = () => {
    const accountClass = getSelectedClass();
    return accountClass?.subClasses.find(s => s.id === selectedSubClass);
  };
  const getSelectedDetail = () => {
    const subClass = getSelectedSubClass();
    return subClass?.details.find(d => d.id === selectedDetail);
  };

  const getFullCode = (item: any, level: 'group' | 'class' | 'subclass' | 'detail') => {
    if (!item) return '';

    if (level === 'group') {
      return item.code;
    } else if (level === 'class') {
      const group = groups.find(g => g.classes.some(c => c.id === item.id));
      return group ? group.code + item.code : item.code;
    } else if (level === 'subclass') {
      const group = groups.find(g => g.classes.some(c => c.subClasses.some(s => s.id === item.id)));
      const accountClass = group?.classes.find(c => c.subClasses.some(s => s.id === item.id));
      return group && accountClass ? group.code + accountClass.code + item.code : item.code;
    } else if (level === 'detail') {
      const group = groups.find(g => g.classes.some(c => c.subClasses.some(s => s.details.some(d => d.id === item.id))));
      const accountClass = group?.classes.find(c => c.subClasses.some(s => s.details.some(d => d.id === item.id)));
      const subClass = accountClass?.subClasses.find(s => s.details.some(d => d.id === item.id));
      return group && accountClass && subClass ? group.code + accountClass.code + subClass.code + item.code : item.code;
    }
    return item.code;
  };

  const handleSelectAccount = () => {
    const detail = getSelectedDetail();
    const subClass = getSelectedSubClass();
    const accountClass = getSelectedClass();
    const group = getSelectedGroup();

    // Get account nature - it inherits from class level
    let accountNature: 'DEBIT' | 'CREDIT' | 'DEBIT_CREDIT' | undefined;
    
    if (detail || subClass || accountClass) {
      // Find the class that contains this account
      const containingClass = groups.find(g => 
        g.classes.some(c => 
          c.id === selectedClass || 
          c.subClasses.some(s => s.id === selectedSubClass) ||
          c.subClasses.some(s => s.details.some(d => d.id === selectedDetail))
        )
      )?.classes.find(c => 
        c.id === selectedClass || 
        c.subClasses.some(s => s.id === selectedSubClass) ||
        c.subClasses.some(s => s.details.some(d => d.id === selectedDetail))
      );
      
      accountNature = containingClass?.nature;
    }

    if (detail) {
      onSelect(getFullCode(detail, 'detail'), detail.name, accountNature);
    } else if (subClass) {
      onSelect(getFullCode(subClass, 'subclass'), subClass.name, accountNature);
    } else if (accountClass) {
      onSelect(getFullCode(accountClass, 'class'), accountClass.name, accountClass.nature);
    } else if (group) {
      onSelect(getFullCode(group, 'group'), group.name);
    }
  };

  const openAddDialog = (level: 'group' | 'class' | 'subclass' | 'detail') => {
    setAddDialogLevel(level);
    setAddDialogOpen(true);
  };

  // Context menu handlers
  const handleContextMenu = (event: React.MouseEvent, type: 'class' | 'subclass' | 'detail', item: any) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      type,
      item
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return;

    switch (action) {
      case 'edit-class':
        if (contextMenu.item) openEditDialog('class', contextMenu.item);
        break;
      case 'edit-subclass':
        if (contextMenu.item) openEditDialog('subclass', contextMenu.item);
        break;
      case 'edit-detail':
        if (contextMenu.item) openEditDialog('detail', contextMenu.item);
        break;
      case 'delete-class':
        if (contextMenu.item) handleDeleteItem('class', contextMenu.item.id);
        break;
      case 'delete-subclass':
        if (contextMenu.item) handleDeleteItem('subclass', contextMenu.item.id);
        break;
      case 'delete-detail':
        if (contextMenu.item) handleDeleteItem('detail', contextMenu.item.id);
        break;
    }
    handleCloseContextMenu();
  };

  const openEditDialog = (level: 'class' | 'subclass' | 'detail', item: any) => {
    setEditDialogLevel(level);
    setEditingItem(item);
    
    // Initialize form values with current item data
    if (level === 'class') {
      setNewClassName(item.name);
      setNewClassNature(item.nature);
      setNewClassCode(item.code);
    } else if (level === 'subclass') {
      setNewSubClassName(item.name);
      setNewSubClassHasDetails(item.hasDetails);
      setNewSubClassCode(item.code);
    } else if (level === 'detail') {
      setNewDetailName(item.name);
      setNewDetailDescription(item.description || '');
      setNewDetailCode(item.code);
    }
    
    setEditDialogOpen(true);
  };

  const handleDeleteItem = async (level: 'class' | 'subclass' | 'detail', itemId: string) => {
    try {
      setDeleting(true);
      let endpoint = '';
      if (level === 'class') endpoint = `/api/accounting/coding/classes?id=${itemId}`;
      else if (level === 'subclass') endpoint = `/api/accounting/coding/subclasses?id=${itemId}`;
      else if (level === 'detail') endpoint = `/api/accounting/coding/details?id=${itemId}`;

      const response = await fetch(endpoint, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در حذف آیتم');
      }

      setSuccess('آیتم با موفقیت حذف شد');
      fetchCodingData();
    } catch (error) {
      console.error('Error deleting item:', error);
      setError(error instanceof Error ? error.message : 'خطا در حذف آیتم');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditItem = async () => {
    if (!editingItem) return;

    try {
      let endpoint = '';
      let body: any = {};

      if (editDialogLevel === 'class') {
        if (!validateClassCode(newClassCode)) {
          setError('کد کل باید بین 1 تا 9 باشد');
          return;
        }
        
        endpoint = `/api/accounting/coding/classes?id=${editingItem.id}`;
        body = {
          name: newClassName.trim(),
          nature: newClassNature,
          code: newClassCode
        };
      } else if (editDialogLevel === 'subclass') {
        if (!validateSubClassCode(newSubClassCode)) {
          setError('کد معین باید بین 01 تا 99 باشد');
          return;
        }
        
        endpoint = `/api/accounting/coding/subclasses?id=${editingItem.id}`;
        body = {
          name: newSubClassName.trim(),
          hasDetails: newSubClassHasDetails,
          code: newSubClassCode
        };
      } else if (editDialogLevel === 'detail') {
        if (!validateDetailCode(newDetailCode)) {
          setError('کد تفصیلی باید بین 01 تا 99 باشد');
          return;
        }
        
        endpoint = `/api/accounting/coding/details?id=${editingItem.id}`;
        body = {
          name: newDetailName.trim(),
          description: newDetailDescription.trim() || undefined,
          code: newDetailCode
        };
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در ویرایش آیتم');
      }

      setEditDialogOpen(false);
      setEditingItem(null);
      setSuccess('آیتم با موفقیت ویرایش شد');
      fetchCodingData();
    } catch (error) {
      console.error('Error editing item:', error);
      setError(error instanceof Error ? error.message : 'خطا در ویرایش آیتم');
    }
  };

  // Validation functions
  const validateClassCode = (code: string) => {
    const num = parseInt(code);
    return num >= 1 && num <= 9 && code.length === 1;
  };

  const validateSubClassCode = (code: string) => {
    const num = parseInt(code);
    return /^\d{2}$/.test(code) && num >= 1 && num <= 99;
  };

  const validateDetailCode = (code: string) => {
    const num = parseInt(code);
    return /^\d{2}$/.test(code) && num >= 1 && num <= 99;
  };

  const handleAddItem = async () => {
    try {
      let response;
      
      if (addDialogLevel === 'group') {
        if (!newGroupCode.trim() || !newGroupName.trim()) return;
        response = await fetch('/api/accounting/coding/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            code: newGroupCode.trim(),
            name: newGroupName.trim()
          })
        });
      } else if (addDialogLevel === 'class') {
        if (!selectedGroup || !newClassName.trim() || !newClassCode.trim()) return;
        response = await fetch('/api/accounting/coding/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            groupId: selectedGroup,
            name: newClassName.trim(),
            nature: newClassNature,
            code: newClassCode
          })
        });
      } else if (addDialogLevel === 'subclass') {
        if (!selectedClass || !newSubClassName.trim() || !newSubClassCode.trim()) return;
        response = await fetch('/api/accounting/coding/subclasses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            classId: selectedClass,
            name: newSubClassName.trim(),
            hasDetails: newSubClassHasDetails,
            code: newSubClassCode
          })
        });
      } else if (addDialogLevel === 'detail') {
        if (!selectedSubClass || !newDetailName.trim() || !newDetailCode.trim()) return;
        response = await fetch('/api/accounting/coding/details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            subClassId: selectedSubClass,
            name: newDetailName.trim(),
            description: newDetailDescription.trim() || undefined,
            code: newDetailCode
          })
        });
      }

      if (!response?.ok) {
        const errorData = await response?.json();
        throw new Error(errorData.error || 'خطا در افزودن آیتم');
      }

      setAddDialogOpen(false);
      setSuccess('آیتم جدید با موفقیت اضافه شد');
      fetchCodingData();
    } catch (error) {
      console.error('Error adding item:', error);
      setError(error instanceof Error ? error.message : 'خطا در افزودن آیتم');
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>انتخاب حساب</DialogTitle>
        <DialogContent>
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          انتخاب حساب
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {/* Hierarchical Selection Grid */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {/* Group Column */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Card sx={{ height: '400px' }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" sx={{ 
                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}>
                      گروه
                    </Typography>
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => openAddDialog('group')}
                      sx={{ p: 0.5 }}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {groups.length === 0 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        textAlign: 'center',
                        py: 2,
                        display: 'block'
                      }}>
                        هیچ گروهی تعریف نشده است
                      </Typography>
                    ) : (
                      <Box>
                        {groups.map((group) => (
                          <Box
                            key={group.id}
                            onClick={() => {
                              setSelectedGroup(group.id);
                              setSelectedClass('');
                              setSelectedSubClass('');
                              setSelectedDetail('');
                            }}
                            sx={{
                              p: 1,
                              mb: 0.5,
                              border: selectedGroup === group.id ? '2px solid' : '1px solid',
                              borderColor: selectedGroup === group.id ? 'primary.main' : 'divider',
                              borderRadius: 1,
                              cursor: 'pointer',
                              bgcolor: selectedGroup === group.id ? 'primary.light' : 'transparent',
                              '&:hover': {
                                bgcolor: selectedGroup === group.id ? 'primary.light' : 'action.hover'
                              },
                              transition: 'all 0.2s'
                            }}
                          >
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Chip label={group.code} size="small" color="primary" sx={{ fontSize: '0.7rem', height: 20 }} />
                              <Typography sx={{ 
                                fontFamily: 'Vazirmatn, Arial, sans-serif',
                                fontWeight: selectedGroup === group.id ? 'bold' : 'normal',
                                fontSize: '0.8rem'
                              }}>
                                {group.name}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Class Column */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Card sx={{ height: '400px' }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" sx={{ 
                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}>
                      سرفصل کل
                    </Typography>
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => openAddDialog('class')}
                      disabled={!selectedGroup}
                      sx={{ p: 0.5 }}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {!selectedGroup ? (
                      <Typography variant="caption" color="text.secondary" sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        textAlign: 'center',
                        py: 2,
                        display: 'block'
                      }}>
                        ابتدا یک گروه انتخاب کنید
                      </Typography>
                    ) : !getSelectedGroup()?.classes || getSelectedGroup()?.classes.length === 0 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        textAlign: 'center',
                        py: 2,
                        display: 'block'
                      }}>
                        هیچ کل تعریف نشده است
                      </Typography>
                    ) : (
                      <Box>
                        {getSelectedGroup()?.classes.map((accountClass) => (
                          <Box
                            key={accountClass.id}
                            onClick={() => {
                              setSelectedClass(accountClass.id);
                              setSelectedSubClass('');
                              setSelectedDetail('');
                            }}
                            onContextMenu={(e) => handleContextMenu(e, 'class', accountClass)}
                            sx={{
                              p: 1,
                              mb: 0.5,
                              border: selectedClass === accountClass.id ? '2px solid' : '1px solid',
                              borderColor: selectedClass === accountClass.id ? 'secondary.main' : 'divider',
                              borderRadius: 1,
                              cursor: 'pointer',
                              bgcolor: selectedClass === accountClass.id ? 'secondary.light' : 'transparent',
                              '&:hover': {
                                bgcolor: selectedClass === accountClass.id ? 'secondary.light' : 'action.hover'
                              },
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Chip 
                                label={getFullCode(accountClass, 'class')} 
                                size="small" 
                                color="secondary" 
                                sx={{ fontSize: '0.7rem', height: 20 }} 
                              />
                              <Typography sx={{ 
                                fontFamily: 'Vazirmatn, Arial, sans-serif',
                                fontWeight: selectedClass === accountClass.id ? 'bold' : 'normal',
                                fontSize: '0.8rem'
                              }}>
                                {accountClass.name}
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContextMenu(e, 'class', accountClass);
                              }}
                              sx={{ p: 0.5, opacity: 0.7, '&:hover': { opacity: 1 } }}
                            >
                              <MoreVert fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* SubClass Column */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Card sx={{ height: '400px' }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" sx={{ 
                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}>
                      سرفصل معین
                    </Typography>
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => openAddDialog('subclass')}
                      disabled={!selectedClass}
                      sx={{ p: 0.5 }}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {!selectedClass ? (
                      <Typography variant="caption" color="text.secondary" sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        textAlign: 'center',
                        py: 2,
                        display: 'block'
                      }}>
                        ابتدا یک کل انتخاب کنید
                      </Typography>
                    ) : !getSelectedClass()?.subClasses || getSelectedClass()?.subClasses.length === 0 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        textAlign: 'center',
                        py: 2,
                        display: 'block'
                      }}>
                        هیچ معین تعریف نشده است
                      </Typography>
                    ) : (
                      <Box>
                        {getSelectedClass()?.subClasses.map((subClass) => (
                          <Box
                            key={subClass.id}
                            onClick={() => {
                              setSelectedSubClass(subClass.id);
                              setSelectedDetail('');
                            }}
                            onContextMenu={(e) => handleContextMenu(e, 'subclass', subClass)}
                            sx={{
                              p: 1,
                              mb: 0.5,
                              border: selectedSubClass === subClass.id ? '2px solid' : '1px solid',
                              borderColor: selectedSubClass === subClass.id ? 'success.main' : 'divider',
                              borderRadius: 1,
                              cursor: 'pointer',
                              bgcolor: selectedSubClass === subClass.id ? 'success.light' : 'transparent',
                              '&:hover': {
                                bgcolor: selectedSubClass === subClass.id ? 'success.light' : 'action.hover'
                              },
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Chip 
                                label={getFullCode(subClass, 'subclass')} 
                                size="small" 
                                color="success" 
                                sx={{ fontSize: '0.7rem', height: 20 }} 
                              />
                              <Typography sx={{ 
                                fontFamily: 'Vazirmatn, Arial, sans-serif',
                                fontWeight: selectedSubClass === subClass.id ? 'bold' : 'normal',
                                fontSize: '0.8rem'
                              }}>
                                {subClass.name}
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContextMenu(e, 'subclass', subClass);
                              }}
                              sx={{ p: 0.5, opacity: 0.7, '&:hover': { opacity: 1 } }}
                            >
                              <MoreVert fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Detail Column */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Card sx={{ height: '400px' }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" sx={{ 
                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}>
                      تفصیلی
                    </Typography>
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => openAddDialog('detail')}
                      disabled={!selectedSubClass || !getSelectedSubClass()?.hasDetails}
                      sx={{ p: 0.5 }}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {!selectedSubClass ? (
                      <Typography variant="caption" color="text.secondary" sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        textAlign: 'center',
                        py: 2,
                        display: 'block'
                      }}>
                        ابتدا یک معین انتخاب کنید
                      </Typography>
                    ) : !getSelectedSubClass()?.hasDetails ? (
                      <Typography variant="caption" color="text.secondary" sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        textAlign: 'center',
                        py: 2,
                        display: 'block'
                      }}>
                        این معین تفصیلی ندارد
                      </Typography>
                    ) : !getSelectedSubClass()?.details || getSelectedSubClass()?.details.length === 0 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ 
                        fontFamily: 'Vazirmatn, Arial, sans-serif',
                        textAlign: 'center',
                        py: 2,
                        display: 'block'
                      }}>
                        هیچ تفصیلی تعریف نشده است
                      </Typography>
                    ) : (
                      <Box>
                        {getSelectedSubClass()?.details.map((detail) => (
                          <Box
                            key={detail.id}
                            onClick={() => setSelectedDetail(detail.id)}
                            onContextMenu={(e) => handleContextMenu(e, 'detail', detail)}
                            sx={{
                              p: 1,
                              mb: 0.5,
                              border: selectedDetail === detail.id ? '2px solid' : '1px solid',
                              borderColor: selectedDetail === detail.id ? 'warning.main' : 'divider',
                              borderRadius: 1,
                              cursor: 'pointer',
                              bgcolor: selectedDetail === detail.id ? 'warning.light' : 'transparent',
                              '&:hover': {
                                bgcolor: selectedDetail === detail.id ? 'warning.light' : 'action.hover'
                              },
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Chip 
                                label={getFullCode(detail, 'detail')} 
                                size="small" 
                                color="warning" 
                                sx={{ fontSize: '0.7rem', height: 20 }} 
                              />
                              <Typography sx={{ 
                                fontFamily: 'Vazirmatn, Arial, sans-serif',
                                fontWeight: selectedDetail === detail.id ? 'bold' : 'normal',
                                fontSize: '0.8rem'
                              }}>
                                {detail.name}
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContextMenu(e, 'detail', detail);
                              }}
                              sx={{ p: 0.5, opacity: 0.7, '&:hover': { opacity: 1 } }}
                            >
                              <MoreVert fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>
            بستن
          </Button>
          <Button 
            onClick={handleSelectAccount} 
            variant="contained"
            disabled={!selectedGroup}
          >
            انتخاب حساب
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <MuiDialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          افزودن {addDialogLevel === 'group' ? 'گروه' : addDialogLevel === 'class' ? 'کل' : addDialogLevel === 'subclass' ? 'معین' : 'تفصیلی'} جدید
        </MuiDialogTitle>
        <MuiDialogContent>
          <Box sx={{ pt: 2 }}>
            {addDialogLevel === 'group' && (
              <>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <SimpleCodeInput
                    value={newGroupCode}
                    onChange={setNewGroupCode}
                    maxLength={1}
                    placeholder="1"
                    error={false}
                    helperText="عدد 1 تا 9"
                  />
                  <TextField
                    fullWidth
                    label="نام گروه"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </Box>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                  کد کامل: {newGroupCode}
                </Typography>
              </>
            )}
            
            {addDialogLevel === 'class' && (
              <>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <SimpleCodeInput
                    value={newClassCode}
                    onChange={setNewClassCode}
                    maxLength={1}
                    placeholder="1"
                    error={false}
                    helperText="عدد 1 تا 9"
                  />
                  <TextField
                    fullWidth
                    label="نام کل"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                  />
                </Box>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>ماهیت</InputLabel>
                  <Select
                    value={newClassNature}
                    onChange={(e) => setNewClassNature(e.target.value as any)}
                    label="ماهیت"
                  >
                    <MenuItem value="DEBIT">بدهکار</MenuItem>
                    <MenuItem value="CREDIT">بستانکار</MenuItem>
                    <MenuItem value="DEBIT_CREDIT">بدهکار–بستانکار</MenuItem>
                  </Select>
                </FormControl>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                  کد کامل: {selectedGroup ? getSelectedGroup()?.code + newClassCode : newClassCode}
                </Typography>
              </>
            )}
            
            {addDialogLevel === 'subclass' && (
              <>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <SimpleCodeInput
                    value={newSubClassCode}
                    onChange={setNewSubClassCode}
                    maxLength={2}
                    placeholder="01"
                    error={false}
                    helperText="عدد 01 تا 99"
                  />
                  <TextField
                    fullWidth
                    label="نام معین"
                    value={newSubClassName}
                    onChange={(e) => setNewSubClassName(e.target.value)}
                  />
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={newSubClassHasDetails}
                      onChange={(e) => setNewSubClassHasDetails(e.target.checked)}
                    />
                  }
                  label="تفصیلی دارد"
                />
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                  کد کامل: {selectedClass ? getFullCode(getSelectedClass(), 'class') + newSubClassCode : newSubClassCode}
                </Typography>
              </>
            )}
            
            {addDialogLevel === 'detail' && (
              <>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <SimpleCodeInput
                    value={newDetailCode}
                    onChange={setNewDetailCode}
                    maxLength={2}
                    placeholder="01"
                    error={false}
                    helperText="عدد 01 تا 99"
                  />
                  <TextField
                    fullWidth
                    label="نام تفصیلی"
                    value={newDetailName}
                    onChange={(e) => setNewDetailName(e.target.value)}
                  />
                </Box>
                <TextField
                  fullWidth
                  label="توضیحات"
                  value={newDetailDescription}
                  onChange={(e) => setNewDetailDescription(e.target.value)}
                  multiline
                  rows={3}
                  sx={{ mb: 2 }}
                />
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                  کد کامل: {selectedSubClass ? getFullCode(getSelectedSubClass(), 'subclass') + newDetailCode : newDetailCode}
                </Typography>
              </>
            )}
          </Box>
        </MuiDialogContent>
        <MuiDialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>
            انصراف
          </Button>
          <Button 
            onClick={handleAddItem} 
            variant="contained"
            disabled={
              (addDialogLevel === 'group' && (!newGroupCode.trim() || !newGroupName.trim())) ||
              (addDialogLevel === 'class' && (!newClassName.trim() || !newClassCode.trim())) ||
              (addDialogLevel === 'subclass' && (!newSubClassName.trim() || !newSubClassCode.trim())) ||
              (addDialogLevel === 'detail' && (!newDetailName.trim() || !newDetailCode.trim()))
            }
          >
            افزودن
          </Button>
        </MuiDialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {contextMenu?.type === 'class' && [
          <MenuItem key="edit-class" onClick={() => handleContextMenuAction('edit-class')}>
            ویرایش سرفصل کل
          </MenuItem>,
          <MenuItem key="delete-class" onClick={() => handleContextMenuAction('delete-class')} sx={{ color: 'error.main' }}>
            حذف سرفصل کل
          </MenuItem>
        ]}
        {contextMenu?.type === 'subclass' && [
          <MenuItem key="edit-subclass" onClick={() => handleContextMenuAction('edit-subclass')}>
            ویرایش سرفصل معین
          </MenuItem>,
          <MenuItem key="delete-subclass" onClick={() => handleContextMenuAction('delete-subclass')} sx={{ color: 'error.main' }}>
            حذف سرفصل معین
          </MenuItem>
        ]}
        {contextMenu?.type === 'detail' && [
          <MenuItem key="edit-detail" onClick={() => handleContextMenuAction('edit-detail')}>
            ویرایش تفصیلی
          </MenuItem>,
          <MenuItem key="delete-detail" onClick={() => handleContextMenuAction('delete-detail')} sx={{ color: 'error.main' }}>
            حذف تفصیلی
          </MenuItem>
        ]}
      </Menu>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <MuiDialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          ویرایش {editDialogLevel === 'class' ? 'سرفصل کل' : editDialogLevel === 'subclass' ? 'سرفصل معین' : 'تفصیلی'}
        </MuiDialogTitle>
        <MuiDialogContent>
          <Box sx={{ pt: 2 }}>
            {editDialogLevel === 'class' && (
              <>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <SimpleCodeInput
                    value={newClassCode}
                    onChange={setNewClassCode}
                    maxLength={1}
                    placeholder="1"
                    error={!validateClassCode(newClassCode) && newClassCode.length > 0}
                    helperText="عدد 1 تا 9"
                  />
                  <TextField
                    fullWidth
                    label="نام کل"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                  />
                </Box>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>ماهیت</InputLabel>
                  <Select
                    value={newClassNature}
                    onChange={(e) => setNewClassNature(e.target.value as any)}
                    label="ماهیت"
                  >
                    <MenuItem value="DEBIT">بدهکار</MenuItem>
                    <MenuItem value="CREDIT">بستانکار</MenuItem>
                    <MenuItem value="DEBIT_CREDIT">بدهکار–بستانکار</MenuItem>
                  </Select>
                </FormControl>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                  کد کامل: {selectedGroup ? getSelectedGroup()?.code + newClassCode : newClassCode}
                </Typography>
              </>
            )}
            
            {editDialogLevel === 'subclass' && (
              <>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <SimpleCodeInput
                    value={newSubClassCode}
                    onChange={setNewSubClassCode}
                    maxLength={2}
                    placeholder="01"
                    error={!validateSubClassCode(newSubClassCode) && newSubClassCode.length > 0}
                    helperText="عدد 01 تا 99"
                  />
                  <TextField
                    fullWidth
                    label="نام معین"
                    value={newSubClassName}
                    onChange={(e) => setNewSubClassName(e.target.value)}
                  />
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={newSubClassHasDetails}
                      onChange={(e) => setNewSubClassHasDetails(e.target.checked)}
                    />
                  }
                  label="تفصیلی دارد"
                />
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                  کد کامل: {selectedClass ? getFullCode(getSelectedClass(), 'class') + newSubClassCode : newSubClassCode}
                </Typography>
              </>
            )}
            
            {editDialogLevel === 'detail' && (
              <>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <SimpleCodeInput
                    value={newDetailCode}
                    onChange={setNewDetailCode}
                    maxLength={2}
                    placeholder="01"
                    error={!validateDetailCode(newDetailCode) && newDetailCode.length > 0}
                    helperText="عدد 01 تا 99"
                  />
                  <TextField
                    fullWidth
                    label="نام تفصیلی"
                    value={newDetailName}
                    onChange={(e) => setNewDetailName(e.target.value)}
                  />
                </Box>
                <TextField
                  fullWidth
                  label="توضیحات"
                  value={newDetailDescription}
                  onChange={(e) => setNewDetailDescription(e.target.value)}
                  multiline
                  rows={3}
                  sx={{ mb: 2 }}
                />
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                  کد کامل: {selectedSubClass ? getFullCode(getSelectedSubClass(), 'subclass') + newDetailCode : newDetailCode}
                </Typography>
              </>
            )}
          </Box>
        </MuiDialogContent>
        <MuiDialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            انصراف
          </Button>
          <Button 
            onClick={handleEditItem} 
            variant="contained"
            disabled={
              (editDialogLevel === 'class' && (!newClassName.trim() || !newClassCode.trim())) ||
              (editDialogLevel === 'subclass' && (!newSubClassName.trim() || !newSubClassCode.trim())) ||
              (editDialogLevel === 'detail' && (!newDetailName.trim() || !newDetailCode.trim()))
            }
          >
            ویرایش
          </Button>
        </MuiDialogActions>
      </Dialog>
    </>
  );
}
