// src/utils/fileConverter.ts

import * as XLSX from 'xlsx';

export const convertToUTF8CSV = async (file: File): Promise<File> => {
  // If already CSV, just ensure UTF-8 encoding
  if (file.name.toLowerCase().endsWith('.csv')) {
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    let content = decoder.decode(buffer);

    // Check if it's already UTF-8
    try {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder('utf-8');
      const bytes = encoder.encode(content);
      const decoded = decoder.decode(bytes);
      if (decoded === content) {
        return file; // Already UTF-8
      }
    } catch (e) {
      // Not UTF-8, continue with conversion
    }

    // Convert to UTF-8
    const utf8Content = new TextEncoder().encode(content);
    const utf8File = new File([utf8Content], file.name, {
      type: 'text/csv;charset=utf-8',
    });
    return utf8File;
  }

  // For Excel files, convert to UTF-8 CSV
  if (file.name.toLowerCase().match(/\.xlsx?$/)) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, {
      type: 'array',
      codepage: 65001, // UTF-8
      cellDates: true,
      cellNF: false,
      cellText: true
    });

    // Get first sheet
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Convert to CSV with UTF-8 encoding
    const csvContent = XLSX.utils.sheet_to_csv(firstSheet, {
      blankrows: false,
      forceQuotes: true
    });

    // Create new file with UTF-8 encoding
    const utf8Content = new TextEncoder().encode(csvContent);
    const newFileName = file.name.replace(/\.xlsx?$/, '.csv');
    const utf8File = new File([utf8Content], newFileName, {
      type: 'text/csv;charset=utf-8',
    });

    return utf8File;
  }

  throw new Error('Unsupported file format');
};

// Utility function to check if a string is UTF-8
export const isUTF8 = (buffer: ArrayBuffer): boolean => {
  const decoder = new TextDecoder('utf-8');
  try {
    decoder.decode(buffer);
    return true;
  } catch {
    return false;
  }
};