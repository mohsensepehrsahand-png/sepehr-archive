"use client";
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Calculate
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ProjectAccountingCard from '@/components/accounting/ProjectAccountingCard';

interface Project {
  id: string;
  name: string;
  createdAt: string;
}

export default function AccountingPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard');
      return;
    }

    if (isAdmin) {
      fetchProjects();
    }
  }, [isAdmin, authLoading, router]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('خطا در دریافت پروژه‌ها');
      }
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('خطا در دریافت پروژه‌ها');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box p={3}>
        <Alert severity="error">
          شما مجوز دسترسی به بخش حسابداری ندارید
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ 
          fontFamily: 'Vazirmatn, Arial, sans-serif',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Calculate color="primary" />
          حسابداری - انتخاب پروژه
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {projects.map((project) => (
          <Grid item xs={12} md={6} lg={4} key={project.id}>
            <ProjectAccountingCard project={project} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
