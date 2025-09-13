"use client";
import { Typography, Box, CircularProgress, Alert } from "@mui/material";
import InstallmentTable from "@/components/finance/InstallmentTable";
import { useState, useEffect } from "react";

interface Installment {
  id: string;
  title: string;
  dueDate: string;
  shareAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  order: number;
}

export default function UserInstallmentsPage({ params }: { params: Promise<{ id: string; userId: string }> }) {
  const [projectId, setProjectId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializePage = async () => {
      try {
        const resolvedParams = await params;
        setProjectId(resolvedParams.id);
        setUserId(resolvedParams.userId);
        await fetchInstallments(resolvedParams.id, resolvedParams.userId);
      } catch (error) {
        console.error("Error initializing page:", error);
        setError("خطا در بارگذاری صفحه");
      }
    };
    
    initializePage();
  }, [params]);

  const fetchInstallments = async (projectId: string, userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/finance/projects/${projectId}/users/${userId}/installments`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "خطا در دریافت اقساط کاربر");
      }
      
      const data = await response.json();
      setInstallments(data);
    } catch (err) {
      console.error("Error fetching installments:", err);
      setError(err instanceof Error ? err.message : "خطای نامشخص");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            در حال بارگذاری...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          fontFamily: 'Vazirmatn, Arial, sans-serif',
          fontWeight: 'bold',
          mb: 3
        }}
      >
        اقساط کاربر
      </Typography>
      
      <InstallmentTable 
        installments={installments} 
        onRefresh={() => fetchInstallments(projectId, userId)}
        onUpdateInstallments={setInstallments}
        projectId={projectId}
      />
    </Box>
  );
}
