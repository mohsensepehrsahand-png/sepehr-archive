"use client";
import { useState, useEffect } from "react";
import { Box, Typography, Paper, LinearProgress, useTheme } from "@mui/material";
import { Timeline } from "@mui/icons-material";
import ProjectPaymentChart from "./ProjectPaymentChart";

interface ProjectData {
  id: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  userCount: number;
  paymentProgress: number;
}

interface ProjectPaymentProgressWidgetProps {
  isAdmin: boolean;
}

export default function ProjectPaymentProgressWidget({ isAdmin }: ProjectPaymentProgressWidgetProps) {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    if (isAdmin) {
      fetchFinancialData();
    }
  }, [isAdmin]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/financial-summary');
      if (response.ok) {
        const summary = await response.json();
        
        const projectsData = summary.projects.map((project: any) => ({
          id: project.id,
          name: project.name,
          totalAmount: project.totalAmount,
          paidAmount: project.paidAmount,
          remainingAmount: project.remainingAmount,
          userCount: project.userCount,
          paymentProgress: project.paymentProgress
        }));

        setProjects(projectsData);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <Paper sx={{ p: 3, height: '100%', borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          پیشرفت پرداخت پروژه‌ها
        </Typography>
        <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height: '100%', borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Timeline sx={{ color: 'primary.main', fontSize: 24 }} />
        <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          پیشرفت پرداخت پروژه‌ها
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <ProjectPaymentChart projects={projects} />
      </Box>
    </Paper>
  );
}

