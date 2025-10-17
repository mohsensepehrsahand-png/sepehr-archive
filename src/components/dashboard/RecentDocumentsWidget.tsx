"use client";
import { Box, Typography, Paper, List, ListItem, ListItemIcon, ListItemText, Avatar, Divider, IconButton, Tooltip } from "@mui/material";
import { Refresh, Image, PictureAsPdf, Description, TableChart } from "@mui/icons-material";
import { formatPersianDate } from "@/utils/dateUtils";

interface RecentDocumentsWidgetProps {
  documents: any[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function RecentDocumentsWidget({ documents, onRefresh, isLoading }: RecentDocumentsWidgetProps) {
  const getDocumentIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image />;
    if (mimeType === 'application/pdf') return <PictureAsPdf />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <Description />;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <TableChart />;
    return <Description />;
  };

  return (
    <Paper sx={{ p: 3, height: '100%', borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          اسناد اخیر
        </Typography>
        {onRefresh && (
          <Tooltip title="بروزرسانی">
            <IconButton size="small" onClick={onRefresh} disabled={isLoading} sx={{ color: 'primary.main' }}>
              <Refresh sx={{ 
                animation: isLoading ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {documents.length > 0 ? (
        <List dense sx={{ flex: 1, overflow: 'auto' }}>
          {documents.slice(0, 8).map((document, index) => (
            <Box key={document.id}>
              <ListItem sx={{ px: 0, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Avatar sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: document.isImage ? 'success.main' : 
                            document.isPdf ? 'error.main' : 
                            document.isDocument ? 'primary.main' : 
                            document.isSpreadsheet ? 'warning.main' : 'default',
                    fontSize: '0.75rem'
                  }}>
                    {getDocumentIcon(document.mimeType)}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {document.name}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                      {document.sizeFormatted} • {formatPersianDate(document.createdAt)}
                    </Typography>
                  }
                />
              </ListItem>
              {index < documents.slice(0, 8).length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', textAlign: 'center', py: 4 }}>
          هیچ سندی آپلود نشده است
        </Typography>
      )}
    </Paper>
  );
}

