// Utility functions for accounting coding system

export interface AccountGroup {
  id: string;
  code: string;
  name: string;
  isDefault: boolean;
  isProtected: boolean;
  sortOrder: number;
  classes: AccountClass[];
}

export interface AccountClass {
  id: string;
  code: string;
  name: string;
  nature: 'DEBIT' | 'CREDIT' | 'DEBIT_CREDIT';
  isDefault: boolean;
  isProtected: boolean;
  sortOrder: number;
  subClasses: AccountSubClass[];
}

export interface AccountSubClass {
  id: string;
  code: string;
  name: string;
  hasDetails: boolean;
  isDefault: boolean;
  isProtected: boolean;
  sortOrder: number;
  details: AccountDetail[];
}

export interface AccountDetail {
  id: string;
  code: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isProtected: boolean;
  sortOrder: number;
}

/**
 * Generate next code for a specific level in the hierarchy
 */
export function generateNextCode(
  level: 'group' | 'class' | 'subclass' | 'detail',
  groups: AccountGroup[],
  parentId?: string
): string {
  switch (level) {
    case 'group': {
      // 1 digit: 1-9
      const numericCodes = groups.map(g => parseInt(g.code)).filter(n => !Number.isNaN(n));
      const maxCode = numericCodes.length ? Math.max(...numericCodes) : 0;
      return String(maxCode + 1);
    }
    case 'class': {
      // 1 digit: 1-9
      if (!parentId) return '1';
      const parentGroup = groups.find(g => g.id === parentId);
      if (!parentGroup) return '1';
      const numeric = parentGroup.classes.map(c => parseInt(c.code)).filter(n => !Number.isNaN(n));
      const maxCode = numeric.length ? Math.max(...numeric) : 0;
      return String(maxCode + 1);
    }
    case 'subclass': {
      // 2 digits: 01-99
      if (!parentId) return '01';
      const parentClass = groups.flatMap(g => g.classes).find(c => c.id === parentId);
      if (!parentClass) return '01';
      const numeric = parentClass.subClasses.map(s => parseInt(s.code)).filter(n => !Number.isNaN(n));
      const maxCode = numeric.length ? Math.max(...numeric) : 0;
      const next = Math.min(maxCode + 1, 99);
      return String(next).padStart(2, '0');
    }
    case 'detail': {
      // 2 digits: 01-99
      if (!parentId) return '01';
      const parentSub = groups.flatMap(g => g.classes).flatMap(c => c.subClasses).find(s => s.id === parentId);
      if (!parentSub) return '01';
      const numeric = parentSub.details.map(d => parseInt(d.code)).filter(n => !Number.isNaN(n));
      const maxCode = numeric.length ? Math.max(...numeric) : 0;
      const next = Math.min(maxCode + 1, 99);
      return String(next).padStart(2, '0');
    }
  }
}

/**
 * Generate full account code from hierarchy
 */
export function generateFullCode(
  groupCode: string,
  classCode?: string,
  subclassCode?: string,
  detailCode?: string
): string {
  let full = groupCode || '';
  if (classCode) full += classCode;
  if (subclassCode) full += subclassCode;
  if (detailCode) full += detailCode;
  return full;
}

/**
 * Validate code format for each level
 */
export function validateCodeFormat(
  level: 'group' | 'class' | 'subclass' | 'detail',
  code: string
): { isValid: boolean; error?: string } {
  switch (level) {
    case 'group':
      if (!/^\d{1}$/.test(code)) return { isValid: false, error: 'کد گروه باید 1 رقم باشد.' };
      if (parseInt(code) < 1 || parseInt(code) > 9) return { isValid: false, error: 'کد گروه باید بین 1 تا 9 باشد.' };
      break;

    case 'class':
      if (!/^\d{1}$/.test(code)) return { isValid: false, error: 'کد کل باید 1 رقم باشد.' };
      if (parseInt(code) < 1 || parseInt(code) > 9) return { isValid: false, error: 'کد کل باید بین 1 تا 9 باشد.' };
      break;

    case 'subclass':
      if (!/^\d{2}$/.test(code)) return { isValid: false, error: 'کد معین باید 2 رقم باشد (01-99).' };
      break;

    case 'detail':
      if (!/^\d{2}$/.test(code)) return { isValid: false, error: 'کد تفصیلی باید 2 رقم باشد (01-99).' };
      break;
  }

  return { isValid: true };
}

