import React, { useState, useEffect } from 'react';
import { Upload, Save, X, AlertCircle, Check } from 'lucide-react';
import { SalesImportService } from '../../services/salesImport';
import { Product, Material } from '../../types';

interface ColumnMapping {
  fileColumn: string;
  appColumn: string;
}

interface FileImportConfig {
  name: string;
  columnMappings: ColumnMapping[];
  delimiter: string;
  hasHeader: boolean;
}

interface ImportResult {
  success: boolean;
  materialUsage: { materialId: string; quantity: number; }[];
  errors: string[];
  updatedProducts?: string[];
}

export default function FileImportSection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [delimiter, setDelimiter] = useState(',');
  const [hasHeader, setHasHeader] = useState(true);
  const [savedConfigs, setSavedConfigs] = useState<FileImportConfig[]>([]);
  const [configName, setConfigName] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldUpdatePrices, setShouldUpdatePrices] = useState(false);

  const appColumns = [
    { value: 'product_code', label: 'کد محصول' },
    { value: 'product_name', label: 'نام محصول' },
    { value: 'quantity', label: 'تعداد' },
    { value: 'price', label: 'قیمت' },
    { value: 'date', label: 'تاریخ' },
  ];

  useEffect(() => {
    // Load saved configs from localStorage
    const savedConfigsStr = localStorage.getItem('salesImportConfigs');
    if (savedConfigsStr) {
      setSavedConfigs(JSON.parse(savedConfigsStr));
    }
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const rows = text.split('\n').map(row => row.split(delimiter));
        setPreviewData(rows.slice(0, 5)); // Preview first 5 rows
        if (hasHeader) {
          setColumnMappings(rows[0].map(col => ({ fileColumn: col, appColumn: '' })));
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSaveConfig = () => {
    if (configName && columnMappings.length > 0) {
      const newConfig: FileImportConfig = {
        name: configName,
        columnMappings,
        delimiter,
        hasHeader,
      };
      const updatedConfigs = [...savedConfigs, newConfig];
      setSavedConfigs(updatedConfigs);
      localStorage.setItem('salesImportConfigs', JSON.stringify(updatedConfigs));
      setConfigName('');
    }
  };

  const handleLoadConfig = (config: FileImportConfig) => {
    setDelimiter(config.delimiter);
    setHasHeader(config.hasHeader);
    setColumnMappings(config.columnMappings);
  };

  const handleImport = async () => {
    if (!selectedFile || columnMappings.length === 0) return;

    setIsLoading(true);
    setImportResult(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          const rows = text.split('\n').map(row => row.split(delimiter));
          const dataStartIndex = hasHeader ? 1 : 0;
          
          const importData = rows.slice(dataStartIndex).map(row => {
            const data: any = {};
            columnMappings.forEach((mapping, index) => {
              if (mapping.appColumn && row[index]) {
                const value = row[index].trim();
                switch (mapping.appColumn) {
                  case 'quantity':
                  case 'price':
                    const numValue = parseFloat(value);
                    if (isNaN(numValue)) {
                      throw new Error(`Invalid ${mapping.appColumn} value: ${value}`);
                    }
                    data[mapping.appColumn] = numValue;
                    break;
                  default:
                    data[mapping.appColumn] = value;
                }
              }
            });
            return data;
          });

          const importService = SalesImportService.getInstance();
          
          // TODO: Get actual products and materials from your state management
          const dummyProducts: Product[] = [];
          const dummyMaterials: Material[] = [];
          
          importService.setProducts(dummyProducts);
          importService.setMaterials(dummyMaterials);

          const result = await importService.importSalesData(importData);
          
          if (shouldUpdatePrices) {
            const priceUpdateResult = await importService.updateProductPrices(importData);
            result.updatedProducts = priceUpdateResult.updatedProducts;
          }

          setImportResult(result);
        } catch (error) {
          setImportResult({
            success: false,
            materialUsage: [],
            errors: [error instanceof Error ? error.message : 'An unknown error occurred while processing the file'],
          });
        }
      };

      reader.onerror = () => {
        setImportResult({
          success: false,
          materialUsage: [],
          errors: ['Error reading file'],
        });
      };

      reader.readAsText(selectedFile);
    } catch (error) {
      setImportResult({
        success: false,
        materialUsage: [],
        errors: [error instanceof Error ? error.message : 'An unknown error occurred'],
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
          وارد کردن فایل فروش
        </h2>

        {/* File Upload Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            انتخاب فایل
          </label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  {selectedFile ? selectedFile.name : 'برای آپلود ف��یل کلیک کنید یا فایل را بکشید و رها کنید'}
                </p>
              </div>
              <input type="file" className="hidden" onChange={handleFileSelect} accept=".csv,.txt" />
            </label>
          </div>
        </div>

        {/* File Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              جداکننده ستون‌ها
            </label>
            <select
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value=",">کاما (,)</option>
              <option value=";">نقطه‌ویرگول (;)</option>
              <option value="\t">تب</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              سطر اول عنوان ستون‌ها است
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={hasHeader}
                onChange={(e) => setHasHeader(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              به‌روزرسانی قیمت‌ها
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={shouldUpdatePrices}
                onChange={(e) => setShouldUpdatePrices(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Column Mapping */}
        {previewData.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              تنظیم ستون‌ها
            </h3>
            <div className="space-y-3">
              {columnMappings.map((mapping, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[150px]">
                    {mapping.fileColumn}
                  </span>
                  <select
                    value={mapping.appColumn}
                    onChange={(e) => {
                      const newMappings = [...columnMappings];
                      newMappings[index].appColumn = e.target.value;
                      setColumnMappings(newMappings);
                    }}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">انتخاب کنید</option>
                    {appColumns.map(col => (
                      <option key={col.value} value={col.value}>{col.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Configuration */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              placeholder="نام تنظیمات"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              onClick={handleSaveConfig}
              disabled={!configName || columnMappings.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              ذخیره تنظیمات
            </button>
          </div>
        </div>

        {/* Import Button */}
        <div className="mb-6">
          <button
            onClick={handleImport}
            disabled={isLoading || !selectedFile || columnMappings.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg disabled:opacity-50"
          >
            {isLoading ? (
              <span>در حال پردازش...</span>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                شروع ورود اطلاعات
              </>
            )}
          </button>
        </div>

        {/* Import Results */}
        {importResult && (
          <div className={`p-4 rounded-lg ${
            importResult.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              {importResult.success ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span className={`font-medium ${
                importResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
              }`}>
                {importResult.success ? 'ورود اطلاعات با موفقیت انجام شد' : 'خطا در ورود اطلاعات'}
              </span>
            </div>
            
            {importResult.errors.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">خطاها:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {importResult.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-600 dark:text-red-400">{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {importResult.updatedProducts && importResult.updatedProducts.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">
                  محصولات به‌روزرسانی شده:
                </h4>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {importResult.updatedProducts.length} محصول به‌روزرسانی شد
                </p>
              </div>
            )}

            {importResult.materialUsage.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                  مصرف مواد اولیه:
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {importResult.materialUsage.map((usage, index) => (
                    <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                      {`${usage.materialId}: ${usage.quantity}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Saved Configurations */}
        {savedConfigs.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              تنظیمات ذخیره شده
            </h3>
            <div className="space-y-2">
              {savedConfigs.map((config, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-800 dark:text-white">{config.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLoadConfig(config)}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
                    >
                      بارگذاری
                    </button>
                    <button
                      onClick={() => {
                        const newConfigs = savedConfigs.filter((_, i) => i !== index);
                        setSavedConfigs(newConfigs);
                        localStorage.setItem('salesImportConfigs', JSON.stringify(newConfigs));
                      }}
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 