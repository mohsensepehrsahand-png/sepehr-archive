"use client";
import { lazy, Suspense } from "react";
import { Skeleton, Box } from "@mui/material";

// Lazy load heavy components
export const LazyFinancialDashboard = lazy(() => import("@/components/dashboard/FinancialDashboard"));
export const LazyProjectPermissions = lazy(() => import("@/components/projects/ProjectPermissions"));
export const LazyFolderPermissions = lazy(() => import("@/components/projects/FolderPermissions"));
export const LazyDocumentUpload = lazy(() => import("@/components/projects/DocumentUpload"));

// Loading wrapper component
export function LazyWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
      </Box>
    }>
      {children}
    </Suspense>
  );
}
