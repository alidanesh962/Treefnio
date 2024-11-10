// src/components/reports/SalesReportSection.tsx
import React, { useState } from 'react';
import { BarChart2, Download, Calendar, Filter } from 'lucide-react';
import moment from 'moment-jalaali';

export default function SalesReportSection() {
  const [dateRange, setDateRange] = useState<[string, string]>(['', '']);
  const [department, setDepartment] = useState('all');

  // Sample data - replace with actual data
  const salesData = [
    { date: '1402/08/01', department: 'رستوران', amount: 12500000 },
    { date: '1402/08/02', department: 'کافی‌شاپ', amount: 8700000 },
    // Add more sample data
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart2 className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-gray-600 dark:text-gray-400">فروش کل</span>
            </div>
            <span className="text-xl font-bold text-gray-800 dark:text-white">
              21,200,000 ریال
            </span>
          </div>
        </div>
        {/* Add more stats cards */}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            فیلترها
          </h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg">
            <Download className="h-4 w-4" />
            دانلود گزارش
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm text-gray-600 dark:text-gray-400">بازه زمانی</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange[0]}
                onChange={(e) => setDateRange([e.target.value, dateRange[1]])}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <span className="text-gray-500 dark:text-gray-400 self-center">تا</span>
              <input
                type="date"
                value={dateRange[1]}
                onChange={(e) => setDateRange([dateRange[0], e.target.value])}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-gray-600 dark:text-gray-400">بخش</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">همه</option>
              <option value="restaurant">رستوران</option>
              <option value="cafe">کافی‌شاپ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  تاریخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  بخش
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  مبلغ (ریال)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {salesData.map((sale, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {sale.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {sale.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {sale.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}