/**
 * Check if code is unique at the specified level
 */
export function isCodeUnique(
  level: 'group' | 'class' | 'subclass' | 'detail',
  code: string,
  groups: AccountGroup[],
  parentId?: string,
  excludeId?: string
): { isUnique: boolean; error?: string } {
  switch (level) {
    case 'group':
      const existingGroup = groups.find(g => g.code === code && g.id !== excludeId);
      if (existingGroup) {
        return { isUnique: false, error: `کد گروه ${code} قبلاً استفاده شده است` };
      }
      break;

    case 'class':
      if (!parentId) return { isUnique: false, error: 'شناسه گروه الزامی است' };
      const group = groups.find(g => g.id === parentId);
      if (!group) return { isUnique: false, error: 'گروه یافت نشد' };
      
      const existingClass = group.classes.find(c => c.code === code && c.id !== excludeId);
      if (existingClass) {
        return { isUnique: false, error: `کد کل ${code} در این گروه قبلاً استفاده شده است` };
      }
      break;

    case 'subclass':
      if (!parentId) return { isUnique: false, error: 'شناسه کل الزامی است' };
      const groupForSubClass = groups.find(g => g.classes.some(c => c.id === parentId));
      if (!groupForSubClass) return { isUnique: false, error: 'گروه یافت نشد' };
      
      const classForSubClass = groupForSubClass.classes.find(c => c.id === parentId);
      if (!classForSubClass) return { isUnique: false, error: 'کل یافت نشد' };
      
      const existingSubClass = classForSubClass.subClasses.find(s => s.code === code && s.id !== excludeId);
      if (existingSubClass) {
        return { isUnique: false, error: `کد معین ${code} در این کل قبلاً استفاده شده است` };
      }
      break;

    case 'detail':
      if (!parentId) return { isUnique: false, error: 'شناسه معین الزامی است' };
      const groupForDetail = groups.find(g => 
        g.classes.some(c => c.subClasses.some(s => s.id === parentId))
      );
      if (!groupForDetail) return { isUnique: false, error: 'گروه یافت نشد' };
      
      const classForDetail = groupForDetail.classes.find(c => 
        c.subClasses.some(s => s.id === parentId)
      );
      if (!classForDetail) return { isUnique: false, error: 'کل یافت نشد' };
      
      const subClassForDetail = classForDetail.subClasses.find(s => s.id === parentId);
      if (!subClassForDetail) return { isUnique: false, error: 'معین یافت نشد' };
      
      const existingDetail = subClassForDetail.details.find(d => d.code === code && d.id !== excludeId);
      if (existingDetail) {
        return { isUnique: false, error: `کد تفصیلی ${code} در این معین قبلاً استفاده شده است` };
      }
      break;
  }

  return { isUnique: true };
}

/**
 * Validate complete code hierarchy
 */
export function validateCodeHierarchy(
  groupCode: string,
  classCode?: string,
  subclassCode?: string,
  detailCode?: string
): { isValid: boolean; error?: string } {
  // Validate group code
  const groupValidation = validateCodeFormat('group', groupCode);
  if (!groupValidation.isValid) return groupValidation;

  // Validate class code if provided
  if (classCode) {
    const classValidation = validateCodeFormat('class', classCode);
    if (!classValidation.isValid) return classValidation;
  }

  // Validate subclass code if provided
  if (subclassCode) {
    const subclassValidation = validateCodeFormat('subclass', subclassCode);
    if (!subclassValidation.isValid) return subclassValidation;
  }

  // Validate detail code if provided
  if (detailCode) {
    const detailValidation = validateCodeFormat('detail', detailCode);
    if (!detailValidation.isValid) return detailValidation;
  }

  return { isValid: true };
}

/**
 * Get account nature label in Persian
 */
export function getAccountNatureLabel(nature: 'DEBIT' | 'CREDIT' | 'DEBIT_CREDIT'): string {
  switch (nature) {
    case 'DEBIT':
      return 'بدهکار';
    case 'CREDIT':
      return 'بستانکار';
    case 'DEBIT_CREDIT':
      return 'بدهکار–بستانکار';
    default:
      return nature;
  }
}

