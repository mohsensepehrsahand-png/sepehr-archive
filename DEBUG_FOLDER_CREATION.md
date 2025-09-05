# راهنمای Debug برای مشکل ساخت پوشه

## مشکل فعلی
خطای 500 Internal Server Error هنگام ساخت پوشه جدید

## مراحل Debug

### 1. تست اتصال دیتابیس
```bash
# تست endpoint سلامت
GET /api/health

# تست endpoint ساده
GET /api/test
```

### 2. بررسی Console
- خطاهای دقیق در console مرورگر
- خطاهای API در Network tab
- خطاهای server در terminal

### 3. بررسی Database
```bash
# بررسی schema
npx prisma db push

# مشاهده دیتابیس
npx prisma studio --port 5555
```

### 4. تست API با داده‌های ساده
```json
{
  "name": "test",
  "projectId": "cmf2bwhcp0001udvcczw1zxjm",
  "description": "",
  "parentId": null,
  "path": "/test",
  "depth": 1,
  "createdBy": "cmelwu4ao0000udnosqifl9mw"
}
```

## تغییرات اعمال شده

### 1. ساده‌سازی API
- حذف validation‌های پیچیده
- استفاده از مقادیر ثابت برای tabKey
- error handling بهتر

### 2. اضافه کردن Logging
- console.log برای تمام مراحل
- error details کامل
- database connection testing

### 3. Health Check Endpoint
- تست اتصال دیتابیس
- تست query ساده
- گزارش وضعیت سیستم

## نکات مهم

1. **Database Connection**: بررسی اتصال به SQLite
2. **File Permissions**: مشکل در Windows file permissions
3. **Schema Validation**: بررسی تطابق schema با database
4. **Data Types**: بررسی نوع داده‌های ارسالی

## مراحل بعدی

1. تست endpoint سلامت
2. بررسی console برای خطاهای دقیق
3. تست با داده‌های ساده
4. بررسی database schema
5. حل مشکل file permissions

## گزارش خطا

اگر همچنان مشکل وجود دارد:
1. نتیجه `/api/health` را گزارش دهید
2. خطاهای دقیق console را کپی کنید
3. Network tab errors را بررسی کنید
4. Database connection status را گزارش دهید
