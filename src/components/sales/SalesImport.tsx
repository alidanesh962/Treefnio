import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, AlertCircle, Check, Loader, Package, DollarSign, CircleDollarSign } from 'lucide-react';
import { ProductDefinition } from '../../types';
import { SalesImportMapping, UnmappedProduct } from '../../types/sales';
import { ProductSelector } from '../common';
import { ShamsiDate } from '../../utils/shamsiDate';
import * as XLSX from 'xlsx';

interface SalesImportProps {
  onImport: (data: any[]) => Promise<void>;
  products: ProductDefinition[];
}

interface ColumnMapping {
  productCode: string;
  productName: string;
  quantity: string;
  unitPrice: string;
  date: string;
}

interface UnmappedProductWithCode extends UnmappedProduct {
  code: string;
}

interface ImportSummary {
  totalProducts: number;
  totalQuantity: number;
  totalRevenue: number;
  unmappedCount: number;
}

interface FileData {
  headers: string[];
  rows: string[][];
}

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

        const text = new TextDecoder('utf-8').decode(buffer);
        const rows = text.split('\n').map(row => row.split(','));
        
        if (!rows || !Array.isArray(rows) || rows.length < 2) {
          reject(new Error('فایل خالی یا نامعتبر است'));
          return;
        }

        const headers = (rows[0] || []).map(header => 
          header.trim()
        );
        
        const dataRows = rows.slice(1).map(row => 
          (row || []).map(cell => cell.trim())
        );

        resolve({ headers, rows: dataRows });
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
          String(header || '').trim()
        );

        const rows = rawData.slice(1).map(row => 
          (Array.isArray(row) ? row : []).map(cell => 
            String(cell || '').trim()
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

export default function SalesImport({ onImport, products }: SalesImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    productCode: '',
    productName: '',
    quantity: '',
    unitPrice: '',
    date: '',
  });
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [unmappedProducts, setUnmappedProducts] = useState<UnmappedProductWithCode[]>([]);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary>({
    totalProducts: 0,
    totalQuantity: 0,
    totalRevenue: 0,
    unmappedCount: 0,
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFile(file);
    setError('');
    setIsProcessing(true);

    try {
      let fileData: { headers: string[]; rows: any[][] };
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text();
        const rows = text.split('\n').map(row => row.split(','));
        fileData = {
          headers: rows[0].map(header => header.trim()),
          rows: rows.slice(1).map(row => row.map(cell => cell.trim()))
        };
      } else if (file.name.toLowerCase().match(/\.xlsx?$/)) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, {
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
          throw new Error('فایل خالی یا نامعتبر است');
        }

        fileData = {
          headers: rawData[0].map(header => String(header || '').trim()),
          rows: rawData.slice(1).map(row => 
            (Array.isArray(row) ? row : []).map(cell => String(cell || '').trim())
          )
        };
      } else {
        throw new Error('فرمت فایل پشتیبانی نمی‌شود. لطفاً از فایل‌های CSV یا Excel استفاده کنید.');
      }

      setHeaders(fileData.headers);
      
      const previewRows = fileData.rows.slice(0, 5).map(row =>
        row.reduce((obj, val, i) => {
          obj[fileData.headers[i]] = val;
          return obj;
        }, {} as any)
      );
      setPreviewData(previewRows);

      // Calculate initial summary
      const allRows = fileData.rows.map(row =>
        row.reduce((obj, val, i) => {
          obj[fileData.headers[i]] = val;
          return obj;
        }, {} as any)
      );

      setImportSummary({
        totalProducts: new Set(allRows.map(row => row[fileData.headers[0]])).size,
        totalQuantity: allRows.reduce((sum, row) => sum + (parseInt(row[fileData.headers[0]]) || 0), 0),
        totalRevenue: allRows.reduce((sum, row) => {
          const quantity = parseInt(row[fileData.headers[0]]) || 0;
          const price = parseInt(row[fileData.headers[1]]) || 0;
          return sum + (quantity * price);
        }, 0),
        unmappedCount: 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای ناشناخته در پردازش فایل');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    setMapping(prev => ({ ...prev, [field]: value }));
  };

  const validateMapping = () => {
    const requiredFields: (keyof ColumnMapping)[] = [
      'productCode',
      'quantity',
      'unitPrice',
      'date',
    ];
    return requiredFields.every(field => mapping[field]);
  };

  const handleProductSelect = (unmappedProduct: UnmappedProductWithCode, selectedProduct: ProductDefinition) => {
    setUnmappedProducts(prev => {
      const filtered = prev.filter(p => p.code !== unmappedProduct.code);
      setImportSummary(prev => ({
        ...prev,
        unmappedCount: filtered.length,
      }));
      return filtered;
    });
  };

  const handleImport = async () => {
    if (!file || !validateMapping()) {
      setError('لطفاً تمام فیلدهای ضروری را مشخص کنید.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      let fileData: { headers: string[]; rows: any[][] };
      
      if (file.name.toLowerCase().endsWith('.csv')) {
      const text = await file.text();
      const rows = text.split('\n').map(row => row.split(','));
        fileData = {
          headers: rows[0].map(header => header.trim()),
          rows: rows.slice(1).map(row => row.map(cell => cell.trim()))
        };
      } else if (file.name.toLowerCase().match(/\.xlsx?$/)) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, {
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
          throw new Error('فایل خالی یا نامعتبر است');
        }

        fileData = {
          headers: rawData[0].map(header => String(header || '').trim()),
          rows: rawData.slice(1).map(row => 
            (Array.isArray(row) ? row : []).map(cell => String(cell || '').trim())
          )
        };
      } else {
        throw new Error('فرمت فایل پشتیبانی نمی‌شود. لطفاً از فایل‌های CSV یا Excel استفاده کنید.');
      }
      
      const mappedData = fileData.rows.map(row => {
        const data: SalesImportMapping = {
          productCode: row[fileData.headers.indexOf(mapping.productCode)].trim(),
          productName: mapping.productName ? row[fileData.headers.indexOf(mapping.productName)].trim() : '',
          quantity: row[fileData.headers.indexOf(mapping.quantity)].trim(),
          unitPrice: row[fileData.headers.indexOf(mapping.unitPrice)].trim(),
          date: row[fileData.headers.indexOf(mapping.date)].trim(),
        };
        return data;
      });

      // Find unmapped products
      const unmapped = mappedData
        .map(data => {
          const product = products.find(p => p.code === data.productCode);
          if (!product) {
            return {
              code: data.productCode,
              name: data.productName,
              possibleMatches: products.filter(p =>
                p.name.toLowerCase().includes(data.productName.toLowerCase())
              ),
            } as UnmappedProductWithCode;
          }
          return null;
        })
        .filter((p): p is UnmappedProductWithCode => {
          if (!p) return false;
          return typeof p.code === 'string' && 
                 typeof p.name === 'string' && 
                 Array.isArray(p.possibleMatches);
        })
        .filter((p, i, arr) => arr.findIndex(x => x.code === p.code) === i);

      if (unmapped.length > 0) {
        setUnmappedProducts(unmapped);
        setImportSummary(prev => ({
          ...prev,
          unmappedCount: unmapped.length,
        }));
        return;
      }

      await onImport(mappedData);
      
      // Reset form after successful import
      setFile(null);
      setHeaders([]);
      setMapping({
        productCode: '',
        productName: '',
        quantity: '',
        unitPrice: '',
        date: '',
      });
      setPreviewData([]);
      setImportSummary({
        totalProducts: 0,
        totalQuantity: 0,
        totalRevenue: 0,
        unmappedCount: 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای ناشناخته در پردازش فایل');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
          ورود اطلاعات فروش از فایل
        </h3>

        {/* Summary Cards */}
        {file && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                <Package className="h-4 w-4" />
                تعداد محصولات
              </div>
              <div className="text-2xl font-semibold text-blue-900 dark:text-blue-100">
                {importSummary.totalProducts.toLocaleString()}
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                <DollarSign className="h-4 w-4" />
                تعداد کل
              </div>
              <div className="text-2xl font-semibold text-green-900 dark:text-green-100">
                {importSummary.totalQuantity.toLocaleString()}
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                <CircleDollarSign className="h-4 w-4" />
                مجموع فروش
              </div>
              <div className="text-2xl font-semibold text-purple-900 dark:text-purple-100">
                {importSummary.totalRevenue.toLocaleString()} ریال
              </div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                <AlertCircle className="h-4 w-4" />
                محصولات نامشخص
              </div>
              <div className="text-2xl font-semibold text-red-900 dark:text-red-100">
                {importSummary.unmappedCount.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {!file ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500'
              }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-gray-600 dark:text-gray-300">
              فایل CSV را اینجا رها کنید یا کلیک کنید تا انتخاب کنید
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              فقط فایل‌های CSV پشتیبانی می‌شوند
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                تطبیق ستون‌ها
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    کد محصول
                  </label>
                  <select
                    value={mapping.productCode}
                    onChange={(e) => handleMappingChange('productCode', e.target.value)}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">انتخاب ستون</option>
                    {headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    نام محصول (اختیاری)
                  </label>
                  <select
                    value={mapping.productName}
                    onChange={(e) => handleMappingChange('productName', e.target.value)}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">انتخاب ستون</option>
                    {headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    تعداد
                  </label>
                  <select
                    value={mapping.quantity}
                    onChange={(e) => handleMappingChange('quantity', e.target.value)}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">انتخاب ستون</option>
                    {headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    قیمت واحد
                  </label>
                  <select
                    value={mapping.unitPrice}
                    onChange={(e) => handleMappingChange('unitPrice', e.target.value)}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">انتخاب ستون</option>
                    {headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    تاریخ
                  </label>
                  <select
                    value={mapping.date}
                    onChange={(e) => handleMappingChange('date', e.target.value)}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">انتخاب ستون</option>
                    {headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {previewData.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  پیش‌نمایش داده‌ها
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        {headers.map((header) => (
                          <th
                            key={header}
                            className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {previewData.map((row, i) => (
                        <tr key={i}>
                          {headers.map((header) => (
                            <td
                              key={header}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                            >
                              {row[header]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {unmappedProducts.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  محصولات نامشخص
                </h4>
                <div className="space-y-4">
                  {unmappedProducts.map((product) => (
                    <div
                      key={product.code}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {product.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            کد: {product.code}
                          </p>
                        </div>
                      </div>
                      <ProductSelector
                        value={null}
                        onChange={(selected) => {
                          if (selected) {
                            handleProductSelect(product, selected);
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleImport}
                disabled={isProcessing || !validateMapping()}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isProcessing || !validateMapping()
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                }`}
              >
                {isProcessing && <Loader className="h-4 w-4 animate-spin" />}
                {isProcessing ? 'در حال پردازش...' : 'ورود اطلاعات'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 