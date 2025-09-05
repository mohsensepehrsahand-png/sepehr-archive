// Safe value handling to prevent NaN
export const getSafeString = (val: any, defaultValue: string = ''): string => {
  if (val === null || val === undefined || isNaN(val)) {
    return defaultValue;
  }
  return String(val);
};

export const getSafeNumber = (val: any, defaultValue: number = 0): number => {
  if (val === null || val === undefined || isNaN(val)) {
    return defaultValue;
  }
  const num = Number(val);
  return isNaN(num) ? defaultValue : num;
};

