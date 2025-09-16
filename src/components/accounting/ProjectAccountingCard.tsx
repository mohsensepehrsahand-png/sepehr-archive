"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  AccountBalance,
  ArrowForward,
  CalendarToday,
  Description
} from '@mui/icons-material';
import ProjectFiscalYearManager from './ProjectFiscalYearManager';

interface Project {
  id: string;
  name: string;
  createdAt: string;
}

interface ProjectAccountingCardProps {
  project: Project;
}

export default function ProjectAccountingCard({ project }: ProjectAccountingCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleNavigateToAccounting = () => {
    router.push(`/accounting/${project.id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  return (
    <Card 
      elevation={isHovered ? 6 : 3}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease-in-out',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <AccountBalance color="primary" />
          <Typography 
            variant="h6" 
            component="h3" 
            sx={{ 
              fontWeight: 'bold',
              fontFamily: 'Vazirmatn, Arial, sans-serif',
              flexGrow: 1
            }}
          >
            {project.name}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <CalendarToday fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            تاریخ ایجاد: {formatDate(project.createdAt)}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
            مدیریت سال مالی
          </Typography>
          <ProjectFiscalYearManager project={project} />
        </Box>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant="contained"
          endIcon={<ArrowForward />}
          onClick={handleNavigateToAccounting}
          fullWidth
          sx={{
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            fontWeight: 'bold',
            py: 1.5,
            borderRadius: 2
          }}
        >
          ورود به حسابداری پروژه
        </Button>
      </CardActions>
    </Card>
  );
}
