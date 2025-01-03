import React, { useState, useEffect } from 'react';
import { Filter, Download, Package, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { ShamsiDatePicker } from '../common';
import { ShamsiDate } from '../../utils/shamsiDate';
import { db } from '../../database';
import { InventoryTransaction, Item } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface MaterialReport {
  byCategory: {
    [category: string]: {
      totalQuantity: number;
      totalCost: number;
      materials: Array<{
        id: string;
        name: string;
        code: string;
        quantity: number;
        cost: number;
      }>;
    };
  };
  overall: {
    totalQuantity: number;
    totalCost: number;
  };
  timeRange: {
    start: string;
    end: string;
  };
}

export default function MaterialsReportSection() {
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: ShamsiDate.getCurrentShamsiDate(),
    end: ShamsiDate.getCurrentShamsiDate(),
  });
  const [report, setReport] = useState<MaterialReport>({
    byCategory: {},
    overall: {
      totalQuantity: 0,
      totalCost: 0,
    },
    timeRange: {
      start: ShamsiDate.getCurrentShamsiDate(),
      end: ShamsiDate.getCurrentShamsiDate(),
    },
  });

  useEffect(() => {
    loadInitialReport();
  }, []);

  const loadInitialReport = async () => {
    const currentDate = ShamsiDate.getCurrentShamsiDate();
    const startDate = ShamsiDate.subtractDays(currentDate, 30);
    await loadReport(startDate, currentDate);
  };

  const loadReport = async (startDate: string, endDate: string) => {
    // Get all materials and transactions
    const materials = await db.getMaterials();
    const transactions = await db.getMaterialTransactions(startDate, endDate) as InventoryTransaction[];

    const report: MaterialReport = {
      byCategory: {},
      overall: {
        totalQuantity: 0,
        totalCost: 0,
      },
      timeRange: {
        start: startDate,
        end: endDate,
      },
    };

    // Group transactions by material category
    transactions.forEach((transaction) => {
      const material = materials.find((m) => m.id === transaction.materialId);
      if (!material) return;

      const category = material.department || 'بدون دسته‌بندی';
      if (!report.byCategory[category]) {
        report.byCategory[category] = {
          totalQuantity: 0,
          totalCost: 0,
          materials: [],
        };
      }

      const materialInCategory = report.byCategory[category].materials.find(
        (m) => m.id === material.id
      );

      if (materialInCategory) {
        materialInCategory.quantity += transaction.quantity;
        materialInCategory.cost += transaction.totalPrice;
      } else {
        report.byCategory[category].materials.push({
          id: material.id,
          name: material.name,
          code: material.code,
          quantity: transaction.quantity,
          cost: transaction.totalPrice,
        });
      }

      report.byCategory[category].totalQuantity += transaction.quantity;
      report.byCategory[category].totalCost += transaction.totalPrice;
      report.overall.totalQuantity += transaction.quantity;
      report.overall.totalCost += transaction.totalPrice;
    });

    setReport(report);
  };

  const handleDateChange = async (field: 'start' | 'end', value: string) => {
    const newRange = { ...dateRange, [field]: value };
    setDateRange(newRange);
    await loadReport(newRange.start, newRange.end);
  };

  const exportToExcel = () => {
    // TODO: Implement Excel export
    console.log('Exporting to Excel...');
  };

  const categoryData = Object.entries(report.byCategory).map(([name, data]) => ({
    name,
    مصرف: data.totalQuantity,
    هزینه: data.totalCost,
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            گزارش مواد اولیه
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              <Package className="h-4 w-4" />
              مصرف کل
            </div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {report.overall.totalQuantity.toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              <DollarSign className="h-4 w-4" />
              هزینه کل
            </div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {report.overall.totalCost.toLocaleString()} ریال
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              مصرف بر اساس دسته‌بندی
            </h4>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="مصرف" fill="#3b82f6" />
                  <Bar dataKey="هزینه" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              جزئیات مصرف مواد اولیه
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                      دسته‌بندی
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                      نام ماده
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                      کد ماده
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                      مقدار مصرف
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                      هزینه
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.entries(report.byCategory).flatMap(([category, data]) =>
                    data.materials.map((material) => (
                      <tr key={`${category}-${material.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {material.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {material.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {material.quantity.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {material.cost.toLocaleString()} ریال
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