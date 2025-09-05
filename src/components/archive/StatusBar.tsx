"use client";
import { Box, Paper, Typography, Chip, useTheme, alpha } from "@mui/material";
import { CheckCircle, Warning, Error, Security, Storage } from "@mui/icons-material";

interface StatusBarProps {
  backendStatus: 'online' | 'offline' | 'warning';
  securityStatus: 'active' | 'warning' | 'error';
  databaseStatus: 'healthy' | 'warning' | 'error';
}

export default function StatusBar({ 
  backendStatus = 'online', 
  securityStatus = 'active', 
  databaseStatus = 'healthy' 
}: StatusBarProps) {
  const theme = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'active':
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'offline':
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'active':
      case 'healthy':
        return <CheckCircle fontSize="small" />;
      case 'warning':
        return <Warning fontSize="small" />;
      case 'offline':
      case 'error':
        return <Error fontSize="small" />;
      default:
        return <CheckCircle fontSize="small" />;
    }
  };

  const getStatusText = (status: string, type: string) => {
    switch (type) {
      case 'backend':
        return status === 'online' ? 'بک‌اند آنلاین' : 
               status === 'warning' ? 'بک‌اند هشدار' : 'بک‌اند آفلاین';
      case 'security':
        return status === 'active' ? 'امنیت فعال' : 
               status === 'warning' ? 'امنیت هشدار' : 'امنیت غیرفعال';
      case 'database':
        return status === 'healthy' ? 'پایگاه داده سالم' : 
               status === 'warning' ? 'پایگاه داده هشدار' : 'خطا در پایگاه داده';
      default:
        return '';
    }
  };

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 2,
        background: `linear-gradient(90deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.default, 0.9)})`,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        mb: 3
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          وضعیت بک‌اند و امنیت:
        </Typography>
        
        <Chip
          icon={getStatusIcon(backendStatus)}
          label={getStatusText(backendStatus, 'backend')}
          color={getStatusColor(backendStatus) as any}
          size="small"
          sx={{ borderRadius: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        />
        
        <Chip
          icon={<Security fontSize="small" />}
          label={getStatusText(securityStatus, 'security')}
          color={getStatusColor(securityStatus) as any}
          size="small"
          sx={{ borderRadius: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        />
        
        <Chip
          icon={<Storage fontSize="small" />}
          label={getStatusText(databaseStatus, 'database')}
          color={getStatusColor(databaseStatus) as any}
          size="small"
          sx={{ borderRadius: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}
        />
      </Box>
    </Paper>
  );
}
