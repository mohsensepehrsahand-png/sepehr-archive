# سیستم آرشیو اسناد سپهر (Sepehr Archive System)

<div align="center">
  <img src="public/logo.png" alt="Sepehr Archive Logo" width="200" height="200">
  
  [![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-6.13.0-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue?style=for-the-badge&logo=postgresql)](https://postgresql.org/)
</div>

## 📋 نمای کلی پروژه

سیستم آرشیو اسناد سپهر یک پلتفرم جامع مدیریت اسناد و حسابداری است که برای سازمان‌ها و شرکت‌های ساختمانی طراحی شده است. این سیستم شامل مدیریت پروژه‌ها، اسناد، کاربران، سیستم مالی پیشرفته و سیستم حسابداری کامل می‌باشد.

## ✨ ویژگی‌های اصلی

### 🗂️ مدیریت پروژه‌ها و اسناد
- **مدیریت پروژه‌ها**: ایجاد، ویرایش و حذف پروژه‌های مختلف با پالت رنگی سفارشی
- **ساختار پوشه‌ای**: سازماندهی اسناد در پوشه‌های سلسله‌مراتبی
- **آپلود اسناد**: پشتیبانی از انواع فایل‌های مختلف (PDF، تصاویر، اسناد Word و Excel)
- **جستجوی هوشمند**: جستجو در پروژه‌ها، پوشه‌ها و اسناد با فیلترهای پیشرفته
- **مدیریت نسخه‌ها**: نگهداری تاریخچه تغییرات اسناد

### 👥 مدیریت کاربران و دسترسی‌ها
- **سیستم احراز هویت**: ورود امن با نام کاربری و رمز عبور
- **کنترل دسترسی مبتنی بر نقش**: نقش‌های مختلف (مدیر، خریدار، پیمانکار، تامین‌کننده)
- **مدیریت مجوزها**: تعیین دسترسی‌های مختلف برای پوشه‌ها و پروژه‌ها
- **لاگ فعالیت‌ها**: ثبت تمام عملیات انجام شده در سیستم

### 💰 سیستم مالی پیشرفته
- **مدیریت اقساط**: تعریف و مدیریت اقساط پروژه‌های ساختمانی
- **محاسبه جریمه**: محاسبه خودکار جریمه‌های تأخیر پرداخت
- **گزارش‌گیری مالی**: گزارش‌های جامع از وضعیت مالی پروژه‌ها
- **نمودارهای تحلیلی**: نمایش داده‌های مالی با نمودارهای تعاملی

### 📊 سیستم حسابداری کامل
- **دفتر روزنامه**: ثبت تمام تراکنش‌های مالی به صورت روزانه
- **دفتر کل**: خلاصه‌سازی تمام حساب‌ها و نمایش موجودی نهایی
- **دفتر معین**: مدیریت حساب‌های تفصیلی مشتریان و پیمانکاران
- **کدینگ حساب‌ها**: ساختار سلسله‌مراتبی کدهای حسابداری
- **ترازنامه**: گزارش‌های ترازنامه و صورت سود و زیان
- **سند افتتاحیه و اختتامیه**: مدیریت سال مالی

### 🎨 رابط کاربری مدرن
- **طراحی ریسپانسیو**: سازگار با تمام دستگاه‌ها (دسکتاپ، تبلت، موبایل)
- **پشتیبانی کامل از زبان فارسی**: فونت و راست‌چین بودن کامل
- **رابط کاربری Material-UI**: استفاده از کامپوننت‌های مدرن و زیبا
- **تم تاریک/روشن**: پشتیبانی از تم‌های مختلف
- **ناوبری موبایل**: نوار ناوبری مخصوص موبایل

## 🛠️ تکنولوژی‌های استفاده شده

### Frontend
- **Next.js 15.4.6** - فریمورک React با قابلیت‌های SSR و SSG
- **React 19.1.0** - کتابخانه رابط کاربری
- **TypeScript 5.0** - زبان برنامه‌نویسی نوع‌دار
- **Material-UI 7.3.1** - کتابخانه کامپوننت‌های UI
- **TanStack Query 5.84.2** - مدیریت state و cache
- **React Hook Form 7.62.0** - مدیریت فرم‌ها
- **Recharts 3.1.2** - کتابخانه نمودارها

### Backend
- **Next.js API Routes** - API های RESTful
- **Prisma 6.13.0** - ORM برای مدیریت دیتابیس
- **PostgreSQL** - دیتابیس رابطه‌ای
- **bcryptjs** - هش کردن رمز عبور
- **JWT (jose)** - احراز هویت و مجوزدهی

### Tools & Libraries
- **Vitest** - فریمورک تست
- **Playwright** - تست end-to-end
- **ESLint & Prettier** - کد کوالیتی و فرمت
- **Zustand** - مدیریت state کلاینت

## 🚀 راه‌اندازی پروژه

### پیش‌نیازها
- Node.js 18+ 
- PostgreSQL 13+
- npm یا yarn

### 1. کلون کردن پروژه
```bash
git clone https://github.com/mohsensepehrsahand-png/sepehr-archive.git
cd sepehr-archive
```

### 2. نصب وابستگی‌ها
```bash
npm install
# یا
yarn install
```

### 3. تنظیم دیتابیس

ایجاد فایل `.env.local` در ریشه پروژه:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/sepehr_archive"

# Authentication
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="7d"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR="./uploads"
```

> **توجه**: مقادیر بالا را با اطلاعات واقعی خود جایگزین کنید.

### 4. اجرای Migration ها
```bash
npx prisma migrate dev
```

### 5. Seed کردن دیتابیس
```bash
npm run db:seed
```

### 6. اجرای پروژه
```bash
npm run dev
```

پروژه در آدرس `http://localhost:3000` در دسترس خواهد بود.

### 7. اطلاعات پیش‌فرض ورود
```
نام کاربری: admin
رمز عبور: admin123
```

> **توجه امنیتی**: حتماً رمز عبور پیش‌فرض را بعد از اولین ورود تغییر دهید.

## 🎯 دستورات مهم

```bash
# توسعه
npm run dev              # اجرای محیط Development
npm run build            # ساخت برای Production
npm run start            # اجرای Production Build

# دیتابیس
npm run db:seed          # Seed کردن دیتابیس
npm run db:studio        # باز کردن Prisma Studio
npm run db:reset         # ریست کردن دیتابیس
npx prisma migrate dev   # اجرای Migration جدید
npx prisma generate      # تولید Prisma Client

# تست
npm run test             # اجرای تست‌های واحد
npm run test:e2e         # اجرای تست‌های E2E
npm run test:ui          # اجرای تست با UI
npm run test:coverage    # گزارش Coverage

# کد کوالیتی
npm run lint             # بررسی Lint
npm run lint:fix         # رفع خودکار مشکلات Lint
npm run format           # فرمت کردن کد
```

## 📁 ساختار پروژه

```
src/
├── app/                    # Next.js App Router
│   ├── (routes)/          # صفحات اصلی
│   │   ├── accounting/    # صفحات حسابداری
│   │   ├── finance/       # صفحات مالی
│   │   ├── projects/      # صفحات پروژه‌ها
│   │   └── ...
│   └── api/               # API Routes
│       ├── accounting/    # API های حسابداری
│       ├── finance/       # API های مالی
│       └── ...
├── components/            # کامپوننت‌های React
│   ├── accounting/        # کامپوننت‌های حسابداری
│   ├── finance/           # کامپوننت‌های مالی
│   ├── common/            # کامپوننت‌های مشترک
│   └── layout/            # کامپوننت‌های چیدمان
├── contexts/              # React Context ها
├── hooks/                 # Custom Hooks
├── lib/                   # توابع کمکی
└── utils/                 # ابزارهای کمکی
```

## 🔐 سیستم احراز هویت

### نقش‌های کاربری
- **مدیر (Admin)**: دسترسی کامل به تمام بخش‌ها
- **خریدار (Buyer)**: دسترسی به پروژه‌ها و اسناد مربوطه
- **پیمانکار (Contractor)**: دسترسی محدود به پروژه‌های مربوطه
- **تامین‌کننده (Supplier)**: دسترسی به اطلاعات پروژه‌ها

### امنیت
- هش کردن رمز عبور با bcrypt
- JWT برای احراز هویت
- کنترل دسترسی در سطح API
- اعتبارسنجی ورودی‌ها

## 📊 سیستم حسابداری

### دفاتر سه گانه
1. **دفتر روزنامه**: ثبت تراکنش‌های روزانه
2. **دفتر کل**: خلاصه حساب‌ها
3. **دفتر معین**: حساب‌های تفصیلی

### کدینگ حساب‌ها
- **1000-1999**: دارایی‌ها
- **2000-2999**: بدهی‌ها
- **3000-3999**: حقوق صاحبان سهام
- **4000-4999**: درآمدها
- **5000-5999**: هزینه‌ها

### گزارش‌های مالی
- ترازنامه
- صورت سود و زیان
- تراز آزمایشی
- گزارش‌های تفصیلی

## 💰 سیستم مالی

### مدیریت اقساط
- تعریف اقساط پروژه
- محاسبه سهم هر کاربر
- ثبت پرداخت‌ها
- محاسبه جریمه تأخیر

### ویژگی‌های پیشرفته
- نمودارهای تحلیلی
- گزارش‌های PDF
- اعلان‌های خودکار
- پشتیبانی از چندین ارز

## 📱 طراحی ریسپانسیو

### دسکتاپ
- نوار کناری کامل
- جداول با قابلیت‌های پیشرفته
- نمودارهای تعاملی

### موبایل
- نوار ناوبری پایین
- کارت‌های فشرده
- منوهای کشویی

## 🧪 تست‌ها

### اجرای تست‌ها
```bash
# تست‌های واحد
npm run test

# تست‌های E2E
npm run test:e2e

# تست با UI
npm run test:ui
```

## 📈 عملکرد

### بهینه‌سازی‌ها
- Server-Side Rendering (SSR)
- Static Site Generation (SSG)
- Image Optimization
- Code Splitting
- Caching با React Query

## 🚀 استقرار (Deployment)

### Vercel (توصیه شده)
```bash
npm install -g vercel
vercel
```

### Docker
```bash
docker build -t sepehr-archive .
docker run -p 3000:3000 sepehr-archive
```

## 🤝 مشارکت

1. Fork کنید
2. شاخه جدید ایجاد کنید (`git checkout -b feature/amazing-feature`)
3. تغییرات را commit کنید (`git commit -m 'Add amazing feature'`)
4. Push کنید (`git push origin feature/amazing-feature`)
5. Pull Request ایجاد کنید

## 📝 مجوز

این پروژه تحت مجوز MIT منتشر شده است. برای جزئیات بیشتر فایل [LICENSE](LICENSE) را مطالعه کنید.

## 🔧 عیب‌یابی (Troubleshooting)

### مشکل اتصال به دیتابیس
```bash
# بررسی اتصال PostgreSQL
psql -U username -d sepehr_archive -h localhost

# راه‌اندازی مجدد PostgreSQL
sudo service postgresql restart
```

### خطای Prisma Client
```bash
# تولید مجدد Prisma Client
npx prisma generate

# ریست کردن دیتابیس
npm run db:reset
```

### خطاهای CORS
در فایل `next.config.js` تنظیمات CORS را بررسی کنید.

### مشکل در آپلود فایل
- اطمینان حاصل کنید پوشه `uploads` وجود دارد
- دسترسی‌های فایل را بررسی کنید
- حداکثر سایز فایل را در `.env.local` چک کنید

## 📋 سناریوهای استفاده (Use Cases)

### مدیریت پروژه ساختمانی
1. ایجاد پروژه جدید با اطلاعات کامل
2. تعریف اقساط و زمان‌بندی پرداخت‌ها
3. افزودن کاربران (پیمانکاران، سرمایه‌گذاران)
4. آپلود اسناد و قراردادها
5. ثبت پرداخت‌ها و محاسبه خودکار جریمه‌ها
6. صدور گزارش‌های مالی و حسابداری

### مدیریت حسابداری
1. تعریف دوره مالی جدید
2. ثبت سند افتتاحیه
3. ثبت اسناد حسابداری روزانه
4. مشاهده دفتر روزنامه، کل و معین
5. صدور ترازنامه و صورت سود و زیان
6. ثبت سند اختتامیه پایان سال

## 🏗️ معماری سیستم

### Architecture Overview
```
┌─────────────────────────────────────────────┐
│           Client (Browser)                   │
│  React Components + Material-UI              │
└───────────────┬─────────────────────────────┘
                │ HTTP/HTTPS
                ▼
┌─────────────────────────────────────────────┐
│           Next.js Server                     │
│  ├── App Router (Pages)                      │
│  ├── API Routes (Backend)                    │
│  └── Middleware (Auth)                       │
└───────────────┬─────────────────────────────┘
                │ Prisma ORM
                ▼
┌─────────────────────────────────────────────┐
│          PostgreSQL Database                 │
│  ├── Users & Auth                            │
│  ├── Projects & Documents                    │
│  ├── Financial Data                          │
│  └── Accounting Records                      │
└─────────────────────────────────────────────┘
```

### Database Schema
پروژه از Prisma ORM استفاده می‌کند. برای مشاهده schema کامل، فایل `prisma/schema.prisma` را بررسی کنید.

#### جداول اصلی:
- `User`: کاربران سیستم
- `Project`: پروژه‌های ساختمانی
- `Document`: اسناد آپلود شده
- `Folder`: پوشه‌های سازمان‌دهی
- `InstallmentDefinition`: تعریف اقساط
- `UserInstallment`: اقساط هر کاربر
- `Payment`: پرداخت‌ها
- `Receipt`: رسیدهای مالی
- `AccountingDocument`: اسناد حسابداری
- `AccountingTransaction`: تراکنش‌های حسابداری
- `Account`: حساب‌های حسابداری
- `FiscalYear`: سال‌های مالی

## 🔐 امنیت

### بهترین شیوه‌های امنیتی پیاده‌سازی شده:
- ✅ هش کردن رمز عبور با bcrypt (10 rounds)
- ✅ JWT با انقضای زمانی
- ✅ اعتبارسنجی ورودی‌ها در سمت سرور
- ✅ محافظت در برابر SQL Injection (Prisma ORM)
- ✅ محافظت در برابر XSS
- ✅ CORS Configuration
- ✅ Rate Limiting (در API Routes)
- ✅ کنترل دسترسی مبتنی بر نقش (RBAC)

### توصیه‌های امنیتی:
- 🔒 همیشه از HTTPS در Production استفاده کنید
- 🔒 JWT_SECRET را پیچیده و منحصر به فرد انتخاب کنید
- 🔒 رمز عبور پیش‌فرض را تغییر دهید
- 🔒 به‌روزرسانی‌های امنیتی را نصب کنید
- 🔒 Backup منظم از دیتابیس بگیرید

## 🌐 API Documentation

### Authentication
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### Projects
```http
GET    /api/projects          # لیست پروژه‌ها
POST   /api/projects          # ایجاد پروژه
GET    /api/projects/:id      # جزئیات پروژه
PUT    /api/projects/:id      # ویرایش پروژه
DELETE /api/projects/:id      # حذف پروژه
```

### Documents
```http
GET    /api/documents         # لیست اسناد
POST   /api/upload            # آپلود سند
DELETE /api/documents/:id     # حذف سند
```

### Finance
```http
GET    /api/finance/projects/:id/users/:userId/installments
POST   /api/finance/payments
GET    /api/finance/receipts
```

### Accounting
```http
GET    /api/accounting/fiscal-years
POST   /api/accounting/documents
GET    /api/accounting/daybook
GET    /api/accounting/ledger
GET    /api/accounting/trial-balance
```

## 📊 مدل‌های داده اصلی

### User Model
```typescript
{
  id: string
  username: string
  password: string (hashed)
  fullName: string
  role: "ADMIN" | "BUYER" | "CONTRACTOR" | "SUPPLIER"
  createdAt: Date
  updatedAt: Date
}
```

### Project Model
```typescript
{
  id: string
  name: string
  color: string
  totalBudget: Decimal
  status: string
  archived: boolean
  createdAt: Date
  updatedAt: Date
}
```

## 📈 نقشه راه (Roadmap)

### نسخه‌های آینده

#### v2.0 (در حال توسعه)
- [ ] پشتیبانی از چند زبانه (انگلیسی، عربی)
- [ ] اپلیکیشن موبایل (React Native)
- [ ] اعلان‌های Real-time با WebSocket
- [ ] سیستم چت داخلی
- [ ] ویرایشگر آنلاین اسناد

#### v2.1 (برنامه‌ریزی شده)
- [ ] هوش مصنوعی برای پیش‌بینی مالی
- [ ] تشخیص خودکار OCR برای اسناد
- [ ] یکپارچه‌سازی با نرم‌افزارهای حسابداری
- [ ] گزارش‌دهی پیشرفته با Power BI

## ❓ سوالات متداول (FAQ)

### چگونه یک پروژه جدید ایجاد کنم؟
از منوی Projects > New Project استفاده کنید.

### چگونه اقساط را تعریف کنم؟
در صفحه پروژه، تب Finance > Installments را انتخاب کنید.

### چگونه سند حسابداری ثبت کنم؟
Accounting > Documents > New Document

### چگونه Backup بگیرم؟
```bash
# Backup دیتابیس
pg_dump -U username sepehr_archive > backup.sql

# Backup فایل‌ها
tar -czf uploads_backup.tar.gz uploads/
```

### چگونه از SQLite به PostgreSQL مهاجرت کنم؟
پروژه از PostgreSQL استفاده می‌کند و SQLite پشتیبانی نمی‌شود.

## 📞 پشتیبانی

- **ایمیل**: support@sepehr-archive.com
- **تلفن**: +98-21-1234-5678
- **وب‌سایت**: https://sepehr-archive.com
- **GitHub Issues**: [گزارش مشکل](https://github.com/mohsensepehrsahand-png/sepehr-archive/issues)

## 🤝 راهنمای مشارکت

### قبل از شروع
1. Issue جدید ایجاد کنید یا یکی از Issueهای موجود را انتخاب کنید
2. با تیم توسعه هماهنگ کنید
3. استانداردهای کدنویسی را رعایت کنید

### استانداردهای کدنویسی
- از TypeScript استفاده کنید
- از ESLint و Prettier پیروی کنید
- تست برای کدهای جدید بنویسید
- کامنت‌های فارسی برای توضیحات پیچیده
- نام متغیرها به انگلیسی

### پروسه Review
1. کد را بررسی می‌کنیم
2. تست‌ها را اجرا می‌کنیم
3. نظرات را ارائه می‌دهیم
4. بعد از تایید، Merge می‌کنیم

## 📝 Changelog

### [v1.5.0] - 2025-01-12
#### اضافه شده
- سیستم حسابداری کامل با دفاتر سه‌گانه
- مدیریت سال مالی و دوره‌های مالی
- سند افتتاحیه و اختتامیه
- گزارش‌های مالی پیشرفته

#### بهبود یافته
- بهینه‌سازی عملکرد دیتابیس
- رابط کاربری موبایل
- سیستم احراز هویت

#### رفع شده
- مشکل محاسبه جریمه دیرکرد
- خطا در ویرایش تاریخ پرداخت
- مشکل آپلود فایل‌های بزرگ

### [v1.0.0] - 2024-09-06
- انتشار اولیه

## 🙏 تشکر

از تمام کسانی که در توسعه این پروژه مشارکت داشته‌اند، صمیمانه تشکر می‌کنیم.

### تکنولوژی‌ها و ابزارهای استفاده شده
- [Next.js](https://nextjs.org/) - فریمورک React
- [Prisma](https://prisma.io/) - ORM
- [Material-UI](https://mui.com/) - کتابخانه UI
- [TanStack Query](https://tanstack.com/query) - مدیریت State
- [PostgreSQL](https://postgresql.org/) - دیتابیس

---

<div align="center">
  <p>ساخته شده با ❤️ در ایران</p>
  <p>© 2024 سیستم آرشیو اسناد سپهر. تمام حقوق محفوظ است.</p>
</div>