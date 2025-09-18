"use client";
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Alert,
  Chip,
  Grid
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Save,
  Cancel
} from '@mui/icons-material';

interface CommonDescription {
  id: string;
  text: string;
  usageCount: number;
}

interface CommonDescriptionsModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (description: string) => void;
  projectId: string;
}

export default function CommonDescriptionsModal({
  open,
  onClose,
  onSelect,
  projectId
}: CommonDescriptionsModalProps) {
  const [descriptions, setDescriptions] = useState<CommonDescription[]>([]);
  const [newDescription, setNewDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      fetchDescriptions();
    }
  }, [open, projectId]);

  const fetchDescriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/accounting/common-descriptions?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setDescriptions(data);
      }
    } catch (error) {
      console.error('Error fetching descriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDescription = async () => {
    if (!newDescription.trim()) return;

    try {
      const response = await fetch('/api/accounting/common-descriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          text: newDescription.trim()
        }),
      });

      if (response.ok) {
        const newDesc = await response.json();
        setDescriptions(prev => [...prev, newDesc]);
        setNewDescription('');
        setError('');
      } else {
        setError('خطا در افزودن شرح');
      }
    } catch (error) {
      setError('خطا در افزودن شرح');
    }
  };

  const handleEditDescription = async (id: string) => {
    if (!editingText.trim()) return;

    try {
      const response = await fetch(`/api/accounting/common-descriptions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: editingText.trim()
        }),
      });

      if (response.ok) {
        setDescriptions(prev => prev.map(desc => 
          desc.id === id ? { ...desc, text: editingText.trim() } : desc
        ));
        setEditingId(null);
        setEditingText('');
        setError('');
      } else {
        setError('خطا در ویرایش شرح');
      }
    } catch (error) {
      setError('خطا در ویرایش شرح');
    }
  };

  const handleDeleteDescription = async (id: string) => {
    try {
      const response = await fetch(`/api/accounting/common-descriptions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDescriptions(prev => prev.filter(desc => desc.id !== id));
        setError('');
      } else {
        setError('خطا در حذف شرح');
      }
    } catch (error) {
      setError('خطا در حذف شرح');
    }
  };

  const handleSelectDescription = (text: string) => {
    onSelect(text);
    onClose();
  };

  const startEditing = (id: string, text: string) => {
    setEditingId(id);
    setEditingText(text);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingText('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
        شرح‌های پر استفاده
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Add new description */}
        <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            افزودن شرح جدید
          </Typography>
          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="شرح جدید را وارد کنید..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddDescription()}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddDescription}
              disabled={!newDescription.trim()}
              size="small"
            >
              افزودن
            </Button>
          </Box>
        </Box>

        {/* Descriptions list */}
        <Typography variant="subtitle2" sx={{ mb: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          شرح‌های موجود ({descriptions.length})
        </Typography>
        
        <List>
          {descriptions.map((desc) => (
            <ListItem
              key={desc.id}
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                mb: 1,
                backgroundColor: 'background.paper'
              }}
            >
              {editingId === desc.id ? (
                <Box display="flex" alignItems="center" gap={1} width="100%">
                  <TextField
                    fullWidth
                    size="small"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleEditDescription(desc.id)}
                    sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
                  />
                  <IconButton
                    onClick={() => handleEditDescription(desc.id)}
                    color="primary"
                    size="small"
                  >
                    <Save />
                  </IconButton>
                  <IconButton
                    onClick={cancelEditing}
                    color="error"
                    size="small"
                  >
                    <Cancel />
                  </IconButton>
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    width: '100%', 
                    gap: 1, 
                    direction: 'rtl',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                  onClick={() => handleSelectDescription(desc.text)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <Chip
                      label={`${desc.usageCount} بار استفاده`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Typography sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', flex: 1, textAlign: 'right' }}>
                      {desc.text}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(desc.id, desc.text);
                      }}
                      color="warning"
                      size="small"
                      title="ویرایش"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDescription(desc.id);
                      }}
                      color="error"
                      size="small"
                      title="حذف"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
              )}
            </ListItem>
          ))}
          
          {descriptions.length === 0 && (
            <ListItem>
              <ListItemText
                primary={
                  <Typography color="text.secondary" sx={{ textAlign: 'center', fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                    هیچ شرحی اضافه نشده است
                  </Typography>
                }
              />
            </ListItem>
          )}
        </List>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          بستن
        </Button>
      </DialogActions>
    </Dialog>
  );
}
