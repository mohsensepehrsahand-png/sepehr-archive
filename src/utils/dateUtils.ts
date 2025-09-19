// Utility functions for Persian date formatting

export const formatPersianDate = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'persian'
  };
  
  return new Intl.DateTimeFormat('fa-IR', options).format(date);
};


export const formatPersianDateShort = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    calendar: 'persian'
  };
  
  return new Intl.DateTimeFormat('fa-IR', options).format(date);
};

export const getCurrentPersianDate = (): string => {
  // Only run on client side to avoid hydration issues
  if (typeof window === 'undefined') {
    return '';
  }
  
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    calendar: 'persian'
  };
  
  const formatted = new Intl.DateTimeFormat('fa-IR', options).format(now);
  
  // Convert to custom format: "جمعه 3 شهریور 1405"
  const parts = formatted.split(' ');
  if (parts.length >= 4) {
    const weekday = parts[0]; // جمعه
    const day = parts[1]; // 3
    const month = parts[2]; // شهریور
    const year = parts[3]; // 1405
    return `${weekday} ${day} ${month} ${year}`;
  }
  
  return formatted;
};

export const getCurrentPersianTime = (): string => {
  // Only run on client side to avoid hydration issues
  if (typeof window === 'undefined') {
    return '';
  }
  
  const now = new Date();
  return now.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatRelativeTime = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'همین الان';
  if (diffMins < 60) return `${diffMins} دقیقه پیش`;
  if (diffHours < 24) return `${diffHours} ساعت پیش`;
  if (diffDays < 7) return `${diffDays} روز پیش`;
  
  // For older dates, show Persian date
  return formatPersianDateShort(date);
};

// Convert Persian year to Gregorian dates
export const getPersianYearStartDate = (persianYear: number): string => {
  // Persian year starts on March 21st (approximately)
  // We need to calculate the exact Gregorian date for Farvardin 1st of the given Persian year
  const gregorianYear = persianYear + 621; // Approximate conversion
  
  // For simplicity, we'll use March 21st as the start of Persian year
  // In a more accurate implementation, you might want to use a proper Persian calendar library
  const startDate = new Date(gregorianYear, 2, 21); // Month is 0-indexed, so 2 = March
  return startDate.toISOString().split('T')[0];
};

export const getPersianYearEndDate = (persianYear: number): string => {
  // Persian year ends on March 20th of the next Gregorian year
  const gregorianYear = persianYear + 622; // Next year
  const endDate = new Date(gregorianYear, 2, 20); // March 20th
  return endDate.toISOString().split('T')[0];
};