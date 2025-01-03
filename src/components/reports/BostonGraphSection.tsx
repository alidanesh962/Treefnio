import React, { useState, useEffect } from 'react';
import { Filter, Download, Check } from 'lucide-react';
import { ShamsiDatePicker } from '../common';
import { ShamsiDate } from '../../utils/shamsiDate';
import { db } from '../../database';
import { 
  SaleEntry,
  SaleBatch,
  SalesReport 
} from '../../types/sales';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
} from 'recharts';

interface BostonData {
  name: string;
  code: string;
  marketGrowth: number;
  marketShare: number;
  revenue: number;
}

interface BostonReport {
  data: BostonData[];
  timeRange: {
    start: string;
    end: string;
  };
}

interface BostonGraphSectionProps {
  salesBatches: SaleBatch[];
  report: SalesReport;
  onDateRangeChange: (startDate: string, endDate: string) => Promise<void>;
}

interface ProductSaleData {
  name: string;
  code: string;
  sales: Array<{
    date: string;
    revenue: number;
    quantity: number;
  }>;
}

export default function BostonGraphSection({ salesBatches, report, onDateRangeChange }: BostonGraphSectionProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: report.timeRange.start,
    end: report.timeRange.end,
  });
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [bostonReport, setBostonReport] = useState<BostonReport>({
    data: [],
    timeRange: report.timeRange,
  });

  useEffect(() => {
    generateBostonReport();
  }, [salesBatches, report]);

  const handleBatchSelect = (batchId: string) => {
    const newSelection = selectedBatches.includes(batchId)
      ? selectedBatches.filter(id => id !== batchId)
      : [...selectedBatches, batchId];
    setSelectedBatches(newSelection);
    generateBostonReport();
  };

  const generateBostonReport = () => {
    // If no batches are selected, show empty data
    if (selectedBatches.length === 0) {
      setBostonReport({
        data: [],
        timeRange: report.timeRange,
      });
      return;
    }

    // Only use selected batches
    const relevantBatches = salesBatches.filter(batch => selectedBatches.includes(batch.id));

    const salesByProduct = new Map<string, ProductSaleData>();

    // Process selected sales batches
    relevantBatches.forEach(batch => {
      batch.entries.forEach((entry: SaleEntry) => {
        const existingProduct = salesByProduct.get(entry.productId) || {
          name: entry.product?.name || 'Unknown Product',
          code: entry.product?.code || 'Unknown Code',
          sales: [],
        };

        existingProduct.sales.push({
          date: batch.startDate,
          revenue: entry.totalPrice,
          quantity: entry.quantity,
        });

        salesByProduct.set(entry.productId, existingProduct);
      });
    });

    // Calculate Boston matrix data for each product
    const bostonData: BostonData[] = Array.from(salesByProduct.entries()).map(([_, product]) => {
      const sortedSales = [...product.sales].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const firstSale = sortedSales[0];
      const lastSale = sortedSales[sortedSales.length - 1];
      const marketGrowth = firstSale && lastSale
        ? ((lastSale.revenue - firstSale.revenue) / firstSale.revenue) * 100
        : 0;

      const productRevenue = sortedSales.reduce((sum, sale) => sum + sale.revenue, 0);
      const totalMarketRevenue = report.overall.totalRevenue;
      const marketShare = totalMarketRevenue > 0
        ? (productRevenue / totalMarketRevenue) * 100
        : 0;

      return {
        name: product.name,
        code: product.code,
        marketGrowth,
        marketShare,
        revenue: productRevenue,
      };
    });

    setBostonReport({
      data: bostonData,
      timeRange: report.timeRange,
    });
  };

  const handleDateChange = async (field: 'start' | 'end', value: string) => {
    const newRange = { ...dateRange, [field]: value };
    setDateRange(newRange);
    await onDateRangeChange(newRange.start, newRange.end);
  };

  const exportToExcel = () => {
    // TODO: Implement Excel export
    console.log('Exporting to Excel...');
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-gray-100">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">کد: {data.code}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            رشد بازار: {data.marketGrowth.toFixed(2)}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            سهم بازار: {data.marketShare.toFixed(2)}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            درآمد: {data.revenue.toLocaleString()} ریال
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            نمودار بوستون
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

        {/* Sales Batches Selection */}
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
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {salesBatches.map((batch: SaleBatch) => (
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

        <div className="h-[600px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{
                top: 20,
                right: 20,
                bottom: 50,
                left: 50,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="marketShare"
                name="سهم بازار"
                unit="%"
                domain={[0, 100]}
              >
                <Label
                  value="سهم بازار"
                  position="bottom"
                  offset={20}
                  className="text-gray-600 dark:text-gray-400"
                />
              </XAxis>
              <YAxis
                type="number"
                dataKey="marketGrowth"
                name="رشد بازار"
                unit="%"
                domain={[-100, 100]}
              >
                <Label
                  value="رشد بازار"
                  angle={-90}
                  position="left"
                  offset={20}
                  className="text-gray-600 dark:text-gray-400"
                />
              </YAxis>
              <Tooltip content={<CustomTooltip />} />
              <Scatter
                name="محصولات"
                data={bostonReport.data}
                fill="#3b82f6"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-8">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            جزئیات محصولات در تحلیل بوستون
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                    نام محصول
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                    کد محصول
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                    سهم بازار
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                    رشد بازار
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                    درآمد کل
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                    دسته‌بندی
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {bostonReport.data.map((product) => {
                  let category = '';
                  if (product.marketShare >= 50) {
                    category = product.marketGrowth >= 0 ? 'ستاره' : 'گاو شیرده';
                  } else {
                    category = product.marketGrowth >= 0 ? 'علامت سؤال' : 'سگ';
                  }

                  return (
                    <tr key={product.code} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {product.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {product.marketShare.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {product.marketGrowth.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {product.revenue.toLocaleString()} ریال
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium
                        ${category === 'ستاره' ? 'text-yellow-500 dark:text-yellow-400' : ''}
                        ${category === 'گاو شیرده' ? 'text-green-500 dark:text-green-400' : ''}
                        ${category === 'علامت سؤال' ? 'text-purple-500 dark:text-purple-400' : ''}
                        ${category === 'سگ' ? 'text-red-500 dark:text-red-400' : ''}
                      `}>
                        {category}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8">
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            راهنمای نمودار
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                ستاره‌ها (ربع اول)
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                رشد بازار بالا و سهم بازار بالا - نیازمند سرمایه‌گذاری برای حفظ موقعیت
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                علامت سؤال‌ها (ربع دوم)
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                رشد بازار بالا و سهم بازار پایین - نیازمند تصمیم‌گیری برای سرمایه‌گذاری یا خروج
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                گاوهای شیرده (ربع سوم)
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                رشد بازار پایین و سهم بازار بالا - تولیدکننده نقدینگی برای سایر محصولات
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                سگ‌ها (ربع چهارم)
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                رشد بازار پایین و سهم بازار پایین - نیازمند بررسی برای خروج از سبد محصولات
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}