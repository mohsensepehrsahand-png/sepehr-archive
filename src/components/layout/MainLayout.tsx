"use client";
import { Box, CssBaseline, useMediaQuery, useTheme } from "@mui/material";
import Header from "./Header";
import Sidebar from "./Sidebar";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import PrefetchLinks from "@/components/common/PrefetchLinks";
import { ReactNode } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ 
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      width: "100%",
      direction: "rtl"
    }}>
      <CssBaseline />
      <PrefetchLinks />
      <Box sx={{ 
        position: "relative",
        zIndex: 1000,
        width: "100%"
      }}>
        <Header />
      </Box>
      <Box sx={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        direction: "rtl"
      }}>
        <Box
          component="main"
          sx={{
            order: 2,
            flex: 1,
            p: { xs: 2, md: 3 },
            minHeight: "100vh",
            backgroundColor: "background.default",
            overflow: "auto",
            direction: "rtl",
            pb: { xs: 8, md: 3 } // Add bottom padding for mobile bottom nav
          }}
        >
          {children}
        </Box>
        {!isMobile && (
          <Box sx={{ 
            order: 1,
            width: "300px",
            flexShrink: 0,
            direction: "rtl"
          }}>
            <Sidebar />
          </Box>
        )}
      </Box>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </Box>
  );
}
