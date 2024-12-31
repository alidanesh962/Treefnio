import { Material, Product, ProductRecipe } from '../types';
import * as XLSX from 'xlsx';
import { getCurrentJalaliTimestamp } from '../database/dateUtils';
import { firebaseService, COLLECTIONS } from './firebaseService';

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
      // Get all documents from each collection and delete them
      const collections = [
        COLLECTIONS.MATERIALS,
        COLLECTIONS.RECIPES,
        COLLECTIONS.PRODUCTS,
        COLLECTIONS.DEPARTMENTS,
        COLLECTIONS.INVENTORY_ENTRIES,
        COLLECTIONS.INVENTORY_TRANSACTIONS,
        COLLECTIONS.STORAGE_LOCATIONS,
        COLLECTIONS.MATERIAL_STOCKS,
        COLLECTIONS.USER_ACTIVITIES
      ];

      for (const collectionName of collections) {
        const docs = await firebaseService.getCollection(collectionName);
        for (const doc of docs) {
          await firebaseService.deleteDocument(collectionName, doc.id);
        }
      }
      
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
      
      for (const unit of units) {
        const activityData = {
          id: `unit-${unit.id}`,
          username: 'system',
          fullName: 'System Import',
          type: 'create',
          timestamp: Date.now(),
          module: 'units',
          details: JSON.stringify(unit)
        };

        await firebaseService.setDocument(COLLECTIONS.USER_ACTIVITIES, activityData.id, activityData);
      }

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

      for (const material of materials) {
        await firebaseService.setDocument(COLLECTIONS.MATERIALS, material.id, material);
      }

      // Generate and insert sample products
      const products: Product[] = [
        {
          id: 'chocolate-cake',
          name: 'کیک شکلاتی',
          code: 'CC001',
          description: 'کیک شکلاتی خامه‌ای',
          price: 450000,
          category: 'dessert',
          type: 'product',
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: 'vanilla-cake',
          name: 'کیک وانیلی',
          code: 'VC001',
          description: 'کیک وانیلی ساده',
          price: 350000,
          category: 'dessert',
          type: 'product',
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: 'special-cake',
          name: 'کیک مخصوص',
          code: 'SC001',
          description: 'کیک مخصوص با تزیین ویژه',
          price: 650000,
          category: 'dessert',
          type: 'product',
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: 'fruit-cake',
          name: 'کیک میوه‌ای',
          code: 'FC001',
          description: 'کیک میوه‌ای با تزیین میوه‌های تازه',
          price: 550000,
          category: 'dessert',
          type: 'product',
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ];

      for (const product of products) {
        await firebaseService.setDocument(COLLECTIONS.PRODUCTS, product.id, product);
      }

      // Generate and insert sample recipes
      const recipes: ProductRecipe[] = [
        {
          id: 'chocolate-cake-recipe',
          productId: 'chocolate-cake',
          name: 'دستور پخت کیک شکلاتی',
          materials: [
            { materialId: 'flour', unit: 'kg', amount: 0.5, unitPrice: 150000, totalPrice: 75000, note: 'آرد مخصوص شیرینی‌پزی' },
            { materialId: 'sugar', unit: 'kg', amount: 0.3, unitPrice: 200000, totalPrice: 60000, note: 'شکر سفید' },
            { materialId: 'milk', unit: 'l', amount: 0.4, unitPrice: 180000, totalPrice: 72000, note: 'شیر پرچرب' },
            { materialId: 'chocolate', unit: 'kg', amount: 0.2, unitPrice: 800000, totalPrice: 160000, note: 'شکلات تلخ' }
          ],
          notes: 'دستور پخت اصلی کیک شکلاتی با شکلات تلخ',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'vanilla-cake-recipe',
          productId: 'vanilla-cake',
          name: 'دستور پخت کیک وانیلی',
          materials: [
            { materialId: 'flour', unit: 'kg', amount: 0.5, unitPrice: 150000, totalPrice: 75000, note: 'آرد مخصوص شیرینی‌پزی' },
            { materialId: 'sugar', unit: 'kg', amount: 0.25, unitPrice: 200000, totalPrice: 50000, note: 'شکر سفید' },
            { materialId: 'milk', unit: 'l', amount: 0.35, unitPrice: 180000, totalPrice: 63000, note: 'شیر پرچرب' }
          ],
          notes: 'دستور پخت پایه کیک وانیلی',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'special-cake-recipe',
          productId: 'special-cake',
          name: 'دستور پخت کیک مخصوص',
          materials: [
            { materialId: 'flour', unit: 'kg', amount: 0.5, unitPrice: 150000, totalPrice: 75000, note: 'آرد مخصوص شیرینی‌پزی' },
            { materialId: 'sugar', unit: 'kg', amount: 0.4, unitPrice: 200000, totalPrice: 80000, note: 'شکر قهوه‌ای' },
            { materialId: 'milk', unit: 'l', amount: 0.5, unitPrice: 180000, totalPrice: 90000, note: 'شیر پرچرب' },
            { materialId: 'chocolate', unit: 'kg', amount: 0.3, unitPrice: 800000, totalPrice: 240000, note: 'شکلات تلخ ۸۵٪' }
          ],
          notes: 'دستور پخت ویژه کیک مخصوص با شکلات تلخ ۸۵٪',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'fruit-cake-recipe',
          productId: 'fruit-cake',
          name: 'دستور پخت کیک میوه‌ای',
          materials: [
            { materialId: 'flour', unit: 'kg', amount: 0.5, unitPrice: 150000, totalPrice: 75000, note: 'آرد مخصوص شیرینی‌پزی' },
            { materialId: 'sugar', unit: 'kg', amount: 0.2, unitPrice: 200000, totalPrice: 40000, note: 'شکر سفید' },
            { materialId: 'milk', unit: 'l', amount: 0.3, unitPrice: 180000, totalPrice: 54000, note: 'شیر کم‌چرب' }
          ],
          notes: 'دستور پخت کیک میوه‌ای با تزیین میوه‌های تازه فصل',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        }
      ];

      for (const recipe of recipes) {
        await firebaseService.setDocument(COLLECTIONS.RECIPES, recipe.id, recipe);
      }

      // Generate sample sales data
      const salesData = [];
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      // Generate daily sales for the past month
      for (let i = 0; i < 30; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const sale = {
          id: `sale-${i}`,
          date: currentDate.toISOString(),
          department: 'cafe',
          product_code: 'CC001',
          quantity: 3 + Math.floor(Math.random() * 3),
          totalAmount: 450000 + Math.floor(Math.random() * 50000),
          productId: 'chocolate-cake'
        };

        await firebaseService.setDocument(COLLECTIONS.USER_ACTIVITIES, `sale-${i}`, sale);
      }

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
        ['تاریخ', 'بخش', 'کد محصول', 'تعداد', 'مبلغ کل', 'شناسه محصول'],
        [new Date().toLocaleDateString('fa-IR'), 'cafe', 'CC001', '1', '450000', 'chocolate-cake'],
        [new Date().toLocaleDateString('fa-IR'), 'restaurant', 'VC001', '2', '700000', 'vanilla-cake'],
        [new Date().toLocaleDateString('fa-IR'), 'cafe', 'SC001', '3', '650000', 'special-cake'],
        [new Date().toLocaleDateString('fa-IR'), 'restaurant', 'FC001', '4', '550000', 'fruit-cake']
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