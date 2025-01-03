import React from 'react';
import BostonGraphSection from './BostonGraphSection';
import { SalesReport, SaleBatch } from '../../types/sales';

interface SalesReportViewProps {
  report: SalesReport;
  salesBatches: SaleBatch[];
  onDateRangeChange: (startDate: string, endDate: string) => Promise<void>;
  onBatchSelect: (selectedBatches: string[]) => void;
}

export default function SalesReportView({ report, salesBatches, onDateRangeChange, onBatchSelect }: SalesReportViewProps) {
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          گزارش فروش
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-700 dark:text-blue-300 mb-2">
              فروش کل
            </h3>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              ۱۲۳,۴۵۶,۷۸۹
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              ریال
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="text-lg font-medium text-green-700 dark:text-green-300 mb-2">
              تعداد فروش
            </h3>
            <p className="text-3xl font-bold text-green-900 dark:text-green-100">
              ۲,۳۴۵
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              عدد
            </p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <h3 className="text-lg font-medium text-purple-700 dark:text-purple-300 mb-2">
              میانگین فروش
            </h3>
            <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              ۵۲,۶۴۷
            </p>
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
              ریال
            </p>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <h3 className="text-lg font-medium text-orange-700 dark:text-orange-300 mb-2">
              رشد فروش
            </h3>
            <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
              ۱۵.۴%
            </p>
            <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
              نسبت به ماه قبل
            </p>
          </div>
        </div>
      </div>

      <BostonGraphSection 
        report={report}
        salesBatches={salesBatches}
        onDateRangeChange={onDateRangeChange}
      />
    </div>
  );
} 