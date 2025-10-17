"use client";
import { useState } from "react";
import { Dialog, DialogTitle, DialogContent, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, Typography, Chip, IconButton, Button } from "@mui/material";
import { Search, FolderOpen, Assessment, History, Description, Close, AddCircle, Delete } from "@mui/icons-material";

export interface WidgetType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  size: 'small' | 'medium' | 'large';
}

interface WidgetSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (widgetId: string) => void;
  onRemove?: (widgetId: string) => void;
  availableWidgets: WidgetType[];
  selectedWidgets: string[];
  onSelectAll?: () => void;
}

export default function WidgetSelector({ open, onClose, onSelect, onRemove, availableWidgets, selectedWidgets, onSelectAll }: WidgetSelectorProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          انتخاب ویجت
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {onSelectAll && (
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<AddCircle />}
              onClick={() => {
                onSelectAll();
                onClose();
              }}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', py: 1.5 }}
            >
              اضافه کردن همه ویجت‌ها
            </Button>
          </Box>
        )}
        <List>
          {availableWidgets.map((widget) => {
            const isSelected = selectedWidgets.includes(widget.id);
            return (
              <ListItem 
                key={widget.id}
                disablePadding
                sx={{ mb: 1 }}
              >
                <ListItemButton
                  onClick={() => {
                    if (isSelected && onRemove) {
                      onRemove(widget.id);
                    } else {
                      onSelect(widget.id);
                    }
                    onClose();
                  }}
                  sx={{ 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: isSelected ? 'success.main' : 'divider',
                    bgcolor: isSelected ? 'success.light' : 'transparent',
                    '&:hover': {
                      bgcolor: isSelected ? 'success.light' : 'action.hover'
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: isSelected ? 'success.main' : 'primary.main' }}>
                    {widget.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                          {widget.name}
                        </Typography>
                        {isSelected && <Chip label="فعال" size="small" color="success" />}
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                        {widget.description}
                      </Typography>
                    }
                  />
                  {isSelected && onRemove && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(widget.id);
                      }}
                      sx={{ color: 'error.main' }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </DialogContent>
    </Dialog>
  );
}

