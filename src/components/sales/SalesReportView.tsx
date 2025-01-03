import React, { useState } from 'react';
import { SaleEntry, SaleBatch } from '../../types/sales';
import { BarChart, FileText, Download, Filter, X, DollarSign, Package, TrendingUp, PieChart, Check } from 'lucide-react';
import { ShamsiDatePicker } from '../common';
<<<<<<< HEAD
=======
import { motion, AnimatePresence } from 'framer-motion';
import {
  fadeIn,
  slideUp,
  slideDown,
  scale,
  stagger,
  listItem,
  cardHover,
  buttonTap,
  chartAnimation,
  slideRight
} from '../../utils/animations';
>>>>>>> 51896f95d56e0aada20772cb05d7612324bb812f
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

export interface SalesReportProps {
  report: {
    byDepartment: Record<string, {
      totalUnits: number;
      totalRevenue: number;
      totalCost: number;
      netRevenue: number;
      products: Array<{
        id: string;
        name: string;
        code: string;
        units: number;
        revenue: number;
        materialCost: number;
        netRevenue: number;
      }>;
    }>;
    byProductionSegment: Record<string, {
      totalUnits: number;
      totalRevenue: number;
      totalCost: number;
      netRevenue: number;
      products: Array<{
        id: string;
        name: string;
        code: string;
        units: number;
        revenue: number;
        materialCost: number;
        netRevenue: number;
      }>;
    }>;
    overall: {
      totalUnits: number;
      totalRevenue: number;
      totalCost: number;
      netRevenue: number;
    };
    timeRange: {
      start: string;
      end: string;
    };
  };
  salesBatches: SaleBatch[];
  onDateRangeChange: (startDate: string, endDate: string) => Promise<void>;
  onBatchSelect: (selectedBatches: string[]) => void;
}

const COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value.toLocaleString()} ${entry.name.includes('ریال') ? 'ریال' : ''}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function SalesReportView({ report, salesBatches, onDateRangeChange, onBatchSelect }: SalesReportProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    start: report.timeRange.start,
    end: report.timeRange.end,
  });

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    const newRange = { ...dateRange, [type]: value };
    setDateRange(newRange);
    onDateRangeChange(newRange.start, newRange.end);
  };

  const handleBatchSelect = (batchId: string) => {
    const newSelection = selectedBatches.includes(batchId)
      ? selectedBatches.filter(id => id !== batchId)
      : [...selectedBatches, batchId];
    setSelectedBatches(newSelection);
    onBatchSelect(newSelection);
  };

  const departmentChartData = Object.entries(report.byDepartment).map(([name, data]) => ({
    name,
    'تعداد فروش': data.totalUnits,
    'درآمد': data.totalRevenue,
    'هزینه مواد': data.totalCost,
    'سود خالص': data.netRevenue
  }));

  const segmentChartData = Object.entries(report.byProductionSegment).map(([name, data]) => ({
    name,
    'تعداد فروش': data.totalUnits,
    'درآمد': data.totalRevenue,
    'هزینه مواد': data.totalCost,
    'سود خالص': data.netRevenue
  }));

  return (
<<<<<<< HEAD
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <BarChart className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            گزارش فروش
          </h3>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {showFilters ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
              {showFilters ? 'بستن فیلترها' : 'فیلترها'}
            </button>
            <button
              onClick={() => {/* Implement export */}}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="h-4 w-4" />
              خروجی Excel
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
=======
    <motion.div 
      className="space-y-6"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeIn}
    >
      <motion.div 
        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        variants={scale}
      >
        <div className="flex items-center justify-between mb-6">
          <motion.h3 
            className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2"
            variants={slideRight}
          >
            <BarChart className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            گزارش فروش
          </motion.h3>
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              whileTap="whileTap"
              variants={buttonTap}
            >
              {showFilters ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
              {showFilters ? 'بستن فیلترها' : 'فیلترها'}
            </motion.button>
            <motion.button
              onClick={() => {/* Implement export */}}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              whileTap="whileTap"
              variants={buttonTap}
            >
              <Download className="h-4 w-4" />
              خروجی Excel
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
        {showFilters && (
            <motion.div 
              className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={slideDown}
            >
>>>>>>> 51896f95d56e0aada20772cb05d7612324bb812f
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
<<<<<<< HEAD
          </div>
        )}

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
              <Package className="h-4 w-4" />
              هزینه مواد اولیه
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
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
=======
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          variants={stagger}
        >
          {[
            {
              icon: <Package className="h-4 w-4" />,
              label: "تعداد کل فروش",
              value: report.overall.totalUnits.toLocaleString()
            },
            {
              icon: <DollarSign className="h-4 w-4" />,
              label: "درآمد کل",
              value: `${report.overall.totalRevenue.toLocaleString()} ریال`
            },
            {
              icon: <Package className="h-4 w-4" />,
              label: "هزینه مواد اولیه",
              value: `${report.overall.totalCost.toLocaleString()} ریال`
            },
            {
              icon: <TrendingUp className="h-4 w-4" />,
              label: "سود خالص",
              value: `${report.overall.netRevenue.toLocaleString()} ریال`
            }
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
              variants={listItem}
              {...cardHover}
            >
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                {stat.icon}
                {stat.label}
            </div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {stat.value}
            </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="space-y-8"
          variants={stagger}
        >
          <motion.div 
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6"
            variants={chartAnimation}
          >
>>>>>>> 51896f95d56e0aada20772cb05d7612324bb812f
            <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              نمودار فروش بر اساس بخش فروش
            </h4>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={departmentChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#E5E7EB" 
                    opacity={0.3} 
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    axisLine={{ stroke: '#374151', opacity: 0.3 }}
                  />
                  <YAxis
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    axisLine={{ stroke: '#374151', opacity: 0.3 }}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Legend
                    wrapperStyle={{
                      paddingTop: '20px',
                    }}
                  />
                  <Bar
                    dataKey="تعداد فروش"
                    fill={COLORS[0]}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                  <Bar
                    dataKey="درآمد"
                    fill={COLORS[1]}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                  <Bar
                    dataKey="هزینه مواد"
                    fill={COLORS[2]}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                  <Bar
                    dataKey="سود خالص"
                    fill={COLORS[3]}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
<<<<<<< HEAD
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div>
            <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              جزئیات فروش بر اساس بخش فروش
            </h4>
            <div className="space-y-4">
              {Object.entries(report.byDepartment).map(([dept, stats]) => (
                <div key={dept} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{dept}</span>
=======
          </motion.div>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8"
          variants={stagger}
        >
          {[
            {
              title: "جزئیات فروش بر اساس بخش فروش",
              icon: <DollarSign className="h-4 w-4" />,
              data: Object.entries(report.byDepartment)
            },
            {
              title: "جزئیات فروش بر اساس بخش تولید",
              icon: <Package className="h-4 w-4" />,
              data: Object.entries(report.byProductionSegment)
            }
          ].map((section, index) => (
            <motion.div key={index} variants={listItem}>
            <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                {section.icon}
                {section.title}
            </h4>
              <motion.div className="space-y-4" variants={stagger}>
                {section.data.map(([key, stats]) => (
                  <motion.div
                    key={key}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                    variants={listItem}
                    {...cardHover}
                  >
                  <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{key}</span>
>>>>>>> 51896f95d56e0aada20772cb05d7612324bb812f
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {stats.totalRevenue.toLocaleString()} ریال
                    </span>
                  </div>
<<<<<<< HEAD
                  <div className="space-y-4">
                    {stats.products.map(product => (
                      <div key={product.id} className="border-t border-gray-200 dark:border-gray-600 pt-4">
=======
                    <motion.div className="space-y-4" variants={stagger}>
                    {stats.products.map(product => (
                        <motion.div
                          key={product.id}
                          className="border-t border-gray-200 dark:border-gray-600 pt-4"
                          variants={listItem}
                        >
>>>>>>> 51896f95d56e0aada20772cb05d7612324bb812f
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {product.name} ({product.code})
                          </span>
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {product.revenue.toLocaleString()} ریال
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">تعداد: </span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {product.units.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">هزینه مواد: </span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {product.materialCost.toLocaleString()} ریال
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">سود: </span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {product.netRevenue.toLocaleString()} ریال
                            </span>
                          </div>
                        </div>
<<<<<<< HEAD
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Package className="h-4 w-4" />
              جزئیات فروش بر اساس بخش تولید
            </h4>
            <div className="space-y-4">
              {Object.entries(report.byProductionSegment).map(([segment, stats]) => (
                <div key={segment} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{segment}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {stats.totalRevenue.toLocaleString()} ریال
                    </span>
                  </div>
                  <div className="space-y-4">
                    {stats.products.map(product => (
                      <div key={product.id} className="border-t border-gray-200 dark:border-gray-600 pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {product.name} ({product.code})
                          </span>
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {product.revenue.toLocaleString()} ریال
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">تعداد: </span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {product.units.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">هزینه مواد: </span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {product.materialCost.toLocaleString()} ریال
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">سود: </span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {product.netRevenue.toLocaleString()} ریال
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
=======
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
>>>>>>> 51896f95d56e0aada20772cb05d7612324bb812f
  );
} 