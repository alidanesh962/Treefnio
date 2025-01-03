import React, { useState, useMemo } from 'react';
import { SaleBatch, SaleEntry } from '../../types/sales';
import { ShamsiDatePicker } from '../common';
import { Filter, Download, Package, DollarSign, CircleDollarSign, Loader, AlertCircle, X } from 'lucide-react';
import { ShamsiDate } from '../../utils/shamsiDate';

interface SalesHistoryProps {
  salesData: SaleBatch[];
}

export default function SalesHistory({ salesData }: SalesHistoryProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<SaleBatch | null>(null);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  const filteredSales = useMemo(() => {
    if (!dateRange.start && !dateRange.end) return salesData;

    return salesData.filter((batch) => {
      if (dateRange.start && ShamsiDate.compareShamsiDates(batch.startDate, dateRange.start) < 0) {
        return false;
      }
      if (dateRange.end && ShamsiDate.compareShamsiDates(batch.endDate, dateRange.end) > 0) {
        return false;
      }
      return true;
    });
  }, [salesData, dateRange]);

  const totals = useMemo(() => {
    return filteredSales.reduce(
      (acc, batch) => {
        acc.totalQuantity += batch.entries.reduce((sum, entry) => sum + entry.quantity, 0);
        acc.totalRevenue += batch.totalRevenue;
        acc.totalCost += batch.totalCost;
        acc.totalProfit += batch.totalRevenue - batch.totalCost;
        return acc;
      },
      { totalQuantity: 0, totalRevenue: 0, totalCost: 0, totalProfit: 0 }
    );
  }, [filteredSales]);

  const exportToExcel = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Implement Excel export
      console.log('Exporting to Excel...');
    } catch (err) {
      setError('خطا در خروجی گرفتن از اطلاعات');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            تاریخچه فروش
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
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              خروجی اکسل
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
            <div className="flex gap-4">
              <ShamsiDatePicker
                label="از تاریخ"
                value={dateRange.start}
                onChange={(date) => setDateRange({ ...dateRange, start: date })}
              />
              <ShamsiDatePicker
                label="تا تاریخ"
                value={dateRange.end}
                onChange={(date) => setDateRange({ ...dateRange, end: date })}
              />
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
              <Package className="h-4 w-4" />
              تعداد کل
            </div>
            <div className="text-2xl font-semibold text-blue-900 dark:text-blue-100">
              {totals.totalQuantity.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-300 mb-2">
              <DollarSign className="h-4 w-4" />
              درآمد کل
            </div>
            <div className="text-2xl font-semibold text-green-900 dark:text-green-100">
              {totals.totalRevenue.toLocaleString()} ریال
            </div>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-300 mb-2">
              <CircleDollarSign className="h-4 w-4" />
              هزینه مواد
            </div>
            <div className="text-2xl font-semibold text-red-900 dark:text-red-100">
              {totals.totalCost.toLocaleString()} ریال
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
              <CircleDollarSign className="h-4 w-4" />
              سود خالص
            </div>
            <div className="text-2xl font-semibold text-purple-900 dark:text-purple-100">
              {totals.totalProfit.toLocaleString()} ریال
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
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
              {filteredSales.map((batch) => (
                <tr 
                  key={batch.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => setSelectedBatch(batch)}
                >
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

        {/* Batch Details Dialog */}
        {selectedBatch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    جزئیات فروش - {selectedBatch.startDate}
                  </h3>
                  <button
                    onClick={() => setSelectedBatch(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                      <Package className="h-4 w-4" />
                      تعداد کل
                    </div>
                    <div className="text-2xl font-semibold text-blue-900 dark:text-blue-100">
                      {selectedBatch.entries.reduce((sum, entry) => sum + entry.quantity, 0).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                      <DollarSign className="h-4 w-4" />
                      درآمد کل
                    </div>
                    <div className="text-2xl font-semibold text-green-900 dark:text-green-100">
                      {selectedBatch.totalRevenue.toLocaleString()} ریال
                    </div>
                  </div>
                  
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                      <CircleDollarSign className="h-4 w-4" />
                      هزینه مواد
                    </div>
                    <div className="text-2xl font-semibold text-red-900 dark:text-red-100">
                      {selectedBatch.totalCost.toLocaleString()} ریال
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                      <CircleDollarSign className="h-4 w-4" />
                      سود خالص
                    </div>
                    <div className="text-2xl font-semibold text-purple-900 dark:text-purple-100">
                      {(selectedBatch.totalRevenue - selectedBatch.totalCost).toLocaleString()} ریال
                    </div>
                  </div>
                </div>

                {/* Products Table */}
                <div className="overflow-y-auto max-h-[calc(90vh-300px)]">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                          محصول
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                          کد محصول
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                          بخش فروش
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                          بخش تولید
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                          تعداد
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                          قیمت واحد
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                          هزینه مواد
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                          قیمت کل
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedBatch.entries.map((entry) => (
                        <tr key={entry.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {entry.product?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {entry.product?.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {entry.product?.saleDepartment || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {entry.product?.productionSegment || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {entry.quantity.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {entry.unitPrice.toLocaleString()} ریال
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {((selectedBatch.totalCost / selectedBatch.entries.reduce((sum, e) => sum + e.quantity, 0)) * entry.quantity).toLocaleString()} ریال
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {entry.totalPrice.toLocaleString()} ریال
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 