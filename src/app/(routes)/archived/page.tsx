"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardActions,
  Alert,
  Snackbar,
  CircularProgress,
  Avatar,
  Divider,
  Tabs,
  Tab
} from "@mui/material";
import {
  Search,
  Archive,
  Visibility,
  Delete,
  Person,
  Business,
  AttachMoney,
  Receipt,
  Warning,
  Refresh,
  ExpandMore,
  ExpandLess,
  Restore,
  Folder,
  Description
} from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { dispatchProjectEvent } from "@/lib/events";

interface ArchivedProject {
  id: string;
  name: string;
  description?: string;
  status: string;
  colorPrimary: string;
  colorFolderDefault: string;
  colorDocImage: string;
  colorDocPdf: string;
  bgColor: string;
  createdBy: string;
  createdByUsername: string;
  archivedAt: string;
  archivedFolders: ArchivedFolder[];
  archivedDocuments: ArchivedDocument[];
  archivedUnits: ArchivedProjectUnit[];
  archivedInstallmentDefinitions: ArchivedProjectInstallmentDefinition[];
}

interface ArchivedFolder {
  id: string;
  name: string;
  description?: string;
  tabKey: string;
  path: string;
  depth: number;
  sortOrder: number;
  createdBy: string;
  createdByUsername: string;
  archivedAt: string;
  archivedDocuments: ArchivedDocument[];
}

interface ArchivedDocument {
  id: string;
  name: string;
  description?: string;
  tagsJson: string;
  mimeType: string;
  fileExt: string;
  sizeBytes: number;
  isUserUploaded: boolean;
  createdBy: string;
  createdByUsername: string;
  filePath: string;
  archivedAt: string;
}

interface ArchivedProjectUnit {
  id: string;
  userId: string;
  userUsername: string;
  userFirstName?: string;
  userLastName?: string;
  unitNumber: string;
  area: number;
  archivedAt: string;
}

interface ArchivedProjectInstallmentDefinition {
  id: string;
  title: string;
  dueDate: string;
  amount: number;
  isDefault: boolean;
  archivedAt: string;
}

interface ArchivedUser {
  id: string;
  originalUserId: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  isActive: boolean;
  archivedAt: string;
  archivedUnits: ArchivedUnit[];
  archivedInstallments: ArchivedUserInstallment[];
  archivedPayments: ArchivedPayment[];
  archivedPenalties: ArchivedPenalty[];
}

interface ArchivedUnit {
  id: string;
  archivedUserId: string;
  projectId: string;
  projectName: string;
  unitNumber: string;
  area: number;
  archivedAt: string;
}

interface ArchivedUserInstallment {
  id: string;
  archivedUserId: string;
  archivedUnitId?: string;
  installmentDefinitionId: string;
  installmentTitle: string;
  shareAmount: number;
  status: string;
  archivedAt: string;
}

interface ArchivedPayment {
  id: string;
  archivedUserInstallmentId: string;
  paymentDate: string;
  amount: number;
  description?: string;
  archivedAt: string;
}

interface ArchivedPenalty {
  id: string;
  archivedUserInstallmentId: string;
  daysLate: number;
  dailyRate: number;
  totalPenalty: number;
  archivedAt: string;
}

interface Stats {
  totalArchivedProjects: number;
  totalArchivedFolders: number;
  totalArchivedDocuments: number;
  totalArchivedUnits: number;
  totalArchivedInstallmentDefinitions: number;
  totalArchivedUsers: number;
  totalArchivedUserUnits: number;
  totalArchivedUserInstallments: number;
  totalArchivedPayments: number;
  totalArchivedPenalties: number;
}

