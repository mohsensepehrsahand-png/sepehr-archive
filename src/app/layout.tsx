import type { Metadata } from "next";
import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/600.css";
import "./globals.css";
import ThemeProvider from "@/components/providers/ThemeProvider";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { AuthProvider } from "@/contexts/AuthContext";

// Use Vazirmatn via global CSS; remove default Geist fonts.

export const metadata: Metadata = {
  title: "سیستم آرشیو اسناد سپهر",
  description: "سامانه مدیریت و آرشیو اسناد",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ProjectProvider>
              {children}
            </ProjectProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