/**
 * Get account nature color for UI
 */
export function getAccountNatureColor(nature: 'DEBIT' | 'CREDIT' | 'DEBIT_CREDIT'): 'error' | 'success' | 'warning' {
  switch (nature) {
    case 'DEBIT':
      return 'error';
    case 'CREDIT':
      return 'success';
    case 'DEBIT_CREDIT':
      return 'warning';
    default:
      return 'error';
  }
}

/**
 * Sort accounts by code
 */
export function sortAccountsByCode<T extends { code: string }>(accounts: T[]): T[] {
  return accounts.sort((a, b) => {
    const codeA = parseInt(a.code);
    const codeB = parseInt(b.code);
    return codeA - codeB;
  });
}

/**
 * Find account by full code
 */
export function findAccountByFullCode(
  fullCode: string,
  groups: AccountGroup[]
): {
  group?: AccountGroup;
  class?: AccountClass;
  subclass?: AccountSubClass;
  detail?: AccountDetail;
  level: 'group' | 'class' | 'subclass' | 'detail';
} {
  if (fullCode.length === 1) {
    // Group level
    const group = groups.find(g => g.code === fullCode);
    return { group, level: 'group' };
  } else if (fullCode.length === 2) {
    // Class: 1+1
    const groupCode = fullCode.substring(0, 1);
    const classCode = fullCode.substring(1, 2);
    const group = groups.find(g => g.code === groupCode);
    const accountClass = group?.classes.find(c => c.code === classCode);
    return { group, class: accountClass, level: 'class' };
  } else if (fullCode.length === 4) {
    // Subclass: 1+1+2
    const groupCode = fullCode.substring(0, 1);
    const classCode = fullCode.substring(1, 2);
    const subclassCode = fullCode.substring(2, 4);
    const group = groups.find(g => g.code === groupCode);
    const accountClass = group?.classes.find(c => c.code === classCode);
    const subclass = accountClass?.subClasses.find(s => s.code === subclassCode);
    return { group, class: accountClass, subclass, level: 'subclass' };
  } else if (fullCode.length === 6) {
    // Detail: 1+1+2+2
    const groupCode = fullCode.substring(0, 1);
    const classCode = fullCode.substring(1, 2);
    const subclassCode = fullCode.substring(2, 4);
    const detailCode = fullCode.substring(4, 6);
    const group = groups.find(g => g.code === groupCode);
    const accountClass = group?.classes.find(c => c.code === classCode);
    const subclass = accountClass?.subClasses.find(s => s.code === subclassCode);
    const detail = subclass?.details.find(d => d.code === detailCode);
    return { group, class: accountClass, subclass, detail, level: 'detail' };
  }

  return { level: 'group' };
}

/**
 * Generate suggested codes for construction scenarios
 */
export function getConstructionScenarioCodes(scenario: 'partnership_type1' | 'partnership_type2' | 'presale'): {
  landOwnerContribution: string;
  constructionCost: string;
  ownerShare: string;
  landSale: string;
  buyerInstallments: string;
  constructionProfit: string;
  buyerAdvance: string;
  unitSales: string;
} {
  switch (scenario) {
    case 'partnership_type1':
      return {
        landOwnerContribution: '401002', // آورده مالک زمین
        constructionCost: '801', // هزینه ساخت
        ownerShare: '403001' // سهم مالک
      };
    case 'partnership_type2':
      return {
        landSale: '601001', // فروش قدرالسهم زمین
        buyerInstallments: '102002', // اقساط خریداران
        constructionCost: '801', // هزینه ساخت
        constructionProfit: '701' // سود پیمانکاری
      };
    case 'presale':
      return {
        buyerAdvance: '401004', // پیش‌پرداخت خریداران
        buyerInstallments: '102001', // اقساط
        unitSales: '602001', // فروش واحدها
        constructionCost: '801', // هزینه ساخت
        constructionProfit: '402001' // سود
      };
    default:
      return {
        landOwnerContribution: '401002',
        constructionCost: '801',
        ownerShare: '403001',
        landSale: '601001',
        buyerInstallments: '102002',
        constructionProfit: '701',
        buyerAdvance: '401004',
        unitSales: '602001'
      };
  }
}

