"use client";
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  IconButton,
  useTheme,
  useMediaQuery,
  Paper,
  Chip,
  Divider
} from "@mui/material";
import { 
  Close, 
  Download, 
  Share,
  Visibility,
  Delete
} from "@mui/icons-material";

interface MobileDocumentViewerProps {
  open: boolean;
  onClose: () => void;
  document: {
    id: string;
    name: string;
    description?: string;
    mimeType: string;
    sizeBytes: number;
    fileExt: string;
    uploadedBy: string;
    createdAt: string;
  } | null;
  onDownload?: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

export default function MobileDocumentViewer({
  open,
  onClose,
  document,
  onDownload,
  onDelete,
  showDelete = false
}: MobileDocumentViewerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!document) return null;

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel')) return '📊';
    return '📄';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isMobile ? 0 : 3,
          m: isMobile ? 0 : 2
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
          <Typography variant="h4">
            {getFileIcon(document.mimeType)}
          </Typography>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              fontWeight="bold"
              noWrap
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              {document.name}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              {document.description || 'بدون توضیحات'}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <Divider />

      {/* Content */}
      <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
        {/* Document Info */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
          <Typography 
            variant="subtitle1" 
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
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 2
          }}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                نوع فایل
              </Typography>
              <Chip 
                label={document.fileExt.toUpperCase()} 
                size="small" 
                variant="outlined"
                sx={{ mt: 0.5 }}
              />
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                حجم فایل
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', mt: 0.5 }}>
                {formatFileSize(document.sizeBytes)}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                تاریخ آپلود
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', mt: 0.5 }}>
                {new Date(document.createdAt).toLocaleDateString('fa-IR')}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                آپلود شده توسط
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', mt: 0.5 }}>
                {document.uploadedBy}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Document Preview */}
        <Paper sx={{ 
          p: 2, 
          textAlign: 'center',
          bgcolor: 'background.default'
        }}>
          <Typography 
            variant="subtitle1" 
            fontWeight="bold" 
            sx={{ 
              mb: 2,
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
              minHeight: '300px'
            }}>
              <img 
                src={`/api/documents/${document.id}/download`} 
                alt={document.name}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '400px',
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
              minHeight: '300px',
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
            </Box>
          )}
        </Paper>
      </DialogContent>

      <Divider />

      {/* Actions */}
      <DialogActions sx={{ 
        p: { xs: 2, md: 3 },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 1
      }}>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={() => {
            onDownload?.();
          }}
          sx={{ 
            width: { xs: '100%', sm: 'auto' },
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            order: { xs: 1, sm: 1 }
          }}
        >
          دانلود فایل
        </Button>
        
        {showDelete && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={onDelete}
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              fontFamily: 'Vazirmatn, Arial, sans-serif',
              order: { xs: 2, sm: 2 }
            }}
          >
            حذف سند
          </Button>
        )}
        
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ 
            width: { xs: '100%', sm: 'auto' },
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            order: { xs: 3, sm: 3 }
          }}
        >
          بستن
        </Button>
      </DialogActions>
    </Dialog>
  );
}
