"use client";
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Divider,
  Menu,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  AccountTree,
  MoreVert,
  CloudDownload,
  ImportExport,
  Lock,
  LockOpen,
  DragIndicator,
  Upload
} from '@mui/icons-material';
import ImportCodingModal from './ImportCodingModal';

interface Project {
  id: string;
  name: string;
  description?: string;
}

interface AccountGroup {
  id: string;
  code: string;
  name: string;
  isDefault: boolean;
  isProtected: boolean;
  sortOrder: number;
  classes: AccountClass[];
}

interface AccountClass {
  id: string;
  code: string;
  name: string;
  nature: 'DEBIT' | 'CREDIT' | 'DEBIT_CREDIT';
  isDefault: boolean;
  isProtected: boolean;
  sortOrder: number;
  subClasses: AccountSubClass[];
}

interface AccountSubClass {
  id: string;
  code: string;
  name: string;
  hasDetails: boolean;
  isDefault: boolean;
  isProtected: boolean;
  sortOrder: number;
  details: AccountDetail[];
}

interface AccountDetail {
  id: string;
  code: string;
  name: string;
  description?: string;
  userId?: string;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    username: string;
  };
  isDefault: boolean;
  isProtected: boolean;
  sortOrder: number;
}

interface HierarchicalCodingDefinitionProps {
  projectId: string;
  fiscalYearId?: string;
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
    // Only allow numbers and limit length
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

export default function HierarchicalCodingDefinition({ projectId, fiscalYearId }: HierarchicalCodingDefinitionProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [groups, setGroups] = useState<AccountGroup[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Toast notification state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('info');

  // Selection states
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubClass, setSelectedSubClass] = useState<string>('');
  const [selectedDetail, setSelectedDetail] = useState<string>('');
  
  // All groups view state
  const [showAllGroups, setShowAllGroups] = useState<boolean>(false);

  // Form states
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
  const [newDetailUserId, setNewDetailUserId] = useState('');

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogLevel, setAddDialogLevel] = useState<'group' | 'class' | 'subclass' | 'detail'>('group');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogLevel, setEditDialogLevel] = useState<'group' | 'class' | 'subclass' | 'detail'>('group');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Context menu states
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    type: 'group' | 'class' | 'subclass' | 'detail';
    item?: any;
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Global lock state - groups are locked by default
  const [isGlobalLocked, setIsGlobalLocked] = useState(true);
  
  // Force re-render when groups change
  const [dragKey, setDragKey] = useState(0);
  
  useEffect(() => {
    // Force re-render of drag context when groups change
    setDragKey(prev => prev + 1);
  }, [groups]);
  
  // Helper functions for code generation
  const getNextGroupCode = () => {
    if (groups.length === 0) return '1';
    const maxCode = Math.max(...groups.map(g => parseInt(g.code)));
    return String(maxCode + 1 > 9 ? 9 : maxCode + 1);
  };

  const getNextClassCode = () => {
    if (!selectedGroup) return '1';
    const group = groups.find(g => g.id === selectedGroup);
    if (!group || group.classes.length === 0) return '1';
    
    const maxCode = Math.max(...group.classes.map(c => parseInt(c.code)));
    return String(maxCode + 1 > 9 ? 9 : maxCode + 1);
  };

  const getNextSubClassCode = () => {
    if (!selectedClass) return '01';
    const accountClass = getSelectedClass();
    if (!accountClass || accountClass.subClasses.length === 0) return '01';
    
    const maxCode = Math.max(...accountClass.subClasses.map(s => {
      return parseInt(s.code);
    }));
    return String(maxCode + 1).padStart(2, '0');
  };

  const getNextDetailCode = () => {
    if (!selectedSubClass) return '01';
    const subClass = getSelectedSubClass();
    if (!subClass || subClass.details.length === 0) return '01';
    
    const maxCode = Math.max(...subClass.details.map(d => {
      return parseInt(d.code);
    }));
    return String(maxCode + 1).padStart(2, '0');
  };

  // Toast notification helper
  const showToast = (message: string, severity: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const handleImportSuccess = () => {
    fetchCodingData(); // Refresh data after import
    setImportModalOpen(false);
    showToast('کدینگ با موفقیت ایمپورت شد', 'success');
  };

  useEffect(() => {
    fetchProject();
    fetchCodingData();
    fetchUsers();
  }, [projectId, fiscalYearId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error('خطا در دریافت پروژه');
      const data = await response.json();
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      setError('خطا در دریافت اطلاعات پروژه');
    }
  };

  const fetchCodingData = async () => {
    try {
      setLoadingData(true);
      setError('');
      const url = fiscalYearId 
        ? `/api/accounting/coding/groups?projectId=${projectId}&fiscalYearId=${fiscalYearId}`
        : `/api/accounting/coding/groups?projectId=${projectId}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'خطا در دریافت کدینگ' }));
        throw new Error(errorData.error || 'خطا در دریافت کدینگ');
      }
      const data = await response.json();
      
      // Do not auto-initialize groups; show empty state
      // Ensure all groups are protected by default
      const groupsWithProtection = (data || []).map(group => ({
        ...group,
        isProtected: group.isProtected !== undefined ? group.isProtected : true
      }));
      setGroups(groupsWithProtection);
    } catch (error) {
      console.error('Error fetching coding data:', error);
      setError(error instanceof Error ? error.message : 'خطا در دریافت اطلاعات کدینگ');
      setGroups([]);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('خطا در دریافت کاربران');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('خطا در دریافت اطلاعات کاربران');
    }
  };

  // Validation functions
  const validateGroupCode = (code: string) => {
    const num = parseInt(code);
    return num >= 1 && num <= 9 && code.length === 1;
  };

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
        if (!validateGroupCode(newGroupCode)) {
          setError('کد گروه باید بین 1 تا 9 باشد');
          return;
        }
        console.log('Creating group with data:', {
          projectId,
          code: newGroupCode.trim(),
          name: newGroupName.trim()
        });
        
        response = await fetch('/api/accounting/coding/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            fiscalYearId,
            code: newGroupCode.trim(),
            name: newGroupName.trim()
          })
        });
        
        console.log('Group creation response:', response.status, response.statusText);
      } else if (addDialogLevel === 'class') {
        if (!selectedGroup || !newClassName.trim() || !newClassCode.trim()) {
          setError('لطفاً ابتدا یک گروه انتخاب کنید و اطلاعات کل را وارد کنید');
          return;
        }
        if (!validateClassCode(newClassCode)) {
          setError('کد کل باید بین 1 تا 9 باشد');
          return;
        }
        const group = groups.find(g => g.id === selectedGroup);
        const fullClassCode = group ? group.code + newClassCode : newClassCode;
        
        console.log('Checking for duplicate codes:', {
          groupCode: group?.code,
          newClassCode,
          fullClassCode,
          existingClassCodes: group?.classes.map(c => c.code)
        });
        
        // Check if code already exists (compare class codes only)
        const existingClass = group?.classes.find(c => c.code === newClassCode);
        if (existingClass) {
          console.log('Duplicate code found:', {
            existingClassCode: existingClass.code,
            newClassCode: newClassCode,
            existingClass: existingClass
          });
          setError('کد کل تکراری است');
          return;
        }
        
        const requestData = {
          projectId,
          fiscalYearId,
          groupId: selectedGroup,
          name: newClassName.trim(),
          nature: newClassNature,
          code: newClassCode  // Send only the class part, not the full code
        };
        console.log('Sending class creation request:', requestData);
        
        response = await fetch('/api/accounting/coding/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        });
      } else if (addDialogLevel === 'subclass') {
        if (!selectedClass || !newSubClassName.trim() || !newSubClassCode.trim()) return;
        if (!validateSubClassCode(newSubClassCode)) {
          setError('کد معین باید بین 01 تا 99 باشد');
          return;
        }
        const accountClass = getSelectedClass();
        const fullSubClassCode = accountClass ? accountClass.code + newSubClassCode : newSubClassCode;
        
        // Check if code already exists (compare subclass codes only)
        const existingSubClass = accountClass?.subClasses.find(s => s.code === newSubClassCode);
        if (existingSubClass) {
          setError('کد معین تکراری است');
          return;
        }
        
        response = await fetch('/api/accounting/coding/subclasses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            fiscalYearId,
            classId: selectedClass,
            name: newSubClassName.trim(),
            hasDetails: newSubClassHasDetails,
            code: newSubClassCode  // Send only the subclass part, not the full code
          })
        });
      } else if (addDialogLevel === 'detail') {
        if (!selectedSubClass || !newDetailName.trim() || !newDetailCode.trim()) return;
        if (!validateDetailCode(newDetailCode)) {
          setError('کد تفصیلی باید بین 01 تا 99 باشد');
          return;
        }
        const subClass = getSelectedSubClass();
        const fullDetailCode = subClass ? subClass.code + newDetailCode : newDetailCode;
        
        // Check if code already exists (compare detail codes only)
        const existingDetail = subClass?.details.find(d => d.code === newDetailCode);
        if (existingDetail) {
          setError('کد تفصیلی تکراری است');
          return;
        }
        
        response = await fetch('/api/accounting/coding/details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            fiscalYearId,
            subClassId: selectedSubClass,
            name: newDetailName.trim(),
            description: newDetailDescription.trim() || undefined,
            code: newDetailCode,  // Send only the detail part, not the full code
            userId: newDetailUserId && newDetailUserId.trim() !== '' ? newDetailUserId : null
          })
        });
      }

      if (!response?.ok) {
        const errorData = await response?.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || errorData.details || 'خطا در افزودن آیتم');
      }

      // Reset form
      setNewGroupCode('');
      setNewGroupName('');
      setNewClassName('');
      setNewClassCode('');
      setNewSubClassName('');
      setNewSubClassCode('');
      setNewDetailName('');
      setNewDetailCode('');
      setNewDetailDescription('');
      setNewDetailUserId('');
      setAddDialogOpen(false);
      showToast('آیتم جدید با موفقیت اضافه شد', 'success');
      fetchCodingData();
    } catch (error) {
      console.error('Error adding item:', error);
      showToast(error instanceof Error ? error.message : 'خطا در افزودن آیتم', 'error');
    }
  };

  const openAddDialog = (level: 'group' | 'class' | 'subclass' | 'detail') => {
    setAddDialogLevel(level);
    
    // Reset form
    setNewGroupCode('');
    setNewGroupName('');
    setNewClassName('');
    setNewClassCode('');
    setNewSubClassName('');
    setNewSubClassCode('');
    setNewDetailName('');
    setNewDetailCode('');
    setNewDetailDescription('');
    setNewDetailUserId('');
    
    // Generate suggested codes
    if (level === 'group') {
      setNewGroupCode(getNextGroupCode());
    } else if (level === 'class' && selectedGroup) {
      setNewClassCode(getNextClassCode());
    } else if (level === 'subclass' && selectedClass) {
      setNewSubClassCode(getNextSubClassCode());
    } else if (level === 'detail' && selectedSubClass) {
      setNewDetailCode(getNextDetailCode());
    }
    
    setAddDialogOpen(true);
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

  // Helper functions for "All Groups" view
  const getAllClasses = () => {
    if (!showAllGroups) return [];
    return groups.flatMap(group => 
      group.classes.map(accountClass => ({
        ...accountClass,
        groupCode: group.code,
        groupName: group.name
      }))
    );
  };

  const getAllSubClasses = () => {
    if (!showAllGroups) return [];
    return groups.flatMap(group => 
      group.classes.flatMap(accountClass => 
        accountClass.subClasses.map(subClass => ({
          ...subClass,
          groupCode: group.code,
          groupName: group.name,
          classCode: accountClass.code,
          className: accountClass.name
        }))
      )
    );
  };

  const getAllDetails = () => {
    if (!showAllGroups) return [];
    const allDetails = groups.flatMap(group => 
      group.classes.flatMap(accountClass => 
        accountClass.subClasses.flatMap(subClass => 
          subClass.details.map(detail => ({
            ...detail,
            groupCode: group.code,
            groupName: group.name,
            classCode: accountClass.code,
            className: accountClass.name,
            subClassCode: subClass.code,
            subClassName: subClass.name
          }))
        )
      )
    );
    
    return allDetails;
  };

  // Helper function to get full code for display
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

  // Context menu handlers
  const handleContextMenu = (event: React.MouseEvent, type: 'group' | 'class' | 'subclass' | 'detail', item: any) => {
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
      case 'edit-group':
        if (contextMenu.item) openEditDialog('group', contextMenu.item);
        break;
      case 'edit-class':
        if (contextMenu.item) openEditDialog('class', contextMenu.item);
        break;
      case 'edit-subclass':
        if (contextMenu.item) openEditDialog('subclass', contextMenu.item);
        break;
      case 'edit-detail':
        if (contextMenu.item) openEditDialog('detail', contextMenu.item);
        break;
      case 'delete-group':
        if (contextMenu.item) handleDeleteItem('group', contextMenu.item.id);
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

  const openEditDialog = (level: 'group' | 'class' | 'subclass' | 'detail', item: any) => {
    setEditDialogLevel(level as any);
    setEditingItem(item);
    
    // Initialize form values with current item data
    if (level === 'group') {
      setNewGroupName(item.name);
      setNewGroupCode(item.code);
    } else if (level === 'class') {
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
      setNewDetailUserId(item.userId || '');
    }
    
    setEditDialogOpen(true);
  };

  const handleDeleteItem = async (level: 'group' | 'class' | 'subclass' | 'detail', itemId: string) => {
    try {
      let endpoint = '';
      if (level === 'group') endpoint = `/api/accounting/coding/groups?id=${itemId}`;
      else if (level === 'class') endpoint = `/api/accounting/coding/classes?id=${itemId}`;
      else if (level === 'subclass') endpoint = `/api/accounting/coding/subclasses?id=${itemId}`;
      else if (level === 'detail') endpoint = `/api/accounting/coding/details?id=${itemId}`;

      const response = await fetch(endpoint, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در حذف آیتم');
      }

      showToast('آیتم با موفقیت حذف شد', 'success');
      fetchCodingData();
    } catch (error) {
      console.error('Error deleting item:', error);
      showToast(error instanceof Error ? error.message : 'خطا در حذف آیتم', 'error');
    }
  };

  const handleEditItem = async () => {
    if (!editingItem) return;

    try {
      let endpoint = '';
      let body: any = {};

      if (editDialogLevel === 'group') {
        if (!validateGroupCode(newGroupCode)) {
          setError('کد گروه باید بین 1 تا 9 باشد');
          return;
        }
        
        endpoint = `/api/accounting/coding/groups?id=${editingItem.id}`;
        body = {
          name: newGroupName.trim(),
          code: newGroupCode
        };
      } else if (editDialogLevel === 'class') {
        const group = groups.find(g => g.id === selectedGroup);
        
        if (!validateClassCode(newClassCode)) {
          setError('کد کل باید بین 1 تا 9 باشد');
          return;
        }
        
        endpoint = `/api/accounting/coding/classes?id=${editingItem.id}`;
        body = {
          name: newClassName.trim(),
          nature: newClassNature,
          code: newClassCode  // Send only the class part, not the full code
        };
      } else if (editDialogLevel === 'subclass') {
        const accountClass = getSelectedClass();
        
        if (!validateSubClassCode(newSubClassCode)) {
          setError('کد معین باید بین 01 تا 99 باشد');
          return;
        }
        
        endpoint = `/api/accounting/coding/subclasses?id=${editingItem.id}`;
        body = {
          name: newSubClassName.trim(),
          hasDetails: newSubClassHasDetails,
          code: newSubClassCode  // Send only the subclass part, not the full code
        };
      } else if (editDialogLevel === 'detail') {
        const subClass = getSelectedSubClass();
        
        if (!validateDetailCode(newDetailCode)) {
          setError('کد تفصیلی باید بین 01 تا 99 باشد');
          return;
        }
        
        endpoint = `/api/accounting/coding/details?id=${editingItem.id}`;
        body = {
          name: newDetailName.trim(),
          description: newDetailDescription.trim() || undefined,
          code: newDetailCode,  // Send only the detail part, not the full code
          userId: newDetailUserId && newDetailUserId.trim() !== '' ? newDetailUserId : null
        };
      }

        console.log('Sending edit request:', { endpoint, body });
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Edit API Error:', errorData);
        throw new Error(errorData.error || errorData.details || 'خطا در ویرایش آیتم');
      }

      setEditDialogOpen(false);
      setEditingItem(null);
      setNewClassName('');
      setNewSubClassName('');
      setNewDetailName('');
      setNewDetailDescription('');
      setNewDetailUserId('');
      showToast('آیتم با موفقیت ویرایش شد', 'success');
      fetchCodingData();
    } catch (error) {
      console.error('Error editing item:', error);
      showToast(error instanceof Error ? error.message : 'خطا در ویرایش آیتم', 'error');
    }
  };

  const handleDeleteAllCoding = async () => {
    try {
      setDeleting(true);
      const deleteUrl = fiscalYearId 
        ? `/api/accounting/coding/groups?projectId=${projectId}&fiscalYearId=${fiscalYearId}`
        : `/api/accounting/coding/groups?projectId=${projectId}`;
      const res = await fetch(deleteUrl, { method: 'DELETE' });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || 'خطا در حذف کدینگ');
      }
      setDeleteDialogOpen(false);
      fetchCodingData(); // Refresh data
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا در حذف کدینگ');
    } finally {
      setDeleting(false);
    }
  };

  const handleImportDefault = async () => {
    try {
      setLoadingData(true);
      const response = await fetch('/api/accounting/coding/import-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, fiscalYearId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در ایمپورت کدینگ پیش فرض');
      }

      showToast('کدینگ پیش فرض با موفقیت ایمپورت شد', 'success');
      fetchCodingData();
    } catch (error) {
      console.error('Error importing default coding:', error);
      setError(error instanceof Error ? error.message : 'خطا در ایمپورت کدینگ پیش فرض');
    } finally {
      setLoadingData(false);
    }
  };


  // HTML5 Drag and Drop handlers
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isGlobalLocked) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (isGlobalLocked || draggedIndex === null || draggedIndex === dropIndex || showAllGroups) {
      setDraggedIndex(null);
      return;
    }

    try {
      // Create new order
      const newGroups = Array.from(groups);
      const [reorderedItem] = newGroups.splice(draggedIndex, 1);
      newGroups.splice(dropIndex, 0, reorderedItem);

      // Update sort order and codes based on new positions
      const updatedGroups = newGroups.map((group, index) => ({
        ...group,
        sortOrder: index + 1,
        code: String(index + 1)
      }));

      // Update groups in state immediately for better UX
      setGroups(updatedGroups);

      // Send update to server
      const response = await fetch('/api/accounting/coding/groups/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          fiscalYearId,
          groups: updatedGroups.map(g => ({
            id: g.id,
            sortOrder: g.sortOrder,
            code: g.code
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در به‌روزرسانی ترتیب گروه‌ها');
      }

      showToast('ترتیب گروه‌ها با موفقیت به‌روزرسانی شد', 'success');
    } catch (error) {
      console.error('Error reordering groups:', error);
      showToast(error instanceof Error ? error.message : 'خطا در تغییر ترتیب گروه‌ها', 'error');
      // Revert to original order
      fetchCodingData();
    } finally {
      setDraggedIndex(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleToggleGlobalLock = async () => {
    try {
      const newLockState = !isGlobalLocked;
      
      // Update all groups' protection status
      const updatePromises = groups.map(group => 
        fetch(`/api/accounting/coding/groups?id=${group.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: group.code,
            name: group.name,
            isDefault: group.isDefault,
            isProtected: newLockState
          })
        })
      );

      await Promise.all(updatePromises);
      
      setIsGlobalLocked(newLockState);
      showToast(`همه گروه‌ها ${newLockState ? 'قفل شدند' : 'باز شدند'}`, 'success');
      fetchCodingData();
    } catch (error) {
      console.error('Error toggling global lock:', error);
      showToast('خطا در تغییر وضعیت قفل همه گروه‌ها', 'error');
    }
  };


  if (loadingData || !project) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ 
          fontFamily: 'Vazirmatn, Arial, sans-serif',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 0
        }}>
          <AccountTree color="primary" />
          تعریف کدینگ حسابداری
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<CloudDownload />}
            onClick={handleImportDefault}
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            ایمپورت کدینگ پیش فرض
          </Button>
          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={() => setImportModalOpen(true)}
            color="info"
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            ایمپورت از پروژه دیگر
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => setDeleteDialogOpen(true)}
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            حذف تمام کدینگ
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        
      </Box>

      {/* Hierarchical Selection Grid */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {/* Group Column */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ height: '700px' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1" sx={{ 
                  fontFamily: 'Vazirmatn, Arial, sans-serif',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}>
                  گروه
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Tooltip title={isGlobalLocked ? "باز کردن قفل همه گروه‌ها" : "قفل کردن همه گروه‌ها"}>
                    <IconButton 
                      size="small" 
                      onClick={handleToggleGlobalLock}
                      sx={{ p: 0.5 }}
                    >
                      {isGlobalLocked ? <LockOpen fontSize="small" color="warning" /> : <Lock fontSize="small" color="primary" />}
                    </IconButton>
                  </Tooltip>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => openAddDialog('group')}
                    disabled={isGlobalLocked}
                    sx={{ p: 0.5 }}
                  >
                    <Add fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              
              <Box sx={{ flex: 1 }}>
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
                  <Box sx={{ height: 600, width: '100%' }}>
                    {groups.map((group, index) => (
                      <Box
                        key={group.id}
                        draggable={!isGlobalLocked}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        onClick={() => {
                          setSelectedGroup(group.id);
                          setSelectedClass('');
                          setSelectedSubClass('');
                          setSelectedDetail('');
                          setShowAllGroups(false);
                        }}
                        onContextMenu={(e) => handleContextMenu(e, 'group', group)}
                        sx={{
                          p: 1,
                          mb: 0.5,
                          border: selectedGroup === group.id ? '2px solid' : '1px solid',
                          borderColor: selectedGroup === group.id ? 'primary.main' : 'divider',
                          borderRadius: 1,
                          cursor: isGlobalLocked ? 'default' : 'pointer',
                          bgcolor: selectedGroup === group.id ? 'primary.light' : 'transparent',
                          opacity: draggedIndex === index ? 0.5 : 1,
                          transform: draggedIndex === index ? 'rotate(5deg)' : 'none',
                          boxShadow: draggedIndex === index ? 3 : 0,
                          '&:hover': {
                            bgcolor: selectedGroup === group.id ? 'primary.light' : 'action.hover'
                          },
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          position: 'relative'
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={0.5} sx={{ flex: 1 }}>
                          {!isGlobalLocked && (
                            <DragIndicator 
                              fontSize="small" 
                              sx={{ 
                                color: 'grey.400', 
                                cursor: 'grab',
                                '&:active': { cursor: 'grabbing' }
                              }} 
                            />
                          )}
                          <Chip 
                            label={group.code} 
                            size="small" 
                            color="primary" 
                            sx={{ fontSize: '0.7rem', height: 20 }} 
                          />
                          <Typography sx={{ 
                            fontFamily: 'Vazirmatn, Arial, sans-serif',
                            fontWeight: selectedGroup === group.id ? 'bold' : 'normal',
                            fontSize: '0.8rem',
                            flex: 1
                          }}>
                            {group.name}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Tooltip title={isGlobalLocked ? "همه گروه‌ها قفل هستند" : "همه گروه‌ها باز هستند"}>
                            <Box sx={{ p: 0.5, opacity: 0.7 }}>
                              {isGlobalLocked ? <Lock fontSize="small" color="warning" /> : <LockOpen fontSize="small" color="success" />}
                            </Box>
                          </Tooltip>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContextMenu(e, 'group', group);
                            }}
                            sx={{ p: 0.5, opacity: 0.7, '&:hover': { opacity: 1 } }}
                          >
                            <MoreVert fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                    
                    {/* All Groups Option */}
                    <Box
                      onClick={() => {
                        setShowAllGroups(true);
                        setSelectedGroup('');
                        setSelectedClass('');
                        setSelectedSubClass('');
                        setSelectedDetail('');
                      }}
                      sx={{
                        p: 1,
                        mt: 1,
                        border: showAllGroups ? '2px solid' : '1px solid',
                        borderColor: showAllGroups ? 'primary.main' : 'divider',
                        borderRadius: 1,
                        cursor: 'pointer',
                        bgcolor: showAllGroups ? 'primary.light' : 'transparent',
                        '&:hover': {
                          bgcolor: showAllGroups ? 'primary.light' : 'action.hover'
                        },
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '2px solid',
                        borderTopColor: 'divider',
                        position: 'relative'
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={0.5} sx={{ flex: 1 }}>
                        <Chip 
                          label="همه" 
                          size="small" 
                          color="info" 
                          sx={{ fontSize: '0.7rem', height: 20 }} 
                        />
                        <Typography sx={{ 
                          fontFamily: 'Vazirmatn, Arial, sans-serif',
                          fontWeight: showAllGroups ? 'bold' : 'normal',
                          fontSize: '0.8rem',
                          flex: 1
                        }}>
                          همه گروه‌ها
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Class Column */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ height: '700px' }}>
            <CardContent 
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
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
                {showAllGroups ? (
                  <Box>
                    {getAllClasses().map((accountClass) => (
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
                            label={`${accountClass.groupCode}${accountClass.code}`} 
                            size="small" 
                            color="secondary" 
                            sx={{ fontSize: '0.7rem', height: 20 }} 
                          />
                          <Box>
                            <Typography sx={{ 
                              fontFamily: 'Vazirmatn, Arial, sans-serif',
                              fontWeight: selectedClass === accountClass.id ? 'bold' : 'normal',
                              fontSize: '0.8rem'
                            }}>
                              {accountClass.name}
                            </Typography>
                            <Typography sx={{ 
                              fontFamily: 'Vazirmatn, Arial, sans-serif',
                              fontSize: '0.7rem',
                              color: 'text.secondary'
                            }}>
                              {accountClass.groupName}
                            </Typography>
                          </Box>
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
                ) : !selectedGroup ? (
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
          <Card sx={{ height: '700px' }}>
            <CardContent 
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
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
                {showAllGroups ? (
                  <Box>
                    {getAllSubClasses().map((subClass) => (
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
                            label={`${subClass.groupCode}${subClass.classCode}${subClass.code}`} 
                            size="small" 
                            color="success" 
                            sx={{ fontSize: '0.7rem', height: 20 }} 
                          />
                          <Box>
                            <Typography sx={{ 
                              fontFamily: 'Vazirmatn, Arial, sans-serif',
                              fontWeight: selectedSubClass === subClass.id ? 'bold' : 'normal',
                              fontSize: '0.8rem'
                            }}>
                              {subClass.name}
                            </Typography>
                            <Typography sx={{ 
                              fontFamily: 'Vazirmatn, Arial, sans-serif',
                              fontSize: '0.7rem',
                              color: 'text.secondary'
                            }}>
                              {subClass.groupName} - {subClass.className}
                            </Typography>
                          </Box>
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
                ) : !selectedClass ? (
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
          <Card sx={{ height: '700px' }}>
            <CardContent 
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
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
                {showAllGroups ? (
                  <Box>
                    {getAllDetails().map((detail) => (
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
                            label={`${detail.groupCode}${detail.classCode}${detail.subClassCode}${detail.code}`} 
                            size="small" 
                            color="warning" 
                            sx={{ fontSize: '0.7rem', height: 20 }} 
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ 
                              fontFamily: 'Vazirmatn, Arial, sans-serif',
                              fontWeight: selectedDetail === detail.id ? 'bold' : 'normal',
                              fontSize: '0.8rem'
                            }}>
                              {detail.name}
                              {detail.user && (
                                <span style={{ color: '#666', fontSize: '0.7rem' }}>
                                  {' '}({detail.user.firstName && detail.user.lastName 
                                    ? `${detail.user.firstName} ${detail.user.lastName}`
                                    : detail.user.username
                                  })
                                </span>
                              )}
                            </Typography>
                            <Typography sx={{ 
                              fontFamily: 'Vazirmatn, Arial, sans-serif',
                              fontSize: '0.7rem',
                              color: 'text.secondary'
                            }}>
                              {detail.groupName} - {detail.className} - {detail.subClassName}
                            </Typography>
                          </Box>
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
                ) : !selectedSubClass ? (
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
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ 
                              fontFamily: 'Vazirmatn, Arial, sans-serif',
                              fontWeight: selectedDetail === detail.id ? 'bold' : 'normal',
                              fontSize: '0.8rem'
                            }}>
                              {detail.name}
                              {detail.user && (
                                <span style={{ color: '#666', fontSize: '0.7rem' }}>
                                  {' '}({detail.user.firstName && detail.user.lastName 
                                    ? `${detail.user.firstName} ${detail.user.lastName}`
                                    : detail.user.username
                                  })
                                </span>
                              )}
                            </Typography>
                          </Box>
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


      {/* Add Item Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          افزودن {addDialogLevel === 'group' ? 'گروه' : addDialogLevel === 'class' ? 'کل' : addDialogLevel === 'subclass' ? 'معین' : 'تفصیلی'} جدید
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {addDialogLevel === 'group' && (
              <>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <SimpleCodeInput
                    value={newGroupCode}
                    onChange={setNewGroupCode}
                    maxLength={1}
                    placeholder="1"
                    error={!validateGroupCode(newGroupCode) && newGroupCode.length > 0}
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
            
            {addDialogLevel === 'subclass' && (
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
            
            {addDialogLevel === 'detail' && (
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
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>کاربر مرتبط (اختیاری)</InputLabel>
                  <Select
                    value={newDetailUserId}
                    onChange={(e) => setNewDetailUserId(e.target.value)}
                    label="کاربر مرتبط (اختیاری)"
                  >
                    <MenuItem value="">
                      <em>هیچ کاربری انتخاب نشده</em>
                    </MenuItem>
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName} (${user.username})`
                          : user.username
                        }
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                  کد کامل: {selectedSubClass ? getFullCode(getSelectedSubClass(), 'subclass') + newDetailCode : newDetailCode}
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
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
        </DialogActions>
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
        {contextMenu?.type === 'group' && [
          !isGlobalLocked && (
            <MenuItem key="edit-group" onClick={() => handleContextMenuAction('edit-group')}>
              ویرایش گروه
            </MenuItem>
          ),
          !isGlobalLocked && (
            <MenuItem key="delete-group" onClick={() => handleContextMenuAction('delete-group')} sx={{ color: 'error.main' }}>
              حذف گروه
            </MenuItem>
          ),
          isGlobalLocked && (
            <MenuItem key="locked-message" disabled sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              گروه‌ها قفل هستند - ابتدا قفل را باز کنید
            </MenuItem>
          )
        ]}
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
        <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          ویرایش {editDialogLevel === 'group' ? 'گروه' : editDialogLevel === 'class' ? 'سرفصل کل' : editDialogLevel === 'subclass' ? 'سرفصل معین' : 'تفصیلی'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {editDialogLevel === 'group' && (
              <>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <SimpleCodeInput
                    value={newGroupCode}
                    onChange={setNewGroupCode}
                    maxLength={1}
                    placeholder="1"
                    error={!validateGroupCode(newGroupCode) && newGroupCode.length > 0}
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
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>کاربر مرتبط (اختیاری)</InputLabel>
                  <Select
                    value={newDetailUserId}
                    onChange={(e) => setNewDetailUserId(e.target.value)}
                    label="کاربر مرتبط (اختیاری)"
                  >
                    <MenuItem value="">
                      <em>هیچ کاربری انتخاب نشده</em>
                    </MenuItem>
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName} (${user.username})`
                          : user.username
                        }
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                  کد کامل: {selectedSubClass ? getFullCode(getSelectedSubClass(), 'subclass') + newDetailCode : newDetailCode}
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            انصراف
          </Button>
          <Button 
            onClick={handleEditItem} 
            variant="contained"
            disabled={
              (editDialogLevel === 'group' && (!newGroupName.trim() || !newGroupCode.trim())) ||
              (editDialogLevel === 'class' && (!newClassName.trim() || !newClassCode.trim())) ||
              (editDialogLevel === 'subclass' && (!newSubClassName.trim() || !newSubClassCode.trim())) ||
              (editDialogLevel === 'detail' && (!newDetailName.trim() || !newDetailCode.trim()))
            }
          >
            ویرایش
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete All Coding Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          حذف تمام کدینگ
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', mb: 2 }}>
            آیا مطمئن هستید که می‌خواهید تمام گروه‌ها، کل‌ها، معین‌ها و تفصیلی‌های این پروژه را حذف کنید؟
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            هشدار: این عمل غیرقابل بازگشت است و تمام ساختار کدینگ پاک می‌شود.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            انصراف
          </Button>
          <Button 
            onClick={handleDeleteAllCoding} 
            variant="contained" 
            color="error"
            disabled={deleting}
          >
            {deleting ? 'در حال حذف...' : 'حذف'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notifications */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={() => setToastOpen(false)} 
          severity={toastSeverity}
          sx={{ width: '100%' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>

      {/* Import Coding Modal */}
      <ImportCodingModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        targetProjectId={projectId}
        targetFiscalYearId={fiscalYearId || ''}
        onImportSuccess={handleImportSuccess}
      />
    </Box>
  );
}
