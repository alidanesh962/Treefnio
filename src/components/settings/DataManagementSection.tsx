import React, { useState } from 'react';
import { Trash2, Database, FileDown } from 'lucide-react';
import { DataManagementService } from '../../services/dataManagementService';

export default function DataManagementSection() {
  const [isResetting, setIsResetting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleReset = async () => {
    if (!window.confirm('آیا از حذف تمام اطلاعات اطمینان دارید؟ این عمل غیرقابل بازگشت است.')) {
      return;
    }

    setIsResetting(true);
    setMessage(null);
    try {
      const service = DataManagementService.getInstance();
      await service.resetAllData();
      setMessage({ type: 'success', text: 'تمام اطلاعات با موفقیت حذف شدند.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'خطا در حذف اطلاعات. لطفا دوباره تلاش کنید.' });
    } finally {
      setIsResetting(false);
    }
  };

  const handleGenerateSampleData = async () => {
    setIsGenerating(true);
    setMessage(null);
    try {
      const service = DataManagementService.getInstance();
      await service.generateSampleData();
      setMessage({ type: 'success', text: 'داده‌های نمونه با موفقیت ایجاد شدند.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'خطا در ایجاد داده‌های نمونه. لطفا دوباره تلاش کنید.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadSampleFiles = () => {
    try {
      const service = DataManagementService.getInstance();
      const files = service.generateSampleFiles();

      // Download product sample file
      const productBlob = base64ToBlob(files.products);
      const productUrl = URL.createObjectURL(productBlob);
      const productLink = document.createElement('a');
      productLink.href = productUrl;
      productLink.download = 'sample_products.xlsx';
      productLink.click();
      URL.revokeObjectURL(productUrl);

      // Download material sample file
      const materialBlob = base64ToBlob(files.materials);
      const materialUrl = URL.createObjectURL(materialBlob);
      const materialLink = document.createElement('a');
      materialLink.href = materialUrl;
      materialLink.download = 'sample_materials.xlsx';
      materialLink.click();
      URL.revokeObjectURL(materialUrl);

      // Download sales sample file
      const salesBlob = base64ToBlob(files.sales);
      const salesUrl = URL.createObjectURL(salesBlob);
      const salesLink = document.createElement('a');
      salesLink.href = salesUrl;
      salesLink.download = 'sample_sales.xlsx';
      salesLink.click();
      URL.revokeObjectURL(salesUrl);

      setMessage({ type: 'success', text: 'فایل‌های نمونه با موفقیت دانلود شدند.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'خطا در ایجاد فایل‌های نمونه. لطفا دوباره تلاش کنید.' });
    }
  };

  const base64ToBlob = (base64: string): Blob => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
          مدیریت داده‌ها
        </h3>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-red-500" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">حذف تمام اطلاعات</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  تمام اطلاعات شامل محصولات، مواد اولیه، دستور پخت‌ها و فروش‌ها حذف خواهند شد.
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResetting ? 'در حال حذف...' : 'حذف همه'}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-blue-500" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">ایجاد داده‌های نمونه</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  داده‌های نمونه شامل محصولات، مواد اولیه، دستور پخت‌ها و فروش‌ها ایجاد خواهند شد.
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerateSampleData}
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'در حال ایجاد...' : 'ایجاد داده‌های نمونه'}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <FileDown className="h-5 w-5 text-green-500" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">دانلود فایل‌های نمونه</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  فایل‌های اکسل نمونه برای وارد کردن محصولات، مواد اولیه و اطلاعات فروش
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadSampleFiles}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              دانلود فایل‌های نمونه
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 