// src/components/production/ProductImport.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Upload, X, FileSpreadsheet, RefreshCw, Check, AlertCircle, 
  Search, Filter, ArrowUpDown, Edit2
} from 'lucide-react';
import Papa from 'papaparse';
import _ from 'lodash';
import { db } from '../../database';
import type { Item } from '../../types';
import * as XLSX from 'xlsx';

interface FileData {
  headers: string[];
  rows: string[][];
}

// Step 2: Replace the existing ColumnMapping with the new one
interface ColumnMapping {
  name: number | null;
  code: number | null;
  department: number | null;
  price: number | null;
  autoGenerateCode?: boolean;
}

interface PreviewProduct {
  name: string;
  code: string;
  department: string;
  price: number;
  isSelected: boolean;
  hasError?: boolean;
  errorMessage?: string;
  autoGenerateCode?: boolean;
}

type SortConfig = {
  key: keyof PreviewProduct;
  direction: 'asc' | 'desc';
} | null;

type FilterConfig = {
  name: string;
  code: string;
  department: string;
  hasError: 'all' | 'true' | 'false';
};

interface ProductImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

type SupportedEncoding = 'UTF-8' | 'UTF-16LE' | 'UTF-16BE' | 'windows-1256' | 'ISO-8859-1';

const PERSIAN_CHAR_REPLACEMENTS: { [key: string]: string } = {
  'ي': 'ی',
  'ك': 'ک',
  'دِ': 'د',
  'بِ': 'ب',
  'زِ': 'ز',
  'ذِ': 'ذ',
  'ِشِ': 'ش',
  'ِسِ': 'س',
  '٠': '۰',
  '١': '۱',
  '٢': '۲',
  '٣': '۳',
  '٤': '۴',
  '٥': '۵',
  '٦': '۶',
  '٧': '۷',
  '٨': '۸',
  '٩': '۹'
};

