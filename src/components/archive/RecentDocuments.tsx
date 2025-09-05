"use client";
import { Paper, Typography, List, ListItem, ListItemText, ListItemIcon, Avatar, Box, Chip, Button, useTheme, alpha } from "@mui/material";
import { Description, Download, Visibility, Edit } from "@mui/icons-material";

interface Document {
  id: number;
  name: string;
  project: string;
  size: string;
  type: string;
  status: 'approved' | 'pending' | 'review' | 'rejected';
  lastModified: string;
}

interface RecentDocumentsProps {
  documents?: Document[];
  compact?: boolean;
}

export default function RecentDocuments({ documents = [], compact = false }: RecentDocumentsProps) {
  const theme = useTheme();

  const defaultDocuments: Document[] = [
    {
      id: 1,
      name: "پلان معماری طبقه اول.pdf",
      project: "ساختمان مسکونی",
      size: "2.4 MB",
      type: "PDF",
      status: "approved",
      lastModified: "2 ساعت پیش"
    },
    {
      id: 2,
      name: "متره و برآورد.xlsx",
      project: "مرکز خرید",
      size: "1.8 MB",
      type: "Excel",
      status: "pending",
      lastModified: "1 روز پیش"
    },
    {
      id: 3,
      name: "تصاویر سایت.jpg",
      project: "بیمارستان",
      size: "5.2 MB",
      type: "Image",
      status: "review",
      lastModified: "2 روز پیش"
    },
    {
      id: 4,
      name: "گزارش فنی.docx",
      project: "ساختمان اداری",
      size: "890 KB",
      type: "Word",
      status: "approved",
      lastModified: "3 روز پیش"
    },
    {
      id: 5,
      name: "نقشه سازه.dwg",
      project: "پل شهری",
      size: "3.1 MB",
      type: "AutoCAD",
      status: "pending",
      lastModified: "1 هفته پیش"
    }
  ];

  const displayDocuments = documents.length > 0 ? documents : defaultDocuments;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'review': return 'info';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'تایید شده';
      case 'pending': return 'در انتظار';
      case 'review': return 'در حال بررسی';
      case 'rejected': return 'رد شده';
      default: return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': return <Description sx={{ color: '#dc2626' }} />;
      case 'excel':
      case 'xlsx':
      case 'xls': return <Description sx={{ color: '#059669' }} />;
      case 'word':
      case 'docx':
      case 'doc': return <Description sx={{ color: '#2563eb' }} />;
      case 'image':
      case 'jpg':
      case 'png':
      case 'gif': return <Description sx={{ color: '#7c3aed' }} />;
      case 'autocad':
      case 'dwg': return <Description sx={{ color: '#ea580c' }} />;
      default: return <Description />;
    }
  };

  if (compact) {
    return (
      <List sx={{ p: 0 }}>
        {displayDocuments.slice(0, 4).map((doc, index) => (
          <Box key={doc.id}>
            <ListItem sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Avatar sx={{ 
                  width: 24, 
                  height: 24, 
                  bgcolor: alpha(theme.palette.background.default, 0.8)
                }}>
                  {getTypeIcon(doc.type)}
                </Avatar>
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Typography variant="caption" fontWeight="bold" sx={{ mb: 0.5, lineHeight: 1.2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    {doc.name}
                  </Typography>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" component="span" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', lineHeight: 1.2 }}>
                      {doc.project}
                    </Typography>
                    <Typography variant="caption" component="div" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', mt: 0.5 }}>
                      {doc.lastModified}
                    </Typography>
                  </Box>
                }
                sx={{ '& .MuiListItemText-primary': { mb: 0.5 } }}
              />
            </ListItem>
            {index < Math.min(displayDocuments.length, 4) - 1 && (
              <Box sx={{ 
                height: 1, 
                bgcolor: alpha(theme.palette.divider, 0.2), 
                mx: 1 
              }} />
            )}
          </Box>
        ))}
      </List>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
        اسناد اخیر
      </Typography>
      
      <List sx={{ p: 0 }}>
        {displayDocuments.map((doc, index) => (
          <Box key={doc.id}>
            <ListItem sx={{ px: 0, py: 1.5 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Avatar sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: alpha(theme.palette.background.default, 0.8)
                }}>
                  {getTypeIcon(doc.type)}
                </Avatar>
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5, lineHeight: 1.3, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    {doc.name}
                  </Typography>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" component="span" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {doc.project} • {doc.size} • {doc.type}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip 
                        label={getStatusText(doc.status)} 
                        size="small" 
                        color={getStatusColor(doc.status) as any}
                        sx={{ borderRadius: 1, height: 20, fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        {doc.lastModified}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
              
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Button
                  size="small"
                  startIcon={<Visibility />}
                  variant="outlined"
                  sx={{ minWidth: 'auto', px: 1, borderRadius: 1, fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                />
                <Button
                  size="small"
                  startIcon={<Download />}
                  variant="outlined"
                  sx={{ minWidth: 'auto', px: 1, borderRadius: 1, fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                />
              </Box>
            </ListItem>
            {index < displayDocuments.length - 1 && (
              <Box sx={{ 
                height: 1, 
                bgcolor: alpha(theme.palette.divider, 0.3), 
                mx: 2 
              }} />
            )}
          </Box>
        ))}
      </List>
    </Paper>
  );
}
