"use client";
import { Card, CardContent, Typography, Box, Chip, useTheme } from "@mui/material";
import { Description, Visibility, Download, Delete, MoreVert } from "@mui/icons-material";
import MobileDocumentActions from "./MobileDocumentActions";

interface MobileDocumentCardProps {
  document: {
    id: string;
    name: string;
    description?: string;
    mimeType: string;
    sizeBytes: number;
    fileExt: string;
    uploadedBy: string;
    createdAt: string;
  };
  onView?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export default function MobileDocumentCard({
  document,
  onView,
  onDownload,
  onDelete,
  showActions = false
}: MobileDocumentCardProps) {
  const theme = useTheme();

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
    <Card 
      sx={{ 
        mb: 2,
        borderRadius: 3,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-1px)'
        }
      }}
    >
      <CardContent sx={{ p: 2 }}>
        {/* Document Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
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
              noWrap
              sx={{ 
                fontFamily: 'Vazirmatn, Arial, sans-serif',
                mb: 1
              }}
            >
              {document.description || 'بدون توضیحات'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip 
                label={formatFileSize(document.sizeBytes)} 
                size="small" 
                variant="outlined"
                color="secondary"
              />
              <Chip 
                label={document.fileExt.toUpperCase()} 
                size="small" 
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>

        {/* Actions */}
        <MobileDocumentActions
          onView={onView || (() => {})}
          onDownload={onDownload || (() => {})}
          onDelete={onDelete || (() => {})}
          showDelete={showActions}
        />
      </CardContent>
    </Card>
  );
}
