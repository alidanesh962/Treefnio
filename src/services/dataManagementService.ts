import { db } from '../database';
import type { Product } from '../types/product';
import type { Material } from '../types/material';
import type { ProductRecipe } from '../types';
import * as XLSX from 'xlsx';

interface MaterialUnit {
  id: string;
  name: string;
  symbol: string;
}

export class DataManagementService {
  private static instance: DataManagementService;

  private constructor() {}

  public static getInstance(): DataManagementService {
    if (!DataManagementService.instance) {
      DataManagementService.instance = new DataManagementService();
    }
    return DataManagementService.instance;
  }

  public async resetAllData(): Promise<void> {
    try {
      await db.clearProducts();
      await db.clearMaterials();
      await db.clearRecipes();
      await db.clearUnits();
      await db.clearSales();
      console.log('All data has been reset successfully');
    } catch (error) {
      console.error('Error resetting data:', error);
      throw error;
    }
  }

  public async generateSampleData(): Promise<void> {
    try {
      // Generate and insert sample units
      const units: MaterialUnit[] = [
        { id: 'kg', name: 'کیلوگرم', symbol: 'kg' },
        { id: 'g', name: 'گرم', symbol: 'g' },
        { id: 'l', name: 'لیتر', symbol: 'l' },
        { id: 'ml', name: 'میلی‌لیتر', symbol: 'ml' }
      ];
      await db.insertUnits(units);

      const currentDate = new Date().toISOString();

      // Generate and insert sample materials
      const materials: Material[] = [
        { 
          id: 'flour', 
          name: 'آرد',
          code: 'FL001',
          unit: 'kg',
          unitPrice: 150000,
          currentStock: 100,
          minimumStock: 20,
          category: 'baking',
          isActive: true,
          createdAt: currentDate,
          updatedAt: currentDate
        },
        { 
          id: 'sugar', 
          name: 'شکر',
          code: 'SG001',
          unit: 'kg',
          unitPrice: 200000,
          currentStock: 50,
          minimumStock: 10,
          category: 'baking',
          isActive: true,
          createdAt: currentDate,
          updatedAt: currentDate
        },
        { 
          id: 'milk', 
          name: 'شیر',
          code: 'ML001',
          unit: 'l',
          unitPrice: 180000,
          currentStock: 200,
          minimumStock: 50,
          category: 'dairy',
          isActive: true,
          createdAt: currentDate,
          updatedAt: currentDate
        },
        { 
          id: 'chocolate', 
          name: 'شکلات',
          code: 'CH001',
          unit: 'kg',
          unitPrice: 800000,
          currentStock: 30,
          minimumStock: 5,
          category: 'baking',
          isActive: true,
          createdAt: currentDate,
          updatedAt: currentDate
        }
      ];
      await db.insertMaterials(materials);

      // Generate and insert sample products
      const products: Product[] = [
        {
          id: 'chocolate-cake',
          name: 'کیک شکلاتی',
          code: 'CC001',
          description: 'کیک شکلاتی خامه‌ای',
          price: 450000,
          category: 'dessert',
          isActive: true,
          createdAt: currentDate,
          updatedAt: currentDate
        },
        {
          id: 'vanilla-cake',
          name: 'کیک وانیلی',
          code: 'VC001',
          description: 'کیک وانیلی ساده',
          price: 350000,
          category: 'dessert',
          isActive: true,
          createdAt: currentDate,
          updatedAt: currentDate
        },
        {
          id: 'special-cake',
          name: 'کیک مخصوص',
          code: 'SC001',
          description: 'کیک مخصوص با تزیین ویژه',
          price: 650000,
          category: 'dessert',
          isActive: true,
          createdAt: currentDate,
          updatedAt: currentDate
        },
        {
          id: 'fruit-cake',
          name: 'کیک میوه‌ای',
          code: 'FC001',
          description: 'کیک با تزیین میوه‌های تازه',
          price: 550000,
          category: 'dessert',
          isActive: true,
          createdAt: currentDate,
          updatedAt: currentDate
        }
      ];
      await db.insertProducts(products);

      // Generate and insert sample recipes
      const recipes: ProductRecipe[] = [
        {
          id: 'chocolate-cake-recipe',
          productId: 'chocolate-cake',
          name: 'دستور پخت کیک شکلاتی',
          materials: [
            { materialId: 'flour', unit: 'kg', amount: 0.5, unitPrice: 150000, totalPrice: 75000 },
            { materialId: 'sugar', unit: 'kg', amount: 0.3, unitPrice: 200000, totalPrice: 60000 },
            { materialId: 'milk', unit: 'l', amount: 0.4, unitPrice: 180000, totalPrice: 72000 },
            { materialId: 'chocolate', unit: 'kg', amount: 0.2, unitPrice: 800000, totalPrice: 160000 }
          ],
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: 'vanilla-cake-recipe',
          productId: 'vanilla-cake',
          name: 'دستور پخت کیک وانیلی',
          materials: [
            { materialId: 'flour', unit: 'kg', amount: 0.5, unitPrice: 150000, totalPrice: 75000 },
            { materialId: 'sugar', unit: 'kg', amount: 0.25, unitPrice: 200000, totalPrice: 50000 },
            { materialId: 'milk', unit: 'l', amount: 0.35, unitPrice: 180000, totalPrice: 63000 }
          ],
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: 'special-cake-recipe',
          productId: 'special-cake',
          name: 'دستور پخت کیک مخصوص',
          materials: [
            { materialId: 'flour', unit: 'kg', amount: 0.5, unitPrice: 150000, totalPrice: 75000 },
            { materialId: 'sugar', unit: 'kg', amount: 0.4, unitPrice: 200000, totalPrice: 80000 },
            { materialId: 'milk', unit: 'l', amount: 0.5, unitPrice: 180000, totalPrice: 90000 },
            { materialId: 'chocolate', unit: 'kg', amount: 0.3, unitPrice: 800000, totalPrice: 240000 }
          ],
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: 'fruit-cake-recipe',
          productId: 'fruit-cake',
          name: 'دستور پخت کیک میوه‌ای',
          materials: [
            { materialId: 'flour', unit: 'kg', amount: 0.5, unitPrice: 150000, totalPrice: 75000 },
            { materialId: 'sugar', unit: 'kg', amount: 0.2, unitPrice: 200000, totalPrice: 40000 },
            { materialId: 'milk', unit: 'l', amount: 0.3, unitPrice: 180000, totalPrice: 54000 }
          ],
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ];
      await db.insertRecipes(recipes);

      // Generate sample sales data
      const salesData = [];
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1); // Start from last month

      // Generate daily sales for the past month
      for (let i = 0; i < 30; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        // Chocolate cake - Star (high market share, high growth)
        salesData.push({
          date: currentDate.toISOString(),
          department: 'cafe',
          totalAmount: 450000 + Math.floor(Math.random() * 50000),
          productId: 'chocolate-cake',
          quantity: 3 + Math.floor(Math.random() * 3)
        });

        // Vanilla cake - Cash Cow (high market share, low growth)
        salesData.push({
          date: currentDate.toISOString(),
          department: 'restaurant',
          totalAmount: 350000 + Math.floor(Math.random() * 30000),
          productId: 'vanilla-cake',
          quantity: 2 + Math.floor(Math.random() * 2)
        });

        // Special cake - Question Mark (low market share, high growth)
        if (i >= 15) { // Only in the second half to show growth
          salesData.push({
            date: currentDate.toISOString(),
            department: 'cafe',
            totalAmount: 650000 + Math.floor(Math.random() * 50000),
            productId: 'special-cake',
            quantity: 1 + Math.floor(Math.random() * 2)
          });
        }

        // Fruit cake - Dog (low market share, low growth)
        if (Math.random() > 0.5) { // Sporadic sales
          salesData.push({
            date: currentDate.toISOString(),
            department: 'restaurant',
            totalAmount: 550000 + Math.floor(Math.random() * 20000),
            productId: 'fruit-cake',
            quantity: 1
          });
        }
      }

      await db.insertSales(salesData, 'Sample Historical Data');

      console.log('Sample data has been generated successfully');
    } catch (error) {
      console.error('Error generating sample data:', error);
      throw error;
    }
  }

