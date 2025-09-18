"use client";
import { useState, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { TreeView, TreeItem } from '@mui/lab';
import {
  ExpandMore,
  ChevronRight,
  Edit,
  Delete,
  Add,
  AccountTree,
  Warning
} from '@mui/icons-material';

interface AccountGroup {
  id: string;
  code: string;
  name: string;
  isDefault: boolean;
  isProtected: boolean;
  sortOrder: number;
  classes: AccountClass[];
}

interface AccountClass {
  id: string;
  code: string;
  name: string;
  nature: 'DEBIT' | 'CREDIT' | 'DEBIT_CREDIT';
  isDefault: boolean;
  isProtected: boolean;
  sortOrder: number;
  subClasses: AccountSubClass[];
}

interface AccountSubClass {
  id: string;
  code: string;
  name: string;
  hasDetails: boolean;
  isDefault: boolean;
  isProtected: boolean;
  sortOrder: number;
  details: AccountDetail[];
}

interface AccountDetail {
  id: string;
  code: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isProtected: boolean;
  sortOrder: number;
}

interface AccountingCodingTreeViewProps {
  groups: AccountGroup[];
  onAddGroup: () => void;
  onAddClass: (groupId: string) => void;
  onAddSubClass: (classId: string) => void;
  onAddDetail: (subClassId: string) => void;
  onEditGroup: (groupId: string) => void;
  onEditClass: (classId: string) => void;
  onEditSubClass: (subClassId: string) => void;
  onEditDetail: (detailId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onDeleteClass: (classId: string) => void;
  onDeleteSubClass: (subClassId: string) => void;
  onDeleteDetail: (detailId: string) => void;
}

export default function AccountingCodingTreeView({
  groups,
  onAddGroup,
  onAddClass,
  onAddSubClass,
  onAddDetail,
  onEditGroup,
  onEditClass,
  onEditSubClass,
  onEditDetail,
  onDeleteGroup,
  onDeleteClass,
  onDeleteSubClass,
  onDeleteDetail
}: AccountingCodingTreeViewProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'group' | 'class' | 'subclass' | 'detail';
    id: string;
    name: string;
    code: string;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    targetType: 'group' | 'class' | 'subclass' | 'detail';
    targetId: string;
    targetName: string;
    targetCode: string;
    isProtected: boolean;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const handleDeleteClick = (
    type: 'group' | 'class' | 'subclass' | 'detail',
    id: string,
    name: string,
    code: string
  ) => {
    setDeleteTarget({ type, id, name, code });
    setDeleteDialogOpen(true);
    setConfirmDelete(false);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;

    switch (deleteTarget.type) {
      case 'group':
        onDeleteGroup(deleteTarget.id);
        break;
      case 'class':
        onDeleteClass(deleteTarget.id);
        break;
      case 'subclass':
        onDeleteSubClass(deleteTarget.id);
        break;
      case 'detail':
        onDeleteDetail(deleteTarget.id);
        break;
    }

    setDeleteDialogOpen(false);
    setDeleteTarget(null);
    setConfirmDelete(false);
  };

  const handleContextMenu = (event: React.MouseEvent, targetType: 'group' | 'class' | 'subclass' | 'detail', targetId: string, targetName: string, targetCode: string, isProtected: boolean) => {
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      targetType,
      targetId,
      targetName,
      targetCode,
      isProtected
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleContextMenuAction = (action: 'edit' | 'delete' | 'add') => {
    if (!contextMenu) return;

    switch (action) {
      case 'edit':
        switch (contextMenu.targetType) {
          case 'group':
            onEditGroup(contextMenu.targetId);
            break;
          case 'class':
            onEditClass(contextMenu.targetId);
            break;
          case 'subclass':
            onEditSubClass(contextMenu.targetId);
            break;
          case 'detail':
            onEditDetail(contextMenu.targetId);
            break;
        }
        break;
      case 'delete':
        handleDeleteClick(contextMenu.targetType, contextMenu.targetId, contextMenu.targetName, contextMenu.targetCode);
        break;
      case 'add':
        switch (contextMenu.targetType) {
          case 'group':
            onAddClass(contextMenu.targetId);
            break;
          case 'class':
            onAddSubClass(contextMenu.targetId);
            break;
          case 'subclass':
            onAddDetail(contextMenu.targetId);
            break;
        }
        break;
    }
    
    handleCloseContextMenu();
  };

  const getNatureColor = (nature: string) => {
    switch (nature) {
      case 'DEBIT':
        return 'error';
      case 'CREDIT':
        return 'success';
      case 'DEBIT_CREDIT':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getNatureLabel = (nature: string) => {
    switch (nature) {
      case 'DEBIT':
        return 'بدهکار';
      case 'CREDIT':
        return 'بستانکار';
      case 'DEBIT_CREDIT':
        return 'بدهکار–بستانکار';
      default:
        return nature;
    }
  };

  const renderTreeItem = (group: AccountGroup) => {
    const groupLabel = (
      <Box 
        display="flex" 
        alignItems="center" 
        gap={1} 
        width="100%"
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleContextMenu(e, 'group', group.id, group.name, group.code, group.isProtected);
        }}
      >
        <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', flex: 1 }}>
          {group.code} - {group.name}
        </Typography>
        {group.isDefault && (
          <Chip label="پیش‌فرض" size="small" color="primary" />
        )}
        <Box display="flex" gap={0.5}>
          <Tooltip title="افزودن کل">
            <IconButton size="small" onClick={(e) => {
              e.stopPropagation();
              onAddClass(group.id);
            }}>
              <Add fontSize="small" />
            </IconButton>
          </Tooltip>
          {!group.isProtected && (
            <>
              <Tooltip title="ویرایش">
                <IconButton size="small" onClick={(e) => {
                  e.stopPropagation();
                  onEditGroup(group.id);
                }}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="حذف">
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick('group', group.id, group.name, group.code);
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>
    );

    return (
      <TreeItem 
        key={group.id} 
        nodeId={group.id} 
        label={groupLabel}
      >
        {group.classes.map((accountClass) => {
          const classLabel = (
            <Box 
              display="flex" 
              alignItems="center" 
              gap={1} 
              width="100%"
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleContextMenu(e, 'class', accountClass.id, accountClass.name, `${group.code}${accountClass.code}`, accountClass.isProtected);
              }}
            >
              <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', flex: 1 }}>
                {group.code}{accountClass.code} - {accountClass.name}
              </Typography>
              <Chip 
                label={getNatureLabel(accountClass.nature)} 
                size="small" 
                color={getNatureColor(accountClass.nature) as any}
              />
              {accountClass.isDefault && (
                <Chip label="پیش‌فرض" size="small" color="primary" />
              )}
              <Box display="flex" gap={0.5}>
                <Tooltip title="افزودن معین">
                  <IconButton size="small" onClick={(e) => {
                    e.stopPropagation();
                    onAddSubClass(accountClass.id);
                  }}>
                    <Add fontSize="small" />
                  </IconButton>
                </Tooltip>
                {!accountClass.isProtected && (
                  <>
                    <Tooltip title="ویرایش">
                      <IconButton size="small" onClick={(e) => {
                        e.stopPropagation();
                        onEditClass(accountClass.id);
                      }}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="حذف">
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick('class', accountClass.id, accountClass.name, `${group.code}${accountClass.code}`);
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>
            </Box>
          );

          return (
            <TreeItem 
              key={accountClass.id} 
              nodeId={accountClass.id} 
              label={classLabel}
            >
              {accountClass.subClasses.map((subClass) => {
                const subClassLabel = (
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    gap={1} 
                    width="100%"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleContextMenu(e, 'subclass', subClass.id, subClass.name, `${group.code}${accountClass.code}${subClass.code}`, subClass.isProtected);
                    }}
                  >
                    <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', flex: 1 }}>
                      {group.code}{accountClass.code}{subClass.code} - {subClass.name}
                    </Typography>
                    {subClass.hasDetails && (
                      <Chip label="تفصیلی" size="small" color="info" />
                    )}
                    {subClass.isDefault && (
                      <Chip label="پیش‌فرض" size="small" color="primary" />
                    )}
                    <Box display="flex" gap={0.5}>
                      {subClass.hasDetails && (
                        <Tooltip title="افزودن تفصیلی">
                          <IconButton size="small" onClick={(e) => {
                            e.stopPropagation();
                            onAddDetail(subClass.id);
                          }}>
                            <Add fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!subClass.isProtected && (
                        <>
                          <Tooltip title="ویرایش">
                            <IconButton size="small" onClick={(e) => {
                              e.stopPropagation();
                              onEditSubClass(subClass.id);
                            }}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="حذف">
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick('subclass', subClass.id, subClass.name, `${group.code}${accountClass.code}${subClass.code}`);
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </Box>
                );

                return (
                  <TreeItem 
                    key={subClass.id} 
                    nodeId={subClass.id} 
                    label={subClassLabel}
                  >
                    {subClass.details.map((detail) => {
                      const detailLabel = (
                        <Box 
                          display="flex" 
                          alignItems="center" 
                          gap={1} 
                          width="100%"
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleContextMenu(e, 'detail', detail.id, detail.name, `${group.code}${accountClass.code}${subClass.code}${detail.code}`, detail.isProtected);
                          }}
                        >
                          <Typography variant="body2" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', flex: 1 }}>
                            {group.code}{accountClass.code}{subClass.code}{detail.code} - {detail.name}
                          </Typography>
                          {detail.isDefault && (
                            <Chip label="پیش‌فرض" size="small" color="primary" />
                          )}
                          {!detail.isProtected && (
                            <Box display="flex" gap={0.5}>
                              <Tooltip title="ویرایش">
                                <IconButton size="small" onClick={(e) => {
                                  e.stopPropagation();
                                  onEditDetail(detail.id);
                                }}>
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="حذف">
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick('detail', detail.id, detail.name, `${group.code}${accountClass.code}${subClass.code}${detail.code}`);
                                  }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                        </Box>
                      );

                      return (
                        <TreeItem 
                          key={detail.id} 
                          nodeId={detail.id} 
                          label={detailLabel}
                        />
                      );
                    })}
                  </TreeItem>
                );
              })}
            </TreeItem>
          );
        })}
      </TreeItem>
    );
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <AccountTree color="primary" />
        <Typography variant="h6" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          ساختار سلسله‌مراتبی کدینگ
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          onClick={onAddGroup}
          sx={{ ml: 'auto' }}
        >
          افزودن گروه
        </Button>
      </Box>

      {groups.length === 0 ? (
        <Alert severity="info" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          هیچ کدینگ تعریف نشده است. برای شروع، کدینگ پیش‌فرض را ایمپورت کنید یا گروه جدیدی اضافه کنید.
        </Alert>
      ) : (
        <TreeView
          defaultCollapseIcon={<ExpandMore />}
          defaultExpandIcon={<ChevronRight />}
          sx={{ 
            flexGrow: 1, 
            maxWidth: '100%', 
            overflowY: 'auto',
            maxHeight: '70vh',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1
          }}
        >
          {groups.map(renderTreeItem)}
        </TreeView>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Warning color="warning" />
            تأیید حذف
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', mb: 2 }}>
            آیا مطمئن هستید که می‌خواهید این آیتم را حذف کنید؟
          </Typography>
          {deleteTarget && (
            <Alert severity="warning" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              <Typography variant="body2">
                <strong>{deleteTarget.code}</strong> - {deleteTarget.name}
              </Typography>
              {(deleteTarget.type === 'group' || deleteTarget.type === 'class' || deleteTarget.type === 'subclass') && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  توجه: تمام زیرمجموعه‌های این آیتم نیز حذف خواهند شد.
                </Typography>
              )}
            </Alert>
          )}
          <TextField
            fullWidth
            label="برای تأیید، 'حذف' را تایپ کنید"
            value={confirmDelete ? 'حذف' : ''}
            onChange={(e) => setConfirmDelete(e.target.value === 'حذف')}
            sx={{ mt: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            انصراف
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={!confirmDelete}
            sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
          >
            حذف
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        ref={contextMenuRef}
        sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
      >
        {contextMenu && (
          <>
            <MenuItem onClick={() => handleContextMenuAction('add')} sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              <ListItemIcon>
                <Add fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                {contextMenu.targetType === 'group' && 'افزودن کل'}
                {contextMenu.targetType === 'class' && 'افزودن معین'}
                {contextMenu.targetType === 'subclass' && 'افزودن تفصیلی'}
              </ListItemText>
            </MenuItem>
            {!contextMenu.isProtected && (
              <>
                <MenuItem onClick={() => handleContextMenuAction('edit')} sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
                  <ListItemIcon>
                    <Edit fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>ویرایش</ListItemText>
                </MenuItem>
                <MenuItem 
                  onClick={() => handleContextMenuAction('delete')} 
                  sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', color: 'error.main' }}
                >
                  <ListItemIcon>
                    <Delete fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText>حذف</ListItemText>
                </MenuItem>
              </>
            )}
          </>
        )}
      </Menu>
    </Box>
  );
}