export default function ArchivedFinancialPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [archivedProjects, setArchivedProjects] = useState<ArchivedProject[]>([]);
  const [archivedUsers, setArchivedUsers] = useState<ArchivedUser[]>([]);
  const [selectedArchivedProject, setSelectedArchivedProject] = useState<ArchivedProject | null>(null);
  const [selectedArchivedUser, setSelectedArchivedUser] = useState<ArchivedUser | null>(null);
  const [openProjectDetails, setOpenProjectDetails] = useState(false);
  const [openUserDetails, setOpenUserDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [stats, setStats] = useState<Stats>({
    totalArchivedProjects: 0,
    totalArchivedFolders: 0,
    totalArchivedDocuments: 0,
    totalArchivedUnits: 0,
    totalArchivedInstallmentDefinitions: 0,
    totalArchivedUsers: 0,
    totalArchivedUserUnits: 0,
    totalArchivedUserInstallments: 0,
    totalArchivedPayments: 0,
    totalArchivedPenalties: 0
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info"
  });

  // Fetch data on component mount and tab change
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    
    async function fetchData() {
      setLoading(true);
      try {
        if (activeTab === 0) {
          // Fetch archived projects
          const response = await fetch("/api/archived-projects", { signal });
          if (response.ok) {
            const data = await response.json();
            setArchivedProjects(data.archivedProjects || []);
            setStats(data.stats || {});
          } else {
            console.error("Error fetching archived projects:", response.status);
          }
        } else {
          // Fetch archived users
          const response = await fetch("/api/archived-financial", { signal });
          if (response.ok) {
            const data = await response.json();
            setArchivedUsers(data.archivedUsers || []);
            setStats(data.stats || {});
          } else {
            console.error("Error fetching archived users:", response.status);
          }
        }
      } catch (error) {
        if (!signal.aborted) {
          console.error("Error fetching archived data:", error);
          setSnackbar({
            open: true,
            message: "خطا در بارگذاری اطلاعات آرشیو شده",
            severity: "error"
          });
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    }
    
    fetchData();
    
    return () => {
      controller.abort();
    };
  }, [activeTab]);

  // Helper function to refresh data
  const refreshData = async () => {
    setLoading(true);
    try {
      if (activeTab === 0) {
        // Fetch archived projects
        const response = await fetch("/api/archived-projects");
        if (response.ok) {
          const data = await response.json();
          setArchivedProjects(data.archivedProjects || []);
          setStats(data.stats || {});
        } else {
          console.error("Error fetching archived projects:", response.status);
        }
      } else {
        // Fetch archived users
        const response = await fetch("/api/archived-financial");
        if (response.ok) {
          const data = await response.json();
          setArchivedUsers(data.archivedUsers || []);
          setStats(data.stats || {});
        } else {
          console.error("Error fetching archived users:", response.status);
        }
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
      setSnackbar({
        open: true,
        message: "خطا در بروزرسانی اطلاعات",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewProjectDetails = async (projectId: string) => {
    try {
      const response = await fetch(`/api/archived-projects/${projectId}`);
      const data = await response.json();
      setSelectedArchivedProject(data);
      setOpenProjectDetails(true);
    } catch (error) {
      console.error("Error fetching project details:", error);
      setSnackbar({
        open: true,
        message: "خطا در بارگذاری جزئیات پروژه",
        severity: "error"
      });
    }
  };

  const handleViewUserDetails = async (userId: string) => {
    try {
      const response = await fetch(`/api/archived-financial/${userId}`);
      const data = await response.json();
      setSelectedArchivedUser(data);
      setOpenUserDetails(true);
    } catch (error) {
      console.error("Error fetching user details:", error);
      setSnackbar({
        open: true,
        message: "خطا در بارگذاری جزئیات کاربر",
        severity: "error"
      });
    }
  };

  const handleRestoreProject = async (projectId: string) => {
    if (!confirm("آیا مطمئن هستید که می‌خواهید این پروژه را بازگردانی کنید؟")) {
      return;
    }

    setActionLoading(`restore-project-${projectId}`);
    try {
      const response = await fetch(`/api/archived-projects/${projectId}/restore`, {
        method: "POST"
      });
      const data = await response.json();

      if (data.success) {
        await refreshData();
        dispatchProjectEvent('RESTORED', { projectId, projectName: data.restoredProject?.name });
        setSnackbar({
          open: true,
          message: "پروژه با موفقیت بازگردانی شد",
          severity: "success"
        });
      } else {
        setSnackbar({
          open: true,
          message: data.error || "خطا در بازگردانی پروژه",
          severity: "error"
        });
      }
    } catch (error) {
      console.error("Error restoring project:", error);
      setSnackbar({
        open: true,
        message: "خطا در بازگردانی پروژه",
        severity: "error"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestoreUser = async (userId: string) => {
    if (!confirm("آیا مطمئن هستید که می‌خواهید این کاربر را بازگردانی کنید؟")) {
      return;
    }

    setActionLoading(`restore-user-${userId}`);
    try {
      const response = await fetch(`/api/archived-financial/${userId}/restore`, {
        method: "POST"
      });
      const data = await response.json();

      if (data.success) {
        await refreshData();
        setSnackbar({
          open: true,
          message: "کاربر با موفقیت بازگردانی شد",
          severity: "success"
        });
      } else {
        setSnackbar({
          open: true,
          message: data.error || "خطا در بازگردانی کاربر",
          severity: "error"
        });
      }
    } catch (error) {
      console.error("Error restoring user:", error);
      setSnackbar({
        open: true,
        message: "خطا در بازگردانی کاربر",
        severity: "error"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteArchivedProject = async (projectId: string) => {
    if (!confirm("آیا مطمئن هستید که می‌خواهید این پروژه را برای همیشه حذف کنید؟ این عمل قابل بازگشت نیست.")) {
      return;
    }

    setActionLoading(`delete-project-${projectId}`);
    try {
      const response = await fetch(`/api/archived-projects/${projectId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        await refreshData();
        dispatchProjectEvent('DELETED', { projectId });
        setSnackbar({
          open: true,
          message: "پروژه با موفقیت حذف شد",
          severity: "success"
        });
      } else {
        const data = await response.json();
        setSnackbar({
          open: true,
          message: data.error || "خطا در حذف پروژه",
          severity: "error"
        });
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      setSnackbar({
        open: true,
        message: "خطا در حذف پروژه",
        severity: "error"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteArchivedUser = async (userId: string) => {
    if (!confirm("آیا مطمئن هستید که می‌خواهید این کاربر را برای همیشه حذف کنید؟ این عمل قابل بازگشت نیست.")) {
      return;
    }

    setActionLoading(`delete-user-${userId}`);
    try {
      const response = await fetch(`/api/archived-financial/${userId}`, {
        method: "DELETE"
        });

        if (response.ok) {
        await refreshData();
        setSnackbar({
          open: true,
          message: "کاربر با موفقیت حذف شد",
          severity: "success"
        });
        } else {
        const data = await response.json();
        setSnackbar({
          open: true,
          message: data.error || "خطا در حذف کاربر",
          severity: "error"
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setSnackbar({
        open: true,
        message: "خطا در حذف کاربر",
        severity: "error"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredData = activeTab === 0 
    ? archivedProjects.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.createdByUsername.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : archivedUsers.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );


  
  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 بایت";
    const k = 1024;
    const sizes = ["بایت", "کیلوبایت", "مگابایت", "گیگابایت"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Temporarily disable admin check for testing
  /*
  if (!user || user.role !== "ADMIN") {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          شما مجوز دسترسی به این صفحه را ندارید.
        </Alert>
      </Container>
    );
  }
  */

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          آرشیو شده‌ها
        </Typography>
        <Typography variant="body1" color="text.secondary">
          مدیریت پروژه‌ها و کاربران آرشیو شده
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="پروژه‌های آرشیو شده" />
          <Tab label="کاربران آرشیو شده" />
        </Tabs>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        {activeTab === 0 ? (
          // Project statistics
          <>
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <Card sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
                      <Typography variant="h6" component="div" fontWeight="bold" color="primary.main">
                        {stats.totalArchivedProjects || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
          پروژه‌های آرشیو شده
        </Typography>
                    </Box>
                    <Business sx={{ fontSize: 24, color: 'primary.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <Card sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" component="div" fontWeight="bold" color="success.main">
                        {stats.totalArchivedFolders || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        پوشه‌های آرشیو شده
                      </Typography>
                    </Box>
                    <Folder sx={{ fontSize: 24, color: 'success.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <Card sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" component="div" fontWeight="bold" color="info.main">
                        {stats.totalArchivedDocuments || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        اسناد آرشیو شده
                      </Typography>
                    </Box>
                    <Description sx={{ fontSize: 24, color: 'info.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <Card sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" component="div" fontWeight="bold" color="warning.main">
                        {stats.totalArchivedUnits || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        واحدهای آرشیو شده
                      </Typography>
                    </Box>
                    <AttachMoney sx={{ fontSize: 24, color: 'warning.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <Card sx={{ bgcolor: 'error.50', border: '1px solid', borderColor: 'error.200' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" component="div" fontWeight="bold" color="error.main">
                        {stats.totalArchivedInstallmentDefinitions || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        تعریف اقساط آرشیو شده
                      </Typography>
                    </Box>
                    <Receipt sx={{ fontSize: 24, color: 'error.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </>
        ) : (
          // User statistics
          <>
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <Card sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" component="div" fontWeight="bold" color="primary.main">
                        {stats.totalArchivedUsers || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        کاربران آرشیو شده
                      </Typography>
                    </Box>
                    <Person sx={{ fontSize: 24, color: 'primary.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <Card sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" component="div" fontWeight="bold" color="success.main">
                        {stats.totalArchivedUserUnits || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        واحدهای آرشیو شده
                      </Typography>
                    </Box>
                    <AttachMoney sx={{ fontSize: 24, color: 'success.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <Card sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" component="div" fontWeight="bold" color="info.main">
                        {stats.totalArchivedUserInstallments || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        اقساط آرشیو شده
                      </Typography>
                    </Box>
                    <Receipt sx={{ fontSize: 24, color: 'info.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <Card sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" component="div" fontWeight="bold" color="warning.main">
                        {stats.totalArchivedPayments || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        پرداخت‌های آرشیو شده
                      </Typography>
                    </Box>
                    <AttachMoney sx={{ fontSize: 24, color: 'warning.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <Card sx={{ bgcolor: 'error.50', border: '1px solid', borderColor: 'error.200' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
                      <Typography variant="h6" component="div" fontWeight="bold" color="error.main">
                        {stats.totalArchivedPenalties || 0}
          </Typography>
                      <Typography variant="caption" color="text.secondary">
                        جریمه‌های آرشیو شده
          </Typography>
        </Box>
                    <Warning sx={{ fontSize: 24, color: 'error.main' }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </>
        )}
      </Box>

      {/* Search and Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <TextField
          placeholder={activeTab === 0 ? "جستجو در پروژه‌ها..." : "جستجو در کاربران..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => refreshData()}
          disabled={loading}
        >
          بروزرسانی
        </Button>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {paginatedData.map((item) => (
            <Card key={item.id} sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {activeTab === 0 ? (
                    <Business sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                  ) : (
                    <Person sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                  )}
                  <Box>
                    <Typography variant="h6" component="div" fontWeight="bold">
                      {activeTab === 0 ? (item as ArchivedProject).name : (item as ArchivedUser).username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {activeTab === 0 
                        ? `سازنده: ${(item as ArchivedProject).createdByUsername}`
                        : `${(item as ArchivedUser).firstName} ${(item as ArchivedUser).lastName}`
                      }
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    تاریخ آرشیو: {formatDate(item.archivedAt)}
                  </Typography>
                  {activeTab === 0 && (
                    <Chip 
                      label={(item as ArchivedProject).status} 
                      size="small" 
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  {activeTab === 0 ? (
                    <>
                      <Chip label={`${(item as ArchivedProject).archivedFolders.length} پوشه`} size="small" />
                      <Chip label={`${(item as ArchivedProject).archivedDocuments.length} سند`} size="small" />
                      <Chip label={`${(item as ArchivedProject).archivedUnits.length} واحد`} size="small" />
                    </>
                  ) : (
                    <>
                      <Chip label={`${(item as ArchivedUser).archivedUnits?.length || 0} واحد`} size="small" />
                      <Chip label={`${(item as ArchivedUser).archivedInstallments?.length || 0} قسط`} size="small" />
                      <Chip label={`${(item as ArchivedUser).archivedPayments?.length || 0} پرداخت`} size="small" />
                    </>
                  )}
                </Box>
              </CardContent>

              <CardActions>
                <IconButton
                  onClick={() => activeTab === 0 
                    ? handleViewProjectDetails(item.id) 
                    : handleViewUserDetails(item.id)
                  }
                  color="primary"
                >
                  <Visibility />
                </IconButton>
                    <IconButton 
                  onClick={() => activeTab === 0 
                    ? handleRestoreProject(item.id) 
                    : handleRestoreUser(item.id)
                  }
                      color="success"
                      disabled={actionLoading === `restore-${activeTab === 0 ? 'project' : 'user'}-${item.id}`}
                    >
                  {actionLoading === `restore-${activeTab === 0 ? 'project' : 'user'}-${item.id}` ? 
                    <CircularProgress size={20} /> : <Restore />}
                    </IconButton>
                    <IconButton 
                  onClick={() => activeTab === 0 
                    ? handleDeleteArchivedProject(item.id) 
                    : handleDeleteArchivedUser(item.id)
                  }
                      color="error"
                      disabled={actionLoading === `delete-${activeTab === 0 ? 'project' : 'user'}-${item.id}`}
                    >
                      {actionLoading === `delete-${activeTab === 0 ? 'project' : 'user'}-${item.id}` ? 
                        <CircularProgress size={20} /> : <Delete />}
                    </IconButton>
              </CardActions>
            </Card>
        ))}
      </Box>
      )}

      {/* Pagination */}
      {filteredData.length > rowsPerPage && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <TablePagination
            component="div"
            count={filteredData.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="تعداد در صفحه:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} از ${count}`
            }
          />
        </Box>
      )}

      {/* Project Details Dialog */}
      <Dialog
        open={openProjectDetails}
        onClose={() => setOpenProjectDetails(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          جزئیات پروژه آرشیو شده: {selectedArchivedProject?.name}
        </DialogTitle>
        <DialogContent>
          {selectedArchivedProject && (
            <Box>
              <Typography variant="h6" gutterBottom>
                اطلاعات پروژه
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>نام:</strong> {selectedArchivedProject.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>توضیحات:</strong> {selectedArchivedProject.description || "ندارد"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>وضعیت:</strong> {selectedArchivedProject.status}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>سازنده:</strong> {selectedArchivedProject.createdByUsername}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>تاریخ آرشیو:</strong> {formatDate(selectedArchivedProject.archivedAt)}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                پوشه‌های آرشیو شده ({selectedArchivedProject.archivedFolders.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {selectedArchivedProject.archivedFolders.map((folder) => (
                  <Chip
                    key={folder.id}
                    label={folder.name}
                    size="small"
                    icon={<Folder />}
                  />
                ))}
          </Box>

              <Typography variant="h6" gutterBottom>
                اسناد آرشیو شده ({selectedArchivedProject.archivedDocuments.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {selectedArchivedProject.archivedDocuments.map((document) => (
                  <Chip
                    key={document.id}
                    label={`${document.name} (${formatFileSize(document.sizeBytes)})`}
                    size="small"
                    icon={<Description />}
                  />
        ))}
      </Box>

              <Typography variant="h6" gutterBottom>
                واحدهای آرشیو شده ({selectedArchivedProject.archivedUnits.length})
          </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {selectedArchivedProject.archivedUnits.map((unit) => (
                  <Chip
                    key={unit.id}
                    label={`واحد ${unit.unitNumber} - ${unit.userUsername} (${unit.area} متر)`}
                    size="small"
                  />
                ))}
              </Box>

              <Typography variant="h6" gutterBottom>
                تعریف اقساط آرشیو شده ({selectedArchivedProject.archivedInstallmentDefinitions.length})
          </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedArchivedProject.archivedInstallmentDefinitions.map((installment) => (
                  <Chip
                    key={installment.id}
                    label={`${installment.title} - ${installment.amount.toLocaleString()} تومان`}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProjectDetails(false)}>
            بستن
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog
        open={openUserDetails}
        onClose={() => setOpenUserDetails(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          جزئیات کاربر آرشیو شده: {selectedArchivedUser?.username}
        </DialogTitle>
        <DialogContent>
          {selectedArchivedUser && (
            <Box>
              {/* اطلاعات کاربر */}
              <Typography variant="h6" gutterBottom>
                اطلاعات کاربر
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>نام کاربری</TableCell>
                      <TableCell>نام</TableCell>
                      <TableCell>ایمیل</TableCell>
                      <TableCell>نقش</TableCell>
                      <TableCell>تاریخ آرشیو</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{selectedArchivedUser.username}</TableCell>
                      <TableCell>{selectedArchivedUser.firstName} {selectedArchivedUser.lastName}</TableCell>
                      <TableCell>{selectedArchivedUser.email}</TableCell>
                      <TableCell>{selectedArchivedUser.role}</TableCell>
                      <TableCell>{formatDate(selectedArchivedUser.archivedAt)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 2 }} />

              {/* واحدهای آرشیو شده */}
              <Typography variant="h6" gutterBottom>
                واحدهای آرشیو شده ({selectedArchivedUser.archivedUnits?.length || 0})
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>پروژه</TableCell>
                      <TableCell>شماره واحد</TableCell>
                      <TableCell>مساحت (متر)</TableCell>
                      <TableCell>تاریخ آرشیو</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(selectedArchivedUser.archivedUnits || []).map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell>{unit.projectName}</TableCell>
                        <TableCell>{unit.unitNumber}</TableCell>
                        <TableCell>{unit.area}</TableCell>
                        <TableCell>{formatDate(unit.archivedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 2 }} />

              {/* اقساط آرشیو شده */}
              <Typography variant="h6" gutterBottom>
                اقساط آرشیو شده ({selectedArchivedUser.archivedInstallments?.length || 0})
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>پروژه</TableCell>
                      <TableCell>عنوان قسط</TableCell>
                      <TableCell>مبلغ (تومان)</TableCell>
                      <TableCell>وضعیت</TableCell>
                      <TableCell>تاریخ آرشیو</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(selectedArchivedUser.archivedInstallments || []).map((installment) => (
                      <TableRow key={installment.id}>
                        <TableCell>پروژه حذف شده</TableCell>
                        <TableCell>{installment.installmentTitle}</TableCell>
                        <TableCell>{installment.shareAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={installment.status === 'PAID' ? 'پرداخت شده' : 'در انتظار'} 
                            color={installment.status === 'PAID' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatDate(installment.archivedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 2 }} />

              {/* پرداخت‌های آرشیو شده */}
              <Typography variant="h6" gutterBottom>
                پرداخت‌های آرشیو شده ({selectedArchivedUser.archivedPayments?.length || 0})
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>پروژه</TableCell>
                      <TableCell>عنوان قسط</TableCell>
                      <TableCell>مبلغ (تومان)</TableCell>
                      <TableCell>تاریخ پرداخت</TableCell>
                      <TableCell>توضیحات</TableCell>
                      <TableCell>تاریخ آرشیو</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(selectedArchivedUser.archivedPayments || []).map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>پروژه حذف شده</TableCell>
                        <TableCell>قسط مربوطه</TableCell>
                        <TableCell>{payment.amount.toLocaleString()}</TableCell>
                        <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                        <TableCell>{payment.description || '-'}</TableCell>
                        <TableCell>{formatDate(payment.archivedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 2 }} />

              {/* جریمه‌های آرشیو شده */}
              <Typography variant="h6" gutterBottom>
                جریمه‌های آرشیو شده ({selectedArchivedUser.archivedPenalties?.length || 0})
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>پروژه</TableCell>
                      <TableCell>عنوان قسط</TableCell>
                      <TableCell>مبلغ جریمه (تومان)</TableCell>
                      <TableCell>تعداد روز تاخیر</TableCell>
                      <TableCell>نرخ روزانه</TableCell>
                      <TableCell>تاریخ آرشیو</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(selectedArchivedUser.archivedPenalties || []).map((penalty) => (
                      <TableRow key={penalty.id}>
                        <TableCell>پروژه حذف شده</TableCell>
                        <TableCell>قسط مربوطه</TableCell>
                        <TableCell>{penalty.totalPenalty.toLocaleString()}</TableCell>
                        <TableCell>{penalty.daysLate}</TableCell>
                        <TableCell>{penalty.dailyRate.toLocaleString()}</TableCell>
                        <TableCell>{formatDate(penalty.archivedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
        </Box>
      )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUserDetails(false)}>
            بستن
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}