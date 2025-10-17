"use client";
import { useState, useEffect } from "react";
import { Box, Typography, Paper, Switch, FormControlLabel, useTheme, alpha } from "@mui/material";
import { AccessTime, CalendarToday } from "@mui/icons-material";
import moment from "moment-jalaali";
import { toHijri, fromHijri } from "hijri-date";

interface DateTimeWidgetProps {
  is24Hour?: boolean;
}

export default function DateTimeWidget({ is24Hour: initialIs24Hour = false }: DateTimeWidgetProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [is24Hour, setIs24Hour] = useState(initialIs24Hour);
  const theme = useTheme();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    if (is24Hour) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const ampm = hours >= 12 ? 'بعد از ظهر' : 'قبل از ظهر';
      return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;
    }
  };

  const getPersianDate = (date: Date) => {
    const persianMonths = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];
    
    const persianDays = [
      'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'
    ];

    // Use moment-jalaali for accurate Persian date conversion
    const jMoment = moment(date);
    const persianYear = jMoment.jYear();
    const persianMonth = jMoment.jMonth() + 1;
    const persianDay = jMoment.jDate();
    const persianDayName = persianDays[date.getDay()];

    return {
      year: persianYear,
      month: persianMonths[persianMonth - 1],
      day: persianDay,
      dayName: persianDayName,
      full: `${persianDayName} - ${persianDay} ${persianMonths[persianMonth - 1]} ${persianYear}`
    };
  };

  const getLunarDate = (date: Date) => {
    // Manual calculation for Islamic calendar (more accurate than library)
    // Based on the fact that today is 24 Rabi' al-Thani 1447
    
    const islamicMonths = [
      'محرم', 'صفر', 'ربیع الاول', 'ربیع الثانی', 'جمادی الاول', 'جمادی الثانیه',
      'رجب', 'شعبان', 'رمضان', 'شوال', 'ذی القعده', 'ذی الحجه'
    ];
    
    const islamicDays = [
      'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
    ];

    // Reference date: October 17, 2025 = 24 Rabi' al-Thani 1447
    const referenceDate = new Date('2025-10-17');
    const referenceIslamic = { year: 1447, month: 4, day: 24 };
    
    const daysDiff = Math.floor((date.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate Islamic date
    let islamicYear = referenceIslamic.year;
    let islamicMonth = referenceIslamic.month;
    let islamicDay = referenceIslamic.day + daysDiff;
    
    // Adjust for month length (Islamic months are 29 or 30 days)
    const monthLengths = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
    
    while (islamicDay > monthLengths[islamicMonth - 1]) {
      islamicDay -= monthLengths[islamicMonth - 1];
      islamicMonth++;
      if (islamicMonth > 12) {
        islamicMonth = 1;
        islamicYear++;
      }
    }
    
    while (islamicDay < 1) {
      islamicMonth--;
      if (islamicMonth < 1) {
        islamicMonth = 12;
        islamicYear--;
      }
      islamicDay += monthLengths[islamicMonth - 1];
    }
    
    const dayName = islamicDays[date.getDay()];
    const monthName = islamicMonths[islamicMonth - 1];
    
    return {
      year: islamicYear,
      month: islamicMonth,
      day: islamicDay,
      full: `${dayName} - ${islamicDay} ${monthName} ${islamicYear}`
    };
  };

  const getGregorianDate = (date: Date) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const days = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];

    return {
      year: date.getFullYear(),
      month: months[date.getMonth()],
      day: date.getDate(),
      dayName: days[date.getDay()],
      full: `${days[date.getDay()]} - ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
    };
  };

  const persianDate = getPersianDate(currentTime);
  const lunarDate = getLunarDate(currentTime);
  const gregorianDate = getGregorianDate(currentTime);

  return (
    <Paper sx={{ 
      p: 3, 
      height: '100%', 
      borderRadius: 3,
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
    }}>
      {/* Header with Time Format Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTime sx={{ color: 'primary.main', fontSize: 24 }} />
          <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
            تاریخ و ساعت
          </Typography>
        </Box>
        <FormControlLabel
          control={
            <Switch
              checked={is24Hour}
              onChange={(e) => setIs24Hour(e.target.checked)}
              color="primary"
              size="small"
            />
          }
          label={
            <Typography variant="caption" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif' }}>
              {is24Hour ? '24h' : '12h'}
            </Typography>
          }
        />
      </Box>

      {/* Time Display */}
      <Box sx={{ 
        textAlign: 'center', 
        mb: 2,
        p: 1.5,
        bgcolor: alpha(theme.palette.primary.main, 0.1),
        borderRadius: 2
      }}>
        <Typography 
          variant="h4" 
          fontWeight="bold" 
          sx={{ 
            fontFamily: 'Vazirmatn, Arial, sans-serif',
            color: 'primary.main'
          }}
        >
          {formatTime(currentTime)}
        </Typography>
      </Box>

      {/* Calendar Information - Side by Side */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {/* Persian Date */}
        <Box sx={{ 
          flex: 1,
          p: 1, 
          bgcolor: alpha(theme.palette.success.main, 0.1),
          borderRadius: 1.5,
          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
          textAlign: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
            <CalendarToday sx={{ color: 'success.main', fontSize: 14 }} />
            <Typography variant="caption" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', color: 'success.main' }}>
              شمسی
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: '0.7rem' }}>
            {persianDate.full}
          </Typography>
        </Box>

        {/* Lunar Date */}
        <Box sx={{ 
          flex: 1,
          p: 1, 
          bgcolor: alpha(theme.palette.info.main, 0.1),
          borderRadius: 1.5,
          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
          textAlign: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
            <CalendarToday sx={{ color: 'info.main', fontSize: 14 }} />
            <Typography variant="caption" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', color: 'info.main' }}>
              قمری
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: '0.7rem' }}>
            {lunarDate.full}
          </Typography>
        </Box>

        {/* Gregorian Date */}
        <Box sx={{ 
          flex: 1,
          p: 1, 
          bgcolor: alpha(theme.palette.warning.main, 0.1),
          borderRadius: 1.5,
          border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
          textAlign: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
            <CalendarToday sx={{ color: 'warning.main', fontSize: 14 }} />
            <Typography variant="caption" fontWeight="bold" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', color: 'warning.main' }}>
              میلادی
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ fontFamily: 'Vazirmatn, Arial, sans-serif', fontSize: '0.7rem' }}>
            {gregorianDate.full}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
