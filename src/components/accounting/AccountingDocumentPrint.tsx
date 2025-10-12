"use client";
import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableRow, TableHead, Paper } from '@mui/material';

interface Document {
  id: string;
  documentNumber: string;
  documentDate: string;
  description: string;
  entries: DocumentEntry[];
  totalDebit: number;
  totalCredit: number;
  status: 'TEMPORARY' | 'PERMANENT';
}

interface DocumentEntry {
  id: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  accountNature?: 'DEBIT' | 'CREDIT' | 'DEBIT_CREDIT';
}

interface AccountingDocumentPrintProps {
  document: Document;
  projectName?: string;
}

export default function AccountingDocumentPrint({ document, projectName = "شرکت" }: AccountingDocumentPrintProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('fa-IR');
  };

  return (
    <Box 
      className="print-root"
      sx={{ 
        direction: 'rtl',
        fontFamily: 'Vazirmatn, Arial, sans-serif',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Paper 
        elevation={0}
        sx={{ 
          padding: '30px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          '@media print': {
            boxShadow: 'none',
            border: 'none',
            height: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {/* Header */}
        <Box className="print-header" sx={{ position: 'relative', mb: 4 }}>
          {/* Document Info - Top Left */}
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0,
            '@media print': {
              position: 'absolute',
              top: '10px',
              left: '10px'
            }
          }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1, fontSize: '14px' }}>
              شماره سند: {document.documentNumber}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '14px' }}>
              تاریخ: {formatDate(document.documentDate)}
            </Typography>
          </Box>
          
          {/* Center Title */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold',
                color: '#1976d2',
                mb: 2,
                fontSize: '28px',
                '@media print': {
                  fontSize: '24px'
                }
              }}
            >
              سند حسابداری
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold',
                color: '#333',
                fontSize: '18px',
                '@media print': {
                  fontSize: '16px'
                }
              }}
            >
              {projectName}
            </Typography>
          </Box>
        </Box>

        {/* Main Table */}
        <Box className="print-body" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Table 
            sx={{ 
              border: '2px solid #333',
              '& .MuiTableCell-root': {
                border: '1px solid #333',
                padding: '12px 8px',
                textAlign: 'center',
                fontFamily: 'Vazirmatn, Arial, sans-serif'
              }
            }}
          >
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '16px' }}>ردیف</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '16px' }}>کد حساب</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '16px' }}>شرح</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '16px' }}>بدهکار</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '16px' }}>بستانکار</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {document.entries.map((entry, index) => (
              <TableRow key={entry.id}>
                <TableCell sx={{ fontWeight: 'bold' }}>{index + 1}</TableCell>
                <TableCell sx={{ textAlign: 'right', padding: '8px' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {entry.accountCode}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '12px', color: '#666' }}>
                      {entry.accountName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{entry.description || '-'}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {entry.debit > 0 ? formatNumber(entry.debit) : '۰'}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {entry.credit > 0 ? formatNumber(entry.credit) : '۰'}
                </TableCell>
              </TableRow>
            ))}
            {/* Total Row */}
            <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
              <TableCell colSpan={3} sx={{ fontWeight: 'bold', fontSize: '16px' }}>
                جمع
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '16px', color: '#d32f2f' }}>
                {formatNumber(document.totalDebit)}
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '16px', color: '#2e7d32' }}>
                {formatNumber(document.totalCredit)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        </Box>

        {/* Fixed Footer - Signature Boxes for print */}
        <Box className="print-footer" sx={{ display: 'flex', justifyContent: 'space-between', gap: 0 }}>
          <Box 
            sx={{ 
              border: '2px solid #333',
              borderRight: '1px solid #333',
              borderRadius: '8px 0 0 8px',
              padding: '16px',
              minHeight: '70px',
              flex: 1,
              textAlign: 'center',
              backgroundColor: '#fafafa'
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1.5 }}>
              صادر کننده
            </Typography>
            <Box sx={{ height: '36px', borderBottom: '1px solid #ccc' }}></Box>
          </Box>
          <Box 
            sx={{ 
              border: '2px solid #333',
              borderRight: '1px solid #333',
              borderLeft: '1px solid #333',
              borderRadius: 0,
              padding: '16px',
              minHeight: '70px',
              flex: 1,
              textAlign: 'center',
              backgroundColor: '#fafafa'
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1.5 }}>
              بررسی کننده
            </Typography>
            <Box sx={{ height: '36px', borderBottom: '1px solid #ccc' }}></Box>
          </Box>
          <Box 
            sx={{ 
              border: '2px solid #333',
              borderLeft: '1px solid #333',
              borderRadius: '0 8px 8px 0',
              padding: '16px',
              minHeight: '70px',
              flex: 1,
              textAlign: 'center',
              backgroundColor: '#fafafa'
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1.5 }}>
              تایید کننده
            </Typography>
            <Box sx={{ height: '36px', borderBottom: '1px solid #ccc' }}></Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
