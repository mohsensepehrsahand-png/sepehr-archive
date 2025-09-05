"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery
} from "@mui/material";
import {
  ArrowBack,
  Download,
  Visibility,
  Share,
  Print
} from "@mui/icons-material";
import Link from "next/link";

type Props = { params: { id: string } };

interface Document {
  id: string;
  name: string;
  description?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  folderId?: string;
  uploadedBy: string;
  createdAt: string;
  filePath: string;
  fileExt: string;
}

export default function DocumentViewerPage({ params }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/documents/${params.id}`);
        if (!response.ok) {
          throw new Error('خطا در دریافت اطلاعات سند');
        }
        const data = await response.json();
        setDocument(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'خطا در دریافت سند');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchDocument();
    }
  }, [params.id]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel')) return '📊';
    return '📄';
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !document) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error">
          {error || 'سند یافت نشد'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Paper sx={{ 
        p: { xs: 2, md: 3 }, 
        mb: 3, 
        borderRadius: 3,
        boxShadow: 2
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' }, 
          justifyContent: 'space-between', 
          gap: 2 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Typography variant="h4">
              {getFileIcon(document.mimeType)}
            </Typography>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="h4" 
                component="h1" 
                fontWeight="bold"
                sx={{ 
                  fontSize: { xs: '1.5rem', md: '2rem' },
                  fontFamily: 'Vazirmatn, Arial, sans-serif',
                  mb: 1
                }}
              >
                {document.name}
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
              >
                {document.description || 'بدون توضیحات'}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            flexDirection: { xs: 'column', sm: 'row' },
            width: { xs: '100%', sm: 'auto' }
          }}>
            <Button
              component={Link}
              href="/projects"
              variant="outlined"
              startIcon={<ArrowBack />}
              size="small"
              sx={{ 
                borderRadius: 2, 
                px: 2,
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              بازگشت
            </Button>
            <Button
              variant="contained"
              startIcon={<Download />}
              size="small"
              href={`/api/documents/${document.id}/download`}
              target="_blank"
              download
              sx={{ 
                borderRadius: 2, 
                px: 2,
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              دانلود
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Document Info */}
      <Paper sx={{ 
        p: { xs: 2, md: 3 }, 
        mb: 3, 
        borderRadius: 3,
        boxShadow: 2
      }}>
        <Typography 
          variant="h6" 
          fontWeight="bold" 
          sx={{ 
            mb: 2,
            fontFamily: 'Vazirmatn, Arial, sans-serif'
          }}
        >
          اطلاعات سند
        </Typography>
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 2
        }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              نام فایل
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              {document.fileName}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              نوع فایل
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              {document.mimeType}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              حجم فایل
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              {formatFileSize(document.sizeBytes)}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              تاریخ آپلود
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              {new Date(document.createdAt).toLocaleDateString('fa-IR')}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              آپلود شده توسط
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              {document.uploadedBy}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Document Preview */}
      <Paper sx={{ 
        p: { xs: 2, md: 3 }, 
        borderRadius: 3,
        boxShadow: 2,
        textAlign: 'center'
      }}>
        <Typography 
          variant="h6" 
          fontWeight="bold" 
          sx={{ 
            mb: 3,
            fontFamily: 'Vazirmatn, Arial, sans-serif'
          }}
        >
          پیش‌نمایش سند
        </Typography>
        
        {document.mimeType.includes('image') ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px'
          }}>
            <img 
              src={`/api/documents/${document.id}/download`} 
              alt={document.name}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '500px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            />
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            gap: 2
          }}>
            <Typography variant="h1" sx={{ fontSize: '4rem' }}>
              {getFileIcon(document.mimeType)}
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              {document.name}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              برای مشاهده این فایل، آن را دانلود کنید
            </Typography>
            <Button
              variant="contained"
              startIcon={<Download />}
              href={`/api/documents/${document.id}/download`}
              target="_blank"
              download
              sx={{ 
                mt: 2,
                fontFamily: 'Vazirmatn, Arial, sans-serif'
              }}
            >
              دانلود فایل
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