export default function ProductImport({ onClose, onSuccess }: ProductImportProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    name: null,
    code: null,
    department: null,
    price: null,
    autoGenerateCode: false // Step 4: Correct state initialization
  });
  const [previewProducts, setPreviewProducts] = useState<PreviewProduct[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterConfig>({
    name: '',
    code: '',
    department: '',
    hasError: 'all'
  });

  const detectEncoding = (buffer: ArrayBuffer): SupportedEncoding => {
    const arr = new Uint8Array(buffer);
    
    if (arr[0] === 0xEF && arr[1] === 0xBB && arr[2] === 0xBF) return 'UTF-8';
    if (arr[0] === 0xFF && arr[1] === 0xFE) return 'UTF-16LE';
    if (arr[0] === 0xFE && arr[1] === 0xFF) return 'UTF-16BE';
    
    let windows1256Count = 0;
    let utf8Count = 0;
    let persianCharCount = 0;
    
    for (let i = 0; i < Math.min(arr.length, 1000); i++) {
      if (arr[i] > 0x80 && arr[i] < 0xFF) windows1256Count++;
      if ((arr[i] & 0xC0) === 0xC0) utf8Count++;
      if ((arr[i] >= 0xD8 && arr[i] <= 0xDF) || (arr[i] >= 0x98 && arr[i] <= 0x9F)) {
        persianCharCount++;
      }
    }
    
    if (persianCharCount > 10 && utf8Count > windows1256Count) return 'UTF-8';
    if (windows1256Count > utf8Count) return 'windows-1256';
    return 'UTF-8';
  };

  const normalizePersianText = (text: string): string => {
    if (!text) return '';
    
    let normalized = text;
    Object.entries(PERSIAN_CHAR_REPLACEMENTS).forEach(([from, to]) => {
      normalized = normalized.replace(new RegExp(from, 'g'), to);
    });

    return normalized
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const validateProduct = (product: PreviewProduct): string[] => {
    const errors: string[] = [];
    
    if (!product.name.trim()) {
      errors.push('نام الزامی است');
    }

    // Only validate code if not auto-generating
    if (!columnMapping.autoGenerateCode && !product.code.trim()) {
      errors.push('کد الزامی است');
    }

    // Check for duplicates only if not auto-generating
    if (!columnMapping.autoGenerateCode) {
      const existingProduct = db.getProductDefinitions().find(p =>
        p.code.toLowerCase() === product.code.toLowerCase()
      );
      if (existingProduct) {
        errors.push('این کد قبلاً ثبت شده است');
      }
    }

    // Always check name duplication
    const existingProductWithName = db.getProductDefinitions().find(p =>
      p.name.toLowerCase() === product.name.toLowerCase()
    );
    if (existingProductWithName) {
      errors.push('این نام قبلاً ثبت شده است');
    }

    if (!product.department.trim()) {
      errors.push('بخش الزامی است');
    }

    if (product.price <= 0) {
      errors.push('قیمت باید بزرگتر از صفر باشد');
    }

    return errors;
  };

  const processCSVFile = async (file: File): Promise<FileData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e: ProgressEvent<FileReader>) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          if (!buffer) {
            reject(new Error('خطا در خواندن فایل'));
            return;
          }

          const encoding = detectEncoding(buffer);
          const text = new TextDecoder(encoding).decode(buffer);

          Papa.parse<string[]>(text, {
            complete: (results) => {
              if (!results.data || !Array.isArray(results.data) || results.data.length < 2) {
                reject(new Error('فایل خالی یا نامعتبر است'));
                return;
              }

              const headers = (results.data[0] || []).map(header => 
                normalizePersianText(String(header || ''))
              );
              
              const rows = results.data.slice(1).map(row => 
                (row || []).map(cell => normalizePersianText(String(cell || '')))
              );

              resolve({ headers, rows });
            },
          });
        } catch (error) {
          console.error('Error processing CSV file:', error);
          reject(error instanceof Error ? error : new Error('خطا در پردازش فایل'));
        }
      };

      reader.onerror = () => {
        reject(new Error('خطا در خواندن فایل'));
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const processExcelFile = async (file: File): Promise<FileData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('خطا در خواندن فایل'));
            return;
          }

          const workbook = XLSX.read(data, { 
            type: 'array',
            codepage: 65001,
            cellDates: true,
            cellNF: false,
            cellText: true
          });
          
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rawData = XLSX.utils.sheet_to_json<string[]>(firstSheet, { 
            header: 1,
            defval: '',
            raw: false
          });
          
          if (!Array.isArray(rawData) || rawData.length < 2) {
            reject(new Error('فایل خالی یا نامعتبر است'));
            return;
          }

          const headers = (rawData[0] || []).map(header => 
            normalizePersianText(String(header || ''))
          );

          const rows = rawData.slice(1).map(row => 
            (Array.isArray(row) ? row : []).map(cell => 
              normalizePersianText(String(cell || ''))
            )
          );

          resolve({ headers, rows });
        } catch (error) {
          console.error('Error processing Excel file:', error);
          reject(error instanceof Error ? error : new Error('خطا در پردازش فایل Excel'));
        }
      };

      reader.onerror = () => {
        reject(new Error('خطا در خواندن فایل'));
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      let fileData: FileData;
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        fileData = await processCSVFile(file);
      } else if (file.name.toLowerCase().match(/\.xlsx?$/)) {
        fileData = await processExcelFile(file);
      } else {
        throw new Error('فرمت فایل پشتیبانی نمی‌شود');
      }

      setFileData(fileData);
      setCurrentStep('mapping');
      
      const autoMapping = autoMapColumns(fileData.headers);
      if (autoMapping) {
        setColumnMapping(autoMapping);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error instanceof Error ? error.message : 'خطای ناشناخته');
    } finally {
      setIsProcessing(false);
    }
  };

  const autoMapColumns = (headers: string[]): ColumnMapping | null => {
    const mapping: ColumnMapping = {
      name: null,
      code: null,
      department: null,
      price: null,
      autoGenerateCode: false
    };

    const patterns = {
      name: [/^نام$/i, /^name$/i, /^title$/i, /^نام.*کالا$/i],
      code: [/^کد$/i, /^code$/i, /^id$/i, /^شناسه$/i, /^کد.*کالا$/i],
      department: [/^بخش$/i, /^بخش.*کالا$/i, /^department$/i],
      price: [/^قیمت$/i, /^price$/i, /^cost$/i, /^مبلغ$/i, /^ارزش$/i]
    };

    headers.forEach((header: string, index: number) => {
      const normalizedHeader = header.trim().toLowerCase();
      
      Object.entries(patterns).forEach(([key, patternList]) => {
        if (patternList.some(pattern => pattern.test(normalizedHeader))) {
        
        }
      });
    });

    return mapping;
  };

  const generatePreview = (): void => {
    if (!fileData) return;

    const products: PreviewProduct[] = fileData.rows.map((row: string[]) => {
      const product: PreviewProduct = {
        name: String(columnMapping.name !== null ? row[columnMapping.name]?.trim() || '' : ''),
        code: String(columnMapping.code !== null ? row[columnMapping.code]?.trim() || '' : ''),
        department: String(columnMapping.department !== null ? row[columnMapping.department]?.trim() || '' : ''),
        price: Number(columnMapping.price !== null 
          ? parseFloat(row[columnMapping.price]?.replace(/[^0-9.-]+/g, '')) || 0 
          : 0),
        isSelected: true,
        autoGenerateCode: columnMapping.autoGenerateCode
      };

      const validationErrors = validateProduct(product);
      return {
        ...product,
        hasError: validationErrors.length > 0,
        errorMessage: validationErrors.join('، ')
      };
    });

    setPreviewProducts(products);
    setCurrentStep('preview');
  };

  const handleSort = (key: keyof PreviewProduct) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  const handleEditStart = (index: number) => {
    setEditingIndex(index);
  };

  const handleImport = async (): Promise<void> => {
    setError(null);
    setIsProcessing(true);

    try {
      const selectedProducts = previewProducts.filter(m => m.isSelected && !m.hasError);
      
      if (selectedProducts.length === 0) {
        throw new Error('هیچ موردی برای ثبت انتخاب نشده است');
      }

      for (const product of selectedProducts) {
        const productData = {
          name: product.name,
          code: columnMapping.autoGenerateCode ? '' : product.code, // Empty if auto-generating
          department: product.department,
          price: product.price,
          autoGenerateCode: columnMapping.autoGenerateCode,
          saleDepartment: product.department,
          productionSegment: product.department,
          type: 'product' as const
        };

        await db.addProductDefinition(productData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error importing products:', error);
      setError(error instanceof Error ? error.message : 'خطای ناشناخته');
    } finally {
      setIsProcessing(false);
    }
  };

  const processedProducts = useMemo(() => {
    let result = [...previewProducts];
    
    result = result.filter(product => {
      const matchesSearch = !searchQuery || 
        Object.values(product)
          .join(' ')
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesFilters = (
        (!filters.name || product.name.toLowerCase().includes(filters.name.toLowerCase())) &&
        (!filters.code || product.code.toLowerCase().includes(filters.code.toLowerCase())) &&
        (!filters.department || product.department.toLowerCase().includes(filters.department.toLowerCase())) &&
        (filters.hasError === 'all' || 
         (filters.hasError === 'true' ? product.hasError : !product.hasError))
      );

      return matchesSearch && matchesFilters;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        if (sortConfig.key === 'price') {
          return sortConfig.direction === 'asc' 
            ? a[sortConfig.key] - b[sortConfig.key]
            : b[sortConfig.key] - a[sortConfig.key];
        }
        
        const aValue = String(a[sortConfig.key]).toLowerCase();
        const bValue = String(b[sortConfig.key]).toLowerCase();
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [previewProducts, sortConfig, filters, searchQuery]);

  const renderUploadStep = (): JSX.Element => (
    <div className="text-center py-12">
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white 
                rounded-lg hover:bg-blue-600 cursor-pointer transition-colors"
      >
        <Upload className="h-5 w-5" />
        انتخاب فایل
      </label>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        فرمت‌های پشتیبانی شده: CSV، Excel
      </p>
      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
        ستون‌های مورد نیاز: نام، کد، بخش، قیمت
      </p>

      <div className="mt-8 max-w-lg mx-auto">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            راهنمای تهیه فایل:
          </h3>
          <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-2 text-right">
            <li>• فایل باید شامل یک ردیف سرستون باشد</li>
            <li>• نام ستون‌ها باید به فارسی یا انگلیسی باشد</li>
            <li>• تنها ستون‌های نام و کد اجباری هستند</li>
            <li>• سایر اطلاعات در صورت عدم وجود، خالی در نظر گرفته می‌شوند</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderMappingStep = (): JSX.Element => (
    <div className="space-y-6">
      {/* Auto-generate toggle added at the top */}
      <div className="flex items-center gap-2 mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <input
          type="checkbox"
          id="autoGenerateCode"
          checked={columnMapping.autoGenerateCode}
          onChange={(e) => {
            setColumnMapping(prev => ({
              ...prev,
              autoGenerateCode: e.target.checked
            }));
          }}
          className="rounded text-blue-500 focus:ring-blue-500"
        />
        <label
          htmlFor="autoGenerateCode"
          className="text-sm text-gray-700 dark:text-gray-300"
        >
          تولید خودکار کد محصولات
        </label>
      </div>

      {/* Rest of the mapping UI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name mapping */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            نام
            <span className="text-red-500 mr-1">*</span>
          </label>
          <select
            value={columnMapping.name?.toString() || ''}
            onChange={(e) => {
              const value = e.target.value;
              setColumnMapping(prev => ({
                ...prev,
                name: value === '' ? null : Number(value)
              }));
            }}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">انتخاب ستون...</option>
            {fileData?.headers.map((header, index) => (
              <option key={index} value={index}>{header}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            مثال: نام کالا، Name
          </p>
        </div>

        {/* Code mapping - only show if NOT auto-generating */}
        {!columnMapping.autoGenerateCode && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              کد
              <span className="text-red-500 mr-1">*</span>
            </label>
            <select
              value={columnMapping.code?.toString() || ''}
              onChange={(e) => {
                const value = e.target.value;
                setColumnMapping(prev => ({
                  ...prev,
                  code: value === '' ? null : Number(value)
                }));
              }}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">انتخاب ستون...</option>
              {fileData?.headers.map((header, index) => (
                <option key={index} value={index}>{header}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              مثال: کد کالا، Code
            </p>
          </div>
        )}

        {/* Department mapping */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            بخش
          </label>
          <select
            value={columnMapping.department?.toString() || ''}
            onChange={(e) => {
              const value = e.target.value;
              setColumnMapping(prev => ({
                ...prev,
                department: value === '' ? null : Number(value)
              }));
            }}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">انتخاب ستون...</option>
            {fileData?.headers.map((header, index) => (
              <option key={index} value={index}>{header}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            مثال: بخش، Department
          </p>
        </div>

        {/* Price mapping */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            قیمت
          </label>
          <select
            value={columnMapping.price?.toString() || ''}
            onChange={(e) => {
              const value = e.target.value;
              setColumnMapping(prev => ({
                ...prev,
                price: value === '' ? null : Number(value)
              }));
            }}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">انتخاب ستون...</option>
            {fileData?.headers.map((header, index) => (
              <option key={index} value={index}>{header}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            مثال: قیمت، Price
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
        <button
          onClick={() => setCurrentStep('upload')}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 
                     dark:bg-gray-700 rounded-lg hover:bg-gray-200 
                     dark:hover:bg-gray-600 transition-colors"
        >
          مرحله قبل
        </button>
        <button
          onClick={generatePreview}
          disabled={!columnMapping.name || (!columnMapping.autoGenerateCode && !columnMapping.code)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                     transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          مرحله بعد
        </button>
      </div>
    </div>
  );

  const renderPreviewStep = (): JSX.Element => (
    <div className="space-y-6">
      {/* Removed the auto-generate toggle from here and moved it to the mapping step */}

      {/* Statistics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 
                    rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">کل موارد</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {previewProducts.length}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">موارد معتبر</div>
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
            {previewProducts.filter(m => !m.hasError).length}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">موارد خطادار</div>
          <div className="text-lg font-semibold text-red-600 dark:text-red-400">
            {previewProducts.filter(m => m.hasError).length}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در همه فیلدها..."
            className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            value={filters.name}
            onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
            placeholder="فیلتر بر اساس نام..."
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <input
            type="text"
            value={filters.code}
            onChange={(e) => setFilters(prev => ({ ...prev, code: e.target.value }))}
            placeholder="فیلتر بر اساس کد..."
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <input
            type="text"
            value={filters.department}
            onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
            placeholder="فیلتر بر اساس بخش..."
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Preview Table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="p-4 w-12">
                <input
                  type="checkbox"
                  checked={processedProducts.every(m => m.isSelected || m.hasError)}
                  onChange={(e) => {
                    const newValue = e.target.checked;
                    setPreviewProducts(prev => 
                      prev.map(m => ({
                        ...m,
                        isSelected: !m.hasError && newValue
                      }))
                    );
                  }}
                  className="rounded text-blue-500 focus:ring-blue-500"
                />
              </th>
              {[
                { key: 'name', label: 'نام' },
                { key: 'code', label: 'کد' },
                { key: 'department', label: 'بخش' },
                { key: 'price', label: 'قیمت' }
              ].map(column => (
                <th 
                  key={column.key}
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 
                           dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 
                           dark:hover:bg-gray-600"
                  onClick={() => handleSort(column.key as keyof PreviewProduct)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 
                           dark:text-gray-400 uppercase">
                وضعیت
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {processedProducts.map((product, index) => (
              <tr 
                key={index}
                className={product.hasError 
                  ? 'bg-red-50 dark:bg-red-900/20' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}
              >
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={product.isSelected}
                    onChange={(e) => {
                      const newProducts = [...previewProducts];
                      const originalIndex = previewProducts.findIndex(
                        m => m.code === product.code && m.name === product.name
                      );
                      if (originalIndex !== -1) {
                        newProducts[originalIndex] = {
                          ...newProducts[originalIndex],
                          isSelected: e.target.checked
                        };
                        setPreviewProducts(newProducts);
                      }
                    }}
                    disabled={product.hasError}
                    className="rounded text-blue-500 focus:ring-blue-500
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {product.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {product.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {product.department}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {product.price.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {product.hasError ? (
                      <span 
                        className="text-sm text-red-500 hover:text-red-600 cursor-help" 
                        title={product.errorMessage}
                      >
                        خطا در اطلاعات
                      </span>
                    ) : (
                      <span className="text-sm text-green-500">آماده برای ثبت</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={handleImport}
          disabled={!processedProducts.some(m => m.isSelected && !m.hasError)}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white 
                   rounded-lg hover:bg-green-600 transition-colors
                   disabled:bg-green-300 disabled:cursor-not-allowed"
        >
          <Check className="h-5 w-5" />
          ثبت موارد انتخاب شده
        </button>
      </div>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-7xl w-full mx-4 max-h-[90vh] 
                   overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            ورود گروهی کالاها
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="relative">
          <div className="absolute top-6 inset-x-0 h-2 flex">
            {['upload', 'mapping', 'preview'].map((step, index) => (
              <div
                key={step}
                className={`flex-1 ${
                  index === 0 ? 'rounded-r-full' : ''
                } ${
                  index === 2 ? 'rounded-l-full' : ''
                } ${
                  ['upload', 'mapping', 'preview'].indexOf(currentStep) >= index
                    ? 'bg-blue-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                } transition-colors duration-300`}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-12">
            {[
              { step: 'upload', label: 'انتخاب فایل' },
              { step: 'mapping', label: 'تطبیق ستون‌ها' },
              { step: 'preview', label: 'پیش‌نمایش و ویرایش' }
            ].map(({ step, label }) => (
              <div 
                key={step}
                className={`text-center text-sm ${
                  currentStep === step 
                    ? 'text-blue-500 font-medium' 
                    : 'text-gray-500'
                }`}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 
                         dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 
                         dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Processing Spinner */}
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">در حال پردازش...</p>
          </div>
        ) : (
          <div className="mt-8">
            {currentStep === 'upload' && renderUploadStep()}
            {currentStep === 'mapping' && renderMappingStep()}
            {currentStep === 'preview' && renderPreviewStep()}
          </div>
        )}
      </div>
    </div>
  );
}
