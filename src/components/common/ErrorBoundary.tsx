"use client";
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import { Refresh, Error as ErrorIcon } from "@mui/icons-material";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Paper sx={{ p: 4, textAlign: "center", m: 2 }}>
          <ErrorIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            خطایی رخ داده است
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            متأسفانه خطایی در بارگذاری این بخش رخ داده است.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={this.handleRetry}
            sx={{ fontFamily: "Vazirmatn, Arial, sans-serif" }}
          >
            تلاش مجدد
          </Button>
        </Paper>
      );
    }

    return this.props.children;
  }
}