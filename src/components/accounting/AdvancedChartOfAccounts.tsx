"use client";
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
  Grid,
  Paper,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  ListItemButton,
  ListItemIcon as MuiListItemIcon,
  ListItemText as MuiListItemText,
  InputAdornment,
  Checkbox
} from '@mui/material';
import { TreeView, TreeItem } from '@mui/lab';
import ImportCodingModal from './ImportCodingModal';
import {
  Add,
  Edit,
  Delete,
  ExpandMore,
  ChevronRight,
  AccountBalance,
  AccountTree,
  Save,
  Cancel,
  Visibility,
  VisibilityOff,
  Folder,
  FolderOpen,
  Receipt,
  DragIndicator,
  MoreVert,
  Check,
  Close,
  FileDownload,
  Upload
} from '@mui/icons-material';

interface Account {
  id: string;
  name: string;
  code: string;
  type: string;
  level: number;
  parentId?: string;
  parent?: Account;
  children?: Account[];
  contact?: string;
  description?: string;
  isActive: boolean;
  isExpanded?: boolean;
  _count?: {
    transactions: number;
    invoices: number;
    bills: number;
  };
}

interface AccountType {
  code: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

const ACCOUNT_TYPES: AccountType[] = [
  { code: 'ASSET', name: 'دارایی', description: 'دارایی‌های شرکت', color: 'success', icon: '💰' },
  { code: 'LIABILITY', name: 'بدهی', description: 'بدهی‌های شرکت', color: 'error', icon: '📋' },
  { code: 'EQUITY', name: 'سرمایه', description: 'سرمایه و حقوق صاحبان سهام', color: 'primary', icon: '🏛️' },
  { code: 'INCOME', name: 'درآمد', description: 'درآمدهای شرکت', color: 'info', icon: '📈' },
  { code: 'EXPENSE', name: 'هزینه', description: 'هزینه‌های شرکت', color: 'warning', icon: '📉' },
  { code: 'CUSTOMER', name: 'مشتری', description: 'حساب‌های مشتریان', color: 'secondary', icon: '👥' },
  { code: 'CONTRACTOR', name: 'پیمانکار', description: 'حساب‌های پیمانکاران', color: 'info', icon: '👷' },
  { code: 'SUPPLIER', name: 'تأمین‌کننده', description: 'حساب‌های تأمین‌کنندگان', color: 'warning', icon: '🚚' }
];

const DEFAULT_CODING_STRUCTURE = [
  {
    name: 'دارایی‌ها',
    code: '100',
    type: 'ASSET',
    level: 1,
    children: [
      {
        name: 'صندوق',
        code: '101',
        type: 'ASSET',
        level: 2
      },
      {
        name: 'بانک',
        code: '102',
        type: 'ASSET',
        level: 2,
        children: [
          { name: 'بانک ملی', code: '10201', type: 'ASSET', level: 3 },
          { name: 'بانک ملت', code: '10202', type: 'ASSET', level: 3 },
          { name: 'بانک صادرات', code: '10203', type: 'ASSET', level: 3 }
        ]
      },
      {
        name: 'حساب‌های دریافتنی',
        code: '103',
        type: 'ASSET',
        level: 2,
        children: [
          { name: 'مشتریان پروژه X', code: '10301', type: 'CUSTOMER', level: 3 },
          { name: 'مشتریان پروژه Y', code: '10302', type: 'CUSTOMER', level: 3 },
          { name: 'مشتریان پروژه Z', code: '10303', type: 'CUSTOMER', level: 3 }
        ]
      },
      {
        name: 'پیش‌پرداخت‌ها',
        code: '104',
        type: 'ASSET',
        level: 2,
        children: [
          { name: 'پیش‌پرداخت مصالح', code: '10401', type: 'ASSET', level: 3 },
          { name: 'پیش‌پرداخت پیمانکاران', code: '10402', type: 'CONTRACTOR', level: 3 }
        ]
      },
      {
        name: 'موجودی مصالح و کالا',
        code: '105',
        type: 'ASSET',
        level: 2,
        children: [
          { name: 'مصالح پروژه X', code: '10501', type: 'ASSET', level: 3 },
          { name: 'مصالح پروژه Y', code: '10502', type: 'ASSET', level: 3 }
        ]
      },
      {
        name: 'دارایی ثابت',
        code: '106',
        type: 'ASSET',
        level: 2,
        children: [
          { name: 'تجهیزات پروژه', code: '10601', type: 'ASSET', level: 3 },
          { name: 'وسایل اداری', code: '10602', type: 'ASSET', level: 3 },
          { name: 'ماشین‌آلات کارگاهی', code: '10603', type: 'ASSET', level: 3 }
        ]
      }
    ]
  },
  {
    name: 'بدهی‌ها',
    code: '200',
    type: 'LIABILITY',
    level: 1,
    children: [
      {
        name: 'بدهی‌های جاری',
        code: '201',
        type: 'LIABILITY',
        level: 2,
        children: [
          { name: 'بدهی پیمانکاران پروژه X', code: '20101', type: 'CONTRACTOR', level: 3 },
          { name: 'بدهی پیمانکاران پروژه Y', code: '20102', type: 'CONTRACTOR', level: 3 }
        ]
      },
      {
        name: 'حساب‌های پرداختنی',
        code: '202',
        type: 'LIABILITY',
        level: 2,
        children: [
          { name: 'تامین‌کنندگان مصالح پروژه X', code: '20201', type: 'SUPPLIER', level: 3 },
          { name: 'تامین‌کنندگان مصالح پروژه Y', code: '20202', type: 'SUPPLIER', level: 3 }
        ]
      },
      {
        name: 'تسهیلات و وام',
        code: '203',
        type: 'LIABILITY',
        level: 2,
        children: [
          { name: 'وام کوتاه‌مدت', code: '20301', type: 'LIABILITY', level: 3 },
          { name: 'وام بلندمدت', code: '20302', type: 'LIABILITY', level: 3 }
        ]
      },
      {
        name: 'پیش‌دریافت‌ها از مشتریان',
        code: '204',
        type: 'LIABILITY',
        level: 2,
        children: [
          { name: 'پیش‌دریافت پروژه X', code: '20401', type: 'CUSTOMER', level: 3 },
          { name: 'پیش‌دریافت پروژه Y', code: '20402', type: 'CUSTOMER', level: 3 }
        ]
      }
    ]
  },
  {
    name: 'سرمایه',
    code: '300',
    type: 'EQUITY',
    level: 1,
    children: [
      { name: 'سرمایه مالک', code: '301', type: 'EQUITY', level: 2 },
      { name: 'سود انباشته', code: '302', type: 'EQUITY', level: 2 },
      { name: 'آورده‌های اضافی', code: '303', type: 'EQUITY', level: 2 }
    ]
  },
  {
    name: 'درآمدها',
    code: '400',
    type: 'INCOME',
    level: 1,
    children: [
      {
        name: 'درآمد پروژه‌ها',
        code: '401',
        type: 'INCOME',
        level: 2,
        children: [
          { name: 'پروژه X', code: '40101', type: 'INCOME', level: 3 },
          { name: 'پروژه Y', code: '40102', type: 'INCOME', level: 3 },
          { name: 'پروژه Z', code: '40103', type: 'INCOME', level: 3 }
        ]
      },
      { name: 'درآمد فروش مصالح و تجهیزات مازاد', code: '402', type: 'INCOME', level: 2 },
      { name: 'درآمد اجاره تجهیزات', code: '403', type: 'INCOME', level: 2 }
    ]
  },
  {
    name: 'هزینه‌ها',
    code: '500',
    type: 'EXPENSE',
    level: 1,
    children: [
      {
        name: 'هزینه‌های مستقیم پروژه',
        code: '501',
        type: 'EXPENSE',
        level: 2,
        children: [
          { name: 'مصالح مصرفی پروژه X', code: '50101', type: 'EXPENSE', level: 3 },
          { name: 'مصالح مصرفی پروژه Y', code: '50102', type: 'EXPENSE', level: 3 },
          { name: 'دستمزد کارگران پروژه X', code: '50103', type: 'EXPENSE', level: 3 },
          { name: 'دستمزد کارگران پروژه Y', code: '50104', type: 'EXPENSE', level: 3 },
          { name: 'اجاره تجهیزات پروژه X', code: '50105', type: 'EXPENSE', level: 3 },
          { name: 'اجاره تجهیزات پروژه Y', code: '50106', type: 'EXPENSE', level: 3 }
        ]
      },
      {
        name: 'هزینه‌های پرسنل و اداری',
        code: '502',
        type: 'EXPENSE',
        level: 2,
        children: [
          { name: 'حقوق کارمندان دفتر', code: '50201', type: 'EXPENSE', level: 3 },
          { name: 'حقوق مهندسان و ناظرین پروژه X', code: '50202', type: 'EXPENSE', level: 3 },
          { name: 'حقوق مهندسان و ناظرین پروژه Y', code: '50203', type: 'EXPENSE', level: 3 }
        ]
      },
      {
        name: 'هزینه‌های عمومی و اداری',
        code: '503',
        type: 'EXPENSE',
        level: 2,
        children: [
          { name: 'برق و آب', code: '50301', type: 'EXPENSE', level: 3 },
          { name: 'اجاره دفتر', code: '50302', type: 'EXPENSE', level: 3 },
          { name: 'تلفن و اینترنت', code: '50303', type: 'EXPENSE', level: 3 }
        ]
      },
      { name: 'هزینه استهلاک دارایی‌ها', code: '504', type: 'EXPENSE', level: 2 },
      { name: 'هزینه حمل و نقل مصالح و تجهیزات پروژه‌ها', code: '505', type: 'EXPENSE', level: 2 }
    ]
  },
  {
    name: 'حساب‌های تفصیلی مشتریان',
    code: '600',
    type: 'CUSTOMER',
    level: 1,
    children: [
      { name: 'مشتریان پروژه X', code: '601', type: 'CUSTOMER', level: 2 },
      { name: 'مشتریان پروژه Y', code: '602', type: 'CUSTOMER', level: 2 },
      { name: 'مشتریان پروژه Z', code: '603', type: 'CUSTOMER', level: 2 }
    ]
  },
  {
    name: 'حساب‌های تفصیلی پیمانکاران',
    code: '700',
    type: 'CONTRACTOR',
    level: 1,
    children: [
      { name: 'پیمانکاران پروژه X', code: '701', type: 'CONTRACTOR', level: 2 },
      { name: 'پیمانکاران پروژه Y', code: '702', type: 'CONTRACTOR', level: 2 },
      { name: 'پیمانکاران پروژه Z', code: '703', type: 'CONTRACTOR', level: 2 }
    ]
  },
  {
    name: 'حساب‌های تفصیلی تأمین‌کنندگان',
    code: '800',
    type: 'SUPPLIER',
    level: 1,
    children: [
      { name: 'تأمین‌کنندگان مصالح', code: '801', type: 'SUPPLIER', level: 2 },
      { name: 'تأمین‌کنندگان تجهیزات', code: '802', type: 'SUPPLIER', level: 2 },
      { name: 'تأمین‌کنندگان خدمات', code: '803', type: 'SUPPLIER', level: 2 }
    ]
  }
];

interface AdvancedChartOfAccountsProps {
  projectId: string;
  fiscalYearId?: string;
}

export default function AdvancedChartOfAccounts({ projectId, fiscalYearId }: AdvancedChartOfAccountsProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingBank, setEditingBank] = useState<any>(null);
  const [selectedParent, setSelectedParent] = useState<Account | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<'accounts' | 'banks' | 'counterparts'>('accounts');
  const [mounted, setMounted] = useState(false);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'name' | 'code' | 'type' | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: '',
    level: 1,
    parentId: '',
    contact: '',
    description: ''
  });
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [codePrefix, setCodePrefix] = useState<string[]>([]);
  const [showCustomType, setShowCustomType] = useState(false);
  const [customType, setCustomType] = useState({
    name: '',
    code: '',
    description: '',
    icon: '📋'
  });
  const [bankFormData, setBankFormData] = useState({
    name: '',
    branch: '',
    accountNumber: '',
    accountName: '',
    balance: 0
  });
  const [importModalOpen, setImportModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchAccounts();
    fetchBanks();
  }, [projectId, fiscalYearId]);

  // تنظیم showCustomType بر اساس formData.type
  useEffect(() => {
    setShowCustomType(formData.type === 'CUSTOM');
    // اگر نوع سفارشی نیست، customType را reset کن
    if (formData.type !== 'CUSTOM') {
      setCustomType({
        name: '',
        code: '',
        description: '',
        icon: '📋'
      });
    }
  }, [formData.type]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const url = fiscalYearId 
        ? `/api/accounting/accounts?projectId=${projectId}&fiscalYearId=${fiscalYearId}`
        : `/api/accounting/accounts?projectId=${projectId}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('خطا در دریافت حساب‌ها');
      }
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setError('خطا در دریافت حساب‌ها');
    } finally {
      setLoading(false);
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await fetch(`/api/accounting/banks?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error('خطا در دریافت حساب‌های بانکی');
      }
      const data = await response.json();
      setBanks(data);
    } catch (error) {
      console.error('Error fetching banks:', error);
      setError('خطا در دریافت حساب‌های بانکی');
    }
  };

  const handleImportSuccess = () => {
    fetchAccounts(); // Refresh accounts after import
    setImportModalOpen(false);
  };

  const initializeDefaultCoding = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/accounting/accounts/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          structure: DEFAULT_CODING_STRUCTURE
        })
      });
      
      if (!response.ok) {
        throw new Error('خطا در ایجاد کدینگ پیش‌فرض');
      }
      
      await fetchAccounts();
    } catch (error) {
      console.error('Error initializing coding:', error);
      setError('خطا در ایجاد کدینگ پیش‌فرض');
    } finally {
      setLoading(false);
    }
  };

  const deleteAllAccounts = async () => {
    if (!confirm('آیا از حذف تمام کدینگ‌ها اطمینان دارید؟ این عمل قابل بازگشت نیست.')) return;
    
    try {
      setLoading(true);
      
      // حذف تمام حساب‌ها به صورت موازی
      const deletePromises = accounts.map(account => 
        fetch(`/api/accounting/accounts/${account.id}`, {
          method: 'DELETE'
        })
      );
      
      await Promise.all(deletePromises);
      
      // پاک کردن state
      setAccounts([]);
      setExpandedNodes([]);
      
    } catch (error) {
      console.error('Error deleting all accounts:', error);
      setError('خطا در حذف کدینگ‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (account?: Account, parent?: Account) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        code: account.code,
        type: account.type,
        level: account.level,
        parentId: account.parentId || '',
        contact: account.contact || '',
        description: account.description || ''
      });
      setShowCustomType(account.type === 'CUSTOM');
      setSelectedCode(account.code);
      setCodePrefix(getCodePrefix(account.level, account.parent?.code));
    } else {
      const level = parent ? parent.level + 1 : 1;
      setEditingAccount(null);
      setFormData({
        name: '',
        code: '',
        type: '',
        level: level,
        parentId: parent?.id || '',
        contact: '',
        description: ''
      });
      setShowCustomType(false);
      setSelectedCode('');
      setCodePrefix(getCodePrefix(level, parent?.code));
    }
    setSelectedParent(parent || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAccount(null);
    setSelectedParent(null);
    setShowCustomType(false);
    setFormData({
      name: '',
      code: '',
      type: '',
      level: 1,
      parentId: '',
      contact: '',
      description: ''
    });
    setCustomType({
      name: '',
      code: '',
      description: '',
      icon: '📋'
    });
    setSelectedCode('');
    setCodePrefix([]);
    setError(''); // خطا را پاک کن
  };

  const handleCodeChange = (fullCode: string) => {
    setSelectedCode(fullCode);
    setFormData(prev => ({ ...prev, code: fullCode }));
  };

  const getCodePrefix = (level: number, parentCode?: string) => {
    if (level === 1) return [];
    if (level === 2 && parentCode) return [parentCode];
    if (level === 3 && parentCode) {
      const parentParts = parentCode.split('');
      return [parentParts[0], parentParts[1]];
    }
    if (level === 4 && parentCode) {
      const parentParts = parentCode.split('');
      return [parentParts[0], parentParts[1], parentParts[2] + parentParts[3]];
    }
    return [];
  };

  const handleTypeChange = (event: SelectChangeEvent) => {
    const selectedType = event.target.value;
    setFormData(prev => ({ ...prev, type: selectedType }));
    setShowCustomType(selectedType === 'CUSTOM');
    
    // اگر نوع سفارشی نیست، customType را reset کن
    if (selectedType !== 'CUSTOM') {
      setCustomType({
        name: '',
        code: '',
        description: '',
        icon: '📋'
      });
    }
  };

  const handleSubmit = async () => {
    try {
      // اعتبارسنجی فیلدهای اجباری
      if (!formData.name.trim()) {
        setError('نام کدینگ الزامی است');
        return;
      }
      if (!formData.code.trim()) {
        setError('کد کدینگ الزامی است');
        return;
      }
      if (!formData.type) {
        setError('نوع کدینگ الزامی است');
        return;
      }
      
      // اگر نوع سفارشی است، بررسی کن که اطلاعات کامل باشد
      if (formData.type === 'CUSTOM') {
        if (!customType.name.trim()) {
          setError('نام نوع کدینگ سفارشی الزامی است');
          return;
        }
        if (!customType.code.trim()) {
          setError('کد نوع کدینگ سفارشی الزامی است');
          return;
        }
      }

      const url = editingAccount 
        ? `/api/accounting/accounts/${editingAccount.id}`
        : '/api/accounting/accounts';
      
      const method = editingAccount ? 'PUT' : 'POST';
      
      // اگر نوع جدید تعریف شده، آن را به formData اضافه کن
      const submitData = {
        ...formData,
        projectId,
        ...(formData.type === 'CUSTOM' && {
          customType: {
            name: customType.name,
            code: customType.code,
            description: customType.description,
            icon: customType.icon
          }
        })
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || `خطا در ذخیره حساب (کد: ${response.status})`;
        throw new Error(errorMessage);
      }

      const savedAccount = await response.json();
      
      if (editingAccount) {
        // ویرایش حساب موجود
        setAccounts(prev => prev.map(acc => 
          acc.id === editingAccount.id ? { ...acc, ...savedAccount } : acc
        ));
      } else {
        // افزودن حساب جدید
        setAccounts(prev => [...prev, savedAccount]);
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving account:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص در ذخیره حساب';
      setError(errorMessage);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('آیا از حذف این حساب اطمینان دارید؟')) return;
    
    try {
      const response = await fetch(`/api/accounting/accounts/${accountId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('خطا در حذف حساب');
      }

      // حذف از state بدون رفرش صفحه
      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('خطا در حذف حساب');
    }
  };

  const handleStartEdit = (accountId: string, field: 'name' | 'code' | 'type', currentValue: string) => {
    setEditingNode(accountId);
    setEditingField(field);
    setEditValue(currentValue);
  };

  const handleCancelEdit = () => {
    setEditingNode(null);
    setEditingField(null);
    setEditValue('');
  };

  const handleSaveEdit = async (accountId: string) => {
    if (!editingField || !editValue.trim()) return;

    try {
      const account = accounts.find(acc => acc.id === accountId);
      if (!account) return;

      const updateData = {
        ...account,
        [editingField]: editValue.trim()
      };

      const response = await fetch(`/api/accounting/accounts/${accountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('خطا در ویرایش حساب');
      }

      const updatedAccount = await response.json();
      
      // به‌روزرسانی state بدون رفرش
      setAccounts(prev => prev.map(acc => 
        acc.id === accountId ? { ...acc, ...updatedAccount } : acc
      ));
      
      handleCancelEdit();
    } catch (error) {
      console.error('Error updating account:', error);
      setError('خطا در ویرایش حساب');
    }
  };

  const getAccountTypeInfo = (type: string) => {
    return ACCOUNT_TYPES.find(t => t.code === type) || ACCOUNT_TYPES[0];
  };

  const buildAccountTree = (accounts: Account[]): Account[] => {
    const accountMap = new Map<string, Account>();
    const rootAccounts: Account[] = [];

    // ایجاد map از تمام حساب‌ها
    accounts.forEach(account => {
      accountMap.set(account.id, { ...account, children: [], isExpanded: expandedNodes.includes(account.id) });
    });

    // ساخت درخت سلسله‌مراتبی
    accounts.forEach(account => {
      const accountWithChildren = accountMap.get(account.id)!;
      if (account.parentId) {
        const parent = accountMap.get(account.parentId);
        if (parent) {
          parent.children!.push(accountWithChildren);
        }
      } else {
        rootAccounts.push(accountWithChildren);
      }
    });

    // مرتب‌سازی بر اساس کد
    const sortAccounts = (accounts: Account[]): Account[] => {
      return accounts.sort((a, b) => {
        const codeA = parseInt(a.code);
        const codeB = parseInt(b.code);
        return codeA - codeB;
      }).map(account => ({
        ...account,
        children: account.children ? sortAccounts(account.children) : []
      }));
    };

    return sortAccounts(rootAccounts);
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => 
      prev.includes(nodeId) 
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  const renderAccountTree = (accounts: Account[], level = 0) => {
    return accounts.map(account => {
      const typeInfo = getAccountTypeInfo(account.type);
      const hasChildren = account.children && account.children.length > 0;
      const isExpanded = expandedNodes.includes(account.id);
      const isEditing = editingNode === account.id;
      const isEditingName = isEditing && editingField === 'name';
      const isEditingCode = isEditing && editingField === 'code';
      const isEditingType = isEditing && editingField === 'type';

      return (
        <Box key={account.id}>
          <ListItemButton
            sx={{
              pr: level * 3 + 2,
              py: 1.5,
              borderRight: `4px solid`,
              borderRightColor: `${typeInfo.color}.main`,
              backgroundColor: isExpanded ? 'action.hover' : 'transparent',
              position: 'relative',
              '&:hover': {
                backgroundColor: 'action.selected',
              },
              '&::before': level > 0 ? {
                content: '""',
                position: 'absolute',
                right: level * 3 - 1,
                top: 0,
                bottom: 0,
                width: '2px',
                backgroundColor: 'divider',
                zIndex: 1
              } : {},
              '&::after': level > 0 ? {
                content: '""',
                position: 'absolute',
                right: level * 3 - 1,
                top: '50%',
                width: '12px',
                height: '2px',
                backgroundColor: 'divider',
                zIndex: 1
              } : {}
            }}
          >
            <MuiListItemIcon sx={{ minWidth: 50, order: 1, position: 'relative' }}>
              {hasChildren ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <IconButton 
                    size="small" 
                    onClick={() => toggleNode(account.id)}
                    sx={{
                      backgroundColor: isExpanded ? 'primary.main' : 'transparent',
                      color: isExpanded ? 'white' : 'text.secondary',
                      '&:hover': {
                        backgroundColor: isExpanded ? 'primary.dark' : 'action.hover',
                      }
                    }}
                  >
                    {isExpanded ? <ExpandMore /> : <ChevronRight />}
                  </IconButton>
                  <Box 
                    sx={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: '50%', 
                      backgroundColor: `${typeInfo.color}.light`,
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '0.9rem'
                    }}
                  >
                    {typeInfo.icon}
                  </Box>
                </Box>
              ) : (
                <Box display="flex" alignItems="center" gap={1}>
                  <Box width={24} height={24} />
                  <Box 
                    sx={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: '50%', 
                      backgroundColor: `${typeInfo.color}.light`,
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '0.9rem'
                    }}
                  >
                    {typeInfo.icon}
                  </Box>
                </Box>
              )}
            </MuiListItemIcon>

            <MuiListItemText
              primary={
                <Box display="flex" alignItems="center" gap={2} width="100%" direction="rtl">
                  {/* کد حساب */}
                  <Box sx={{ minWidth: 100, order: 1 }}>
                    {isEditingCode ? (
                      <Box display="flex" alignItems="center" gap={1} dir="ltr">
                        {getCodePrefix(account.level, account.parent?.code).map((part, idx) => (
                          <Chip
                            key={idx}
                            label={part}
                            size="small"
                            sx={{
                              backgroundColor: "#f5f5f5",
                              color: "#666",
                              fontWeight: 500,
                              minWidth: 32,
                              height: 32,
                              fontFamily: 'monospace',
                              fontSize: '14px'
                            }}
                          />
                        ))}
                        
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: "#ffffff",
                            border: '1px solid #c4c4c4',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'text',
                            position: 'relative',
                            '&:hover': {
                              borderColor: '#1976d2',
                            },
                            '&:focus-within': {
                              borderColor: '#1976d2',
                              borderWidth: 2,
                            }
                          }}
                        >
                          <input
                            value={editValue}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d*$/.test(value) && value.length <= (account.level === 1 ? 1 : account.level === 2 ? 1 : 2)) {
                                setEditValue(value);
                              }
                            }}
                            onBlur={() => {
                              if (account.level >= 3 && editValue.length === 1) {
                                const paddedCode = editValue.padStart(2, '0');
                                setEditValue(paddedCode);
                              }
                              handleSaveEdit(account.id);
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(account.id);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            placeholder={account.level === 1 ? "1" : account.level === 2 ? "1" : "01"}
                            maxLength={account.level === 1 ? 1 : account.level === 2 ? 1 : 2}
                            style={{
                              border: 'none',
                              outline: 'none',
                              background: 'transparent',
                              textAlign: 'center',
                              direction: 'ltr',
                              fontFamily: 'monospace',
                              fontSize: '12px',
                              fontWeight: 500,
                              color: '#666',
                              width: '28px',
                              height: '28px',
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              zIndex: 1
                            }}
                          />
                        </Box>
                      </Box>
                    ) : (
                      <Box 
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover', borderRadius: 1, px: 1 }
                        }}
                        onClick={() => handleStartEdit(account.id, 'code', account.code)}
                      >
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'text.secondary',
                            fontSize: '0.75rem'
                          }}
                        >
                          کد:
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            color: 'primary.main',
                            textAlign: 'left'
                          }}
                        >
                          {account.code}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* نام حساب */}
                  <Box sx={{ flex: 1, textAlign: 'right', order: 2 }}>
                    {isEditingName ? (
                      <TextField
                        size="small"
                        fullWidth
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(account.id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        autoFocus
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <IconButton size="small" onClick={handleCancelEdit}>
                                <Close />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleSaveEdit(account.id)}>
                                <Check />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    ) : (
                      <Box 
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover', borderRadius: 1, px: 1 }
                        }}
                        onClick={() => handleStartEdit(account.id, 'name', account.name)}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          {hasChildren && (
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: '#1976d2',
                                flexShrink: 0,
                                border: '2px solid #fff',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Box
                                sx={{
                                  width: 4,
                                  height: 4,
                                  borderRadius: '50%',
                                  backgroundColor: '#fff'
                                }}
                              />
                            </Box>
                          )}
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              textAlign: 'right',
                              fontWeight: level === 0 ? 'bold' : 'normal',
                              fontSize: level === 0 ? '1.1rem' : '1rem'
                            }}
                          >
                            {account.name}
                          </Typography>
                        </Box>
                        {level > 0 && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'text.secondary',
                              fontSize: '0.75rem'
                            }}
                          >
                            (سطح {level})
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>

                  {/* نوع حساب */}
                  <Box sx={{ minWidth: 120, order: 3 }}>
                    {isEditingType ? (
                      <FormControl size="small" fullWidth>
                        <Select
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                        >
                          {ACCOUNT_TYPES.map(type => (
                            <MenuItem key={type.code} value={type.code}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <span>{type.icon}</span>
                                {type.name}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Chip 
                        label={typeInfo.name}
                        color={typeInfo.color as any}
                        size="small"
                        icon={<span>{typeInfo.icon}</span>}
                        onClick={() => handleStartEdit(account.id, 'type', account.type)}
                        sx={{ cursor: 'pointer' }}
                      />
                    )}
                  </Box>

                  {/* آمار */}
                  {account._count && (
                    <Chip 
                      label={`${account._count.transactions} تراکنش`}
                      variant="outlined"
                      size="small"
                      sx={{ order: 4 }}
                    />
                  )}

                  {/* دکمه‌های عملیات */}
                  <Box display="flex" gap={0.5} sx={{ order: 5 }}>
                    <Tooltip title="افزودن زیرحساب">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDialog(undefined, account)}
                      >
                        <Add />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="ویرایش کامل">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDialog(account)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="حذف">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(account.id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              }
              secondary={
                account.description && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {account.description}
                  </Typography>
                )
              }
            />
          </ListItemButton>
          
          {hasChildren && isExpanded && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ position: 'relative' }}>
                {/* خط عمودی برای اتصال به فرزندان */}
                <Box
                  sx={{
                    position: 'absolute',
                    right: level * 3 + 1,
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    backgroundColor: 'divider',
                    zIndex: 0
                  }}
                />
                <List component="div" disablePadding>
                  {renderAccountTree(account.children!, level + 1)}
                </List>
              </Box>
            </Collapse>
          )}
        </Box>
      );
    });
  };

  if (!mounted) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  const accountTree = buildAccountTree(accounts);

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" sx={{ 
              fontFamily: 'Vazirmatn, Arial, sans-serif',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <AccountTree color="primary" />
              مدیریت جامع حساب‌ها
            </Typography>
            <Box display="flex" gap={1}>
              {activeSection === 'accounts' && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                  >
                    تعریف کدینگ جدید
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AccountTree />}
                    onClick={initializeDefaultCoding}
                    color="success"
                  >
                    ایجاد کدینگ پیش‌فرض
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Upload />}
                    onClick={() => setImportModalOpen(true)}
                    color="info"
                  >
                    ایمپورت از پروژه دیگر
                  </Button>
                  {accounts.length > 0 && (
                    <Button
                      variant="outlined"
                      startIcon={<Delete />}
                      onClick={deleteAllAccounts}
                      color="error"
                    >
                      حذف تمام کدینگ‌ها
                    </Button>
                  )}
                </>
              )}
              {activeSection === 'banks' && (
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => setBankDialogOpen(true)}
                >
                  افزودن حساب بانکی
                </Button>
              )}
            </Box>
          </Box>

          {/* Section Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Box display="flex" gap={1}>
              <Button
                variant={activeSection === 'accounts' ? 'contained' : 'outlined'}
                onClick={() => setActiveSection('accounts')}
                startIcon={<AccountTree />}
              >
                کدینگ سلسله‌مراتبی
              </Button>
              <Button
                variant={activeSection === 'banks' ? 'contained' : 'outlined'}
                onClick={() => setActiveSection('banks')}
                startIcon={<AccountBalance />}
              >
                حساب‌های بانکی
              </Button>
              <Button
                variant={activeSection === 'counterparts' ? 'contained' : 'outlined'}
                onClick={() => setActiveSection('counterparts')}
                startIcon={<Receipt />}
              >
                طرف حساب‌ها
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                '& .MuiAlert-message': {
                  fontSize: '1rem',
                  lineHeight: 1.6
                }
              }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => setError('')}
                >
                  بستن
                </Button>
              }
            >
              <Box>
                <Typography variant="h6" gutterBottom>
                  خطا در عملیات
                </Typography>
                <Typography variant="body2" paragraph>
                  {error}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  لطفاً اطلاعات را بررسی کرده و دوباره تلاش کنید. در صورت ادامه مشکل، با پشتیبانی تماس بگیرید.
                </Typography>
              </Box>
            </Alert>
          )}

          {/* Accounts Section */}
          {activeSection === 'accounts' && (
            <>
              {accounts.length === 0 ? (
                <Box textAlign="center" py={6}>
                  <AccountTree sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
                  <Typography variant="h5" color="text.secondary" gutterBottom fontWeight="bold">
                    هیچ کدینگ حسابداری تعریف نشده است
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                    برای شروع کار با سیستم حسابداری، ابتدا کدینگ پیش‌فرض پیمانکاری را ایجاد کنید یا حساب‌های جدیدی اضافه کنید
                  </Typography>
                  
                  {/* نمایش نمونه کدینگ */}
                  <Box sx={{ mb: 4, p: 3, backgroundColor: 'grey.50', borderRadius: 2, maxWidth: 600, mx: 'auto' }}>
                    <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      نمونه کدینگ پیش‌فرض:
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={2} alignItems="center">
                      <Box display="flex" alignItems="center" gap={1} dir="ltr">
                        <Chip label="1" size="small" sx={{ backgroundColor: "#f5f5f5", color: "#666", fontWeight: 500, minWidth: 32, height: 32, fontFamily: 'monospace', fontSize: '14px' }} />
                        <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>دارایی‌ها</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} dir="ltr">
                        <Chip label="1" size="small" sx={{ backgroundColor: "#f5f5f5", color: "#666", fontWeight: 500, minWidth: 32, height: 32, fontFamily: 'monospace', fontSize: '14px' }} />
                        <Chip label="1" size="small" sx={{ backgroundColor: "#f5f5f5", color: "#666", fontWeight: 500, minWidth: 32, height: 32, fontFamily: 'monospace', fontSize: '14px' }} />
                        <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>صندوق</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} dir="ltr">
                        <Chip label="1" size="small" sx={{ backgroundColor: "#f5f5f5", color: "#666", fontWeight: 500, minWidth: 32, height: 32, fontFamily: 'monospace', fontSize: '14px' }} />
                        <Chip label="1" size="small" sx={{ backgroundColor: "#f5f5f5", color: "#666", fontWeight: 500, minWidth: 32, height: 32, fontFamily: 'monospace', fontSize: '14px' }} />
                        <Chip label="01" size="small" sx={{ backgroundColor: "#f5f5f5", color: "#666", fontWeight: 500, minWidth: 32, height: 32, fontFamily: 'monospace', fontSize: '14px' }} />
                        <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>صندوق اصلی</Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
                    <Button
                      variant="contained"
                      startIcon={<AccountTree />}
                      onClick={initializeDefaultCoding}
                      size="large"
                      color="success"
                    >
                      ایجاد کدینگ پیش‌فرض پیمانکاری
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => handleOpenDialog()}
                      size="large"
                    >
                      تعریف کدینگ جدید
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {/* کنترل‌های نمایش */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="body2" color="text.secondary">
                        نمایش: همه حساب‌ها
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({accounts.length} حساب - {accountTree.length} گروه اصلی)
                      </Typography>
                    </Box>
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        startIcon={<ExpandMore />}
                        onClick={() => setExpandedNodes(accounts.map(acc => acc.id))}
                      >
                        باز کردن همه
                      </Button>
                      <Button
                        size="small"
                        startIcon={<ChevronRight />}
                        onClick={() => setExpandedNodes([])}
                      >
                        بستن همه
                      </Button>
                    </Box>
                  </Box>

                  {/* راهنمای سطوح */}
                  <Box display="flex" gap={2} mb={2} p={2} sx={{ backgroundColor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                      راهنمای سطوح:
                    </Typography>
                    <Box display="flex" gap={3}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'success.light' }} />
                        <Typography variant="caption">سطح 1 (اصلی)</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'info.light' }} />
                        <Typography variant="caption">سطح 2 (فرعی)</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'warning.light' }} />
                        <Typography variant="caption">سطح 3+ (جزئی)</Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  {/* نمایش درختی */}
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      maxHeight: '70vh', 
                      overflow: 'auto',
                      backgroundColor: 'background.paper',
                      '& .MuiListItemButton-root': {
                        borderBottom: '1px solid',
                        borderBottomColor: 'divider',
                        '&:last-child': {
                          borderBottom: 'none'
                        }
                      }
                    }}
                  >
                    <List disablePadding>
                      {renderAccountTree(accountTree)}
                    </List>
                  </Paper>
                </Box>
              )}
            </>
          )}

          {/* Banks Section */}
          {activeSection === 'banks' && (
            <Box>
              {banks.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <AccountBalance sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    هیچ حساب بانکی تعریف نشده است
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    برای شروع، حساب بانکی جدیدی اضافه کنید
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setBankDialogOpen(true)}
                    size="large"
                  >
                    افزودن حساب بانکی
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {banks.map((bank) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={bank.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                            <Box>
                              <Typography variant="h6" gutterBottom>
                                {bank.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {bank.branch && `${bank.branch} - `}
                                {bank.accountNumber}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {bank.accountName}
                              </Typography>
                            </Box>
                            <Chip 
                              label={`${bank.balance.toLocaleString()} ریال`}
                              color={bank.balance >= 0 ? 'success' : 'error'}
                              size="small"
                            />
                          </Box>
                          <Box display="flex" gap={1}>
                            <Button size="small" startIcon={<Edit />}>
                              ویرایش
                            </Button>
                            <Button size="small" color="error" startIcon={<Delete />}>
                              حذف
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {/* Counterparts Section */}
          {activeSection === 'counterparts' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                طرف حساب‌ها (مشتریان، پیمانکاران، تأمین‌کنندگان)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                این بخش شامل حساب‌های مشتریان، پیمانکاران و تأمین‌کنندگان است که در کدینگ سلسله‌مراتبی تعریف شده‌اند.
              </Typography>
              
              <Grid container spacing={2}>
                {accounts.filter(acc => ['CUSTOMER', 'CONTRACTOR', 'SUPPLIER'].includes(acc.type)).map(account => {
                  const typeInfo = getAccountTypeInfo(account.type);
                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={account.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <span style={{ fontSize: '1.5rem' }}>{typeInfo.icon}</span>
                            <Box flex={1}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {account.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                کد: {account.code}
                              </Typography>
                            </Box>
                            <Chip 
                              label={typeInfo.name}
                              color={typeInfo.color as any}
                              size="small"
                            />
                          </Box>
                          {account.contact && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {account.contact}
                            </Typography>
                          )}
                          {account.description && (
                            <Typography variant="body2" color="text.secondary">
                              {account.description}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          {editingAccount ? 'ویرایش کدینگ' : 'تعریف کدینگ جدید'}
        </DialogTitle>
        <DialogContent>
          {/* نمایش کد انتخاب شده */}
          <Box sx={{ mb: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              کد انتخاب شده:
            </Typography>
            <Box display="flex" alignItems="center" gap={1} dir="ltr">
              {codePrefix.map((part, idx) => (
                <Box key={idx} display="flex" alignItems="center">
                  <Chip
                    label={part}
                    size="small"
                    sx={{
                      backgroundColor: "#f5f5f5",
                      color: "#666",
                      fontWeight: 500,
                      minWidth: 32,
                      height: 32,
                      fontFamily: 'monospace',
                      fontSize: '14px'
                    }}
                  />
                </Box>
              ))}
              
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: "#ffffff",
                  border: '1px solid #c4c4c4',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'text',
                  '&:hover': {
                    borderColor: '#1976d2',
                  },
                  '&:focus-within': {
                    borderColor: '#1976d2',
                    borderWidth: 2,
                  }
                }}
              >
                <input
                  value={formData.code}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value) && value.length <= (formData.level === 1 ? 1 : formData.level === 2 ? 1 : 2)) {
                      setFormData(prev => ({ ...prev, code: value }));
                      handleCodeChange([...codePrefix, value].join(''));
                    }
                  }}
                  onBlur={() => {
                    if (formData.level >= 3 && formData.code.length === 1) {
                      const paddedCode = formData.code.padStart(2, '0');
                      setFormData(prev => ({ ...prev, code: paddedCode }));
                      handleCodeChange([...codePrefix, paddedCode].join(''));
                    }
                  }}
                  placeholder={formData.level === 1 ? "1" : formData.level === 2 ? "1" : "01"}
                  maxLength={formData.level === 1 ? 1 : formData.level === 2 ? 1 : 2}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    textAlign: 'center',
                    direction: 'ltr',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#666',
                    width: '28px',
                    height: '28px',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1
                  }}
                />
              </Box>
            </Box>
            
            {selectedCode && (
              <Box display="flex" alignItems="center" gap={2} mt={2}>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '18px' }}>
                  کد کامل: {selectedCode}
                </Typography>
                <Chip 
                  label={`سطح ${formData.level}`}
                  color="primary"
                  size="small"
                />
              </Box>
            )}
          </Box>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="نام کدینگ"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                helperText="نام کدینگ حسابداری"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="کد کدینگ (فقط نمایش)"
                value={selectedCode}
                disabled
                helperText="کد در بالای فرم قابل ویرایش است"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>نوع کدینگ</InputLabel>
                <Select
                  value={formData.type}
                  onChange={handleTypeChange}
                  label="نوع کدینگ"
                >
                  {ACCOUNT_TYPES.map(type => (
                    <MenuItem key={type.code} value={type.code}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <span style={{ fontSize: '1.2rem' }}>{type.icon}</span>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {type.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {type.description}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                  <MenuItem value="CUSTOM">
                    <Box display="flex" alignItems="center" gap={1}>
                      <span style={{ fontSize: '1.2rem' }}>➕</span>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          تعریف نوع جدید
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          افزودن نوع کدینگ جدید
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="سطح سلسله‌مراتبی"
                type="number"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 4 }}
                helperText="سطح سلسله‌مراتبی (1-4)"
              />
            </Grid>

            {/* فرم تعریف نوع جدید */}
            {formData.type === 'CUSTOM' && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 2 }}>
                    <Typography variant="subtitle2" color="primary">
                      تعریف نوع کدینگ جدید
                    </Typography>
                  </Divider>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="نام نوع کدینگ"
                    value={customType.name}
                    onChange={(e) => setCustomType({ ...customType, name: e.target.value })}
                    required
                    helperText="نام نوع کدینگ جدید"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="کد نوع کدینگ"
                    value={customType.code}
                    onChange={(e) => setCustomType({ ...customType, code: e.target.value.toUpperCase() })}
                    required
                    helperText="کد یکتا برای نوع کدینگ"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="آیکون"
                    value={customType.icon}
                    onChange={(e) => setCustomType({ ...customType, icon: e.target.value })}
                    helperText="آیکون نمایشی (emoji)"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="توضیحات نوع"
                    value={customType.description}
                    onChange={(e) => setCustomType({ ...customType, description: e.target.value })}
                    helperText="توضیح مختصر درباره نوع کدینگ"
                  />
                </Grid>
              </>
            )}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="توضیحات"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="اطلاعات تماس"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="شماره تلفن، آدرس، ایمیل و..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>انصراف</Button>
          <Button onClick={handleSubmit} variant="contained" startIcon={<Save />}>
            {editingAccount ? 'به‌روزرسانی کدینگ' : 'ایجاد کدینگ'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bank Dialog */}
      <Dialog open={bankDialogOpen} onClose={() => setBankDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          {editingBank ? 'ویرایش حساب بانکی' : 'افزودن حساب بانکی جدید'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="نام بانک"
                value={bankFormData.name}
                onChange={(e) => setBankFormData({ ...bankFormData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="شعبه"
                value={bankFormData.branch}
                onChange={(e) => setBankFormData({ ...bankFormData, branch: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="شماره حساب"
                value={bankFormData.accountNumber}
                onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="نام صاحب حساب"
                value={bankFormData.accountName}
                onChange={(e) => setBankFormData({ ...bankFormData, accountName: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="موجودی اولیه"
                type="number"
                value={bankFormData.balance}
                onChange={(e) => setBankFormData({ ...bankFormData, balance: parseFloat(e.target.value) || 0 })}
                helperText="موجودی اولیه حساب بانکی (ریال)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBankDialogOpen(false)}>انصراف</Button>
          <Button variant="contained" startIcon={<Save />}>
            ذخیره
          </Button>
        </DialogActions>
      </Dialog>

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
