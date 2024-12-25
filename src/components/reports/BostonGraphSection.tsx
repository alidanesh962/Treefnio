import React, { useEffect, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
  ReferenceLine,
  Cell
} from 'recharts';
import { Database } from '../../database';
import { formatToJalali, parseJalali } from '../../utils/dateUtils';
import { PersianDatePicker } from '../common/PersianDatePicker';

interface Product {
  id: string;
  name: string;
  code: string;
  marketShare: number;
  marketGrowth: number;
  revenue: number;
  category: string;
}

interface SalesData {
  date: string;
  department: string;
  totalAmount: number;
  productId: string;
  quantity: number;
}

interface Dataset {
  id: string;
  name: string;
  importDate: number;
  data: SalesData[];
}

interface DatabaseProduct {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  category: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: Product;
  }>;
}

export default function BostonGraphSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [datasets, setDatasets] = useState<Array<{ id: string; name: string; importDate: number }>>([]);
  const [dateRange, setDateRange] = useState<[string, string]>([
    formatToJalali(new Date()),
    formatToJalali(new Date())
  ]);

  const db = new Database();

  useEffect(() => {
    const loadDatasets = async () => {
      const salesDatasets = db.getSalesDatasets();
      setDatasets(salesDatasets);
      if (salesDatasets.length > 0) {
        setSelectedDataset(salesDatasets[0].id);
      }
    };
    loadDatasets();
  }, []);

  useEffect(() => {
    if (selectedDataset) {
      loadBostonData();
    }
  }, [selectedDataset]);

  const loadBostonData = async () => {
    setIsLoading(true);
    try {
      const allProducts = (await db.getProducts() as unknown) as DatabaseProduct[];
      const salesDatasets = (db.getSalesDatasets() as unknown) as Dataset[];
      const selectedSalesData = salesDatasets.find(d => d.id === selectedDataset)?.data || [];
      
      // Group sales data by product and calculate metrics
      const productSalesMap = new Map<string, { current: number; previous: number; revenue: number }>();
      
      // Split data into current and previous periods (15 days each)
      const midPoint = new Date(selectedSalesData[Math.floor(selectedSalesData.length / 2)].date);
      
      selectedSalesData.forEach((sale: SalesData) => {
        const saleDate = new Date(sale.date);
        const isCurrentPeriod = saleDate >= midPoint;
        
        const productData = productSalesMap.get(sale.productId) || { current: 0, previous: 0, revenue: 0 };
        if (isCurrentPeriod) {
          productData.current += sale.quantity;
          productData.revenue += sale.totalAmount;
        } else {
          productData.previous += sale.quantity;
        }
        productSalesMap.set(sale.productId, productData);
      });

      // Calculate market metrics for each product
      const totalRevenue = Array.from(productSalesMap.values()).reduce((sum, data) => sum + data.revenue, 0);
      
      const productMetrics = allProducts.map((product: DatabaseProduct) => {
        const salesData = productSalesMap.get(product.id) || { current: 0, previous: 0, revenue: 0 };
        
        // Calculate market share based on revenue
        const marketShare = totalRevenue ? (salesData.revenue / totalRevenue) * 100 : 0;
        
        // Calculate growth rate
        const growthRate = salesData.previous ? 
          ((salesData.current - salesData.previous) / salesData.previous) * 100 : 0;

        return {
          id: product.id,
          name: product.name,
          code: product.code,
          marketShare,
          marketGrowth: growthRate,
          revenue: salesData.revenue,
          category: getProductCategory(marketShare, growthRate)
        };
      });

      setProducts(productMetrics);
    } catch (error) {
      console.error('Error loading Boston graph data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProductCategory = (marketShare: number, marketGrowth: number): string => {
    if (marketShare >= 25 && marketGrowth >= 10) return 'ستاره';
    if (marketShare >= 25 && marketGrowth < 10) return 'گاو شیرده';
    if (marketShare < 25 && marketGrowth >= 10) return 'علامت سؤال';
    return 'سگ';
  };

  const getQuadrantColor = (marketShare: number, marketGrowth: number) => {
    if (marketShare >= 25 && marketGrowth >= 10) return '#ff7300'; // Stars
    if (marketShare >= 25 && marketGrowth < 10) return '#82ca9d'; // Cash Cows
    if (marketShare < 25 && marketGrowth >= 10) return '#8884d8'; // Question Marks
    return '#d88884'; // Dogs
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'ستاره':
        return 'text-orange-600 dark:text-orange-400';
      case 'گاو شیرده':
        return 'text-green-600 dark:text-green-400';
      case 'علامت سؤال':
        return 'text-purple-600 dark:text-purple-400';
      case 'سگ':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded shadow-lg border border-gray-200">
          <p className="font-bold">{data.name}</p>
          <p>کد: {data.code}</p>
          <p>سهم بازار: {data.marketShare.toFixed(1)}%</p>
          <p>رشد: {data.marketGrowth.toFixed(1)}%</p>
          <p>درآمد: {data.revenue.toLocaleString()} تومان</p>
          <p>دسته‌بندی: {data.category}</p>
        </div>
      );
    }
    return null;
  };

  const formatDate = (timestamp: number): string => {
    return formatToJalali(timestamp);
  };

  const quadrantColors = {
    star: 'rgba(255, 115, 0, 0.1)', // Stars - Light Orange
    cashCow: 'rgba(130, 202, 157, 0.1)', // Cash Cows - Light Green
    questionMark: 'rgba(136, 132, 216, 0.1)', // Question Marks - Light Purple
    dog: 'rgba(216, 136, 132, 0.1)', // Dogs - Light Red
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            نمودار بوستون
          </h2>
          <select
            className="px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={selectedDataset || ''}
            onChange={(e) => setSelectedDataset(e.target.value)}
          >
            {datasets.map(dataset => (
              <option key={dataset.id} value={dataset.id}>
                {dataset.name} - {formatDate(dataset.importDate)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <PersianDatePicker
              value={dateRange[0]}
              onChange={(value) => setDateRange([value, dateRange[1]])}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="از تاریخ"
            />
          </div>
          <span className="text-gray-500 dark:text-gray-400">تا</span>
          <div className="flex-1">
            <PersianDatePicker
              value={dateRange[1]}
              onChange={(value) => setDateRange([dateRange[0], value])}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="تا تاریخ"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{
                  top: 20,
                  right: 20,
                  bottom: 20,
                  left: 20,
                }}
              >
                <CartesianGrid />
                <XAxis
                  type="number"
                  dataKey="marketShare"
                  name="سهم بازار"
                  unit="%"
                  domain={[0, 100]}
                >
                  <Label value="سهم بازار (%)" offset={0} position="bottom" />
                </XAxis>
                <YAxis
                  type="number"
                  dataKey="marketGrowth"
                  name="رشد"
                  unit="%"
                  domain={[-20, 100]}
                >
                  <Label value="رشد (%)" angle={-90} position="left" />
                </YAxis>
                <Tooltip content={<CustomTooltip />} />
                
                {/* Colored Quadrant Backgrounds */}
                <rect x="0" y="-20" width="25" height="30" fill={quadrantColors.dog} />
                <rect x="25" y="-20" width="75" height="30" fill={quadrantColors.cashCow} />
                <rect x="0" y="10" width="25" height="90" fill={quadrantColors.questionMark} />
                <rect x="25" y="10" width="75" height="90" fill={quadrantColors.star} />
                
                <ReferenceLine x={25} stroke="#666" strokeDasharray="3 3" />
                <ReferenceLine y={10} stroke="#666" strokeDasharray="3 3" />
                
                {/* Quadrant Labels with enhanced styling */}
                <text x="75%" y="75%" textAnchor="middle" fill="#82ca9d" fontWeight="bold">گاو شیرده</text>
                <text x="75%" y="25%" textAnchor="middle" fill="#ff7300" fontWeight="bold">ستاره</text>
                <text x="25%" y="75%" textAnchor="middle" fill="#d88884" fontWeight="bold">سگ</text>
                <text x="25%" y="25%" textAnchor="middle" fill="#8884d8" fontWeight="bold">علامت سؤال</text>

                <Scatter
                  data={products}
                  fill="#8884d8"
                >
                  {products.map((product, index) => (
                    <Cell
                      key={index}
                      fill={getQuadrantColor(product.marketShare, product.marketGrowth)}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Product Details Table */}
          <div className="overflow-x-auto mt-8">
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
                    درآمد
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    دسته‌بندی
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {product.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {product.marketShare.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {product.marketGrowth.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {product.revenue.toLocaleString()} تومان
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getCategoryColor(product.category)}`}>
                      {product.category}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}