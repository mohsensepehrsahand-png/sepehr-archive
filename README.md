# سیستم آرشیو اسناد سپهر (Sepehr Archive System)

A comprehensive document management and archive system built with Next.js, featuring Persian language support, role-based access control, and modern UI components.

## ویژگی‌های اصلی (Key Features)

### 🗂️ مدیریت پروژه‌ها و اسناد
- **مدیریت پروژه‌ها**: ایجاد، ویرایش و حذف پروژه‌های مختلف
- **ساختار پوشه‌ای**: سازماندهی اسناد در پوشه‌های سلسله‌مراتبی
- **آپلود اسناد**: پشتیبانی از انواع فایل‌های مختلف (PDF، تصاویر، اسناد Word و Excel)
- **جستجوی هوشمند**: جستجو در پروژه‌ها، پوشه‌ها و اسناد

### 👥 مدیریت کاربران و دسترسی‌ها
- **سیستم احراز هویت**: ورود امن با نام کاربری و رمز عبور
- **کنترل دسترسی مبتنی بر نقش**: نقش‌های مختلف (مدیر، خریدار، پیمانکار، تامین‌کننده)
- **مدیریت مجوزها**: تعیین دسترسی‌های مختلف برای پوشه‌ها و پروژه‌ها

### 📊 داشبورد و گزارش‌گیری
- **داشبورد مدیریتی**: نمایش آمار کلی و فعالیت‌های اخیر
- **گزارش‌گیری**: گزارش‌های مختلف از فعالیت‌ها و اسناد
- **لاگ فعالیت‌ها**: ثبت تمام عملیات انجام شده در سیستم

### 🎨 رابط کاربری مدرن
- **طراحی ریسپانسیو**: سازگار با تمام دستگاه‌ها
- **پشتیبانی از زبان فارسی**: فونت و راست‌چین بودن کامل
- **رابط کاربری Material-UI**: استفاده از کامپوننت‌های مدرن

## تکنولوژی‌های استفاده شده (Tech Stack)

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Library**: Material-UI (MUI) v7
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcryptjs
- **State Management**: Zustand, React Context
- **Styling**: Emotion, CSS-in-JS
- **Testing**: Vitest, Playwright
- **Font**: Vazirmatn (Persian font)

## نصب و راه‌اندازی (Installation)

### پیش‌نیازها (Prerequisites)
- Node.js 18+ 
- PostgreSQL 12+
- npm یا yarn

### مراحل نصب

1. **کلون کردن پروژه**
```bash
git clone <repository-url>
cd sepehr-archive
```

2. **نصب وابستگی‌ها**
```bash
npm install
# یا
yarn install
```

3. **تنظیم پایگاه داده**
```bash
# ایجاد فایل .env.local
cp .env.example .env.local

# ویرایش متغیرهای محیطی
DATABASE_URL="postgresql://username:password@localhost:5432/sepehr_archive"
```

4. **راه‌اندازی پایگاه داده**
```bash
# اجرای migration ها
npx prisma migrate dev

# پر کردن پایگاه داده با داده‌های نمونه
npm run db:seed
```

5. **اجرای پروژه**
```bash
npm run dev
```

پروژه در آدرس [http://localhost:3000](http://localhost:3000) در دسترس خواهد بود.

## ساختار پروژه (Project Structure)

```
sepehr-archive/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (routes)/          # صفحات اصلی
│   │   │   ├── dashboard/     # داشبورد
│   │   │   ├── projects/      # مدیریت پروژه‌ها
│   │   │   ├── documents/     # مدیریت اسناد
│   │   │   ├── users/         # مدیریت کاربران
│   │   │   └── admin/         # پنل مدیریت
│   │   ├── api/               # API Routes
│   │   └── login/             # صفحه ورود
│   ├── components/            # کامپوننت‌های قابل استفاده مجدد
│   │   ├── dashboard/         # کامپوننت‌های داشبورد
│   │   ├── layout/            # کامپوننت‌های چیدمان
│   │   ├── mobile/            # کامپوننت‌های موبایل
│   │   └── projects/          # کامپوننت‌های پروژه
│   ├── contexts/              # React Context ها
│   ├── lib/                   # توابع کمکی
│   └── utils/                 # ابزارهای کمکی
├── prisma/                    # Prisma Schema و Migration ها
├── public/                    # فایل‌های استاتیک
└── uploads/                   # فایل‌های آپلود شده
```

## API Endpoints

### احراز هویت (Authentication)
- `POST /api/auth/login` - ورود کاربر
- `POST /api/auth/logout` - خروج کاربر
- `GET /api/auth/current-user` - اطلاعات کاربر فعلی

### پروژه‌ها (Projects)
- `GET /api/projects` - لیست پروژه‌ها
- `POST /api/projects` - ایجاد پروژه جدید
- `GET /api/projects/[id]` - جزئیات پروژه
- `PUT /api/projects/[id]` - ویرایش پروژه
- `DELETE /api/projects/[id]` - حذف پروژه

### اسناد (Documents)
- `GET /api/documents` - لیست اسناد
- `POST /api/documents` - آپلود سند جدید
- `GET /api/documents/[id]` - جزئیات سند
- `GET /api/documents/[id]/download` - دانلود سند
- `DELETE /api/documents/[id]` - حذف سند

### پوشه‌ها (Folders)
- `GET /api/folders` - لیست پوشه‌ها
- `POST /api/folders` - ایجاد پوشه جدید
- `PUT /api/folders/[id]` - ویرایش پوشه
- `DELETE /api/folders/[id]` - حذف پوشه

## اسکریپت‌های موجود (Available Scripts)

```bash
# اجرای پروژه در حالت توسعه
npm run dev

# ساخت پروژه برای تولید
npm run build

# اجرای پروژه در حالت تولید
npm run start

# اجرای تست‌ها
npm run test

# اجرای تست‌ها با رابط کاربری
npm run test:ui

# اجرای linter
npm run lint

# پر کردن پایگاه داده
npm run db:seed
```

## تنظیمات (Configuration)

### متغیرهای محیطی (Environment Variables)

```env
# پایگاه داده
DATABASE_URL="postgresql://username:password@localhost:5432/sepehr_archive"

# تنظیمات امنیتی
JWT_SECRET="your-jwt-secret"
BCRYPT_ROUNDS=12

# تنظیمات آپلود
MAX_FILE_SIZE=104857600  # 100MB
UPLOAD_PATH="./uploads"

# تنظیمات سیستم
NEXT_PUBLIC_APP_NAME="سیستم آرشیو اسناد سپهر"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

## مشارکت (Contributing)

1. Fork کنید
2. شاخه جدید ایجاد کنید (`git checkout -b feature/amazing-feature`)
3. تغییرات را commit کنید (`git commit -m 'Add some amazing feature'`)
4. به شاخه push کنید (`git push origin feature/amazing-feature`)
5. Pull Request ایجاد کنید

## مجوز (License)

این پروژه تحت مجوز MIT منتشر شده است. برای جزئیات بیشتر فایل `LICENSE` را مطالعه کنید.

## پشتیبانی (Support)

برای گزارش باگ یا درخواست ویژگی جدید، لطفاً issue جدیدی در GitHub ایجاد کنید.

## تغییرات (Changelog)

### نسخه 1.0.0
- راه‌اندازی اولیه سیستم
- مدیریت پروژه‌ها و اسناد
- سیستم احراز هویت
- رابط کاربری فارسی
- پشتیبانی از موبایل

---

**توسعه‌دهنده**: تیم توسعه سپهر  
**آخرین بروزرسانی**: 2024
