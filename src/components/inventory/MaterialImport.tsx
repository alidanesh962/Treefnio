// src/components/inventory/MaterialImport.tsx
import React, { useState } from 'react';
import { Upload, X, FileSpreadsheet, RefreshCw, Check, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import _ from 'lodash';
import { db } from '../../database';
import type { Item } from '../../types';
import * as XLSX from 'xlsx';

// Interface definitions
interface ColumnMapping {
  name: number | null;
  code: number | null;
  department: number | null;
  price: number | null;
}

interface PreviewMaterial {
  name: string;
  code: string;
  department: string;
  price: number;
  isSelected: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

interface FileData {
  headers: string[];
  rows: string[][];
}

interface MaterialImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

// Helper functions
const detectEncoding = (buffer: ArrayBuffer): string => {
  const arr = new Uint8Array(buffer);
  
  // Check for UTF-8 BOM
  if (arr[0] === 0xEF && arr[1] === 0xBB && arr[2] === 0xBF) {
    return 'UTF-8';
  }
  
  // Check for UTF-16 BOM
  if (arr[0] === 0xFF && arr[1] === 0xFE) {
    return 'UTF-16LE';
  }
  if (arr[0] === 0xFE && arr[1] === 0xFF) {
    return 'UTF-16BE';
  }
  
  // Check for Windows-1256 encoding patterns
  let windows1256Count = 0;
  let utf8Count = 0;
  
  for (let i = 0; i < Math.min(arr.length, 1000); i++) {
    if (arr[i] > 0x80 && arr[i] < 0xFF) {
      windows1256Count++;
    }
    if ((arr[i] & 0xC0) === 0xC0) {
      utf8Count++;
    }
  }
  
  if (windows1256Count > utf8Count) {
    return 'windows-1256';
  }
  
  // Default to UTF-8
  return 'UTF-8';
};
const fixPersianEncoding = (text: string): string => {
  if (!text) return '';
  
  try {
    // Try different encodings
    const decoders = [
      'windows-1256',
      'UTF-8',
      'ISO-8859-1',
      'UTF-16LE',
      'UTF-16BE'
    ];

    for (const encoding of decoders) {
      try {
        const decoded = new TextDecoder(encoding).decode(
          new TextEncoder().encode(text)
        );
        if (decoded.match(/[\u0600-\u06FF]/)) {
          return decoded.trim();
        }
      } catch {
        continue;
      }
    }
    
    return text.trim();
  } catch (e) {
    console.warn('Error fixing Persian encoding:', e);
    return text.trim();
  }
};

const processCSVFile = (file: File): Promise<FileData> => {
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
            if (!Array.isArray(results.data) || results.data.length < 2) {
              reject(new Error('فایل خالی یا نامعتبر است'));
              return;
            }

            const headers = results.data[0].map(header => 
              fixPersianEncoding(String(header || ''))
            );
            
            const rows = results.data.slice(1).map(row => 
              row.map(cell => fixPersianEncoding(String(cell || '')))
            );

            resolve({ headers, rows });
          },
          error: (error: any) => {
            console.error('Error parsing CSV:', error);
            reject(new Error('خطا در پردازش فایل CSV'));
          },
          skipEmptyLines: true,
          delimitersToGuess: [',', '\t', '|', ';']
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

const processExcelFile = (file: File): Promise<FileData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('خطا در خواندن فایل'));
          return;
        }

        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        const jsonData = XLSX.utils.sheet_to_json<string[]>(firstSheet, { 
          header: 1,
          defval: '',
          raw: false
        });
        
        if (!Array.isArray(jsonData) || jsonData.length < 2) {
          reject(new Error('فایل خالی یا نامعتبر است'));
          return;
        }

        const headers = (jsonData[0] || []).map((header): string => 
          fixPersianEncoding(String(header || ''))
        );

        const rows = jsonData.slice(1).map((row): string[] => 
          (Array.isArray(row) ? row : []).map((cell): string => 
            fixPersianEncoding(String(cell || ''))
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
const MaterialImport: React.FC<MaterialImportProps> = ({ onClose, onSuccess }): JSX.Element => {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    name: null,
    code: null,
    department: null,
    price: null
  });
  const [previewMaterials, setPreviewMaterials] = useState<PreviewMaterial[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [error, setError] = useState<string | null>(null);

  const isColumnMappingComplete = (): boolean => {
    return Object.values(columnMapping).every(value => value !== null);
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
      price: null
    };

    const patterns = {
      name: [/^نام$/i, /^name$/i, /^title$/i, /^نام.*کالا$/i, /^نام.*متریال$/i],
      code: [/^کد$/i, /^code$/i, /^id$/i, /^شناسه$/i, /^کد.*کالا$/i],
      department: [/^بخش$/i, /^واحد$/i, /^department$/i, /^unit$/i],
      price: [/^قیمت$/i, /^price$/i, /^cost$/i, /^مبلغ$/i, /^ارزش$/i]
    };

    headers.forEach((header: string, index: number) => {
      const normalizedHeader = header.trim().toLowerCase();
      
      Object.entries(patterns).forEach(([key, patternList]) => {
        if (patternList.some(pattern => pattern.test(normalizedHeader))) {
          mapping[key as keyof ColumnMapping] = index;
        }
      });
    });

    return Object.values(mapping).every(value => value !== null) ? mapping : null;
  };
  const generatePreview = (): void => {
    if (!fileData || !isColumnMappingComplete()) return;

    const materials: PreviewMaterial[] = fileData.rows.map((row: string[]) => {
      // Extract values with null checks and trimming
      const name = columnMapping.name !== null ? row[columnMapping.name]?.trim() || '' : '';
      const code = columnMapping.code !== null ? row[columnMapping.code]?.trim() || '' : '';
      const department = columnMapping.department !== null ? row[columnMapping.department]?.trim() || '' : '';
      const priceStr = columnMapping.price !== null ? row[columnMapping.price]?.trim() || '0' : '0';

      // Convert price string to number, handling different formats
      const price = parseFloat(priceStr.replace(/[^0-9.-]+/g, '')) || 0;

      const material = {
        name,
        code,
        department,
        price,
        isSelected: true
      };

      // Validate material
      const errors: string[] = [];
      
      if (!material.name) {
        errors.push('نام الزامی است');
      }
      if (!material.code) {
        errors.push('کد الزامی است');
      }
      if (!material.department) {
        errors.push('بخش الزامی است');
      }
      if (material.price <= 0) {
        errors.push('قیمت باید بزرگتر از صفر باشد');
      }

      // Check for duplicates in existing database
      const existingMaterials = db.getMaterials();
      if (existingMaterials.some(m => 
        m.code.toLowerCase() === material.code.toLowerCase() || 
        m.name.toLowerCase() === material.name.toLowerCase()
      )) {
        errors.push('این کد یا نام قبلاً ثبت شده است');
      }

      // Check for duplicates within the current import
      const isDuplicate = previewMaterials.some(m => 
        m.code.toLowerCase() === material.code.toLowerCase() || 
        m.name.toLowerCase() === material.name.toLowerCase()
      );
      if (isDuplicate) {
        errors.push('این کد یا نام در فایل تکراری است');
      }

      return {
        ...material,
        hasError: errors.length > 0,
        errorMessage: errors.join('، ')
      };
    });

    setPreviewMaterials(materials);
    setCurrentStep('preview');
  };

  const handleImport = async (): Promise<void> => {
    setError(null);
    setIsProcessing(true);

    try {
      const selectedMaterials = previewMaterials.filter(m => m.isSelected && !m.hasError);
      
      if (selectedMaterials.length === 0) {
        throw new Error('هیچ موردی برای ثبت انتخاب نشده است');
      }

      const importedMaterials = db.bulkAddMaterials(
        selectedMaterials.map(m => ({
          name: m.name,
          code: m.code,
          department: m.department,
          price: m.price,
          type: 'material' as const
        }))
      );

      if (!importedMaterials || importedMaterials.length === 0) {
        throw new Error('خطا در ثبت مواد اولیه در پایگاه داده');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error importing materials:', error);
      setError(error instanceof Error ? error.message : 'خطای ناشناخته');
    } finally {
      setIsProcessing(false);
    }
  };
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
    </div>
  );

  const renderMappingStep = (): JSX.Element => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { key: 'name' as const, label: 'نام' },
          { key: 'code' as const, label: 'کد' },
          { key: 'department' as const, label: 'بخش' },
          { key: 'price' as const, label: 'قیمت' }
        ].map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {field.label}
            </label>
            <select
              value={columnMapping[field.key]?.toString() || ''}
              onChange={(e) => {
                const value = e.target.value;
                setColumnMapping(prev => ({
                  ...prev,
                  [field.key]: value === '' ? null : Number(value)
                }));
              }}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">انتخاب ستون...</option>
              {fileData?.headers.map((header, index) => (
                <option key={index} value={index}>
                  {header}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-4">
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
          disabled={!isColumnMappingComplete()}
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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          پیش‌نمایش مواد اولیه
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {previewMaterials.filter(m => m.isSelected && !m.hasError).length} مورد انتخاب شده
          </span>
          <button
            onClick={() => setPreviewMaterials(prev => 
              prev.map(m => ({ ...m, isSelected: !m.hasError }))
            )}
            className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
          >
            انتخاب همه موارد معتبر
          </button>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 
                    rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">کل موارد</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {previewMaterials.length}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">موارد معتبر</div>
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
            {previewMaterials.filter(m => !m.hasError).length}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">موارد خطادار</div>
          <div className="text-lg font-semibold text-red-600 dark:text-red-400">
            {previewMaterials.filter(m => m.hasError).length}
          </div>
        </div>
      </div>

      {/* Preview Table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="p-4 w-12">
                <input
                  type="checkbox"
                  checked={previewMaterials.every(m => m.isSelected || m.hasError)}
                  onChange={(e) => setPreviewMaterials(prev => 
                    prev.map(m => ({ ...m, isSelected: !m.hasError && e.target.checked }))
                  )}
                  className="rounded text-blue-500 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                نام
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                کد
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                بخش
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                قیمت (ریال)
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                وضعیت
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {previewMaterials.map((material, index) => (
              <tr key={index} className={material.hasError ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={material.isSelected}
                    onChange={(e) => {
                      const newMaterials = [...previewMaterials];
                      newMaterials[index] = { 
                        ...newMaterials[index], 
                        isSelected: e.target.checked 
                      };
                      setPreviewMaterials(newMaterials);
                    }}
                    disabled={material.hasError}
                    className="rounded text-blue-500 focus:ring-blue-500
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {material.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {material.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {material.department}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {material.price.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {material.hasError ? (
                    <span 
                      className="text-red-500 hover:text-red-600 cursor-help" 
                      title={material.errorMessage}
                    >
                      خطا در اطلاعات
                    </span>
                  ) : (
                    <span className="text-green-500">آماده برای ثبت</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-4">
        <button
          onClick={() => setCurrentStep('mapping')}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 
                   dark:bg-gray-700 rounded-lg hover:bg-gray-200 
                   dark:hover:bg-gray-600 transition-colors"
        >
          مرحله قبل
        </button>
        <button
          onClick={handleImport}
          disabled={!previewMaterials.some(m => m.isSelected && !m.hasError)}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
         onClick={(e) => {
           if (e.target === e.currentTarget) {
             onClose();
           }
         }}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] 
                      overflow-y-auto relative"
           onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            ورود گروهی مواد اولیه
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                       rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400">
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
          // Main Content
          <div className="relative">
            {/* Step Indicator */}
            <div className="absolute top-0 inset-x-0 h-2 flex">
              {['upload', 'mapping', 'preview'].map((step, index) => (
                <div
                  key={step}
                  className={`flex-1 ${
                    index === 0 ? 'rounded-l-full' : ''
                  } ${
                    index === 2 ? 'rounded-r-full' : ''
                  } ${
                    ['upload', 'mapping', 'preview'].indexOf(currentStep) >= index
                      ? 'bg-blue-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  } transition-colors duration-300`}
                />
              ))}
            </div>

            {/* Step Content */}
            <div className="mt-8">
              {currentStep === 'upload' && renderUploadStep()}
              {currentStep === 'mapping' && renderMappingStep()}
              {currentStep === 'preview' && renderPreviewStep()}
            </div>
          </div>
        )}

        {/* Footer */}
        {currentStep === 'preview' && !isProcessing && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500">
            <p>* برای مشاهده جزئیات خطا، نشانگر ماوس را روی متن خطا نگه دارید</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialImport;