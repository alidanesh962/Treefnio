import React, { useState, useEffect } from 'react';
import { Package, Download } from 'lucide-react';
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ReportingService } from '../../services/reportingService';
import { db } from '../../database';
import { PersianDatePicker } from '../common/PersianDatePicker';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function MaterialsReportSection() {
  const [dateRange, setDateRange] = useState<[string, string]>(['', '']);
  const [materialsData, setMaterialsData] = useState<any[]>([]);
  const [materialDistribution, setMaterialDistribution] = useState<any[]>([]);
  const [totalUsage, setTotalUsage] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [datasets, setDatasets] = useState<{ id: string; name: string }[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('reference');

  useEffect(() => {
    // Load available datasets
    const loadDatasets = () => {
      const allDatasets = db.getSalesDatasets();
      setDatasets([
        { id: 'reference', name: 'داده‌های مرجع' },
        ...allDatasets.map(ds => ({ id: ds.id, name: ds.name }))
      ]);
    };
    loadDatasets();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!dateRange[0] || !dateRange[1]) return;

      setIsLoading(true);
      try {
        const reportingService = ReportingService.getInstance();
        const data = await reportingService.getMaterialUsageData(dateRange[0], dateRange[1], selectedDataset);

        setMaterialsData(data.materialsData);
        setMaterialDistribution(data.materialDistribution);
        setTotalUsage(data.totalUsage);
        setTotalCost(data.totalCost);
      } catch (error) {
        console.error('Error loading materials data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [dateRange, selectedDataset]);

  const handleDownload = () => {
    // TODO: Implement report download
    console.log('Downloading report...');
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-gray-600 dark:text-gray-400">مصرف کل</span>
            </div>
            <span className="text-xl font-bold text-gray-800 dark:text-white">
              {totalUsage.toLocaleString()} واحد
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-gray-600 dark:text-gray-400">هزینه کل</span>
            </div>
            <span className="text-xl font-bold text-gray-800 dark:text-white">
              {totalCost.toLocaleString()} ریال
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            فیلترها
          </h3>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            <Download className="h-4 w-4" />
            دانلود گزارش
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm text-gray-600 dark:text-gray-400">بازه زمانی</label>
            <div className="flex gap-2">
              <PersianDatePicker
                value={dateRange[0]}
                onChange={(date) => setDateRange([date, dateRange[1]])}
                className="flex-1"
                placeholder="از تاریخ"
              />
              <span className="text-gray-500 dark:text-gray-400 self-center">تا</span>
              <PersianDatePicker
                value={dateRange[1]}
                onChange={(date) => setDateRange([dateRange[0], date])}
                className="flex-1"
                placeholder="تا تاریخ"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-gray-600 dark:text-gray-400">مجموعه داده</label>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {datasets.map(dataset => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
        </div>
      ) : materialsData.length > 0 ? (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Material Usage Trend */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-6">
                روند مصرف مواد
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={materialsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="usage" name="میزان مصرف" stroke="#0088FE" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Material Usage Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-6">
                توزیع مصرف مواد
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={materialDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} (${value.toFixed(0)})`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {materialDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Materials Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      تاریخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ماده اولیه
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      میزان مصرف
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      هزینه (ریال)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {materialsData.map((material, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {material.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {material.material}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {material.usage.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {material.cost.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            {dateRange[0] && dateRange[1] 
              ? 'داده‌ای برای نمایش وجود ندارد'
              : 'لطفا بازه زمانی را انتخاب کنید'
            }
          </p>
        </div>
      )}
    </div>
  );
} 