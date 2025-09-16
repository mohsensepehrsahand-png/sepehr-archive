// Utility functions for accounting operations

export interface Account {
  id: string;
  name: string;
  code: string;
  type: string;
  level: number;
  parentId?: string;
  isActive: boolean;
}

export interface TransactionEntry {
  id: string;
  accountId: string;
  account: Account;
  debit: number;
  credit: number;
}

export interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  reference?: string;
  debit: number;
  credit: number;
  balance: number;
  journalType: string;
}

/**
 * Calculate running balance for ledger entries
 */
export function calculateRunningBalance(entries: LedgerEntry[], accountType: string): LedgerEntry[] {
  let runningBalance = 0;
  
  return entries.map(entry => {
    // Determine if this is a debit or credit account
    const isDebitAccount = ['ASSET', 'EXPENSE'].includes(accountType);
    
    if (isDebitAccount) {
      runningBalance = runningBalance + entry.debit - entry.credit;
    } else {
      runningBalance = runningBalance + entry.credit - entry.debit;
    }
    
    return {
      ...entry,
      balance: runningBalance
    };
  });
}

/**
 * Calculate account summary totals
 */
export function calculateAccountSummary(entries: LedgerEntry[], openingBalance: number = 0) {
  const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);
  const closingBalance = openingBalance + totalDebit - totalCredit;
  
  return {
    openingBalance,
    totalDebit,
    totalCredit,
    closingBalance
  };
}

/**
 * Filter entries by date range
 */
export function filterByDateRange(entries: LedgerEntry[], dateFrom?: string, dateTo?: string): LedgerEntry[] {
  return entries.filter(entry => {
    const entryDate = new Date(entry.date);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;
    
    if (fromDate && entryDate < fromDate) return false;
    if (toDate && entryDate > toDate) return false;
    
    return true;
  });
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('fa-IR');
}

/**
 * Get account type label in Persian
 */
export function getAccountTypeLabel(type: string): string {
  const labels = {
    'ASSET': 'دارایی',
    'LIABILITY': 'بدهی',
    'EQUITY': 'سرمایه',
    'INCOME': 'درآمد',
    'EXPENSE': 'هزینه',
    'CUSTOMER': 'مشتری',
    'CONTRACTOR': 'پیمانکار',
    'SUPPLIER': 'تأمین‌کننده'
  };
  return labels[type as keyof typeof labels] || type;
}

/**
 * Get account type color for UI
 */
export function getAccountTypeColor(type: string): string {
  const colors = {
    'ASSET': 'success',
    'LIABILITY': 'error',
    'EQUITY': 'info',
    'INCOME': 'primary',
    'EXPENSE': 'warning',
    'CUSTOMER': 'secondary',
    'CONTRACTOR': 'default',
    'SUPPLIER': 'default'
  };
  return colors[type as keyof typeof colors] || 'default';
}

/**
 * Validate journal entry balance
 */
export function validateJournalBalance(entries: TransactionEntry[]): { isValid: boolean; error?: string } {
  const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);
  
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return {
      isValid: false,
      error: 'مجموع بدهکار و بستانکار باید برابر باشد'
    };
  }
  
  return { isValid: true };
}

/**
 * Generate account hierarchy path
 */
export function getAccountPath(account: Account, accounts: Account[]): string {
  const path: string[] = [];
  let current = account;
  
  while (current) {
    path.unshift(`${current.code} - ${current.name}`);
    current = accounts.find(a => a.id === current.parentId);
  }
  
  return path.join(' > ');
}

/**
 * Sort accounts by code
 */
export function sortAccountsByCode(accounts: Account[]): Account[] {
  return accounts.sort((a, b) => a.code.localeCompare(b.code));
}

/**
 * Filter accounts by level
 */
export function filterAccountsByLevel(accounts: Account[], level: number): Account[] {
  return accounts.filter(account => account.level === level);
}

/**
 * Get child accounts
 */
export function getChildAccounts(parentId: string, accounts: Account[]): Account[] {
  return accounts.filter(account => account.parentId === parentId);
}
