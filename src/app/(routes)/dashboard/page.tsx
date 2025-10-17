"use client";
import { useState, useEffect } from "react";
import { Box, Typography, Button, LinearProgress, useTheme, alpha, IconButton } from "@mui/material";
import { Add } from "@mui/icons-material";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from "@dnd-kit/sortable";

import { useProjects } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useDashboardData } from "@/hooks/useDashboard";
import { DashboardSkeleton } from "@/components/common/LoadingSkeleton";

import DashboardWidget from "@/components/dashboard/DashboardWidget";
import WidgetSelector, { WidgetType } from "@/components/dashboard/WidgetSelector";
import SmartSearchWidget from "@/components/dashboard/SmartSearchWidget";
import RecentProjectsWidget from "@/components/dashboard/RecentProjectsWidget";
import StatisticsWidget from "@/components/dashboard/StatisticsWidget";
import RecentActivitiesWidget from "@/components/dashboard/RecentActivitiesWidget";
import RecentDocumentsWidget from "@/components/dashboard/RecentDocumentsWidget";
import FinancialSummaryWidget from "@/components/dashboard/FinancialSummaryWidget";
import ProjectPaymentProgressWidget from "@/components/dashboard/ProjectPaymentProgressWidget";
import DateTimeWidget from "@/components/dashboard/DateTimeWidget";
import { Search, FolderOpen, Assessment, History, Description, AccountBalance, Timeline, AccessTime } from "@mui/icons-material";

const AVAILABLE_WIDGETS: WidgetType[] = [
  {
    id: 'search',
    name: 'جستجوی هوشمند',
    description: 'جستجو در پروژه‌ها، پوشه‌ها و اسناد',
    icon: <Search />,
    size: 'medium'
  },
  {
    id: 'projects',
    name: 'پروژه‌های اخیر',
    description: 'نمایش آخرین پروژه‌های فعال',
    icon: <FolderOpen />,
    size: 'medium'
  },
  {
    id: 'statistics',
    name: 'آمار کلی',
    description: 'نمایش آمار کلی پروژه‌ها و اسناد',
    icon: <Assessment />,
    size: 'medium'
  },
  {
    id: 'activities',
    name: 'فعالیت‌های اخیر',
    description: 'نمایش آخرین فعالیت‌های سیستم',
    icon: <History />,
    size: 'medium'
  },
  {
    id: 'documents',
    name: 'اسناد اخیر',
    description: 'نمایش آخرین اسناد آپلود شده',
    icon: <Description />,
    size: 'medium'
  },
  {
    id: 'financialSummary',
    name: 'آمار مالی پروژه‌ها',
    description: 'نمایش آمار مالی کلی پروژه‌ها',
    icon: <AccountBalance />,
    size: 'medium'
  },
  {
    id: 'paymentProgress',
    name: 'پیشرفت پرداخت پروژه‌ها',
    description: 'نمایش وضعیت پیشرفت پرداخت هر پروژه',
    icon: <Timeline />,
    size: 'medium'
  },
  {
    id: 'dateTime',
    name: 'تاریخ و ساعت',
    description: 'نمایش تاریخ و ساعت شمسی، قمری و میلادی',
    icon: <AccessTime />,
    size: 'medium'
  }
];

export default function DashboardPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { projects } = useProjects();
  const theme = useTheme();
  const [selectorOpen, setSelectorOpen] = useState(false);
  
  // Load saved layout from localStorage
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-widgets');
      return saved ? JSON.parse(saved) : ['search', 'projects', 'statistics', 'activities', 'documents', 'financialSummary'];
    }
    return ['search', 'projects', 'statistics', 'activities', 'documents', 'financialSummary'];
  });
  
  const { data: dashboardData, isLoading, error, refetch } = useDashboardData();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && isAdmin === false) {
      router.push('/projects');
    }
  }, [isAdmin, authLoading, router]);

  // Save layout to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('dashboard-widgets', JSON.stringify(selectedWidgets));
    }
  }, [selectedWidgets, mounted]);

  const recentActivities = dashboardData?.activities || [];
  const recentDocuments = dashboardData?.documents || [];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setSelectedWidgets((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddWidget = (widgetId: string) => {
    if (!selectedWidgets.includes(widgetId)) {
      setSelectedWidgets([...selectedWidgets, widgetId]);
    }
  };

  const handleRemoveWidget = (widgetId: string) => {
    setSelectedWidgets(selectedWidgets.filter(id => id !== widgetId));
  };

  const handleAddAllWidgets = () => {
    const allWidgetIds = AVAILABLE_WIDGETS.map(w => w.id);
    setSelectedWidgets(allWidgetIds);
  };

  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case 'search':
        return <SmartSearchWidget projects={projects} recentDocuments={recentDocuments} />;
      case 'projects':
        return <RecentProjectsWidget projects={projects} onRefresh={refetch} isLoading={isLoading} />;
      case 'statistics':
        return <StatisticsWidget projects={projects} />;
      case 'activities':
        return <RecentActivitiesWidget activities={recentActivities} onRefresh={refetch} isLoading={isLoading} />;
      case 'documents':
        return <RecentDocumentsWidget documents={recentDocuments} onRefresh={refetch} isLoading={isLoading} />;
      case 'financialSummary':
        return <FinancialSummaryWidget isAdmin={isAdmin} />;
      case 'paymentProgress':
        return <ProjectPaymentProgressWidget isAdmin={isAdmin} />;
      case 'dateTime':
        return <DateTimeWidget />;
      default:
        return null;
    }
  };

  if (!authLoading && !isAdmin) {
    return null;
  }

  if (isLoading && !mounted) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h6">
          خطا در بارگذاری اطلاعات داشبورد
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {error instanceof Error ? error.message : 'خطای نامشخص'}
        </Typography>
      </Box>
    );
  }

  if (!mounted) {
    return (
      <Box sx={{ py: 4, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <LinearProgress sx={{ width: '200px' }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
      {/* Add Widget Button */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => setSelectorOpen(true)}
          sx={{
            borderRadius: 3,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: 'primary.main',
            py: 1.5,
            px: 3,
            fontSize: '0.9rem',
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            fontWeight: 'bold',
            width: 'auto',
            minWidth: '200px',
            '&:hover': {
              borderWidth: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.05)
            }
          }}
        >
          اضافه کردن ویجت جدید
        </Button>
      </Box>

      {/* Widgets Grid with Drag & Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={selectedWidgets} strategy={rectSortingStrategy}>
          <Box
                sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' },
              gap: 3,
              minHeight: selectedWidgets.length === 0 ? '400px' : 'auto'
            }}
          >
            {selectedWidgets.length > 0 && (
              selectedWidgets.map((widgetId) => {
                return (
                  <Box
                    key={widgetId}
                            sx={{ 
                      gridColumn: { xs: '1 / -1', md: 'span 4' },
                      minHeight: '300px'
                    }}
                  >
                    <DashboardWidget id={widgetId} onRemove={handleRemoveWidget}>
                      {renderWidget(widgetId)}
                    </DashboardWidget>
                    </Box>
                );
              })
            )}
          </Box>
        </SortableContext>
      </DndContext>

      {/* Widget Selector Dialog */}
      <WidgetSelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={handleAddWidget}
        onRemove={handleRemoveWidget}
        availableWidgets={AVAILABLE_WIDGETS}
        selectedWidgets={selectedWidgets}
        onSelectAll={handleAddAllWidgets}
      />
    </Box>
  );
}
