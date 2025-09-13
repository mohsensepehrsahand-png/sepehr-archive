"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
  IconButton,
  Collapse,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from "@mui/material";
import {
  ExpandMore,
  ExpandLess,
  Add,
  Visibility,
  Edit,
  Delete,
  Receipt
} from "@mui/icons-material";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AddReceiptDialog from "./AddReceiptDialog";
import EditReceiptDialog from "./EditReceiptDialog";
import ReceiptImageViewer from "./ReceiptImageViewer";

interface Receipt {
  id: string;
  receiptNumber: string;
  amount: number;
  receiptDate: string | null;
  description: string | null;
  receiptImagePath: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  description?: string;
  receiptImagePath?: string;
}

interface Installment {
  id: string;
  title: string;
  dueDate: string;
  shareAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  order?: number;
  paymentDate?: string;
  payments?: Payment[];
}

interface InstallmentTableProps {
  installments: Installment[];
  onRefresh?: () => void;
  onUpdateInstallments?: (installments: Installment[]) => void;
  projectId?: string;
  onEditInstallment?: (installment: Installment) => void;
  onDeleteInstallment?: (installmentId: string) => void;
}

export default function InstallmentTable({ 
  installments, 
  onRefresh, 
  onUpdateInstallments, 
  projectId, 
  onEditInstallment, 
  onDeleteInstallment 
}: InstallmentTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [receipts, setReceipts] = useState<Record<string, Receipt[]>>({});
  const [addReceiptDialogOpen, setAddReceiptDialogOpen] = useState(false);
  const [editReceiptDialogOpen, setEditReceiptDialogOpen] = useState(false);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [receiptImageViewerOpen, setReceiptImageViewerOpen] = useState(false);
  const [selectedReceiptForView, setSelectedReceiptForView] = useState<Receipt | null>(null);
  const { isAdmin } = useAuth();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fa-IR").format(amount) + " ریال";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  const toggleRowExpansion = async (installmentId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(installmentId)) {
      newExpandedRows.delete(installmentId);
    } else {
      newExpandedRows.add(installmentId);
      // Load receipts when expanding
      await loadReceipts(installmentId);
    }
    setExpandedRows(newExpandedRows);
  };

  const loadReceipts = async (installmentId: string) => {
    try {
      const response = await fetch(`/api/finance/receipts?installmentId=${installmentId}`);
      if (response.ok) {
        const receiptsData = await response.json();
        setReceipts(prev => ({
          ...prev,
          [installmentId]: receiptsData
        }));
      }
    } catch (error) {
      console.error("Error loading receipts:", error);
    }
  };

  const handleAddReceipt = (installmentId: string) => {
    setSelectedInstallmentId(installmentId);
    setAddReceiptDialogOpen(true);
  };

  const handleSaveReceipt = async (receiptData: {
    amount: number;
    receiptDate: string;
    description: string;
  }) => {
    if (!selectedInstallmentId) return;

    try {
      setLoading(true);
      const response = await fetch("/api/finance/receipts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userInstallmentId: selectedInstallmentId,
          ...receiptData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "خطا در ایجاد فیش");
      }

      // Reload receipts for this installment
      await loadReceipts(selectedInstallmentId);
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error saving receipt:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleEditReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setEditReceiptDialogOpen(true);
  };

  const handleUpdateReceipt = async (receiptId: string, receiptData: {
    amount: number;
    receiptDate: string;
    description: string;
  }) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/finance/receipts/${receiptId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(receiptData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "خطا در به‌روزرسانی فیش");
      }

      // Reload receipts for this installment
      if (selectedInstallmentId) {
        await loadReceipts(selectedInstallmentId);
      }
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error updating receipt:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReceipt = async (receiptId: string) => {
    if (!confirm("آیا از حذف این فیش اطمینان دارید؟")) return;

    try {
      const response = await fetch(`/api/finance/receipts/${receiptId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "خطا در حذف فیش");
      }

      // Reload receipts for this installment
      if (selectedInstallmentId) {
        await loadReceipts(selectedInstallmentId);
      }
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting receipt:", error);
      alert(error instanceof Error ? error.message : "خطا در حذف فیش");
    }
  };

  const handleViewReceipt = (receipt: Receipt) => {
    setSelectedReceiptForView(receipt);
    setReceiptImageViewerOpen(true);
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      "پرداخت شده": { color: "success" as const },
      "بخشی پرداخت شده": { color: "warning" as const },
      "در انتظار پرداخت": { color: "default" as const },
      "معوق": { color: "error" as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig["در انتظار پرداخت"];
    return (
      <Chip
        label={status}
        color={config.color}
        size="small"
        sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
      />
    );
  };

  if (installments.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          هیچ قسطی یافت نشد
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: '100%' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                شماره قسط
              </TableCell>
              <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                بابت
              </TableCell>
              <TableCell align="left" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                مبلغ قسط
              </TableCell>
              <TableCell align="left" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                مبلغ پرداختی
              </TableCell>
              <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                تاریخ سررسید
              </TableCell>
              <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                تاریخ پرداخت
              </TableCell>
              <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                وضعیت
              </TableCell>
              <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                عملیات
              </TableCell>
              <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold', width: '50px' }}>
                فیش‌ها
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {installments.map((installment, index) => {
              const isExpanded = expandedRows.has(installment.id);
              const installmentReceipts = receipts[installment.id] || [];
              
              return (
                <React.Fragment key={installment.id}>
                  <TableRow hover>
                    <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {installment.order || index + 1}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {installment.title}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {formatCurrency(installment.shareAmount)}
                    </TableCell>
                    <TableCell sx={{ 
                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                      color: installment.paidAmount > 0 ? 'success.main' : 'text.primary'
                    }}>
                      {formatCurrency(installment.paidAmount)}
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {formatDate(installment.dueDate)}
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {installment.paymentDate ? formatDate(installment.paymentDate) : '-'}
                    </TableCell>
                    <TableCell align="center">
                      {getStatusChip(installment.status)}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        {isAdmin && onEditInstallment && (
                          <IconButton
                            onClick={() => onEditInstallment(installment)}
                            size="small"
                            color="primary"
                            title="ویرایش قسط"
                          >
                            <Edit />
                          </IconButton>
                        )}
                        {isAdmin && onDeleteInstallment && (
                          <IconButton
                            onClick={() => onDeleteInstallment(installment.id)}
                            size="small"
                            color="error"
                            title="حذف قسط"
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => toggleRowExpansion(installment.id)}
                        sx={{ color: 'primary.main' }}
                      >
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell colSpan={9} sx={{ py: 0, border: 0 }}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                          <Card variant="outlined">
                            <CardContent>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                gap: 1,
                                mb: 2 
                              }}>
                                <Typography 
                                  variant="h6" 
                                  sx={{ 
                                    fontFamily: 'Vazirmatn, Arial, sans-serif',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                  }}
                                >
                                  <Receipt color="primary" />
                                  فیش‌های پرداخت:
                                </Typography>
                                
                                {isAdmin && (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<Add />}
                                    onClick={() => handleAddReceipt(installment.id)}
                                    sx={{ 
                                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                                      minWidth: 'auto',
                                      px: 1.5,
                                      py: 0.5,
                                      fontSize: '0.8rem'
                                    }}
                                  >
                                    اضافه کردن فیش
                                  </Button>
                                )}
                              </Box>
                              
                              {installmentReceipts.length > 0 ? (
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                                        شماره فیش
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                                        مبلغ فیش
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                                        تاریخ فیش
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                                        توضیحات
                                      </TableCell>
                                      <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontWeight: 'bold' }}>
                                        عملیات
                                      </TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {installmentReceipts.map((receipt) => (
                                      <TableRow key={receipt.id}>
                                        <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                                          {receipt.receiptNumber}
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                                          {formatCurrency(receipt.amount)}
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                                          {receipt.receiptDate ? formatDate(receipt.receiptDate) : '-'}
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                                          {receipt.description || '-'}
                                        </TableCell>
                                        <TableCell>
                                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                            {isAdmin && (
                                              <Button
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                                startIcon={<Edit />}
                                                onClick={() => handleEditReceipt(receipt)}
                                                sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                                              >
                                                ویرایش
                                              </Button>
                                            )}
                                            
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              color="info"
                                              startIcon={<Visibility />}
                                              onClick={() => handleViewReceipt(receipt)}
                                              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                                            >
                                              نمایش
                                            </Button>
                                            
                                            {isAdmin && (
                                              <Button
                                                size="small"
                                                variant="outlined"
                                                color="error"
                                                startIcon={<Delete />}
                                                onClick={() => handleDeleteReceipt(receipt.id)}
                                                sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                                              >
                                                حذف
                                              </Button>
                                            )}
                                          </Box>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <Box sx={{ textAlign: 'center', py: 3 }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                                    هیچ فیشی برای این قسط ثبت نشده است
                                  </Typography>
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Add Receipt Dialog */}
      <AddReceiptDialog
        open={addReceiptDialogOpen}
        onClose={() => {
          setAddReceiptDialogOpen(false);
          setSelectedInstallmentId(null);
        }}
        onSave={handleSaveReceipt}
        installmentTitle={installments.find(i => i.id === selectedInstallmentId)?.title || ""}
        projectId={projectId}
      />

      {/* Edit Receipt Dialog */}
      <EditReceiptDialog
        open={editReceiptDialogOpen}
        onClose={() => {
          setEditReceiptDialogOpen(false);
          setSelectedReceipt(null);
        }}
        onSave={handleUpdateReceipt}
        receipt={selectedReceipt}
      />

      {/* Receipt Image Viewer */}
      <ReceiptImageViewer
        open={receiptImageViewerOpen}
        onClose={() => {
          setReceiptImageViewerOpen(false);
          setSelectedReceiptForView(null);
        }}
        receiptImagePath={selectedReceiptForView?.receiptImagePath || ""}
        receiptNumber={selectedReceiptForView?.receiptNumber || ""}
      />
    </Box>
  );
}