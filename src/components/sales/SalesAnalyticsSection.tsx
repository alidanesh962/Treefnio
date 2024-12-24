import React, { useState } from 'react';
import { BarChart2, PieChart, TrendingUp, Calendar, Download } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';

// Sample data - replace with actual data from your backend
const salesData = [
  { date: '1402/08/01', sales: 1200000, materials: 450000 },
  { date: '1402/08/02', sales: 1500000, materials: 600000 },
  { date: '1402/08/03', sales: 900000, materials: 350000 },
  { date: '1402/08/04', sales: 1800000, materials: 700000 },
  { date: '1402/08/05', sales: 2000000, materials: 800000 },
];

const productSalesData = [
  { name: 'کافه لاته', value: 350 },
  { name: 'اسپرسو', value: 300 },
  { name: 'کاپوچینو', value: 250 },
  { name: 'قهوه ترک', value: 200 },
  { name: 'موکا', value: 150 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function SalesAnalyticsSection() {
  const [dateRange, setDateRange] = useState<[string, string]>(['', '']);

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">
              بازه زمانی
            </h3>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg">
            <Download className="h-4 w-4" />
            دانلود گزارش
          </button>
        </div>
        <div className="flex gap-4">
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">فروش کل</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-2">
                7,400,000 ریال
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BarChart2 className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">مصرف مواد اولیه</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-2">
                2,900,000 ریال
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <PieChart className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">سود خالص</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-2">
                4,500,000 ریال
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales vs Materials Usage Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-6">
            روند فروش و مصرف مواد اولیه
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" name="فروش" stroke="#0088FE" />
                <Line type="monotone" dataKey="materials" name="مصرف مواد" stroke="#00C49F" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Sales Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-6">
            توزیع فروش محصولات
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={productSalesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {productSalesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
} 