  public generateSampleFiles(): { products: string; materials: string; sales: string } {
    try {
      // Generate sample product import file
      const productData = [
        ['کد', 'نام', 'توضیحات', 'قیمت', 'دسته‌بندی'],
        ['CC001', 'کیک شکلاتی', 'کیک شکلاتی خامه‌ای', '450000', 'dessert'],
        ['VC001', 'کیک وانیلی', 'کیک وانیلی ساده', '350000', 'dessert'],
        ['SC001', 'کیک مخصوص', 'کیک مخصوص با تزیین ویژه', '650000', 'dessert'],
        ['FC001', 'کیک میوه‌ای', 'کیک با تزیین میوه‌های تازه', '550000', 'dessert']
      ];
      const productWB = XLSX.utils.book_new();
      const productWS = XLSX.utils.aoa_to_sheet(productData);
      XLSX.utils.book_append_sheet(productWB, productWS, 'Products');
      const productFile = XLSX.write(productWB, { type: 'base64', bookType: 'xlsx' });

      // Generate sample material import file
      const materialData = [
        ['کد', 'نام', 'واحد', 'قیمت واحد', 'موجودی', 'حداقل موجودی', 'دسته‌بندی'],
        ['FL001', 'آرد', 'kg', '150000', '100', '20', 'baking'],
        ['SG001', 'شکر', 'kg', '200000', '50', '10', 'baking'],
        ['ML001', 'شیر', 'l', '180000', '200', '50', 'dairy'],
        ['CH001', 'شکلات', 'kg', '800000', '30', '5', 'baking']
      ];
      const materialWB = XLSX.utils.book_new();
      const materialWS = XLSX.utils.aoa_to_sheet(materialData);
      XLSX.utils.book_append_sheet(materialWB, materialWS, 'Materials');
      const materialFile = XLSX.write(materialWB, { type: 'base64', bookType: 'xlsx' });

      // Generate sample sales import file
      const salesData = [
        ['تاریخ', 'بخش', 'کد محصول', 'تعداد', 'مبلغ کل'],
        [new Date().toLocaleDateString('fa-IR'), 'cafe', 'CC001', '1', '450000'],
        [new Date().toLocaleDateString('fa-IR'), 'restaurant', 'VC001', '2', '700000'],
        [new Date().toLocaleDateString('fa-IR'), 'cafe', 'SC001', '3', '650000'],
        [new Date().toLocaleDateString('fa-IR'), 'restaurant', 'FC001', '4', '550000']
      ];
      const salesWB = XLSX.utils.book_new();
      const salesWS = XLSX.utils.aoa_to_sheet(salesData);
      XLSX.utils.book_append_sheet(salesWB, salesWS, 'Sales');
      const salesFile = XLSX.write(salesWB, { type: 'base64', bookType: 'xlsx' });

      return {
        products: productFile,
        materials: materialFile,
        sales: salesFile
      };
    } catch (error) {
      console.error('Error generating sample files:', error);
      throw error;
    }
  }
} 