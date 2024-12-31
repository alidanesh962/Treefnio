import React, { useState, useEffect } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { db } from '../../database';
import type { ProductDefinition, SalesDataset } from '../../types';
import { calculateRawMaterialPrice } from '../../utils/pricing';

interface Product {
  id: string;
  code: string;
  name: string;
  department: string;
  price: number;
  sales: number;
}

type SortField = 'code' | 'name' | 'price' | 'sales' | 'department';
type SortOrder = 'asc' | 'desc';

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      
      // Get products from both databases
      const productsData = db.getProductDefinitions();
      const inventoryProducts = db.getProducts();
      
      // Get sales datasets and find the reference dataset
      const datasets: SalesDataset[] = db.getSalesDatasets();
      const referenceDatasetId = db.getReferenceDataset();
      const referenceDataset = datasets.find((d: SalesDataset) => d.id === referenceDatasetId);
      
      // Calculate sales data
      const salesByProduct: { [key: string]: number } = {};
      if (referenceDataset) {
        referenceDataset.data.forEach((sale: { productId: string; quantity: number }) => {
          salesByProduct[sale.productId] = (salesByProduct[sale.productId] || 0) + sale.quantity;
        });
      }
      
      // Get active products from product definitions
      const activeProducts = productsData
        .filter(product => db.isProductActive(product.id))
        .map(product => ({
          id: product.id,
          code: product.code,
          name: product.name,
          department: db.getDepartment(product.saleDepartment)?.name || 'بدون واحد',
          price: calculateRawMaterialPrice(product),
          sales: salesByProduct[product.id] || 0
        }));
      
      // Add active products from inventory that don't exist in definitions
      const additionalProducts = inventoryProducts
        .filter(invProduct => !activeProducts.some(p => p.code === invProduct.code))
        .map(invProduct => ({
          id: invProduct.id,
          code: invProduct.code,
          name: invProduct.name,
          department: db.getDepartment(invProduct.department)?.name || 'بدون واحد',
          price: calculateRawMaterialPrice({
            ...invProduct,
            saleDepartment: invProduct.department,
            productionSegment: invProduct.department,
            createdAt: Date.now(),
            updatedAt: Date.now()
          } as ProductDefinition),
          sales: salesByProduct[invProduct.id] || 0
        }));

      const allProducts = [...activeProducts, ...additionalProducts];
      console.log('Combined products:', allProducts);
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    
    switch (sortField) {
      case 'code':
        return multiplier * a.code.localeCompare(b.code);
      case 'name':
        return multiplier * a.name.localeCompare(b.name);
      case 'price':
        return multiplier * (a.price - b.price);
      case 'sales':
        return multiplier * (a.sales - b.sales);
      case 'department':
        return multiplier * a.department.localeCompare(b.department);
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden animate-scale-in">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-right cursor-pointer group hover-scale"
                onClick={() => handleSort('code')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    کد محصول
                  </span>
                  <ArrowUpDown className={`h-4 w-4 ${sortField === 'code' ? 'text-blue-500' : 'text-gray-400'}`} />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-right cursor-pointer group hover-scale"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    نام محصول
                  </span>
                  <ArrowUpDown className={`h-4 w-4 ${sortField === 'name' ? 'text-blue-500' : 'text-gray-400'}`} />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-right cursor-pointer group hover-scale"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    قیمت
                  </span>
                  <ArrowUpDown className={`h-4 w-4 ${sortField === 'price' ? 'text-blue-500' : 'text-gray-400'}`} />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-right cursor-pointer group hover-scale"
                onClick={() => handleSort('sales')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    تعداد فروش
                  </span>
                  <ArrowUpDown className={`h-4 w-4 ${sortField === 'sales' ? 'text-blue-500' : 'text-gray-400'}`} />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-right cursor-pointer group hover-scale"
                onClick={() => handleSort('department')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    واحد فروش
                  </span>
                  <ArrowUpDown className={`h-4 w-4 ${sortField === 'department' ? 'text-blue-500' : 'text-gray-400'}`} />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 stagger-children">
            {sortedProducts.map((product) => (
              <tr 
                key={product.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors hover-scale"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {product.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {product.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {product.price.toLocaleString()} ریال
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {product.sales.toLocaleString()} عدد
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {product.department}
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td 
                  colSpan={5}
                  className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400 animate-fade-in"
                >
                  محصولی یافت نشد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 