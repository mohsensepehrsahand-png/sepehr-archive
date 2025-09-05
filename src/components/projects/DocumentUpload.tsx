"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert,
  LinearProgress,
  Chip
} from "@mui/material";
import { CloudUpload, Description } from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";

interface DocumentUploadProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  folderId: string;
  onUploadSuccess: (document: any) => void;
}

export default function DocumentUpload({ 
  open, 
  onClose, 
  projectId, 
  folderId, 
  onUploadSuccess 
}: DocumentUploadProps) {
  const { isAdmin } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    file: null as File | null
  });

  // Get current user ID on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/current-user');
        if (response.ok) {
          const userData = await response.json();
          setCurrentUserId(userData.id);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };

    if (isAdmin) {
      getCurrentUser();
    }
  }, [isAdmin]);

  // Don't render the component if user is not admin
  if (!isAdmin) {
    return null;
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
      // Auto-fill name if empty
      if (!formData.name) {
        setFormData(prev => ({ ...prev, name: file.name.split('.')[0] }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.file) {
      setError("نام سند و فایل الزامی است");
      return;
    }

    if (!currentUserId) {
      setError("خطا در دریافت اطلاعات کاربر");
      return;
    }

    try {
      setUploading(true);
      setError("");

      const uploadData = new FormData();
      uploadData.append('name', formData.name.trim());
      uploadData.append('description', formData.description.trim());
      uploadData.append('projectId', projectId);
      uploadData.append('folderId', folderId);
      uploadData.append('createdBy', currentUserId);
      uploadData.append('file', formData.file);

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: uploadData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در آپلود فایل');
      }

      const uploadedDocument = await response.json();
      onUploadSuccess(uploadedDocument);
      
      // Reset form
      setFormData({ name: "", description: "", file: null });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در آپلود فایل');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFormData({ name: "", description: "", file: null });
      setError("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Description color="primary" />
        آپلود سند جدید
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="نام سند"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            fullWidth
            required
          />

          <TextField
            label="توضیحات"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            fullWidth
            multiline
            rows={3}
          />

          <Box>
            <input
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
              style={{ display: 'none' }}
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <label htmlFor="file-upload">
              <Button
                component="span"
                variant="outlined"
                startIcon={<CloudUpload />}
                fullWidth
                sx={{ 
                  height: 120, 
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  '&:hover': {
                    borderStyle: 'dashed',
                    borderWidth: 2
                  }
                }}
                disabled={uploading}
              >
                {formData.file ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="primary" fontWeight="bold">
                      {formData.file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2">
                      کلیک کنید یا فایل را اینجا بکشید
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      PDF, Word, Excel, تصاویر و متن
                    </Typography>
                  </Box>
                )}
              </Button>
            </label>
          </Box>

          {formData.file && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={`نوع: ${formData.file.type || 'نامشخص'}`} 
                size="small" 
                variant="outlined" 
              />
              <Chip 
                label={`حجم: ${(formData.file.size / 1024 / 1024).toFixed(2)} MB`} 
                size="small" 
                variant="outlined" 
              />
            </Box>
          )}
        </Box>

        {uploading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
              در حال آپلود...
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          انصراف
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={uploading || !formData.name.trim() || !formData.file}
        >
          آپلود
        </Button>
      </DialogActions>
    </Dialog>
  );
}
