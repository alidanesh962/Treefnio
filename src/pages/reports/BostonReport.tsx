import React, { useState } from 'react';
import BostonGraphSection from '../../components/reports/BostonGraphSection';
import { Download, Filter } from 'lucide-react';
import { PersianDatePicker } from '../../components/common/PersianDatePicker';
import { formatToJalali } from '../../utils/dateUtils';

export default function BostonReport() {
  const [dateRange, setDateRange] = useState<[string, string]>([
    formatToJalali(new Date()),
    formatToJalali(new Date())
  ]);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          گزارش ماتریس بوستون
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex gap-4 items-center">
            <PersianDatePicker
              value={dateRange[0]}
              onChange={(value) => setDateRange([value, dateRange[1]])}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="از تاریخ"
            />
            <span className="text-gray-500 dark:text-gray-400">تا</span>
            <PersianDatePicker
              value={dateRange[1]}
              onChange={(value) => setDateRange([dateRange[0], value])}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="تا تاریخ"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            <Download className="h-4 w-4" />
            دانلود گزارش
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          درباره ماتریس بوستون
        </h2>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-300">
            ماتریس بوستون (BCG Matrix) یک ابزار تحلیلی برای ارزیابی محصولات بر اساس دو معیار اصلی است:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-4 text-gray-600 dark:text-gray-300">
            <li>
              <span className="font-semibold">سهم بازار:</span> درصد فروش محصول نسبت به کل فروش
            </li>
            <li>
              <span className="font-semibold">رشد بازار:</span> درصد تغییر در فروش محصول نسبت به دوره قبل
            </li>
          </ul>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <h3 className="font-semibold text-orange-600 dark:text-orange-400">ستاره‌ها</h3>
              <p className="text-sm">سهم بازار بالا، رشد بالا</p>
            </div>
            <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <h3 className="font-semibold text-green-600 dark:text-green-400">گاوهای شیرده</h3>
              <p className="text-sm">سهم بازار بالا، رشد پایین</p>
            </div>
            <div className="p-4 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <h3 className="font-semibold text-purple-600 dark:text-purple-400">علامت‌های سؤال</h3>
              <p className="text-sm">سهم بازار پایین، رشد بالا</p>
            </div>
            <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <h3 className="font-semibold text-red-600 dark:text-red-400">سگ‌ها</h3>
              <p className="text-sm">سهم بازار پایین، رشد پایین</p>
            </div>
          </div>
        </div>
      </div>

      {/* Boston Graph */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <BostonGraphSection />
      </div>

      {/* Product Details Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
          جزئیات محصولات
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  نام محصول
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  کد
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  سهم بازار
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  رشد
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  دسته‌بندی
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {/* Product rows will be dynamically added here */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 