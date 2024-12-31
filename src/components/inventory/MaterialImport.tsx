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
      department: [/^گروه$/i, /^گروه.*کالا$/i, /^department$/i],
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
    <div className="p-6 animate-fade-in">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover-scale">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-center text-gray-900 dark:text-white">
            آپلود فایل
          </h3>
          <p className="mt-2 text-sm text-center text-gray-500 dark:text-gray-400">
            فایل CSV یا Excel خود را آپلود کنید
          </p>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="mt-4 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 
                     border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600
                     transition-colors cursor-pointer"
          />
        </div>
      </div>
    </div>
  );

  const renderMappingStep = (): JSX.Element => (
    <div className="p-6 animate-fade-in">
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover-scale">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            تطبیق ستون‌ها
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
            {/* Column mapping controls */}
            {Object.entries(columnMapping).map(([field, value]) => (
              <div key={field} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {field === 'name' ? 'نام' :
                   field === 'code' ? 'کد' :
                   field === 'department' ? 'بخش' :
                   field === 'price' ? 'قیمت' : 'واحد'}
                </label>
                <select
                  value={value === null ? '' : value}
                  onChange={(e) => {
                    const newValue = e.target.value === '' ? null : parseInt(e.target.value);
                    setColumnMapping({ ...columnMapping, [field]: newValue });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover-scale"
                >
                  <option value="">انتخاب ستون</option>
                  {fileData?.headers.map((header, index) => (
                    <option key={index} value={index}>{header}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Continue Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={generatePreview}
              disabled={!isColumnMappingComplete()}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg 
                       hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed hover-scale"
            >
              ادامه
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreviewControls = (): JSX.Element => (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border-t 
                    border-gray-200 dark:border-gray-700 animate-fade-in">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setCurrentStep('mapping')}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                   bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                   rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 hover-scale"
        >
          بازگشت
        </button>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={handleImport}
          disabled={isProcessing}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 
                   rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 
                   disabled:cursor-not-allowed hover-scale"
        >
          {isProcessing ? 'در حال پردازش...' : 'ثبت نهایی'}
        </button>
      </div>
    </div>
  );

  const renderPreviewStep = (): JSX.Element => (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex-1 p-6 overflow-auto">
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      انتخاب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      نام
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      کد
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      بخش
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      قیمت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      واحد
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 stagger-children">
                  {previewMaterials.map((material, index) => (
                    <tr 
                      key={index}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors hover-scale
                                ${material.hasError ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        <input
                          type="checkbox"
                          checked={material.isSelected}
                          onChange={(e) => handleToggleSelect(index, e.target.checked)}
                          className="rounded text-blue-500 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {material.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {material.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {material.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {material.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {material.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {material.hasError ? (
                          <span className="text-red-500 text-xs">{material.errorMessage}</span>
                        ) : (
                          <span className="text-green-500 text-xs">معتبر</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {renderPreviewControls()}
    </div>
  );

  // Main render
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50" onClick={onClose}></div>
        
        <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              ورود اطلاعات از فایل
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                       dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 
                       dark:hover:bg-gray-700 hover-scale"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="relative">
            {/* Steps */}
            <div className="flex items-center justify-center p-4 space-x-4 stagger-children">
              {['upload', 'mapping', 'preview'].map((step, index) => (
                <div
                  key={step}
                  className={`flex items-center ${index !== 0 ? 'mr-4' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center
                              ${currentStep === step
                                ? 'bg-blue-600 text-white'
                                : index < ['upload', 'mapping', 'preview'].indexOf(currentStep)
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                              } hover-scale`}
                  >
                    {index < ['upload', 'mapping', 'preview'].indexOf(currentStep) ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < 2 && (
                    <div
                      className={`h-0.5 w-16 mr-4
                                ${index < ['upload', 'mapping', 'preview'].indexOf(currentStep)
                                  ? 'bg-green-500'
                                  : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="animate-fade-in">
              {currentStep === 'upload' && renderUploadStep()}
              {currentStep === 'mapping' && renderMappingStep()}
              {currentStep === 'preview' && renderPreviewStep()}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 
                            rounded-lg animate-fade-in">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialImport;
