# کامپوننت‌های فیلتر قابل استفاده مجدد

این پوشه شامل کامپوننت‌های فیلتر قابل استفاده مجدد است که می‌توانید در هر جدولی استفاده کنید.

## کامپوننت‌های موجود

### 1. `DateFilter.tsx`
فیلتر تاریخ با قابلیت‌های مختلف مقایسه

**ویژگی‌ها:**
- فیلترهای فارسی (برابر، مخالف، کمتر، بیشتر، بین و...)
- پشتیبانی از فیلتر بین دو تاریخ
- نمایش وضعیت فیلتر فعال
- قابلیت پاک کردن فیلتر

**استفاده:**
```tsx
import DateFilter from '@/components/common/DateFilter';

<DateFilter
  onFilterChange={(filter) => setDateFilter(filter)}
  currentFilter={dateFilter}
  showChip={true}
  size="small"
/>
```

### 2. `SearchFilter.tsx`
فیلتر جستجو با قابلیت پاک کردن

**ویژگی‌ها:**
- جستجو در فیلدهای مختلف
- نمایش چیپ جستجوی فعال
- آیکون پاک کردن خودکار
- پشتیبانی از RTL

**استفاده:**
```tsx
import SearchFilter from '@/components/common/SearchFilter';

<SearchFilter
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="جستجو..."
  showChip={true}
/>
```

### 3. `StatusFilter.tsx`
فیلتر وضعیت با گزینه‌های رنگی

**ویژگی‌ها:**
- گزینه‌های رنگی برای وضعیت‌های مختلف
- نمایش چیپ وضعیت انتخاب شده
- قابلیت پاک کردن فیلتر
- پشتیبانی از RTL

**استفاده:**
```tsx
import StatusFilter, { StatusOption } from '@/components/common/StatusFilter';

const statusOptions: StatusOption[] = [
  { value: 'active', label: 'فعال', color: 'success' },
  { value: 'inactive', label: 'غیرفعال', color: 'error' },
];

<StatusFilter
  value={statusValue}
  onChange={setStatusValue}
  options={statusOptions}
  label="وضعیت"
  showChip={true}
/>
```

### 4. `TableFilters.tsx`
کامپوننت ترکیبی شامل همه فیلترها

**ویژگی‌ها:**
- ترکیب همه فیلترها در یک کامپوننت
- قابلیت جمع‌شو (Collapsible)
- دکمه پاک کردن همه فیلترها
- نمایش وضعیت فیلترهای فعال

**استفاده:**
```tsx
import TableFilters from '@/components/common/TableFilters';

<TableFilters
  searchValue={searchTerm}
  onSearchChange={setSearchTerm}
  searchPlaceholder="جستجو..."
  dateFilter={dateFilter}
  onDateFilterChange={setDateFilter}
  showDateFilter={true}
  statusValue={statusValue}
  onStatusChange={setStatusValue}
  statusOptions={statusOptions}
  showStatusFilter={true}
  onClearAll={clearAllFilters}
  hasActiveFilters={hasActiveFilters}
  title="فیلترها"
/>
```

## هوک `useTableFilters`

هوک سفارشی برای مدیریت فیلترها

**ویژگی‌ها:**
- فیلتر خودکار بر اساس فیلدهای مشخص شده
- پشتیبانی از فیلترهای سفارشی
- مدیریت وضعیت فیلترها
- بهینه‌سازی عملکرد

**استفاده:**
```tsx
import { useTableFilters } from '@/hooks/useTableFilters';

const {
  filteredData,
  filters,
  setSearchTerm,
  setDateFilter,
  setCustomFilter,
  clearAllFilters,
  hasActiveFilters
} = useTableFilters({
  data: yourData,
  searchFields: ['name', 'description'],
  dateField: 'date',
  customFilterFields: {
    status: (item, value) => item.status === value
  }
});
```

## مثال کامل

برای مشاهده مثال‌های کامل، فایل `FilterExamples.tsx` را بررسی کنید.

## نکات مهم

1. **RTL Support**: همه کامپوننت‌ها از راست به چپ پشتیبانی می‌کنند
2. **Font**: از فونت Vazirmatn استفاده می‌کنند
3. **Responsive**: در اندازه‌های مختلف صفحه کار می‌کنند
4. **Accessibility**: قابلیت دسترسی مناسب دارند
5. **Performance**: بهینه‌سازی شده برای عملکرد بهتر

## نحوه اضافه کردن به جدول جدید

1. هوک `useTableFilters` را import کنید
2. فیلدهای جستجو و تاریخ را مشخص کنید
3. کامپوننت `TableFilters` را اضافه کنید
4. `filteredData` را در جدول استفاده کنید

```tsx
// 1. Import
import { useTableFilters } from '@/hooks/useTableFilters';
import TableFilters from '@/components/common/TableFilters';

// 2. Use hook
const { filteredData, filters, setSearchTerm, setDateFilter, clearAllFilters, hasActiveFilters } = useTableFilters({
  data: yourData,
  searchFields: ['field1', 'field2'],
  dateField: 'dateField'
});

// 3. Add filters UI
<TableFilters
  searchValue={filters.searchTerm}
  onSearchChange={setSearchTerm}
  dateFilter={filters.dateFilter}
  onDateFilterChange={setDateFilter}
  onClearAll={clearAllFilters}
  hasActiveFilters={hasActiveFilters}
/>

// 4. Use in table
{filteredData.map(item => ...)}
```
