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
      elevation={isHovered ? 4 : 2}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-2px)',
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent sx={{ flexGrow: 1, p: 2, pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <AccountBalance color="primary" fontSize="small" />
            <Typography 
              variant="subtitle1" 
              component="h3" 
              sx={{ 
                fontWeight: 'bold',
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                fontSize: '0.95rem'
              }}
            >
              {project.name}
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            endIcon={<ArrowForward />}
            onClick={handleNavigateToAccounting}
            sx={{
              fontFamily: 'Vazirmatn, Arial, sans-serif',
              fontWeight: 'bold',
              py: 0.5,
              px: 1.5,
              fontSize: '0.75rem',
              minWidth: 'auto'
            }}
          >
            ورود
          </Button>
        </Box>

        <Box mb={1}>
          <ProjectFiscalYearManager project={project} />
        </Box>
      </CardContent>
    </Card>
  );
}
