import React, { useState, useEffect } from 'react';
import { Upload, Save, X, AlertCircle, Check, Eye, Download } from 'lucide-react';
import { SalesImportService } from '../../services/salesImport';
import { Product, Material } from '../../types';
import * as XLSX from 'xlsx';
import { ProductMappingDialog, UnmatchedProduct } from './ProductMappingDialog';
import { formatToJalali } from '../../utils/dateUtils';

interface ColumnMapping {
  fileColumn: string;
  appColumn: string;
  sampleData: string[];
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

interface Dataset {
  id: string;
  name: string;
  importDate: number;
  data?: any[];
}

interface ImportHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDataset: Dataset | null;
  onDownload: () => void;
}

function ImportHistoryDialog({ isOpen, onClose, selectedDataset, onDownload }: ImportHistoryDialogProps) {
  if (!isOpen || !selectedDataset) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            جزئیات مجموعه داده {selectedDataset.name}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={onDownload}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            تاریخ ورود: {formatToJalali(new Date(selectedDataset.importDate))}
          </p>
        </div>

        {selectedDataset.data && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {Object.keys(selectedDataset.data[0] || {}).map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {selectedDataset.data.slice(0, 100).map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value: any, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300"
                      >
                        {value?.toString()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {selectedDataset.data.length > 100 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
                نمایش 100 ردیف اول از {selectedDataset.data.length} ردیف
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FileImportSection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [delimiter, setDelimiter] = useState(',');
  const [hasHeader, setHasHeader] = useState(true);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldUpdatePrices, setShouldUpdatePrices] = useState(false);
  const [showSampleData, setShowSampleData] = useState(false);
  const [unmatchedProducts, setUnmatchedProducts] = useState<UnmatchedProduct[]>([]);
  const [showProductMapping, setShowProductMapping] = useState(false);
  const [existingProducts, setExistingProducts] = useState<Product[]>([]);
  const [importData, setImportData] = useState<any[]>([]);
  const [datasetName, setDatasetName] = useState('');
  const [setAsReference, setSetAsReference] = useState(false);
  const [importHistory, setImportHistory] = useState<Dataset[]>([]);
  const [selectedHistoryDataset, setSelectedHistoryDataset] = useState<Dataset | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  const appColumns = [
    { value: 'product_code', label: 'کد محصول' },
    { value: 'product_name', label: 'نام محصول' },
    { value: 'quantity', label: 'تعداد' },
    { value: 'price', label: 'قیمت' },
    { value: 'date', label: 'تاریخ' },
  ];

  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][];
      
      setPreviewData(jsonData.slice(0, 5));
      if (hasHeader && jsonData.length > 0) {
        setColumnMappings(jsonData[0].map(col => ({
          fileColumn: col,
          appColumn: '',
          sampleData: jsonData.slice(1, 5).map(row => row[jsonData[0].indexOf(col)] || '')
        })));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processTextFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').map(row => row.split(delimiter));
      setPreviewData(rows.slice(0, 5));
      if (hasHeader && rows.length > 0) {
        setColumnMappings(rows[0].map((col, index) => ({
          fileColumn: col,
          appColumn: '',
          sampleData: rows.slice(1, 5).map(row => row[index] || '')
        })));
      }
    };
    reader.readAsText(file);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        processExcelFile(file);
      } else {
        processTextFile(file);
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile || columnMappings.length === 0 || !datasetName) return;

    setIsLoading(true);
    setImportResult(null);

    try {
      const processImportData = (rows: string[][]) => {
        const dataStartIndex = hasHeader ? 1 : 0;
        return rows.slice(dataStartIndex).map(row => {
          const data: any = {};
          columnMappings.forEach((mapping, index) => {
            if (mapping.appColumn && row[index]) {
              const value = row[index].toString().trim();
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
      };

      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      let processedData: any[] = [];

      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][];
        processedData = processImportData(rows);
      } else {
        const text = await selectedFile.text();
        const rows = text.split('\n').map(row => row.split(delimiter));
        processedData = processImportData(rows);
      }

      // Store the processed data for later use after product mapping
      setImportData(processedData);

      const importService = SalesImportService.getInstance();
      
      // Get actual products from your state management
      const products = await importService.getProducts();
      setExistingProducts(products);

      // Find unmatched products
      const productMap = new Map<string, UnmatchedProduct>();
      processedData.forEach(row => {
        if (row.product_code && !products.find((p: Product) => p.code === row.product_code)) {
          const key = row.product_code;
          if (!productMap.has(key)) {
            productMap.set(key, {
              code: row.product_code,
              name: row.product_name || row.product_code,
              occurrences: 1
            });
          } else {
            const product = productMap.get(key)!;
            product.occurrences++;
          }
        }
      });

      const unmatched = Array.from(productMap.values());
      if (unmatched.length > 0) {
        setUnmatchedProducts(unmatched);
        setShowProductMapping(true);
        setIsLoading(false);
        return;
      }

      // If no unmatched products, proceed with import
      await proceedWithImport(processedData);

    } catch (error) {
      setImportResult({
        success: false,
        materialUsage: [],
        errors: [error instanceof Error ? error.message : 'An unknown error occurred'],
      });
      setIsLoading(false);
    }
  };

  const proceedWithImport = async (data: any[], productMappings?: { [key: string]: string }) => {
    setIsLoading(true);
    try {
      const importService = SalesImportService.getInstance();
      
      // Apply product mappings if provided
      const mappedData = data.map(row => {
        if (productMappings && productMappings[row.product_code]) {
          return {
            ...row,
            product_code: productMappings[row.product_code]
          };
        }
        return row;
      });

      const result = await importService.importSalesData(mappedData, datasetName);
      
      if (shouldUpdatePrices) {
        const priceUpdateResult = await importService.updateProductPrices(mappedData);
        result.updatedProducts = priceUpdateResult.updatedProducts;
      }

      if (setAsReference && result.datasetId) {
        await importService.setReferenceDataset(result.datasetId);
      }

      setImportResult(result);
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

  const handleCreateNewProducts = async (products: UnmatchedProduct[]) => {
    try {
      const importService = SalesImportService.getInstance();
      await importService.createProducts(products.map(p => ({
        code: p.code,
        name: p.name,
        // Add any other required product fields with default values
      })));
    } catch (error) {
      console.error('Error creating new products:', error);
      // Handle error appropriately
    }
  };

  useEffect(() => {
    loadImportHistory();
  }, []);

  const loadImportHistory = async () => {
    const importService = SalesImportService.getInstance();
    const datasets = await importService.getDatasets();
    setImportHistory(datasets);
  };

  const handleDatasetSelect = async (dataset: Dataset) => {
    const importService = SalesImportService.getInstance();
    const fullDataset = await importService.getDatasetDetails(dataset.id);
    setSelectedHistoryDataset(fullDataset);
    setShowHistoryDialog(true);
  };

  const handleDownloadDataset = () => {
    if (!selectedHistoryDataset?.data) return;

    const ws = XLSX.utils.json_to_sheet(selectedHistoryDataset.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${selectedHistoryDataset.name}.xlsx`);
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
                  {selectedFile ? selectedFile.name : 'برای آپلود فایل کلیک کنید یا فایل را بکشید و رها کنید'}
                </p>
              </div>
              <input type="file" className="hidden" onChange={handleFileSelect} accept=".csv,.txt,.xlsx,.xls" />
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
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">تنظیم ستون‌ها</h3>
              <button
                onClick={() => setShowSampleData(!showSampleData)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 
                         hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Eye className="h-4 w-4" />
                {showSampleData ? 'پنهان کردن نمونه‌ها' : 'نمایش نمونه‌ها'}
              </button>
            </div>
            
            <div className="space-y-2">
              {columnMappings.map((mapping, index) => (
                <div 
                  key={index} 
                  className={`flex items-center gap-4 p-3 rounded-lg transition-all
                           ${mapping.appColumn 
                             ? 'bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30' 
                             : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'}`}
                >
                  <div className="w-[180px] flex-shrink-0">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {mapping.fileColumn}
                    </div>
                  </div>
                  
                  <select
                    value={mapping.appColumn}
                    onChange={(e) => {
                      const newMappings = [...columnMappings];
                      newMappings[index].appColumn = e.target.value;
                      setColumnMappings(newMappings);
                    }}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 
                             bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">انتخاب ستون متناظر</option>
                    {appColumns.map(col => (
                      <option key={col.value} value={col.value}>{col.label}</option>
                    ))}
                  </select>

                  {showSampleData && mapping.sampleData[0] && (
                    <div className="w-[200px] flex-shrink-0">
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate" title={mapping.sampleData[0]}>
                        {mapping.sampleData[0]}
                      </div>
                      {mapping.sampleData.length > 1 && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          + {mapping.sampleData.length - 1} نمونه دیگر
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dataset Name Input */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              placeholder="نام مجموعه داده"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Set as Reference Checkbox */}
        <div className="mb-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={setAsReference}
              onChange={(e) => setSetAsReference(e.target.checked)}
              className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              تنظیم به عنوان مجموعه داده مرجع
            </span>
          </label>
        </div>

        {/* Import Button */}
        <div className="mb-6">
          <button
            onClick={handleImport}
            disabled={isLoading || !selectedFile || columnMappings.length === 0 || !datasetName}
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
      </div>

      {/* Import History Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
          تاریخچه ورود اطلاعات
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  نام مجموعه داده
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  تاریخ ورود
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {importHistory.map((dataset) => (
                <tr key={dataset.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {dataset.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {formatToJalali(new Date(dataset.importDate))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    <button
                      onClick={() => handleDatasetSelect(dataset)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      مشاهده جزئیات
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import History Dialog */}
      <ImportHistoryDialog
        isOpen={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        selectedDataset={selectedHistoryDataset}
        onDownload={handleDownloadDataset}
      />

      {showProductMapping && (
        <ProductMappingDialog
          unmatchedProducts={unmatchedProducts}
          existingProducts={existingProducts}
          onSave={async (mappings: { [key: string]: string }) => {
            setShowProductMapping(false);
            await proceedWithImport(importData, mappings);
          }}
          onCancel={() => {
            setShowProductMapping(false);
            setImportResult({
              success: false,
              materialUsage: [],
              errors: ['Import cancelled due to unmatched products'],
            });
          }}
          onCreateNew={handleCreateNewProducts}
        />
      )}
    </div>
  );
} 