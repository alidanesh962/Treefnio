// src/components/inventory/MaterialImport.tsx
import React, { useState, useEffect } from 'react';
import { Upload, X, FileSpreadsheet, RefreshCw, Check, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import _ from 'lodash';
import { db } from '../../database';
import type { Item, MaterialUnit } from '../../types';
import * as XLSX from 'xlsx';
import MaterialEditRow from './MaterialEditRow';

interface ColumnMapping {
  name: number | null;
  code: number | null;
  department: number | null;
  price: number | null;
  unit: number | null;
}

interface FileData {
  headers: string[];
  rows: string[][];
}

interface MaterialImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

export interface PreviewMaterial {
  name: string;
  code: string;
  department: string;
  price: number;
  unit: string;
  isSelected: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

type SupportedEncoding = 'UTF-8' | 'UTF-16LE' | 'UTF-16BE' | 'windows-1256' | 'ISO-8859-1';

const MaterialImport: React.FC<MaterialImportProps> = ({ onClose, onSuccess }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [availableUnits, setAvailableUnits] = useState<MaterialUnit[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    name: null,
    code: null,
    department: null,
    price: null,
    unit: null
  });
  const [previewMaterials, setPreviewMaterials] = useState<PreviewMaterial[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAvailableUnits(db.getMaterialUnits());
  }, []);

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
  // Utility functions
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

  const convertEncoding = (text: string, sourceEncoding: SupportedEncoding): string => {
    if (!text) return '';
    
    try {
      if (sourceEncoding === 'UTF-8') return normalizePersianText(text);

      const decoder = new TextDecoder(sourceEncoding);
      const encoder = new TextEncoder();
      const buffer = encoder.encode(text);
      const decodedText = decoder.decode(buffer);
      
      return normalizePersianText(decodedText);
    } catch (error) {
      console.warn('Error converting encoding:', error);
      return normalizePersianText(text);
    }
  };

  const validateMaterial = (material: PreviewMaterial): string[] => {
    const errors: string[] = [];
    
    // Only name and code are required
    if (!material.name.trim()) {
      errors.push('نام الزامی است');
    }
    if (!material.code.trim()) {
      errors.push('کد الزامی است');
    }
    
    // Other fields are optional, but validate if provided
    if (material.price && material.price < 0) {
      errors.push('قیمت نمی‌تواند منفی باشد');
    }

    return errors;
  };

  const checkForDuplicates = (material: PreviewMaterial, currentIndex: number): string[] => {
    const errors: string[] = [];

    // Check existing database
    const existingMaterials = db.getMaterials();
    if (existingMaterials.some(m => 
      m.code.toLowerCase() === material.code.toLowerCase() || 
      m.name.toLowerCase() === material.name.toLowerCase()
    )) {
      errors.push('این کد یا نام قبلاً ثبت شده است');
    }

    // Check current import list
    const duplicateInPreview = previewMaterials.some((m, i) => 
      i !== currentIndex && (
        m.code.toLowerCase() === material.code.toLowerCase() || 
        m.name.toLowerCase() === material.name.toLowerCase()
      )
    );
    if (duplicateInPreview) {
      errors.push('این کد یا نام در فایل تکراری است');
    }

    return errors;
  };

  const findMatchingUnit = (unitName: string): string => {
    if (!unitName) return availableUnits[0]?.id || '';
    
    const exactMatch = availableUnits.find(u => 
      u.name.toLowerCase() === unitName.toLowerCase() || 
      u.symbol.toLowerCase() === unitName.toLowerCase()
    );
    if (exactMatch) return exactMatch.id;

    const partialMatch = availableUnits.find(u => 
      unitName.toLowerCase().includes(u.name.toLowerCase()) || 
      unitName.toLowerCase().includes(u.symbol.toLowerCase())
    );
    if (partialMatch) return partialMatch.id;

    return availableUnits[0]?.id || '';
  };
  // File processing functions
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
                convertEncoding(String(header || ''), encoding)
              );
              
              const rows = results.data.slice(1).map(row => 
                (row || []).map(cell => convertEncoding(String(cell || ''), encoding))
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

  // Event handlers
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
      unit: null
    };

    const patterns = {
      name: [/^نام$/i, /^name$/i, /^title$/i, /^نام.*کالا$/i, /^نام.*متریال$/i],
      code: [/^کد$/i, /^code$/i, /^id$/i, /^شناسه$/i, /^کد.*کالا$/i],
      department: [/^بخش$/i, /^بخش.*کالا$/i, /^department$/i],
      unit: [/^واحد.*اندازه.*گیری$/i, /^واحد$/i, /^unit$/i, /^measure$/i],
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

    // Return mapping even if not all fields are mapped
    return mapping;
  };
  // Preview and editing handlers
  const generatePreview = (): void => {
    if (!fileData) return;

    const materials: PreviewMaterial[] = fileData.rows.map((row: string[]) => {
      // Extract values using column mapping
      const name = columnMapping.name !== null ? row[columnMapping.name]?.trim() || '' : '';
      const code = columnMapping.code !== null ? row[columnMapping.code]?.trim() || '' : '';
      const department = columnMapping.department !== null ? row[columnMapping.department]?.trim() || '' : '';
      const unitName = columnMapping.unit !== null ? row[columnMapping.unit]?.trim() || '' : '';
      const priceStr = columnMapping.price !== null ? row[columnMapping.price]?.trim() || '0' : '0';

      // Convert price string to number, handling different formats
      const price = parseFloat(priceStr.replace(/[^0-9.-]+/g, '')) || 0;

      // Find matching unit from available units
      const unit = findMatchingUnit(unitName);

      const material: PreviewMaterial = {
        name,
        code,
        department,
        price,
        unit,
        isSelected: true
      };

      // Validate the material
      const validationErrors = validateMaterial(material);
      const duplicateErrors = checkForDuplicates(material, -1);
      const allErrors = [...validationErrors, ...duplicateErrors];

      return {
        ...material,
        hasError: allErrors.length > 0,
        errorMessage: allErrors.join('، ')
      };
    });

    setPreviewMaterials(materials);
    setCurrentStep('preview');
  };

  const handleEditStart = (index: number) => {
    setEditingIndex(index);
  };

  const handleEditSave = (index: number, updatedMaterial: PreviewMaterial) => {
    const newMaterials = [...previewMaterials];
    
    // Validate the updated material
    const validationErrors = validateMaterial(updatedMaterial);
    const duplicateErrors = checkForDuplicates(updatedMaterial, index);
    const allErrors = [...validationErrors, ...duplicateErrors];

    // Update the material with validation results
    newMaterials[index] = {
      ...updatedMaterial,
      hasError: allErrors.length > 0,
      errorMessage: allErrors.join('، ')
    };

    setPreviewMaterials(newMaterials);
    setEditingIndex(null);
  };

  const handleEditCancel = (index: number) => {
    setEditingIndex(null);
  };

  const handleToggleSelect = (index: number, checked: boolean) => {
    const newMaterials = [...previewMaterials];
    newMaterials[index].isSelected = checked;
    setPreviewMaterials(newMaterials);
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
          department: m.department || '',
          price: m.price || 0,
          unit: m.unit || availableUnits[0]?.id || '',
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

  const isColumnMappingComplete = (): boolean => {
    // Only require name and code columns to be mapped
    return columnMapping.name !== null && columnMapping.code !== null;
  };
  // Render functions
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
        ستون‌های مورد نیاز: نام، کد (سایر فیلدها اختیاری هستند)
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { key: 'name' as const, label: 'نام', example: 'نام کالا، Name', required: true },
          { key: 'code' as const, label: 'کد', example: 'کد کالا، Code', required: true },
          { key: 'department' as const, label: 'بخش', example: 'بخش، Department', required: false },
          { key: 'unit' as const, label: 'واحد اندازه‌گیری', example: 'واحد، Unit', required: false },
          { key: 'price' as const, label: 'قیمت', example: 'قیمت، Price', required: false }
        ].map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 mr-1">*</span>}
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
                <option key={index} value={index}>{header}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              مثال: {field.example}
            </p>
          </div>
        ))}
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
          disabled={!isColumnMappingComplete()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                   transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          مرحله بعد
        </button>
      </div>
    </div>
  );

  const renderPreviewControls = (): JSX.Element => (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 
                    p-4 sticky top-0 z-10 shadow-sm">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
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
    </div>
  );
  const renderPreviewStep = (): JSX.Element => (
    <div className="space-y-6">
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
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                نام
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                کد
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                بخش
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                واحد
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                قیمت (ریال)
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                وضعیت
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {previewMaterials.map((material, index) => (
              <MaterialEditRow
                key={index}
                material={material}
                index={index}
                units={availableUnits}
                isEditing={editingIndex === index}
                onEdit={handleEditStart}
                onSave={handleEditSave}
                onCancel={handleEditCancel}
                onToggleSelect={handleToggleSelect}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-500 space-y-1">
        <p>* برای مشاهده جزئیات خطا، نشانگر ماوس را روی متن خطا نگه دارید</p>
        <p>* برای ویرایش هر مورد، روی دکمه ویرایش کلیک کنید</p>
        <p>* تنها فیلدهای نام و کد اجباری هستند</p>
        <p>* موارد خطادار قابل انتخاب نیستند</p>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto"
         onClick={(e) => {
           if (e.target === e.currentTarget) {
             onClose();
           }
         }}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full mx-4 my-6
                      relative flex flex-col max-h-[90vh]"
           onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
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

        {/* Progress Bar */}
        <div className="relative h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="absolute h-full bg-blue-500 transition-all duration-300"
            style={{
              width: currentStep === 'upload' ? '33.33%' :
                    currentStep === 'mapping' ? '66.66%' : '100%'
            }}
          />
        </div>

        {/* Step Labels */}
        <div className="grid grid-cols-3 gap-4 px-6 pt-4">
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

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 
                         dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 
                         dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Processing Spinner */}
        {isProcessing ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">در حال پردازش...</p>
          </div>
        ) : (
          <>
            {/* Controls for Preview Step */}
            {currentStep === 'preview' && renderPreviewControls()}
            
            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {currentStep === 'upload' && renderUploadStep()}
              {currentStep === 'mapping' && renderMappingStep()}
              {currentStep === 'preview' && renderPreviewStep()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MaterialImport;
