'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { Save, Calculate } from '@mui/icons-material';

interface PenaltySettings {
  id: string;
  name: string;
  dailyPenaltyAmount: number;
  penaltyGraceDays: number;
}

interface PenaltySettingsManagerProps {
  projectId: string;
  userId: string;
  onSettingsChange?: () => void;
}

export default function PenaltySettingsManager({
  projectId,
  userId,
  onSettingsChange
}: PenaltySettingsManagerProps) {
  const [settings, setSettings] = useState<PenaltySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    dailyPenaltyAmount: 0,
    penaltyGraceDays: 0
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/finance/projects/${projectId}/users/${userId}/penalty-settings`);
      if (!response.ok) {
        throw new Error('خطا در دریافت تنظیمات جریمه');
      }

      const data = await response.json();
      setSettings(data);
      setFormData({
        dailyPenaltyAmount: data.dailyPenaltyAmount || 0,
        penaltyGraceDays: data.penaltyGraceDays || 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای نامشخص');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [projectId, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.dailyPenaltyAmount <= 0) {
      setError('مبلغ جریمه روزانه باید بزرگتر از صفر باشد');
      return;
    }
    
    if (formData.penaltyGraceDays < 0) {
      setError('تعداد روزهای تاخیر مجاز نمی‌تواند منفی باشد');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/finance/projects/${projectId}/users/${userId}/penalty-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در به‌روزرسانی تنظیمات');
      }

      const data = await response.json();
      setSuccess(data.message);
      setSettings(data.user);
      
      // Automatically recalculate penalties after updating settings
      await handleRecalculatePenalties();
      
      // Call callback to refresh parent component
      onSettingsChange?.();
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای نامشخص');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleCalculatePenalties = async () => {
    try {
      setCalculating(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/finance/projects/${projectId}/users/${userId}/calculate-penalties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در محاسبه جریمه');
      }

      const data = await response.json();
      setSuccess(`محاسبه جریمه انجام شد. ${data.result.updatedPenalties} جریمه جدید محاسبه شد. مجموع جریمه: ${new Intl.NumberFormat('fa-IR').format(data.result.totalPenaltyAmount)} ریال`);
      
      // Call callback to refresh parent component
      onSettingsChange?.();
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای نامشخص');
    } finally {
      setCalculating(false);
    }
  };

  const handleRecalculatePenalties = async () => {
    try {
      const response = await fetch(`/api/finance/projects/${projectId}/users/${userId}/recalculate-penalties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'خطا در محاسبه مجدد جریمه‌ها');
      }

      const data = await response.json();
      console.log('Recalculated penalties:', data);
      
      // Call callback to refresh parent component
      onSettingsChange?.();
    } catch (err) {
      console.error('Error recalculating penalties:', err);
      // Don't show error to user as this is automatic
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography 
        variant="h6" 
        gutterBottom 
        sx={{ 
          fontFamily: 'Vazirmatn, Arial, sans-serif',
          fontWeight: 'bold',
          mb: 3
        }}
      >
        تنظیمات جریمه کاربر
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2, fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
          {success}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="مبلغ جریمه روزانه (ریال)"
              type="number"
              value={formData.dailyPenaltyAmount}
              onChange={(e) => handleInputChange('dailyPenaltyAmount', e.target.value)}
              margin="normal"
              required
              inputProps={{ min: 0.01, step: 0.01 }}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
              helperText="مبلغ جریمه که روزانه به قسط اضافه می‌شود (هر عدد بزرگتر از صفر)"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="تعداد روزهای تاخیر مجاز"
              type="number"
              value={formData.penaltyGraceDays}
              onChange={(e) => handleInputChange('penaltyGraceDays', e.target.value)}
              margin="normal"
              required
              inputProps={{ min: 0, step: 1 }}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
              helperText="تعداد روزهایی که بعد از سررسید، جریمه شروع نمی‌شود"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              مثال: اگر مبلغ جریمه 100,000 ریال و تاخیر مجاز 14 روز باشد،
              <br />
              بعد از 14 روز از تاریخ سررسید، روزانه 100,000 ریال جریمه محاسبه می‌شود.
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Calculate />}
              onClick={handleCalculatePenalties}
              disabled={calculating || formData.dailyPenaltyAmount <= 0}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              {calculating ? 'در حال محاسبه...' : 'محاسبه جریمه'}
            </Button>
            
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
              disabled={saving}
              sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}
            >
              {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
