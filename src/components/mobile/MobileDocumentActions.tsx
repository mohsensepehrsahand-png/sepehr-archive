"use client";
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import { Visibility, Download, Delete, MoreVert } from "@mui/icons-material";
import { useState } from "react";

interface MobileDocumentActionsProps {
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
  showActions?: boolean;
}

export default function MobileDocumentActions({
  onView,
  onDownload,
  onDelete,
  showActions = true
}: MobileDocumentActionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: () => void) => {
    action();
    handleClose();
  };

  if (!showActions) return null;

  return (
    <>
      <IconButton
        size="small"
        onClick={handleClick}
        sx={{ 
          color: 'text.secondary',
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }}
      >
        <MoreVert />
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            minWidth: 120,
            '& .MuiMenuItem-root': {
              fontFamily: 'Vazirmatn, Arial, sans-serif'
            }
          }
        }}
      >
        <MenuItem onClick={() => handleAction(onView)}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>مشاهده</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleAction(onDownload)}>
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          <ListItemText>دانلود</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleAction(onDelete)}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>حذف</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
