# راهنمای تست ویرایش تاریخ پرداخت

## ⚠️ نکته مهم: تفاوت بین تاریخ سررسید و تاریخ پرداخت

### 1️⃣ تاریخ سررسید قسط
- این تاریخی است که قسط باید پرداخت شود
- در **ستون "تاریخ سررسید"** در جدول اقساط نمایش داده می‌شود
- با کلیک روی **دکمه "ویرایش"** در کنار هر قسط قابل ویرایش است
- این تاریخ **قبلاً کار می‌کند** (از logs شما مشخص است)

### 2️⃣ تاریخ پرداخت (که شما می‌خواهید ویرایش کنید)
- این تاریخی است که پرداخت واقعی انجام شده
- در **فیش‌های پرداخت** نمایش داده می‌شود
- باید ابتدا قسط را **باز کنید** (expand)
- سپس در جدول فیش‌ها روی **"ویرایش"** کلیک کنید

## مراحل صحیح برای ویرایش تاریخ پرداخت

### مرحله 1: باز کردن صفحه
```
URL: http://localhost:3000/finance/[projectId]/users/[userId]
مثال: http://localhost:3000/finance/cmfqu2aw10001udjc3chinixh/users/cmgfjq56x0007udgom4f6ung1
```

### مرحله 2: پیدا کردن قسطی که پرداخت دارد
در جدول اقساط، ستون **"فیش‌ها"** را ببینید:
- اگر عددی بیشتر از 0 باشد (مثلاً: "1 فیش") یعنی این قسط پرداخت دارد
- روی **فلش سمت چپ** (◀) کلیک کنید تا قسط باز شود

### مرحله 3: مشاهده فیش‌های پرداخت
بعد از باز کردن قسط، یک جدول جدید ظاهر می‌شود با عنوان **"فیش‌های پرداخت"**:
- ستون‌ها: شماره فیش | مبلغ فیش | تاریخ فیش | توضیحات | عملیات
- در ستون "عملیات" دکمه‌های: **ویرایش** | نمایش | حذف

### مرحله 4: ویرایش تاریخ پرداخت
1. روی دکمه **"ویرایش"** (با آیکون مداد) کلیک کنید
2. یک dialog باز می‌شود با عنوان **"ویرایش پرداخت"** یا **"ویرایش فیش"**
3. سه فیلد خواهید دید:
   - مبلغ پرداخت (ریال)
   - **تاریخ پرداخت** ← اینجاست!
   - توضیحات

### مرحله 5: تغییر تاریخ
1. روی فیلد **"تاریخ پرداخت"** کلیک کنید
2. تقویم شمسی باز می‌شود
3. یک تاریخ جدید انتخاب کنید
4. روی **"ذخیره"** کلیک کنید

### مرحله 6: بررسی تغییرات
1. dialog بسته می‌شود
2. در جدول فیش‌ها، ستون "تاریخ فیش" باید تاریخ جدید را نشان دهد
3. در console browser باید این logs را ببینید:
   ```
   EditPaymentDialog: Setting payment data: {...}
   PersianDatePicker: useEffect triggered with value: [old date]
   PersianDatePicker: handleDateChange called with: {...}
   PersianDatePicker: Converted to ISO date: [new date]
   EditPaymentDialog: Payment date changed to: [new date]
   EditPaymentDialog: Saving payment with data: {...}
   ```

## اگر مشکل هنوز وجود دارد

### چک لیست 1: آیا در جای درستی هستید؟
- [ ] آیا قسط را باز کردید (expand)؟
- [ ] آیا جدول "فیش‌های پرداخت" را می‌بینید؟
- [ ] آیا روی "ویرایش" در جدول **فیش‌ها** کلیک کردید (نه در جدول اقساط)؟

### چک لیست 2: آیا dialog درست باز می‌شود؟
- [ ] آیا dialog عنوان "ویرایش پرداخت" یا "ویرایش فیش" دارد؟
- [ ] آیا سه فیلد می‌بینید (مبلغ، تاریخ، توضیحات)؟
- [ ] آیا فیلد تاریخ مقدار اولیه دارد؟

### چک لیست 3: آیا تقویم باز می‌شود؟
- [ ] آیا روی فیلد "تاریخ پرداخت" کلیک کردید؟
- [ ] آیا تقویم شمسی ظاهر می‌شود؟
- [ ] آیا می‌توانید روی تاریخ‌های مختلف کلیک کنید؟

### چک لیست 4: آیا تاریخ تغییر می‌کند؟
- [ ] بعد از انتخاب تاریخ، آیا در فیلد نمایش داده می‌شود؟
- [ ] آیا در console این log را می‌بینید: `PersianDatePicker: handleDateChange called`؟
- [ ] آیا در console این log را می‌بینید: `EditPaymentDialog: Payment date changed to`؟

### چک لیست 5: آیا ذخیره می‌شود؟
- [ ] آیا روی دکمه "ذخیره" کلیک کردید؟
- [ ] آیا در console این log را می‌بینید: `EditPaymentDialog: Saving payment with data`؟
- [ ] آیا در server console این log را می‌بینید: `Payment update request`؟
- [ ] آیا dialog بسته می‌شود؟

## Screenshots مورد نیاز

اگر مشکل ادامه دارد، لطفاً:

1. **Screenshot از صفحه**: نشان دهید که کجا هستید
2. **Screenshot از جدول فیش‌ها**: نشان دهید که جدول فیش‌های پرداخت را می‌بینید
3. **Screenshot از dialog**: نشان دهید که dialog "ویرایش پرداخت" باز شده
4. **Screenshot از console**: همه logs را نشان دهید
5. **Video کوتاه**: فرآیند کامل را ضبط کنید

## Logs مورد انتظار

### هنگام باز کردن dialog:
```javascript
EditPaymentDialog: Setting payment data: {
  id: "cmf1234567890",
  amount: 1000000,
  paymentDate: "2025-08-29T00:00:00.000Z",
  description: "..."
}
EditPaymentDialog: Setting payment date: 2025-08-29
PersianDatePicker: useEffect triggered with value: 2025-08-29
PersianDatePicker: Parsed date: Fri Aug 29 2025 03:30:00 GMT+0330
PersianDatePicker: Created Persian date: Object { ... }
```

### هنگام تغییر تاریخ:
```javascript
PersianDatePicker: handleDateChange called with: Object { ... }
PersianDatePicker: Converted to ISO date: 2025-09-24
EditPaymentDialog: Payment date changed to: 2025-09-24
```

### هنگام ذخیره:
```javascript
EditPaymentDialog: Saving payment with data: {
  id: "cmf1234567890",
  amount: 1000000,
  paymentDate: "2025-09-24",
  description: "..."
}
```

### در server console:
```javascript
Payment update request: {
  paymentId: 'cmf1234567890',
  body: { amount: 1000000, paymentDate: '2025-09-24', description: '...' }
}
Updated payment: {
  id: 'cmf1234567890',
  paymentDate: 2025-09-24T00:00:00.000Z,
  ...
}
```

## نتیجه‌گیری

- اگر logs مشابه بالا را می‌بینید، یعنی سیستم درست کار می‌کند
- اگر logs متفاوت است، لطفاً آنها را برایم ارسال کنید
- اگر مشکل در قسمت خاصی است، به من بگویید تا آن قسمت را بررسی کنم
