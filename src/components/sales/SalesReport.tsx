import React, { useState } from 'react';
import { SalesReport, SaleBatch } from '../../types/sales';
import { ShamsiDatePicker } from '../common';
import { Filter, Download, DollarSign, Package, TrendingUp, TrendingDown, Check } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SalesReportProps {
  report: SalesReport;
  salesBatches: SaleBatch[];
  onDateRangeChange: (range: { start: string; end: string }) => void;
  onBatchSelect: (selectedBatches: string[]) => void;
}

export default function SalesReportView({ report, salesBatches, onDateRangeChange, onBatchSelect }: SalesReportProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: report.timeRange.start,
    end: report.timeRange.end,
  });
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    const newRange = { ...dateRange, [field]: value };
    setDateRange(newRange);
    onDateRangeChange(newRange);
  };

  const handleBatchSelect = (batchId: string) => {
    const newSelection = selectedBatches.includes(batchId)
      ? selectedBatches.filter(id => id !== batchId)
      : [...selectedBatches, batchId];
    setSelectedBatches(newSelection);
    onBatchSelect(newSelection);
  };

  const exportToExcel = () => {
    // TODO: Implement Excel export
    console.log('Exporting to Excel...');
  };

  const departmentData = Object.entries(report.byDepartment).map(([name, data]) => ({
    name,
    فروش: data.totalRevenue,
    هزینه: data.totalCost,
    سود: data.netRevenue,
  }));

  const segmentData = Object.entries(report.byProductionSegment).map(([name, data]) => ({
    name,
    فروش: data.totalRevenue,
    هزینه: data.totalCost,
    سود: data.netRevenue,
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            گزارش فروش
          </h3>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Filter className="h-4 w-4" />
              فیلترها
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="h-4 w-4" />
              خروجی اکسل
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">
            انتخاب دسته‌های فروش
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                    انتخاب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                    تاریخ ثبت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                    تعداد اقلام
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                    مجموع تعداد
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                    درآمد کل
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                    هزینه مواد
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                    سود خالص
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {salesBatches.map((batch) => (
                  <tr 
                    key={batch.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleBatchSelect(batch.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center
                          ${selectedBatches.includes(batch.id)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {selectedBatches.includes(batch.id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {batch.startDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {batch.entries.length.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {batch.entries.reduce((sum, entry) => sum + entry.quantity, 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {batch.totalRevenue.toLocaleString()} ریال
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {batch.totalCost.toLocaleString()} ریال
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {(batch.totalRevenue - batch.totalCost).toLocaleString()} ریال
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
            <div className="flex gap-4">
              <ShamsiDatePicker
                label="از تاریخ"
                value={dateRange.start}
                onChange={(date) => handleDateChange('start', date)}
              />
              <ShamsiDatePicker
                label="تا تاریخ"
                value={dateRange.end}
                onChange={(date) => handleDateChange('end', date)}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              <Package className="h-4 w-4" />
              تعداد کل فروش
            </div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {report.overall.totalUnits.toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              <DollarSign className="h-4 w-4" />
              درآمد کل
            </div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {report.overall.totalRevenue.toLocaleString()} ریال
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              <TrendingDown className="h-4 w-4" />
              هزینه کل
            </div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {report.overall.totalCost.toLocaleString()} ریال
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              <TrendingUp className="h-4 w-4" />
              سود خالص
            </div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {report.overall.netRevenue.toLocaleString()} ریال
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              فروش بر اساس بخش فروش
            </h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="فروش" fill="#3b82f6" />
                  <Bar dataKey="هزینه" fill="#ef4444" />
                  <Bar dataKey="سود" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              فروش بر اساس بخش تولید
            </h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={segmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="فروش" fill="#3b82f6" />
                  <Bar dataKey="هزینه" fill="#ef4444" />
                  <Bar dataKey="سود" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              جزئیات فروش محصولات
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                      بخش فروش
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                      محصول
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                      کد محصول
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                      تعداد
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                      درآمد
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                      هزینه مواد
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                      سود
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.entries(report.byDepartment).flatMap(([department, data]) =>
                    data.products.map((product) => (
                      <tr key={`${department}-${product.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {product.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {product.units.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {product.revenue.toLocaleString()} ریال
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {product.materialCost.toLocaleString()} ریال
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {product.netRevenue.toLocaleString()} ریال
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 