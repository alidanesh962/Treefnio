import { db } from '../database';
import { Material, Product, ProductRecipe, ProductDefinition } from '../types';
import * as XLSX from 'xlsx';
import { getCurrentJalaliTimestamp } from '../database/dateUtils';

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
      await db.clearMaterialGroups();
      // Clear other data
      localStorage.removeItem('material_default_values');
      localStorage.removeItem('restaurant_departments');
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
        { id: 'ml', name: 'میلی‌لیتر', symbol: 'ml' },
        { id: 'pcs', name: 'عدد', symbol: 'pcs' },
        { id: 'box', name: 'جعبه', symbol: 'box' },
        { id: 'pack', name: 'بسته', symbol: 'pack' },
        { id: 'dozen', name: 'دوجین', symbol: 'dozen' }
      ];
      await db.insertUnits(units);

      // Set up default material values (collections and storage locations)
      const materialDefaults = [
        { id: 'restaurant_a', name: 'رستوران ایرانی', defaultStorage: 'انبار مواد خشک' },
        { id: 'restaurant_b', name: 'رستوران فرنگی', defaultStorage: 'یخچال اصلی' },
        { id: 'restaurant_c', name: 'فست فود', defaultStorage: 'قفسه ادویه‌جات' },
        { id: 'bakery', name: 'نانوایی و شیرینی‌پزی', defaultStorage: 'انبار آرد' },
        { id: 'cafe', name: 'کافه', defaultStorage: 'یخچال نوشیدنی' },
        { id: 'juice_bar', name: 'آبمیوه و بستنی', defaultStorage: 'فریزر' }
      ];
      localStorage.setItem('material_default_values', JSON.stringify(materialDefaults));

      // Set up material groups
      const materialGroups = [
        { id: 'baking', name: 'مواد پخت' },
        { id: 'dairy', name: 'لبنیات' },
        { id: 'spices', name: 'ادویه‌جات' },
        { id: 'oils', name: 'روغن‌ها' },
        { id: 'sweets', name: 'شیرینی‌جات' },
        { id: 'fruits', name: 'میوه‌جات' },
        { id: 'vegetables', name: 'سبزیجات' },
        { id: 'meat', name: 'گوشت' },
        { id: 'seafood', name: 'غذاهای دریایی' },
        { id: 'beverages', name: 'نوشیدنی‌ها' },
        { id: 'nuts', name: 'آجیل و خشکبار' },
        { id: 'grains', name: 'غلات' }
      ];
      localStorage.setItem('material_food_groups', JSON.stringify(materialGroups));

      // Set up default departments
      const defaultDepartments = [
        { id: 'test_sales', name: 'تست واحد فروش', type: 'sale' as const, createdAt: Date.now() },
        { id: 'restaurant', name: 'رستوران', type: 'sale' as const, createdAt: Date.now() },
        { id: 'cafe', name: 'کافه', type: 'sale' as const, createdAt: Date.now() },
        { id: 'bakery', name: 'نانوایی', type: 'sale' as const, createdAt: Date.now() },
        { id: 'fastfood', name: 'فست‌فود', type: 'sale' as const, createdAt: Date.now() },
        { id: 'juice_bar', name: 'آبمیوه و بستنی', type: 'sale' as const, createdAt: Date.now() },
        { id: 'test_prod', name: 'تست واحد تولید', type: 'production' as const, createdAt: Date.now() },
        { id: 'kitchen', name: 'آشپزخانه مرکزی', type: 'production' as const, createdAt: Date.now() },
        { id: 'bakery_prod', name: 'واحد تولید نان', type: 'production' as const, createdAt: Date.now() }
      ];
      localStorage.setItem('restaurant_departments', JSON.stringify(defaultDepartments));

      const currentDate = new Date().toISOString();

      // Generate and insert sample materials
      const materials: Material[] = [
        // Baking Materials
        { id: 'flour', name: 'آرد', code: 'FL001', unit: 'g', unitPrice: 150000, currentStock: 100000, minimumStock: 20000, category: 'مواد خشک', foodGroup: 'مواد پخت', storageLocation: 'انبار مواد خشک', expiryDate: new Date('2025/03/19').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'cake_flour', name: 'آرد کیک', code: 'FL002', unit: 'g', unitPrice: 180000, currentStock: 80000, minimumStock: 15000, category: 'مواد خشک', foodGroup: 'مواد پخت', storageLocation: 'انبار مواد خشک', expiryDate: new Date('2025/03/19').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'pastry_flour', name: 'آرد شیرینی‌پزی', code: 'FL003', unit: 'g', unitPrice: 200000, currentStock: 70000, minimumStock: 15000, category: 'مواد خشک', foodGroup: 'مواد پخت', storageLocation: 'انبار مواد خشک', expiryDate: new Date('2025/03/19').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'sugar', name: 'شکر', code: 'SG001', unit: 'g', unitPrice: 200000, currentStock: 50000, minimumStock: 10000, category: 'مواد خشک', foodGroup: 'مواد پخت', storageLocation: 'انبار مواد خشک', expiryDate: new Date('2025/03/19').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'brown_sugar', name: 'شکر قهوه‌ای', code: 'SG002', unit: 'g', unitPrice: 250000, currentStock: 40000, minimumStock: 8000, category: 'مواد خشک', foodGroup: 'مواد پخت', storageLocation: 'انبار مواد خشک', expiryDate: new Date('2025/03/19').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'powdered_sugar', name: 'پودر قند', code: 'SG003', unit: 'g', unitPrice: 220000, currentStock: 45000, minimumStock: 9000, category: 'مواد خشک', foodGroup: 'مواد پخت', storageLocation: 'انبار مواد خشک', expiryDate: new Date('2025/03/19').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'baking_powder', name: 'بکینگ پودر', code: 'BP001', unit: 'g', unitPrice: 300000, currentStock: 20000, minimumStock: 5000, category: 'مواد خشک', foodGroup: 'مواد پخت', storageLocation: 'انبار مواد خشک', expiryDate: new Date('2024/12/31').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'baking_soda', name: 'جوش شیرین', code: 'BS001', unit: 'g', unitPrice: 150000, currentStock: 15000, minimumStock: 3000, category: 'مواد خشک', foodGroup: 'مواد پخت', storageLocation: 'انبار مواد خشک', expiryDate: new Date('2024/12/31').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'yeast', name: 'مخمر', code: 'YE001', unit: 'g', unitPrice: 400000, currentStock: 10000, minimumStock: 2000, category: 'مواد خشک', foodGroup: 'مواد پخت', storageLocation: 'یخچال مواد اولیه', expiryDate: new Date('2024/06/30').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        
        // Dairy Products
        { id: 'milk', name: 'شیر', code: 'ML001', unit: 'ml', unitPrice: 180000, currentStock: 200000, minimumStock: 50000, category: 'لبنیات', foodGroup: 'لبنیات', storageLocation: 'یخچال اصلی', expiryDate: new Date('2024/03/04').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'cream', name: 'خامه', code: 'CR001', unit: 'ml', unitPrice: 250000, currentStock: 100000, minimumStock: 20000, category: 'لبنیات', foodGroup: 'لبنیات', storageLocation: 'یخچال اصلی', expiryDate: new Date('2024/03/04').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'whipping_cream', name: 'خامه فرم', code: 'CR002', unit: 'ml', unitPrice: 300000, currentStock: 80000, minimumStock: 15000, category: 'لبنیات', foodGroup: 'لبنیات', storageLocation: 'یخچال اصلی', expiryDate: new Date('2024/03/04').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'butter', name: 'کره', code: 'BT001', unit: 'g', unitPrice: 400000, currentStock: 50000, minimumStock: 10000, category: 'لبنیات', foodGroup: 'لبنیات', storageLocation: 'یخچال اصلی', expiryDate: new Date('2024/06/30').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'yogurt', name: 'ماست', code: 'YG001', unit: 'g', unitPrice: 160000, currentStock: 100000, minimumStock: 20000, category: 'لبنیات', foodGroup: 'لبنیات', storageLocation: 'یخچال اصلی', expiryDate: new Date('2024/03/04').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'cheese', name: 'پنیر', code: 'CH001', unit: 'g', unitPrice: 450000, currentStock: 40000, minimumStock: 8000, category: 'لبنیات', foodGroup: 'لبنیات', storageLocation: 'یخچال اصلی', expiryDate: new Date('2024/03/15').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        
        // Chocolates and Sweets
        { id: 'chocolate', name: 'شکلات', code: 'CH001', unit: 'g', unitPrice: 800000, currentStock: 30000, minimumStock: 5000, category: 'مواد خشک', foodGroup: 'شیرینی‌جات', storageLocation: 'انبار خنک', expiryDate: new Date('2024/09/20').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'dark_chocolate', name: 'شکلات تلخ', code: 'CH002', unit: 'g', unitPrice: 900000, currentStock: 25000, minimumStock: 5000, category: 'مواد خشک', foodGroup: 'شیرینی‌جات', storageLocation: 'انبار خنک', expiryDate: new Date('2024/09/20').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'white_chocolate', name: 'شکلات سفید', code: 'CH003', unit: 'g', unitPrice: 850000, currentStock: 20000, minimumStock: 4000, category: 'مواد خشک', foodGroup: 'شیرینی‌جات', storageLocation: 'انبار خنک', expiryDate: new Date('2024/09/20').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'cocoa', name: 'پودر کاکائو', code: 'CC001', unit: 'g', unitPrice: 600000, currentStock: 25000, minimumStock: 5000, category: 'مواد خشک', foodGroup: 'شیرینی‌جات', storageLocation: 'انبار خنک', expiryDate: new Date('2024/12/31').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'vanilla', name: 'وانیل', code: 'VN001', unit: 'g', unitPrice: 900000, currentStock: 10000, minimumStock: 2000, category: 'مواد خشک', foodGroup: 'شیرینی‌جات', storageLocation: 'انبار خنک', expiryDate: new Date('2024/12/31').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'caramel', name: 'کارامل', code: 'CM001', unit: 'g', unitPrice: 500000, currentStock: 15000, minimumStock: 3000, category: 'مواد خشک', foodGroup: 'شیرینی‌جات', storageLocation: 'انبار خنک', expiryDate: new Date('2024/12/31').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        
        // Fruits
        { id: 'strawberry', name: 'توت فرنگی', code: 'ST001', unit: 'g', unitPrice: 350000, currentStock: 40000, minimumStock: 10000, category: 'میوه‌جات', foodGroup: 'میوه‌جات', storageLocation: 'یخچال میوه', expiryDate: new Date('2024/03/10').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'banana', name: 'موز', code: 'BN001', unit: 'g', unitPrice: 280000, currentStock: 50000, minimumStock: 15000, category: 'میوه‌جات', foodGroup: 'میوه‌جات', storageLocation: 'یخچال میوه', expiryDate: new Date('2024/03/08').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'raspberry', name: 'تمشک', code: 'RB001', unit: 'g', unitPrice: 400000, currentStock: 20000, minimumStock: 5000, category: 'میوه‌جات', foodGroup: 'میوه‌جات', storageLocation: 'یخچال میوه', expiryDate: new Date('2024/03/07').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'blueberry', name: 'بلوبری', code: 'BB001', unit: 'g', unitPrice: 450000, currentStock: 15000, minimumStock: 3000, category: 'میوه‌جات', foodGroup: 'میوه‌جات', storageLocation: 'یخچال میوه', expiryDate: new Date('2024/03/07').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'mango', name: 'انبه', code: 'MG001', unit: 'g', unitPrice: 380000, currentStock: 30000, minimumStock: 8000, category: 'میوه‌جات', foodGroup: 'میوه‌جات', storageLocation: 'یخچال میوه', expiryDate: new Date('2024/03/12').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        
        // Nuts and Seeds
        { id: 'almond', name: 'بادام', code: 'AL001', unit: 'g', unitPrice: 1200000, currentStock: 20000, minimumStock: 5000, category: 'خشکبار', foodGroup: 'آجیل و خشکبار', storageLocation: 'انبار خشکبار', expiryDate: new Date('2024/12/31').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'walnut', name: 'گردو', code: 'WL001', unit: 'g', unitPrice: 1500000, currentStock: 15000, minimumStock: 3000, category: 'خشکبار', foodGroup: 'آجیل و خشکبار', storageLocation: 'انبار خشکبار', expiryDate: new Date('2024/12/31').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'pistachio', name: 'پسته', code: 'PS001', unit: 'g', unitPrice: 2000000, currentStock: 10000, minimumStock: 2000, category: 'خشکبار', foodGroup: 'آجیل و خشکبار', storageLocation: 'انبار خشکبار', expiryDate: new Date('2024/12/31').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'hazelnut', name: 'فندق', code: 'HZ001', unit: 'g', unitPrice: 1800000, currentStock: 12000, minimumStock: 2500, category: 'خشکبار', foodGroup: 'آجیل و خشکبار', storageLocation: 'انبار خشکبار', expiryDate: new Date('2024/12/31').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'sesame', name: 'کنجد', code: 'SS001', unit: 'g', unitPrice: 500000, currentStock: 8000, minimumStock: 2000, category: 'خشکبار', foodGroup: 'آجیل و خشکبار', storageLocation: 'انبار خشکبار', expiryDate: new Date('2024/12/31').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        
        // Spices and Flavorings
        { id: 'cinnamon', name: 'دارچین', code: 'CN001', unit: 'g', unitPrice: 400000, currentStock: 5000, minimumStock: 1000, category: 'ادویه‌جات', foodGroup: 'ادویه‌جات', storageLocation: 'قفسه ادویه‌جات', expiryDate: new Date('2024/12/31').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'cardamom', name: 'هل', code: 'CD001', unit: 'g', unitPrice: 600000, currentStock: 3000, minimumStock: 500, category: 'ادویه‌جات', foodGroup: 'ادویه‌جات', storageLocation: 'قفسه ادویه‌جات', expiryDate: new Date('2024/12/31').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'saffron', name: 'زعفران', code: 'SF001', unit: 'g', unitPrice: 12000000, currentStock: 500, minimumStock: 100, category: 'ادویه‌جات', foodGroup: 'ادویه‌جات', storageLocation: 'گاوصندوق', expiryDate: new Date('2025/12/31').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate },
        { id: 'rosewater', name: 'گلاب', code: 'RW001', unit: 'ml', unitPrice: 300000, currentStock: 10000, minimumStock: 2000, category: 'عرقیجات', foodGroup: 'ادویه‌جات', storageLocation: 'قفسه عرقیجات', expiryDate: new Date('2024/12/31').getTime(), isActive: true, createdAt: currentDate, updatedAt: currentDate }
      ];
      await db.insertMaterials(materials);

      // Generate and insert sample products
      const products: ProductDefinition[] = [
        // Cakes
        { id: 'chocolate-cake', name: 'کیک شکلاتی', code: 'CC001', saleDepartment: 'cafe', productionSegment: 'kitchen', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        { id: 'vanilla-cake', name: 'کیک وانیلی', code: 'VC001', saleDepartment: 'cafe', productionSegment: 'kitchen', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        { id: 'fruit-cake', name: 'کیک میوه‌ای', code: 'FC001', saleDepartment: 'cafe', productionSegment: 'kitchen', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        { id: 'walnut-cake', name: 'کیک گردویی', code: 'WC001', saleDepartment: 'cafe', productionSegment: 'kitchen', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        { id: 'carrot-cake', name: 'کیک هویج', code: 'RC001', saleDepartment: 'cafe', productionSegment: 'kitchen', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        { id: 'red-velvet', name: 'کیک رد ولوت', code: 'RV001', saleDepartment: 'cafe', productionSegment: 'kitchen', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        { id: 'black-forest', name: 'کیک جنگل سیاه', code: 'BF001', saleDepartment: 'cafe', productionSegment: 'kitchen', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        { id: 'tiramisu-cake', name: 'کیک تیرامیسو', code: 'TC001', saleDepartment: 'cafe', productionSegment: 'kitchen', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        
        // Pastries
        { id: 'cream-puff', name: 'نان خامه‌ای', code: 'CP001', saleDepartment: 'bakery', productionSegment: 'bakery_prod', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        { id: 'eclair', name: 'اکلر', code: 'EC001', saleDepartment: 'bakery', productionSegment: 'bakery_prod', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        { id: 'danish', name: 'دانمارکی', code: 'DN001', saleDepartment: 'bakery', productionSegment: 'bakery_prod', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        { id: 'croissant', name: 'کروسان', code: 'CR001', saleDepartment: 'bakery', productionSegment: 'bakery_prod', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        { id: 'apple-strudel', name: 'اشترودل سیب', code: 'AS001', saleDepartment: 'bakery', productionSegment: 'bakery_prod', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        { id: 'baklava', name: 'باقلوا', code: 'BK001', saleDepartment: 'bakery', productionSegment: 'bakery_prod', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        
        // Traditional Sweets
        { id: 'sholeh-zard', name: 'شله زرد', code: 'SZ001', saleDepartment: 'restaurant', productionSegment: 'kitchen', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        { id: 'halva', name: 'حلوا', code: 'HL001', saleDepartment: 'restaurant', productionSegment: 'kitchen', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        { id: 'ranginak', name: 'رنگینک', code: 'RN001', saleDepartment: 'restaurant', productionSegment: 'kitchen', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        
        // Drinks
        { id: 'fruit-smoothie', name: 'اسموتی میوه‌ای', code: 'SM001', saleDepartment: 'juice_bar', productionSegment: 'kitchen', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        { id: 'milkshake', name: 'میلک‌شیک', code: 'MS001', saleDepartment: 'juice_bar', productionSegment: 'kitchen', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        { id: 'ice-coffee', name: 'قهوه سرد', code: 'IC001', saleDepartment: 'cafe', productionSegment: 'kitchen', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        { id: 'mango-lassi', name: 'لاسی انبه', code: 'ML001', saleDepartment: 'juice_bar', productionSegment: 'kitchen', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        { id: 'berry-blast', name: 'اسموتی توت‌ها', code: 'BB001', saleDepartment: 'juice_bar', productionSegment: 'kitchen', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        { id: 'mint-lemonade', name: 'لیموناد نعناع', code: 'LM001', saleDepartment: 'juice_bar', productionSegment: 'kitchen', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        
        // Ice Cream and Frozen Desserts
        { id: 'vanilla-ice', name: 'بستنی وانیلی', code: 'VI001', saleDepartment: 'juice_bar', productionSegment: 'kitchen', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        { id: 'chocolate-ice', name: 'بستنی شکلاتی', code: 'CI001', saleDepartment: 'juice_bar', productionSegment: 'kitchen', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        { id: 'saffron-ice', name: 'بستنی زعفرانی', code: 'SI001', saleDepartment: 'juice_bar', productionSegment: 'kitchen', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true },
        { id: 'faloodeh', name: 'فالوده', code: 'FL001', saleDepartment: 'juice_bar', productionSegment: 'kitchen', createdAt: getCurrentJalaliTimestamp(), updatedAt: getCurrentJalaliTimestamp(), isActive: true }
      ];

      // Save products directly to product definitions
      await db.saveProductDefinitions(products);

      // Generate and insert sample recipes
      const recipes: ProductRecipe[] = [
        // Chocolate Cake Recipes
        {
          id: 'chocolate-cake-classic',
          productId: 'chocolate-cake',
          name: 'دستور پخت کیک شکلاتی کلاسیک',
          materials: [
            { materialId: 'flour', unit: 'g', amount: 500, unitPrice: 150000, totalPrice: 75000, note: 'آرد مخصوص شیرینی‌پزی' },
            { materialId: 'sugar', unit: 'g', amount: 300, unitPrice: 200000, totalPrice: 60000, note: 'شکر سفید' },
            { materialId: 'chocolate', unit: 'g', amount: 200, unitPrice: 800000, totalPrice: 160000, note: 'شکلات تلخ' },
            { materialId: 'milk', unit: 'ml', amount: 400, unitPrice: 180000, totalPrice: 72000, note: 'شیر پرچرب' },
            { materialId: 'butter', unit: 'g', amount: 200, unitPrice: 400000, totalPrice: 80000, note: 'کره' }
          ],
          notes: 'دستور پخت کلاسیک کیک شکلاتی',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'chocolate-cake-premium',
          productId: 'chocolate-cake',
          name: 'دستور پخت کیک شکلاتی ویژه',
          materials: [
            { materialId: 'cake_flour', unit: 'g', amount: 500, unitPrice: 180000, totalPrice: 90000, note: 'آرد کیک' },
            { materialId: 'brown_sugar', unit: 'g', amount: 300, unitPrice: 250000, totalPrice: 75000, note: 'شکر قهوه‌ای' },
            { materialId: 'dark_chocolate', unit: 'g', amount: 300, unitPrice: 900000, totalPrice: 270000, note: 'شکلات تلخ ممتاز' },
            { materialId: 'whipping_cream', unit: 'ml', amount: 400, unitPrice: 300000, totalPrice: 120000, note: 'خامه فرم' }
          ],
          notes: 'نسخه ویژه با شکلات تلخ ممتاز',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'chocolate-cake-nutty',
          productId: 'chocolate-cake',
          name: 'دستور پخت کیک شکلاتی مغزدار',
          materials: [
            { materialId: 'flour', unit: 'g', amount: 500, unitPrice: 150000, totalPrice: 75000, note: 'آرد مخصوص شیرینی‌پزی' },
            { materialId: 'sugar', unit: 'g', amount: 300, unitPrice: 200000, totalPrice: 60000, note: 'شکر سفید' },
            { materialId: 'chocolate', unit: 'g', amount: 200, unitPrice: 800000, totalPrice: 160000, note: 'شکلات تلخ' },
            { materialId: 'walnut', unit: 'g', amount: 100, unitPrice: 1500000, totalPrice: 150000, note: 'گردو' },
            { materialId: 'almond', unit: 'g', amount: 100, unitPrice: 1200000, totalPrice: 120000, note: 'بادام' }
          ],
          notes: 'نسخه با مغز گردو و بادام',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Black Forest Cake Recipes
        {
          id: 'black-forest-classic',
          productId: 'black-forest',
          name: 'دستور پخت کیک جنگل سیاه کلاسیک',
          materials: [
            { materialId: 'cake_flour', unit: 'g', amount: 500, unitPrice: 180000, totalPrice: 90000, note: 'آرد کیک' },
            { materialId: 'sugar', unit: 'g', amount: 300, unitPrice: 200000, totalPrice: 60000, note: 'شکر سفید' },
            { materialId: 'dark_chocolate', unit: 'g', amount: 250, unitPrice: 900000, totalPrice: 225000, note: 'شکلات تلخ' },
            { materialId: 'whipping_cream', unit: 'ml', amount: 500, unitPrice: 300000, totalPrice: 150000, note: 'خامه فرم' }
          ],
          notes: 'دستور پخت کلاسیک کیک جنگل سیاه',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'black-forest-premium',
          productId: 'black-forest',
          name: 'دستور پخت کیک جنگل سیاه ویژه',
          materials: [
            { materialId: 'cake_flour', unit: 'g', amount: 500, unitPrice: 180000, totalPrice: 90000, note: 'آرد کیک' },
            { materialId: 'brown_sugar', unit: 'g', amount: 300, unitPrice: 250000, totalPrice: 75000, note: 'شکر قهوه‌ای' },
            { materialId: 'dark_chocolate', unit: 'g', amount: 300, unitPrice: 900000, totalPrice: 270000, note: 'شکلات تلخ ممتاز' },
            { materialId: 'whipping_cream', unit: 'ml', amount: 600, unitPrice: 300000, totalPrice: 180000, note: 'خامه فرم' },
            { materialId: 'cherry', unit: 'g', amount: 300, unitPrice: 400000, totalPrice: 120000, note: 'گیلاس تازه' }
          ],
          notes: 'نسخه ویژه با گیلاس تازه',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'black-forest-deluxe',
          productId: 'black-forest',
          name: 'دستور پخت کیک جنگل سیاه دلوکس',
          materials: [
            { materialId: 'cake_flour', unit: 'g', amount: 500, unitPrice: 180000, totalPrice: 90000, note: 'آرد کیک' },
            { materialId: 'brown_sugar', unit: 'g', amount: 300, unitPrice: 250000, totalPrice: 75000, note: 'شکر قهوه‌ای' },
            { materialId: 'dark_chocolate', unit: 'g', amount: 350, unitPrice: 900000, totalPrice: 315000, note: 'شکلات تلخ ممتاز' },
            { materialId: 'whipping_cream', unit: 'ml', amount: 700, unitPrice: 300000, totalPrice: 210000, note: 'خامه فرم' },
            { materialId: 'cherry', unit: 'g', amount: 400, unitPrice: 400000, totalPrice: 160000, note: 'گیلاس تازه' },
            { materialId: 'chocolate_chips', unit: 'g', amount: 200, unitPrice: 700000, totalPrice: 140000, note: 'چیپس شکلات' }
          ],
          notes: 'نسخه دلوکس با تزیین ویژه',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Cream Puff Recipes
        {
          id: 'cream-puff-classic',
          productId: 'cream-puff',
          name: 'دستور پخت نان خامه‌ای کلاسیک',
          materials: [
            { materialId: 'pastry_flour', unit: 'g', amount: 300, unitPrice: 200000, totalPrice: 60000, note: 'آرد شیرینی‌پزی' },
            { materialId: 'butter', unit: 'g', amount: 150, unitPrice: 400000, totalPrice: 60000, note: 'کره' },
            { materialId: 'whipping_cream', unit: 'ml', amount: 500, unitPrice: 300000, totalPrice: 150000, note: 'خامه فرم' }
          ],
          notes: 'دستور پخت کلاسیک نان خامه‌ای',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'cream-puff-chocolate',
          productId: 'cream-puff',
          name: 'دستور پخت نان خامه‌ای شکلاتی',
          materials: [
            { materialId: 'pastry_flour', unit: 'g', amount: 300, unitPrice: 200000, totalPrice: 60000, note: 'آرد شیرینی‌پزی' },
            { materialId: 'butter', unit: 'g', amount: 150, unitPrice: 400000, totalPrice: 60000, note: 'کره' },
            { materialId: 'whipping_cream', unit: 'ml', amount: 400, unitPrice: 300000, totalPrice: 120000, note: 'خامه فرم' },
            { materialId: 'chocolate', unit: 'g', amount: 200, unitPrice: 800000, totalPrice: 160000, note: 'شکلات تلخ' }
          ],
          notes: 'دستور پخت نان خامه‌ای با روکش شکلاتی',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'cream-puff-caramel',
          productId: 'cream-puff',
          name: 'دستور پخت نان خامه‌ای کارامل',
          materials: [
            { materialId: 'pastry_flour', unit: 'g', amount: 300, unitPrice: 200000, totalPrice: 60000, note: 'آرد شیرینی‌پزی' },
            { materialId: 'butter', unit: 'g', amount: 150, unitPrice: 400000, totalPrice: 60000, note: 'کره' },
            { materialId: 'whipping_cream', unit: 'ml', amount: 500, unitPrice: 300000, totalPrice: 150000, note: 'خامه فرم' },
            { materialId: 'caramel', unit: 'g', amount: 200, unitPrice: 500000, totalPrice: 100000, note: 'سس کارامل' }
          ],
          notes: 'دستور پخت نان خامه‌ای با روکش کارامل',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Fruit Smoothie Recipes
        {
          id: 'fruit-smoothie-berry',
          productId: 'fruit-smoothie',
          name: 'دستور تهیه اسموتی توت‌ها',
          materials: [
            { materialId: 'strawberry', unit: 'g', amount: 200, unitPrice: 350000, totalPrice: 70000, note: 'توت فرنگی تازه' },
            { materialId: 'raspberry', unit: 'g', amount: 100, unitPrice: 400000, totalPrice: 40000, note: 'تمشک تازه' },
            { materialId: 'blueberry', unit: 'g', amount: 100, unitPrice: 450000, totalPrice: 45000, note: 'بلوبری تازه' },
            { materialId: 'yogurt', unit: 'g', amount: 300, unitPrice: 160000, totalPrice: 48000, note: 'ماست' }
          ],
          notes: 'اسموتی با ترکیب توت‌های مختلف',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'fruit-smoothie-tropical',
          productId: 'fruit-smoothie',
          name: 'دستور تهیه اسموتی استوایی',
          materials: [
            { materialId: 'mango', unit: 'g', amount: 250, unitPrice: 380000, totalPrice: 95000, note: 'انبه تازه' },
            { materialId: 'banana', unit: 'g', amount: 200, unitPrice: 280000, totalPrice: 56000, note: 'موز رسیده' },
            { materialId: 'milk', unit: 'ml', amount: 300, unitPrice: 180000, totalPrice: 54000, note: 'شیر' }
          ],
          notes: 'اسموتی با میوه‌های استوایی',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'fruit-smoothie-energy',
          productId: 'fruit-smoothie',
          name: 'دستور تهیه اسموتی انرژی‌زا',
          materials: [
            { materialId: 'banana', unit: 'g', amount: 200, unitPrice: 280000, totalPrice: 56000, note: 'موز رسیده' },
            { materialId: 'strawberry', unit: 'g', amount: 150, unitPrice: 350000, totalPrice: 52500, note: 'توت فرنگی تازه' },
            { materialId: 'milk', unit: 'ml', amount: 250, unitPrice: 180000, totalPrice: 45000, note: 'شیر' },
            { materialId: 'honey', unit: 'g', amount: 50, unitPrice: 900000, totalPrice: 45000, note: 'عسل طبیعی' }
          ],
          notes: 'اسموتی انرژی‌زا با عسل طبیعی',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Red Velvet Cake Recipes
        {
          id: 'red-velvet-classic',
          productId: 'red-velvet',
          name: 'دستور پخت کیک رد ولوت کلاسیک',
          materials: [
            { materialId: 'cake_flour', unit: 'g', amount: 500, unitPrice: 180000, totalPrice: 90000, note: 'آرد کیک' },
            { materialId: 'sugar', unit: 'g', amount: 300, unitPrice: 200000, totalPrice: 60000, note: 'شکر سفید' },
            { materialId: 'butter', unit: 'g', amount: 200, unitPrice: 400000, totalPrice: 80000, note: 'کره' },
            { materialId: 'whipping_cream', unit: 'ml', amount: 400, unitPrice: 300000, totalPrice: 120000, note: 'خامه فرم' },
            { materialId: 'food_color', unit: 'ml', amount: 20, unitPrice: 500000, totalPrice: 10000, note: 'رنگ خوراکی قرمز' }
          ],
          notes: 'دستور پخت کلاسیک کیک رد ولوت',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'red-velvet-cream-cheese',
          productId: 'red-velvet',
          name: 'دستور پخت کیک رد ولوت با کرم پنیر',
          materials: [
            { materialId: 'cake_flour', unit: 'g', amount: 500, unitPrice: 180000, totalPrice: 90000, note: 'آرد کیک' },
            { materialId: 'sugar', unit: 'g', amount: 300, unitPrice: 200000, totalPrice: 60000, note: 'شکر سفید' },
            { materialId: 'butter', unit: 'g', amount: 200, unitPrice: 400000, totalPrice: 80000, note: 'کره' },
            { materialId: 'cheese', unit: 'g', amount: 300, unitPrice: 450000, totalPrice: 135000, note: 'پنیر خامه‌ای' },
            { materialId: 'food_color', unit: 'ml', amount: 20, unitPrice: 500000, totalPrice: 10000, note: 'رنگ خوراکی قرمز' }
          ],
          notes: 'دستور پخت کیک رد ولوت با روکش کرم پنیر',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Carrot Cake Recipes
        {
          id: 'carrot-cake-classic',
          productId: 'carrot-cake',
          name: 'دستور پخت کیک هویج کلاسیک',
          materials: [
            { materialId: 'flour', unit: 'g', amount: 400, unitPrice: 150000, totalPrice: 60000, note: 'آرد' },
            { materialId: 'sugar', unit: 'g', amount: 250, unitPrice: 200000, totalPrice: 50000, note: 'شکر' },
            { materialId: 'carrot', unit: 'g', amount: 300, unitPrice: 100000, totalPrice: 30000, note: 'هویج رنده شده' },
            { materialId: 'cinnamon', unit: 'g', amount: 10, unitPrice: 400000, totalPrice: 4000, note: 'دارچین' },
            { materialId: 'walnut', unit: 'g', amount: 100, unitPrice: 1500000, totalPrice: 150000, note: 'گردو' }
          ],
          notes: 'دستور پخت کلاسیک کیک هویج',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'carrot-cake-spiced',
          productId: 'carrot-cake',
          name: 'دستور پخت کیک هویج ادویه‌ای',
          materials: [
            { materialId: 'flour', unit: 'g', amount: 400, unitPrice: 150000, totalPrice: 60000, note: 'آرد' },
            { materialId: 'brown_sugar', unit: 'g', amount: 250, unitPrice: 250000, totalPrice: 62500, note: 'شکر قهوه‌ای' },
            { materialId: 'carrot', unit: 'g', amount: 300, unitPrice: 100000, totalPrice: 30000, note: 'هویج رنده شده' },
            { materialId: 'cinnamon', unit: 'g', amount: 15, unitPrice: 400000, totalPrice: 6000, note: 'دارچین' },
            { materialId: 'cardamom', unit: 'g', amount: 5, unitPrice: 600000, totalPrice: 3000, note: 'هل' },
            { materialId: 'walnut', unit: 'g', amount: 150, unitPrice: 1500000, totalPrice: 225000, note: 'گردو' }
          ],
          notes: 'دستور پخت کیک هویج با ادویه‌جات',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Sholeh Zard Recipes
        {
          id: 'sholeh-zard-classic',
          productId: 'sholeh-zard',
          name: 'دستور پخت شله زرد سنتی',
          materials: [
            { materialId: 'rice', unit: 'g', amount: 500, unitPrice: 350000, totalPrice: 175000, note: 'برنج ایرانی' },
            { materialId: 'sugar', unit: 'g', amount: 400, unitPrice: 200000, totalPrice: 80000, note: 'شکر' },
            { materialId: 'saffron', unit: 'g', amount: 2, unitPrice: 12000000, totalPrice: 24000, note: 'زعفران' },
            { materialId: 'rosewater', unit: 'ml', amount: 100, unitPrice: 300000, totalPrice: 30000, note: 'گلاب' },
            { materialId: 'almond', unit: 'g', amount: 100, unitPrice: 1200000, totalPrice: 120000, note: 'بادام' }
          ],
          notes: 'دستور پخت سنتی شله زرد',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'sholeh-zard-premium',
          productId: 'sholeh-zard',
          name: 'دستور پخت شله زرد مجلسی',
          materials: [
            { materialId: 'rice', unit: 'g', amount: 500, unitPrice: 350000, totalPrice: 175000, note: 'برنج ایرانی' },
            { materialId: 'sugar', unit: 'g', amount: 400, unitPrice: 200000, totalPrice: 80000, note: 'شکر' },
            { materialId: 'saffron', unit: 'g', amount: 4, unitPrice: 12000000, totalPrice: 48000, note: 'زعفران' },
            { materialId: 'rosewater', unit: 'ml', amount: 200, unitPrice: 300000, totalPrice: 60000, note: 'گلاب دو آتشه' },
            { materialId: 'almond', unit: 'g', amount: 150, unitPrice: 1200000, totalPrice: 180000, note: 'بادام' },
            { materialId: 'pistachio', unit: 'g', amount: 100, unitPrice: 2000000, totalPrice: 200000, note: 'پسته' }
          ],
          notes: 'دستور پخت مجلسی شله زرد با تزیین ویژه',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Saffron Ice Cream Recipes
        {
          id: 'saffron-ice-classic',
          productId: 'saffron-ice',
          name: 'دستور تهیه بستنی زعفرانی سنتی',
          materials: [
            { materialId: 'milk', unit: 'ml', amount: 1000, unitPrice: 180000, totalPrice: 180000, note: 'شیر پرچرب' },
            { materialId: 'cream', unit: 'ml', amount: 500, unitPrice: 250000, totalPrice: 125000, note: 'خامه' },
            { materialId: 'saffron', unit: 'g', amount: 1, unitPrice: 12000000, totalPrice: 12000, note: 'زعفران' },
            { materialId: 'rosewater', unit: 'ml', amount: 50, unitPrice: 300000, totalPrice: 15000, note: 'گلاب' }
          ],
          notes: 'دستور تهیه بستنی زعفرانی به سبک سنتی',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'saffron-ice-premium',
          productId: 'saffron-ice',
          name: 'دستور تهیه بستنی زعفرانی مجلسی',
          materials: [
            { materialId: 'milk', unit: 'ml', amount: 1000, unitPrice: 180000, totalPrice: 180000, note: 'شیر پرچرب' },
            { materialId: 'cream', unit: 'ml', amount: 700, unitPrice: 250000, totalPrice: 175000, note: 'خامه' },
            { materialId: 'saffron', unit: 'g', amount: 2, unitPrice: 12000000, totalPrice: 24000, note: 'زعفران' },
            { materialId: 'rosewater', unit: 'ml', amount: 100, unitPrice: 300000, totalPrice: 30000, note: 'گلاب' },
            { materialId: 'pistachio', unit: 'g', amount: 200, unitPrice: 2000000, totalPrice: 400000, note: 'پسته' }
          ],
          notes: 'دستور تهیه بستنی زعفرانی مجلسی با تزیین پسته',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Eclair Recipes
        {
          id: 'eclair-classic',
          productId: 'eclair',
          name: 'دستور پخت اکلر کلاسیک',
          materials: [
            { materialId: 'pastry_flour', unit: 'g', amount: 300, unitPrice: 200000, totalPrice: 60000, note: 'آرد شیرینی‌پزی' },
            { materialId: 'butter', unit: 'g', amount: 150, unitPrice: 400000, totalPrice: 60000, note: 'کره' },
            { materialId: 'whipping_cream', unit: 'ml', amount: 400, unitPrice: 300000, totalPrice: 120000, note: 'خامه فرم' }
          ],
          notes: 'دستور پخت کلاسیک اکلر',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'eclair-chocolate',
          productId: 'eclair',
          name: 'دستور پخت اکلر شکلاتی',
          materials: [
            { materialId: 'pastry_flour', unit: 'g', amount: 300, unitPrice: 200000, totalPrice: 60000, note: 'آرد شیرینی‌پزی' },
            { materialId: 'butter', unit: 'g', amount: 150, unitPrice: 400000, totalPrice: 60000, note: 'کره' },
            { materialId: 'whipping_cream', unit: 'ml', amount: 400, unitPrice: 300000, totalPrice: 120000, note: 'خامه فرم' },
            { materialId: 'dark_chocolate', unit: 'g', amount: 200, unitPrice: 900000, totalPrice: 180000, note: 'شکلات تلخ' }
          ],
          notes: 'دستور پخت اکلر با روکش شکلاتی',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'eclair-coffee',
          productId: 'eclair',
          name: 'دستور پخت اکلر قهوه',
          materials: [
            { materialId: 'pastry_flour', unit: 'g', amount: 300, unitPrice: 200000, totalPrice: 60000, note: 'آرد شیرینی‌پزی' },
            { materialId: 'butter', unit: 'g', amount: 150, unitPrice: 400000, totalPrice: 60000, note: 'کره' },
            { materialId: 'whipping_cream', unit: 'ml', amount: 400, unitPrice: 300000, totalPrice: 120000, note: 'خامه فرم' },
            { materialId: 'coffee', unit: 'ml', amount: 100, unitPrice: 500000, totalPrice: 50000, note: 'قهوه اسپرسو' }
          ],
          notes: 'دستور پخت اکلر با طعم قهوه',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Danish Recipes
        {
          id: 'danish-apple',
          productId: 'danish',
          name: 'دستور پخت دانمارکی سیب',
          materials: [
            { materialId: 'pastry_flour', unit: 'g', amount: 400, unitPrice: 200000, totalPrice: 80000, note: 'آرد شیرینی‌پزی' },
            { materialId: 'butter', unit: 'g', amount: 200, unitPrice: 400000, totalPrice: 80000, note: 'کره' },
            { materialId: 'apple', unit: 'g', amount: 300, unitPrice: 250000, totalPrice: 75000, note: 'سیب' },
            { materialId: 'cinnamon', unit: 'g', amount: 5, unitPrice: 400000, totalPrice: 2000, note: 'دارچین' }
          ],
          notes: 'دستور پخت دانمارکی با سیب و دارچین',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'danish-berry',
          productId: 'danish',
          name: 'دستور پخت دانمارکی توت‌ها',
          materials: [
            { materialId: 'pastry_flour', unit: 'g', amount: 400, unitPrice: 200000, totalPrice: 80000, note: 'آرد شیرینی‌پزی' },
            { materialId: 'butter', unit: 'g', amount: 200, unitPrice: 400000, totalPrice: 80000, note: 'کره' },
            { materialId: 'strawberry', unit: 'g', amount: 200, unitPrice: 350000, totalPrice: 70000, note: 'توت فرنگی' },
            { materialId: 'blueberry', unit: 'g', amount: 100, unitPrice: 450000, totalPrice: 45000, note: 'بلوبری' }
          ],
          notes: 'دستور پخت دانمارکی با توت‌های تازه',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'danish-cheese',
          productId: 'danish',
          name: 'دستور پخت دانمارکی پنیری',
          materials: [
            { materialId: 'pastry_flour', unit: 'g', amount: 400, unitPrice: 200000, totalPrice: 80000, note: 'آرد شیرینی‌پزی' },
            { materialId: 'butter', unit: 'g', amount: 200, unitPrice: 400000, totalPrice: 80000, note: 'کره' },
            { materialId: 'cheese', unit: 'g', amount: 250, unitPrice: 450000, totalPrice: 112500, note: 'پنیر خامه‌ای' }
          ],
          notes: 'دستور پخت دانمارکی با پنیر خامه‌ای',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Croissant Recipes
        {
          id: 'croissant-classic',
          productId: 'croissant',
          name: 'دستور پخت کروسان کلاسیک',
          materials: [
            { materialId: 'pastry_flour', unit: 'g', amount: 500, unitPrice: 200000, totalPrice: 100000, note: 'آرد شیرینی‌پزی' },
            { materialId: 'butter', unit: 'g', amount: 300, unitPrice: 400000, totalPrice: 120000, note: 'کره' },
            { materialId: 'milk', unit: 'ml', amount: 200, unitPrice: 180000, totalPrice: 36000, note: 'شیر' },
            { materialId: 'yeast', unit: 'g', amount: 10, unitPrice: 400000, totalPrice: 4000, note: 'مخمر' }
          ],
          notes: 'دستور پخت کلاسیک کروسان',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'croissant-chocolate',
          productId: 'croissant',
          name: 'دستور پخت کروسان شکلاتی',
          materials: [
            { materialId: 'pastry_flour', unit: 'g', amount: 500, unitPrice: 200000, totalPrice: 100000, note: 'آرد شیرینی‌پزی' },
            { materialId: 'butter', unit: 'g', amount: 300, unitPrice: 400000, totalPrice: 120000, note: 'کره' },
            { materialId: 'milk', unit: 'ml', amount: 200, unitPrice: 180000, totalPrice: 36000, note: 'شیر' },
            { materialId: 'yeast', unit: 'g', amount: 10, unitPrice: 400000, totalPrice: 4000, note: 'مخمر' },
            { materialId: 'dark_chocolate', unit: 'g', amount: 150, unitPrice: 900000, totalPrice: 135000, note: 'شکلات تلخ' }
          ],
          notes: 'دستور پخت کروسان با شکلات',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'croissant-almond',
          productId: 'croissant',
          name: 'دستور پخت کروسان بادام',
          materials: [
            { materialId: 'pastry_flour', unit: 'g', amount: 500, unitPrice: 200000, totalPrice: 100000, note: 'آرد شیرینی‌پزی' },
            { materialId: 'butter', unit: 'g', amount: 300, unitPrice: 400000, totalPrice: 120000, note: 'کره' },
            { materialId: 'milk', unit: 'ml', amount: 200, unitPrice: 180000, totalPrice: 36000, note: 'شیر' },
            { materialId: 'yeast', unit: 'g', amount: 10, unitPrice: 400000, totalPrice: 4000, note: 'مخمر' },
            { materialId: 'almond', unit: 'g', amount: 150, unitPrice: 1200000, totalPrice: 180000, note: 'بادام' }
          ],
          notes: 'دستور پخت کروسان با بادام',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Apple Strudel Recipes
        {
          id: 'apple-strudel-classic',
          productId: 'apple-strudel',
          name: 'دستور پخت اشترودل سیب کلاسیک',
          materials: [
            { materialId: 'pastry_flour', unit: 'g', amount: 400, unitPrice: 200000, totalPrice: 80000, note: 'آرد شیرینی‌پزی' },
            { materialId: 'butter', unit: 'g', amount: 200, unitPrice: 400000, totalPrice: 80000, note: 'کره' },
            { materialId: 'apple', unit: 'g', amount: 500, unitPrice: 250000, totalPrice: 125000, note: 'سیب' },
            { materialId: 'cinnamon', unit: 'g', amount: 10, unitPrice: 400000, totalPrice: 4000, note: 'دارچین' },
            { materialId: 'raisins', unit: 'g', amount: 100, unitPrice: 300000, totalPrice: 30000, note: 'کشمش' }
          ],
          notes: 'دستور پخت کلاسیک اشترودل سیب',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'apple-strudel-nutty',
          productId: 'apple-strudel',
          name: 'دستور پخت اشترودل سیب مغزدار',
          materials: [
            { materialId: 'pastry_flour', unit: 'g', amount: 400, unitPrice: 200000, totalPrice: 80000, note: 'آرد شیرینی‌پزی' },
            { materialId: 'butter', unit: 'g', amount: 200, unitPrice: 400000, totalPrice: 80000, note: 'کره' },
            { materialId: 'apple', unit: 'g', amount: 500, unitPrice: 250000, totalPrice: 125000, note: 'سیب' },
            { materialId: 'cinnamon', unit: 'g', amount: 10, unitPrice: 400000, totalPrice: 4000, note: 'دارچین' },
            { materialId: 'walnut', unit: 'g', amount: 150, unitPrice: 1500000, totalPrice: 225000, note: 'گردو' },
            { materialId: 'almond', unit: 'g', amount: 100, unitPrice: 1200000, totalPrice: 120000, note: 'بادام' }
          ],
          notes: 'دستور پخت اشترودل سیب با مغزیجات',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'apple-strudel-caramel',
          productId: 'apple-strudel',
          name: 'دستور پخت اشترودل سیب کارامل',
          materials: [
            { materialId: 'pastry_flour', unit: 'g', amount: 400, unitPrice: 200000, totalPrice: 80000, note: 'آرد شیرینی‌پزی' },
            { materialId: 'butter', unit: 'g', amount: 200, unitPrice: 400000, totalPrice: 80000, note: 'کره' },
            { materialId: 'apple', unit: 'g', amount: 500, unitPrice: 250000, totalPrice: 125000, note: 'سیب' },
            { materialId: 'cinnamon', unit: 'g', amount: 10, unitPrice: 400000, totalPrice: 4000, note: 'دارچین' },
            { materialId: 'caramel', unit: 'g', amount: 200, unitPrice: 500000, totalPrice: 100000, note: 'سس کارامل' }
          ],
          notes: 'دستور پخت اشترودل سیب با سس کارامل',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Baklava Recipes
        {
          id: 'baklava-classic',
          productId: 'baklava',
          name: 'دستور پخت باقلوا کلاسیک',
          materials: [
            { materialId: 'pastry_flour', unit: 'g', amount: 500, unitPrice: 200000, totalPrice: 100000, note: 'آرد شیرینی‌پزی' },
            { materialId: 'butter', unit: 'g', amount: 300, unitPrice: 400000, totalPrice: 120000, note: 'کره' },
            { materialId: 'pistachio', unit: 'g', amount: 300, unitPrice: 2000000, totalPrice: 600000, note: 'پسته' },
            { materialId: 'sugar', unit: 'g', amount: 400, unitPrice: 200000, totalPrice: 80000, note: 'شکر' },
            { materialId: 'rosewater', unit: 'ml', amount: 100, unitPrice: 300000, totalPrice: 30000, note: 'گلاب' }
          ],
          notes: 'دستور پخت کلاسیک باقلوا',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'baklava-walnut',
          productId: 'baklava',
          name: 'دستور پخت باقلوا گردویی',
          materials: [
            { materialId: 'pastry_flour', unit: 'g', amount: 500, unitPrice: 200000, totalPrice: 100000, note: 'آرد شیرینی‌پزی' },
            { materialId: 'butter', unit: 'g', amount: 300, unitPrice: 400000, totalPrice: 120000, note: 'کره' },
            { materialId: 'walnut', unit: 'g', amount: 400, unitPrice: 1500000, totalPrice: 600000, note: 'گردو' },
            { materialId: 'sugar', unit: 'g', amount: 400, unitPrice: 200000, totalPrice: 80000, note: 'شکر' },
            { materialId: 'cinnamon', unit: 'g', amount: 10, unitPrice: 400000, totalPrice: 4000, note: 'دارچین' }
          ],
          notes: 'دستور پخت باقلوا با گردو',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'baklava-mixed',
          productId: 'baklava',
          name: 'دستور پخت باقلوا مخلوط',
          materials: [
            { materialId: 'pastry_flour', unit: 'g', amount: 500, unitPrice: 200000, totalPrice: 100000, note: 'آرد شیرینی‌پزی' },
            { materialId: 'butter', unit: 'g', amount: 300, unitPrice: 400000, totalPrice: 120000, note: 'کره' },
            { materialId: 'pistachio', unit: 'g', amount: 200, unitPrice: 2000000, totalPrice: 400000, note: 'پسته' },
            { materialId: 'walnut', unit: 'g', amount: 200, unitPrice: 1500000, totalPrice: 300000, note: 'گردو' },
            { materialId: 'almond', unit: 'g', amount: 100, unitPrice: 1200000, totalPrice: 120000, note: 'بادام' },
            { materialId: 'sugar', unit: 'g', amount: 400, unitPrice: 200000, totalPrice: 80000, note: 'شکر' },
            { materialId: 'rosewater', unit: 'ml', amount: 100, unitPrice: 300000, totalPrice: 30000, note: 'گلاب' },
            { materialId: 'cardamom', unit: 'g', amount: 5, unitPrice: 600000, totalPrice: 3000, note: 'هل' }
          ],
          notes: 'دستور پخت باقلوا با مغزیجات مخلوط',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Milkshake Recipes
        {
          id: 'milkshake-vanilla',
          productId: 'milkshake',
          name: 'دستور تهیه میلک‌شیک وانیلی',
          materials: [
            { materialId: 'milk', unit: 'ml', amount: 300, unitPrice: 180000, totalPrice: 54000, note: 'شیر سرد' },
            { materialId: 'vanilla_ice', unit: 'g', amount: 200, unitPrice: 350000, totalPrice: 70000, note: 'بستنی وانیلی' },
            { materialId: 'vanilla', unit: 'g', amount: 5, unitPrice: 900000, totalPrice: 4500, note: 'وانیل' },
            { materialId: 'whipping_cream', unit: 'ml', amount: 100, unitPrice: 300000, totalPrice: 30000, note: 'خامه فرم' }
          ],
          notes: 'دستور تهیه میلک‌شیک وانیلی کلاسیک',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'milkshake-chocolate',
          productId: 'milkshake',
          name: 'دستور تهیه میلک‌شیک شکلاتی',
          materials: [
            { materialId: 'milk', unit: 'ml', amount: 300, unitPrice: 180000, totalPrice: 54000, note: 'شیر سرد' },
            { materialId: 'chocolate_ice', unit: 'g', amount: 200, unitPrice: 350000, totalPrice: 70000, note: 'بستنی شکلاتی' },
            { materialId: 'chocolate', unit: 'g', amount: 50, unitPrice: 800000, totalPrice: 40000, note: 'شکلات' },
            { materialId: 'whipping_cream', unit: 'ml', amount: 100, unitPrice: 300000, totalPrice: 30000, note: 'خامه فرم' }
          ],
          notes: 'دستور تهیه میلک‌شیک شکلاتی',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'milkshake-caramel',
          productId: 'milkshake',
          name: 'دستور تهیه میلک‌شیک کارامل',
          materials: [
            { materialId: 'milk', unit: 'ml', amount: 300, unitPrice: 180000, totalPrice: 54000, note: 'شیر سرد' },
            { materialId: 'vanilla_ice', unit: 'g', amount: 200, unitPrice: 350000, totalPrice: 70000, note: 'بستنی وانیلی' },
            { materialId: 'caramel', unit: 'g', amount: 100, unitPrice: 500000, totalPrice: 50000, note: 'سس کارامل' },
            { materialId: 'whipping_cream', unit: 'ml', amount: 100, unitPrice: 300000, totalPrice: 30000, note: 'خامه فرم' }
          ],
          notes: 'دستور تهیه میلک‌شیک کارامل',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Ice Coffee Recipes
        {
          id: 'ice-coffee-classic',
          productId: 'ice-coffee',
          name: 'دستور تهیه قهوه سرد کلاسیک',
          materials: [
            { materialId: 'coffee', unit: 'ml', amount: 200, unitPrice: 500000, totalPrice: 100000, note: 'قهوه اسپرسو' },
            { materialId: 'milk', unit: 'ml', amount: 200, unitPrice: 180000, totalPrice: 36000, note: 'شیر سرد' },
            { materialId: 'ice', unit: 'g', amount: 200, unitPrice: 50000, totalPrice: 10000, note: 'یخ' }
          ],
          notes: 'دستور تهیه قهوه سرد کلاسیک',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'ice-coffee-mocha',
          productId: 'ice-coffee',
          name: 'دستور تهیه قهوه سرد موکا',
          materials: [
            { materialId: 'coffee', unit: 'ml', amount: 200, unitPrice: 500000, totalPrice: 100000, note: 'قهوه اسپرسو' },
            { materialId: 'milk', unit: 'ml', amount: 200, unitPrice: 180000, totalPrice: 36000, note: 'شیر سرد' },
            { materialId: 'chocolate', unit: 'g', amount: 50, unitPrice: 800000, totalPrice: 40000, note: 'شکلات' },
            { materialId: 'whipping_cream', unit: 'ml', amount: 100, unitPrice: 300000, totalPrice: 30000, note: 'خامه فرم' },
            { materialId: 'ice', unit: 'g', amount: 200, unitPrice: 50000, totalPrice: 10000, note: 'یخ' }
          ],
          notes: 'دستور تهیه قهوه سرد موکا',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'ice-coffee-caramel',
          productId: 'ice-coffee',
          name: 'دستور تهیه قهوه سرد کارامل',
          materials: [
            { materialId: 'coffee', unit: 'ml', amount: 200, unitPrice: 500000, totalPrice: 100000, note: 'قهوه اسپرسو' },
            { materialId: 'milk', unit: 'ml', amount: 200, unitPrice: 180000, totalPrice: 36000, note: 'شیر سرد' },
            { materialId: 'caramel', unit: 'g', amount: 50, unitPrice: 500000, totalPrice: 25000, note: 'سس کارامل' },
            { materialId: 'whipping_cream', unit: 'ml', amount: 100, unitPrice: 300000, totalPrice: 30000, note: 'خامه فرم' },
            { materialId: 'ice', unit: 'g', amount: 200, unitPrice: 50000, totalPrice: 10000, note: 'یخ' }
          ],
          notes: 'دستور تهیه قهوه سرد کارامل',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Mango Lassi Recipes
        {
          id: 'mango-lassi-classic',
          productId: 'mango-lassi',
          name: 'دستور تهیه لاسی انبه کلاسیک',
          materials: [
            { materialId: 'mango', unit: 'g', amount: 300, unitPrice: 380000, totalPrice: 114000, note: 'انبه تازه' },
            { materialId: 'yogurt', unit: 'g', amount: 300, unitPrice: 160000, totalPrice: 48000, note: 'ماست' },
            { materialId: 'milk', unit: 'ml', amount: 100, unitPrice: 180000, totalPrice: 18000, note: 'شیر' },
            { materialId: 'cardamom', unit: 'g', amount: 2, unitPrice: 600000, totalPrice: 1200, note: 'هل' }
          ],
          notes: 'دستور تهیه لاسی انبه به سبک هندی',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'mango-lassi-saffron',
          productId: 'mango-lassi',
          name: 'دستور تهیه لاسی انبه زعفرانی',
          materials: [
            { materialId: 'mango', unit: 'g', amount: 300, unitPrice: 380000, totalPrice: 114000, note: 'انبه تازه' },
            { materialId: 'yogurt', unit: 'g', amount: 300, unitPrice: 160000, totalPrice: 48000, note: 'ماست' },
            { materialId: 'milk', unit: 'ml', amount: 100, unitPrice: 180000, totalPrice: 18000, note: 'شیر' },
            { materialId: 'saffron', unit: 'g', amount: 0.5, unitPrice: 12000000, totalPrice: 6000, note: 'زعفران' },
            { materialId: 'cardamom', unit: 'g', amount: 2, unitPrice: 600000, totalPrice: 1200, note: 'هل' }
          ],
          notes: 'دستور تهیه لاسی انبه با زعفران',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'mango-lassi-pistachio',
          productId: 'mango-lassi',
          name: 'دستور تهیه لاسی انبه با پسته',
          materials: [
            { materialId: 'mango', unit: 'g', amount: 300, unitPrice: 380000, totalPrice: 114000, note: 'انبه تازه' },
            { materialId: 'yogurt', unit: 'g', amount: 300, unitPrice: 160000, totalPrice: 48000, note: 'ماست' },
            { materialId: 'milk', unit: 'ml', amount: 100, unitPrice: 180000, totalPrice: 18000, note: 'شیر' },
            { materialId: 'pistachio', unit: 'g', amount: 50, unitPrice: 2000000, totalPrice: 100000, note: 'پسته' },
            { materialId: 'cardamom', unit: 'g', amount: 2, unitPrice: 600000, totalPrice: 1200, note: 'هل' }
          ],
          notes: 'دستور تهیه لاسی انبه با تزیین پسته',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Berry Blast Recipes
        {
          id: 'berry-blast-classic',
          productId: 'berry-blast',
          name: 'دستور تهیه اسموتی توت‌ها کلاسیک',
          materials: [
            { materialId: 'strawberry', unit: 'g', amount: 200, unitPrice: 350000, totalPrice: 70000, note: 'توت فرنگی تازه' },
            { materialId: 'raspberry', unit: 'g', amount: 100, unitPrice: 400000, totalPrice: 40000, note: 'تمشک تازه' },
            { materialId: 'blueberry', unit: 'g', amount: 100, unitPrice: 450000, totalPrice: 45000, note: 'بلوبری تازه' },
            { materialId: 'yogurt', unit: 'g', amount: 200, unitPrice: 160000, totalPrice: 32000, note: 'ماست' }
          ],
          notes: 'دستور تهیه اسموتی با مخلوط توت‌ها',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'berry-blast-cream',
          productId: 'berry-blast',
          name: 'دستور تهیه اسموتی توت‌ها خامه‌ای',
          materials: [
            { materialId: 'strawberry', unit: 'g', amount: 200, unitPrice: 350000, totalPrice: 70000, note: 'توت فرنگی تازه' },
            { materialId: 'raspberry', unit: 'g', amount: 100, unitPrice: 400000, totalPrice: 40000, note: 'تمشک تازه' },
            { materialId: 'blueberry', unit: 'g', amount: 100, unitPrice: 450000, totalPrice: 45000, note: 'بلوبری تازه' },
            { materialId: 'whipping_cream', unit: 'ml', amount: 100, unitPrice: 300000, totalPrice: 30000, note: 'خامه فرم' },
            { materialId: 'vanilla', unit: 'g', amount: 5, unitPrice: 900000, totalPrice: 4500, note: 'وانیل' }
          ],
          notes: 'دستور تهیه اسموتی توت‌ها با خامه',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'berry-blast-honey',
          productId: 'berry-blast',
          name: 'دستور تهیه اسموتی توت‌ها با عسل',
          materials: [
            { materialId: 'strawberry', unit: 'g', amount: 200, unitPrice: 350000, totalPrice: 70000, note: 'توت فرنگی تازه' },
            { materialId: 'raspberry', unit: 'g', amount: 100, unitPrice: 400000, totalPrice: 40000, note: 'تمشک تازه' },
            { materialId: 'blueberry', unit: 'g', amount: 100, unitPrice: 450000, totalPrice: 45000, note: 'بلوبری تازه' },
            { materialId: 'yogurt', unit: 'g', amount: 200, unitPrice: 160000, totalPrice: 32000, note: 'ماست' },
            { materialId: 'honey', unit: 'g', amount: 50, unitPrice: 900000, totalPrice: 45000, note: 'عسل طبیعی' }
          ],
          notes: 'دستور تهیه اسموتی توت‌ها با عسل',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Mint Lemonade Recipes
        {
          id: 'mint-lemonade-classic',
          productId: 'mint-lemonade',
          name: 'دستور تهیه لیموناد نعناع کلاسیک',
          materials: [
            { materialId: 'lemon', unit: 'g', amount: 300, unitPrice: 250000, totalPrice: 75000, note: 'لیمو تازه' },
            { materialId: 'mint', unit: 'g', amount: 50, unitPrice: 200000, totalPrice: 10000, note: 'نعناع تازه' },
            { materialId: 'sugar', unit: 'g', amount: 100, unitPrice: 200000, totalPrice: 20000, note: 'شکر' },
            { materialId: 'ice', unit: 'g', amount: 200, unitPrice: 50000, totalPrice: 10000, note: 'یخ' }
          ],
          notes: 'دستور تهیه لیموناد نعناع کلاسیک',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'mint-lemonade-honey',
          productId: 'mint-lemonade',
          name: 'دستور تهیه لیموناد نعناع با عسل',
          materials: [
            { materialId: 'lemon', unit: 'g', amount: 300, unitPrice: 250000, totalPrice: 75000, note: 'لیمو تازه' },
            { materialId: 'mint', unit: 'g', amount: 50, unitPrice: 200000, totalPrice: 10000, note: 'نعناع تازه' },
            { materialId: 'honey', unit: 'g', amount: 80, unitPrice: 900000, totalPrice: 72000, note: 'عسل طبیعی' },
            { materialId: 'ice', unit: 'g', amount: 200, unitPrice: 50000, totalPrice: 10000, note: 'یخ' }
          ],
          notes: 'دستور تهیه لیموناد نعناع با عسل طبیعی',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'mint-lemonade-ginger',
          productId: 'mint-lemonade',
          name: 'دستور تهیه لیموناد نعناع زنجبیلی',
          materials: [
            { materialId: 'lemon', unit: 'g', amount: 300, unitPrice: 250000, totalPrice: 75000, note: 'لیمو تازه' },
            { materialId: 'mint', unit: 'g', amount: 50, unitPrice: 200000, totalPrice: 10000, note: 'نعناع تازه' },
            { materialId: 'ginger', unit: 'g', amount: 30, unitPrice: 300000, totalPrice: 9000, note: 'زنجبیل تازه' },
            { materialId: 'honey', unit: 'g', amount: 80, unitPrice: 900000, totalPrice: 72000, note: 'عسل طبیعی' },
            { materialId: 'ice', unit: 'g', amount: 200, unitPrice: 50000, totalPrice: 10000, note: 'یخ' }
          ],
          notes: 'دستور تهیه لیموناد نعناع با زنجبیل',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Vanilla Ice Cream Recipes
        {
          id: 'vanilla-ice-classic',
          productId: 'vanilla-ice',
          name: 'دستور تهیه بستنی وانیلی کلاسیک',
          materials: [
            { materialId: 'milk', unit: 'ml', amount: 1000, unitPrice: 180000, totalPrice: 180000, note: 'شیر پرچرب' },
            { materialId: 'cream', unit: 'ml', amount: 500, unitPrice: 250000, totalPrice: 125000, note: 'خامه' },
            { materialId: 'vanilla', unit: 'g', amount: 10, unitPrice: 900000, totalPrice: 9000, note: 'وانیل' },
            { materialId: 'sugar', unit: 'g', amount: 300, unitPrice: 200000, totalPrice: 60000, note: 'شکر' }
          ],
          notes: 'دستور تهیه بستنی وانیلی کلاسیک',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'vanilla-ice-premium',
          productId: 'vanilla-ice',
          name: 'دستور تهیه بستنی وانیلی مجلسی',
          materials: [
            { materialId: 'milk', unit: 'ml', amount: 1000, unitPrice: 180000, totalPrice: 180000, note: 'شیر پرچرب' },
            { materialId: 'cream', unit: 'ml', amount: 700, unitPrice: 250000, totalPrice: 175000, note: 'خامه' },
            { materialId: 'vanilla', unit: 'g', amount: 15, unitPrice: 900000, totalPrice: 13500, note: 'وانیل' },
            { materialId: 'sugar', unit: 'g', amount: 300, unitPrice: 200000, totalPrice: 60000, note: 'شکر' },
            { materialId: 'pistachio', unit: 'g', amount: 100, unitPrice: 2000000, totalPrice: 200000, note: 'پسته' }
          ],
          notes: 'دستور تهیه بستنی وانیلی مجلسی با تزیین پسته',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'vanilla-ice-caramel',
          productId: 'vanilla-ice',
          name: 'دستور تهیه بستنی وانیلی کارامل',
          materials: [
            { materialId: 'milk', unit: 'ml', amount: 1000, unitPrice: 180000, totalPrice: 180000, note: 'شیر پرچرب' },
            { materialId: 'cream', unit: 'ml', amount: 500, unitPrice: 250000, totalPrice: 125000, note: 'خامه' },
            { materialId: 'vanilla', unit: 'g', amount: 10, unitPrice: 900000, totalPrice: 9000, note: 'وانیل' },
            { materialId: 'sugar', unit: 'g', amount: 300, unitPrice: 200000, totalPrice: 60000, note: 'شکر' },
            { materialId: 'caramel', unit: 'g', amount: 200, unitPrice: 500000, totalPrice: 100000, note: 'سس کارامل' }
          ],
          notes: 'دستور تهیه بستنی وانیلی با سس کارامل',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Chocolate Ice Cream Recipes
        {
          id: 'chocolate-ice-classic',
          productId: 'chocolate-ice',
          name: 'دستور تهیه بستنی شکلاتی کلاسیک',
          materials: [
            { materialId: 'milk', unit: 'ml', amount: 1000, unitPrice: 180000, totalPrice: 180000, note: 'شیر پرچرب' },
            { materialId: 'cream', unit: 'ml', amount: 500, unitPrice: 250000, totalPrice: 125000, note: 'خامه' },
            { materialId: 'cocoa', unit: 'g', amount: 100, unitPrice: 600000, totalPrice: 60000, note: 'پودر کاکائو' },
            { materialId: 'sugar', unit: 'g', amount: 300, unitPrice: 200000, totalPrice: 60000, note: 'شکر' }
          ],
          notes: 'دستور تهیه بستنی شکلاتی کلاسیک',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'chocolate-ice-dark',
          productId: 'chocolate-ice',
          name: 'دستور تهیه بستنی شکلات تلخ',
          materials: [
            { materialId: 'milk', unit: 'ml', amount: 1000, unitPrice: 180000, totalPrice: 180000, note: 'شیر پرچرب' },
            { materialId: 'cream', unit: 'ml', amount: 500, unitPrice: 250000, totalPrice: 125000, note: 'خامه' },
            { materialId: 'dark_chocolate', unit: 'g', amount: 200, unitPrice: 900000, totalPrice: 180000, note: 'شکلات تلخ' },
            { materialId: 'cocoa', unit: 'g', amount: 50, unitPrice: 600000, totalPrice: 30000, note: 'پودر کاکائو' },
            { materialId: 'sugar', unit: 'g', amount: 250, unitPrice: 200000, totalPrice: 50000, note: 'شکر' }
          ],
          notes: 'دستور تهیه بستنی با شکلات تلخ',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'chocolate-ice-nutty',
          productId: 'chocolate-ice',
          name: 'دستور تهیه بستنی شکلاتی مغزدار',
          materials: [
            { materialId: 'milk', unit: 'ml', amount: 1000, unitPrice: 180000, totalPrice: 180000, note: 'شیر پرچرب' },
            { materialId: 'cream', unit: 'ml', amount: 500, unitPrice: 250000, totalPrice: 125000, note: 'خامه' },
            { materialId: 'cocoa', unit: 'g', amount: 100, unitPrice: 600000, totalPrice: 60000, note: 'پودر کاکائو' },
            { materialId: 'sugar', unit: 'g', amount: 300, unitPrice: 200000, totalPrice: 60000, note: 'شکر' },
            { materialId: 'walnut', unit: 'g', amount: 150, unitPrice: 1500000, totalPrice: 225000, note: 'گردو' },
            { materialId: 'almond', unit: 'g', amount: 100, unitPrice: 1200000, totalPrice: 120000, note: 'بادام' }
          ],
          notes: 'دستور تهیه بستنی شکلاتی با مغزیجات',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Faloodeh Recipes
        {
          id: 'faloodeh-classic',
          productId: 'faloodeh',
          name: 'دستور تهیه فالوده کلاسیک',
          materials: [
            { materialId: 'rice_noodles', unit: 'g', amount: 500, unitPrice: 300000, totalPrice: 150000, note: 'رشته فالوده' },
            { materialId: 'sugar', unit: 'g', amount: 400, unitPrice: 200000, totalPrice: 80000, note: 'شکر' },
            { materialId: 'rosewater', unit: 'ml', amount: 100, unitPrice: 300000, totalPrice: 30000, note: 'گلاب' },
            { materialId: 'lime', unit: 'ml', amount: 50, unitPrice: 200000, totalPrice: 10000, note: 'آب لیمو' }
          ],
          notes: 'دستور تهیه فالوده سنتی',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'faloodeh-saffron',
          productId: 'faloodeh',
          name: 'دستور تهیه فالوده زعفرانی',
          materials: [
            { materialId: 'rice_noodles', unit: 'g', amount: 500, unitPrice: 300000, totalPrice: 150000, note: 'رشته فالوده' },
            { materialId: 'sugar', unit: 'g', amount: 400, unitPrice: 200000, totalPrice: 80000, note: 'شکر' },
            { materialId: 'rosewater', unit: 'ml', amount: 100, unitPrice: 300000, totalPrice: 30000, note: 'گلاب' },
            { materialId: 'lime', unit: 'ml', amount: 50, unitPrice: 200000, totalPrice: 10000, note: 'آب لیمو' },
            { materialId: 'saffron', unit: 'g', amount: 1, unitPrice: 12000000, totalPrice: 12000, note: 'زعفران' }
          ],
          notes: 'دستور تهیه فالوده زعفرانی',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'faloodeh-cherry',
          productId: 'faloodeh',
          name: 'دستور تهیه فالوده آلبالو',
          materials: [
            { materialId: 'rice_noodles', unit: 'g', amount: 500, unitPrice: 300000, totalPrice: 150000, note: 'رشته فالوده' },
            { materialId: 'sugar', unit: 'g', amount: 400, unitPrice: 200000, totalPrice: 80000, note: 'شکر' },
            { materialId: 'rosewater', unit: 'ml', amount: 100, unitPrice: 300000, totalPrice: 30000, note: 'گلاب' },
            { materialId: 'lime', unit: 'ml', amount: 50, unitPrice: 200000, totalPrice: 10000, note: 'آب لیمو' },
            { materialId: 'cherry_syrup', unit: 'ml', amount: 200, unitPrice: 400000, totalPrice: 80000, note: 'شربت آلبالو' }
          ],
          notes: 'دستور تهیه فالوده با شربت آلبالو',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Vanilla Cake Recipes
        {
          id: 'vanilla-cake-classic',
          productId: 'vanilla-cake',
          name: 'دستور پخت کیک وانیلی کلاسیک',
          materials: [
            { materialId: 'cake_flour', unit: 'g', amount: 500, unitPrice: 180000, totalPrice: 90000, note: 'آرد کیک' },
            { materialId: 'sugar', unit: 'g', amount: 300, unitPrice: 200000, totalPrice: 60000, note: 'شکر' },
            { materialId: 'butter', unit: 'g', amount: 200, unitPrice: 400000, totalPrice: 80000, note: 'کره' },
            { materialId: 'milk', unit: 'ml', amount: 250, unitPrice: 180000, totalPrice: 45000, note: 'شیر' },
            { materialId: 'vanilla', unit: 'g', amount: 10, unitPrice: 900000, totalPrice: 9000, note: 'وانیل' }
          ],
          notes: 'دستور پخت کلاسیک کیک وانیلی',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'vanilla-cake-deluxe',
          productId: 'vanilla-cake',
          name: 'دستور پخت کیک وانیلی مجلسی',
          materials: [
            { materialId: 'cake_flour', unit: 'g', amount: 500, unitPrice: 180000, totalPrice: 90000, note: 'آرد کیک' },
            { materialId: 'sugar', unit: 'g', amount: 300, unitPrice: 200000, totalPrice: 60000, note: 'شکر' },
            { materialId: 'butter', unit: 'g', amount: 200, unitPrice: 400000, totalPrice: 80000, note: 'کره' },
            { materialId: 'milk', unit: 'ml', amount: 250, unitPrice: 180000, totalPrice: 45000, note: 'شیر' },
            { materialId: 'vanilla', unit: 'g', amount: 15, unitPrice: 900000, totalPrice: 13500, note: 'وانیل' },
            { materialId: 'whipping_cream', unit: 'ml', amount: 300, unitPrice: 300000, totalPrice: 90000, note: 'خامه فرم' }
          ],
          notes: 'دستور پخت کیک وانیلی مجلسی با روکش خامه',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'vanilla-cake-almond',
          productId: 'vanilla-cake',
          name: 'دستور پخت کیک وانیلی بادام',
          materials: [
            { materialId: 'cake_flour', unit: 'g', amount: 500, unitPrice: 180000, totalPrice: 90000, note: 'آرد کیک' },
            { materialId: 'sugar', unit: 'g', amount: 300, unitPrice: 200000, totalPrice: 60000, note: 'شکر' },
            { materialId: 'butter', unit: 'g', amount: 200, unitPrice: 400000, totalPrice: 80000, note: 'کره' },
            { materialId: 'milk', unit: 'ml', amount: 250, unitPrice: 180000, totalPrice: 45000, note: 'شیر' },
            { materialId: 'vanilla', unit: 'g', amount: 10, unitPrice: 900000, totalPrice: 9000, note: 'وانیل' },
            { materialId: 'almond', unit: 'g', amount: 150, unitPrice: 1200000, totalPrice: 180000, note: 'بادام' }
          ],
          notes: 'دستور پخت کیک وانیلی با بادام',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Fruit Cake Recipes
        {
          id: 'fruit-cake-classic',
          productId: 'fruit-cake',
          name: 'دستور پخت کیک میوه‌ای کلاسیک',
          materials: [
            { materialId: 'cake_flour', unit: 'g', amount: 500, unitPrice: 180000, totalPrice: 90000, note: 'آرد کیک' },
            { materialId: 'sugar', unit: 'g', amount: 300, unitPrice: 200000, totalPrice: 60000, note: 'شکر' },
            { materialId: 'butter', unit: 'g', amount: 200, unitPrice: 400000, totalPrice: 80000, note: 'کره' },
            { materialId: 'milk', unit: 'ml', amount: 200, unitPrice: 180000, totalPrice: 36000, note: 'شیر' },
            { materialId: 'strawberry', unit: 'g', amount: 200, unitPrice: 350000, totalPrice: 70000, note: 'توت فرنگی' },
            { materialId: 'blueberry', unit: 'g', amount: 150, unitPrice: 450000, totalPrice: 67500, note: 'بلوبری' }
          ],
          notes: 'دستور پخت کلاسیک کیک میوه‌ای',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'fruit-cake-tropical',
          productId: 'fruit-cake',
          name: 'دستور پخت کیک میوه‌های استوایی',
          materials: [
            { materialId: 'cake_flour', unit: 'g', amount: 500, unitPrice: 180000, totalPrice: 90000, note: 'آرد کیک' },
            { materialId: 'sugar', unit: 'g', amount: 300, unitPrice: 200000, totalPrice: 60000, note: 'شکر' },
            { materialId: 'butter', unit: 'g', amount: 200, unitPrice: 400000, totalPrice: 80000, note: 'کره' },
            { materialId: 'milk', unit: 'ml', amount: 200, unitPrice: 180000, totalPrice: 36000, note: 'شیر' },
            { materialId: 'mango', unit: 'g', amount: 250, unitPrice: 380000, totalPrice: 95000, note: 'انبه' },
            { materialId: 'banana', unit: 'g', amount: 200, unitPrice: 280000, totalPrice: 56000, note: 'موز' }
          ],
          notes: 'دستور پخت کیک با میوه‌های استوایی',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'fruit-cake-berry',
          productId: 'fruit-cake',
          name: 'دستور پخت کیک توت‌ها',
          materials: [
            { materialId: 'cake_flour', unit: 'g', amount: 500, unitPrice: 180000, totalPrice: 90000, note: 'آرد کیک' },
            { materialId: 'sugar', unit: 'g', amount: 300, unitPrice: 200000, totalPrice: 60000, note: 'شکر' },
            { materialId: 'butter', unit: 'g', amount: 200, unitPrice: 400000, totalPrice: 80000, note: 'کره' },
            { materialId: 'milk', unit: 'ml', amount: 200, unitPrice: 180000, totalPrice: 36000, note: 'شیر' },
            { materialId: 'raspberry', unit: 'g', amount: 200, unitPrice: 400000, totalPrice: 80000, note: 'تمشک' },
            { materialId: 'blueberry', unit: 'g', amount: 150, unitPrice: 450000, totalPrice: 67500, note: 'بلوبری' },
            { materialId: 'strawberry', unit: 'g', amount: 150, unitPrice: 350000, totalPrice: 52500, note: 'توت فرنگی' }
          ],
          notes: 'دستور پخت کیک با انواع توت‌ها',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Tiramisu Cake Recipes
        {
          id: 'tiramisu-cake-classic',
          productId: 'tiramisu-cake',
          name: 'دستور پخت تیرامیسو کلاسیک',
          materials: [
            { materialId: 'cake_flour', unit: 'g', amount: 400, unitPrice: 180000, totalPrice: 72000, note: 'آرد کیک' },
            { materialId: 'sugar', unit: 'g', amount: 250, unitPrice: 200000, totalPrice: 50000, note: 'شکر' },
            { materialId: 'coffee', unit: 'ml', amount: 300, unitPrice: 500000, totalPrice: 150000, note: 'قهوه اسپرسو' },
            { materialId: 'whipping_cream', unit: 'ml', amount: 500, unitPrice: 300000, totalPrice: 150000, note: 'خامه فرم' },
            { materialId: 'cocoa', unit: 'g', amount: 50, unitPrice: 600000, totalPrice: 30000, note: 'پودر کاکائو' }
          ],
          notes: 'دستور پخت کلاسیک تیرامیسو',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'tiramisu-cake-chocolate',
          productId: 'tiramisu-cake',
          name: 'دستور پخت تیرامیسو شکلاتی',
          materials: [
            { materialId: 'cake_flour', unit: 'g', amount: 400, unitPrice: 180000, totalPrice: 72000, note: 'آرد کیک' },
            { materialId: 'sugar', unit: 'g', amount: 250, unitPrice: 200000, totalPrice: 50000, note: 'شکر' },
            { materialId: 'coffee', unit: 'ml', amount: 300, unitPrice: 500000, totalPrice: 150000, note: 'قهوه اسپرسو' },
            { materialId: 'whipping_cream', unit: 'ml', amount: 500, unitPrice: 300000, totalPrice: 150000, note: 'خامه فرم' },
            { materialId: 'dark_chocolate', unit: 'g', amount: 200, unitPrice: 900000, totalPrice: 180000, note: 'شکلات تلخ' },
            { materialId: 'cocoa', unit: 'g', amount: 50, unitPrice: 600000, totalPrice: 30000, note: 'پودر کاکائو' }
          ],
          notes: 'دستور پخت تیرامیسو با شکلات تلخ',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'tiramisu-cake-caramel',
          productId: 'tiramisu-cake',
          name: 'دستور پخت تیرامیسو کارامل',
          materials: [
            { materialId: 'cake_flour', unit: 'g', amount: 400, unitPrice: 180000, totalPrice: 72000, note: 'آرد کیک' },
            { materialId: 'sugar', unit: 'g', amount: 250, unitPrice: 200000, totalPrice: 50000, note: 'شکر' },
            { materialId: 'coffee', unit: 'ml', amount: 300, unitPrice: 500000, totalPrice: 150000, note: 'قهوه اسپرسو' },
            { materialId: 'whipping_cream', unit: 'ml', amount: 500, unitPrice: 300000, totalPrice: 150000, note: 'خامه فرم' },
            { materialId: 'caramel', unit: 'g', amount: 150, unitPrice: 500000, totalPrice: 75000, note: 'سس کارامل' },
            { materialId: 'cocoa', unit: 'g', amount: 30, unitPrice: 600000, totalPrice: 18000, note: 'پودر کاکائو' }
          ],
          notes: 'دستور پخت تیرامیسو با سس کارامل',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Additional Red Velvet Recipe
        {
          id: 'red-velvet-nutty',
          productId: 'red-velvet',
          name: 'دستور پخت کیک رد ولوت مغزدار',
          materials: [
            { materialId: 'cake_flour', unit: 'g', amount: 500, unitPrice: 180000, totalPrice: 90000, note: 'آرد کیک' },
            { materialId: 'sugar', unit: 'g', amount: 300, unitPrice: 200000, totalPrice: 60000, note: 'شکر سفید' },
            { materialId: 'butter', unit: 'g', amount: 200, unitPrice: 400000, totalPrice: 80000, note: 'کره' },
            { materialId: 'whipping_cream', unit: 'ml', amount: 400, unitPrice: 300000, totalPrice: 120000, note: 'خامه فرم' },
            { materialId: 'food_color', unit: 'ml', amount: 20, unitPrice: 500000, totalPrice: 10000, note: 'رنگ خوراکی قرمز' },
            { materialId: 'walnut', unit: 'g', amount: 150, unitPrice: 1500000, totalPrice: 225000, note: 'گردو' },
            { materialId: 'almond', unit: 'g', amount: 100, unitPrice: 1200000, totalPrice: 120000, note: 'بادام' }
          ],
          notes: 'دستور پخت کیک رد ولوت با مغزیجات',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Additional Carrot Cake Recipe
        {
          id: 'carrot-cake-cream-cheese',
          productId: 'carrot-cake',
          name: 'دستور پخت کیک هویج با کرم پنیر',
          materials: [
            { materialId: 'flour', unit: 'g', amount: 400, unitPrice: 150000, totalPrice: 60000, note: 'آرد' },
            { materialId: 'sugar', unit: 'g', amount: 250, unitPrice: 200000, totalPrice: 50000, note: 'شکر' },
            { materialId: 'carrot', unit: 'g', amount: 300, unitPrice: 100000, totalPrice: 30000, note: 'هویج رنده شده' },
            { materialId: 'cinnamon', unit: 'g', amount: 10, unitPrice: 400000, totalPrice: 4000, note: 'دارچین' },
            { materialId: 'cheese', unit: 'g', amount: 300, unitPrice: 450000, totalPrice: 135000, note: 'پنیر خامه‌ای' },
            { materialId: 'vanilla', unit: 'g', amount: 5, unitPrice: 900000, totalPrice: 4500, note: 'وانیل' }
          ],
          notes: 'دستور پخت کیک هویج با روکش کرم پنیر',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Halva Recipes
        {
          id: 'halva-classic',
          productId: 'halva',
          name: 'دستور پخت حلوا سنتی',
          materials: [
            { materialId: 'flour', unit: 'g', amount: 500, unitPrice: 150000, totalPrice: 75000, note: 'آرد گندم' },
            { materialId: 'sugar', unit: 'g', amount: 400, unitPrice: 200000, totalPrice: 80000, note: 'شکر' },
            { materialId: 'oil', unit: 'ml', amount: 300, unitPrice: 250000, totalPrice: 75000, note: 'روغن مایع' },
            { materialId: 'saffron', unit: 'g', amount: 0.5, unitPrice: 12000000, totalPrice: 6000, note: 'زعفران' },
            { materialId: 'cardamom', unit: 'g', amount: 5, unitPrice: 600000, totalPrice: 3000, note: 'هل' }
          ],
          notes: 'دستور پخت سنتی حلوا',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'halva-carrot',
          productId: 'halva',
          name: 'دستور پخت حلوای هویج',
          materials: [
            { materialId: 'carrot', unit: 'g', amount: 1000, unitPrice: 100000, totalPrice: 100000, note: 'هویج' },
            { materialId: 'sugar', unit: 'g', amount: 400, unitPrice: 200000, totalPrice: 80000, note: 'شکر' },
            { materialId: 'flour', unit: 'g', amount: 200, unitPrice: 150000, totalPrice: 30000, note: 'آرد گندم' },
            { materialId: 'oil', unit: 'ml', amount: 200, unitPrice: 250000, totalPrice: 50000, note: 'روغن مایع' },
            { materialId: 'cardamom', unit: 'g', amount: 5, unitPrice: 600000, totalPrice: 3000, note: 'هل' }
          ],
          notes: 'دستور پخت حلوا با هویج',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'halva-date',
          productId: 'halva',
          name: 'دستور پخت حلوای خرما',
          materials: [
            { materialId: 'date', unit: 'g', amount: 500, unitPrice: 300000, totalPrice: 150000, note: 'خرما' },
            { materialId: 'flour', unit: 'g', amount: 300, unitPrice: 150000, totalPrice: 45000, note: 'آرد گندم' },
            { materialId: 'oil', unit: 'ml', amount: 200, unitPrice: 250000, totalPrice: 50000, note: 'روغن مایع' },
            { materialId: 'cinnamon', unit: 'g', amount: 10, unitPrice: 400000, totalPrice: 4000, note: 'دارچین' },
            { materialId: 'walnut', unit: 'g', amount: 100, unitPrice: 1500000, totalPrice: 150000, note: 'گردو' }
          ],
          notes: 'دستور پخت حلوا با خرما',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Ranginak Recipes
        {
          id: 'ranginak-classic',
          productId: 'ranginak',
          name: 'دستور پخت رنگینک سنتی',
          materials: [
            { materialId: 'date', unit: 'g', amount: 500, unitPrice: 300000, totalPrice: 150000, note: 'خرما' },
            { materialId: 'flour', unit: 'g', amount: 300, unitPrice: 150000, totalPrice: 45000, note: 'آرد گندم' },
            { materialId: 'walnut', unit: 'g', amount: 200, unitPrice: 1500000, totalPrice: 300000, note: 'گردو' },
            { materialId: 'cinnamon', unit: 'g', amount: 10, unitPrice: 400000, totalPrice: 4000, note: 'دارچین' }
          ],
          notes: 'دستور پخت سنتی رنگینک',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'ranginak-pistachio',
          productId: 'ranginak',
          name: 'دستور پخت رنگینک پسته‌ای',
          materials: [
            { materialId: 'date', unit: 'g', amount: 500, unitPrice: 300000, totalPrice: 150000, note: 'خرما' },
            { materialId: 'flour', unit: 'g', amount: 300, unitPrice: 150000, totalPrice: 45000, note: 'آرد گندم' },
            { materialId: 'pistachio', unit: 'g', amount: 200, unitPrice: 2000000, totalPrice: 400000, note: 'پسته' },
            { materialId: 'cinnamon', unit: 'g', amount: 10, unitPrice: 400000, totalPrice: 4000, note: 'دارچین' },
            { materialId: 'cardamom', unit: 'g', amount: 5, unitPrice: 600000, totalPrice: 3000, note: 'هل' }
          ],
          notes: 'دستور پخت رنگینک با پسته',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },
        {
          id: 'ranginak-mixed',
          productId: 'ranginak',
          name: 'دستور پخت رنگینک مخلوط',
          materials: [
            { materialId: 'date', unit: 'g', amount: 500, unitPrice: 300000, totalPrice: 150000, note: 'خرما' },
            { materialId: 'flour', unit: 'g', amount: 300, unitPrice: 150000, totalPrice: 45000, note: 'آرد گندم' },
            { materialId: 'walnut', unit: 'g', amount: 100, unitPrice: 1500000, totalPrice: 150000, note: 'گردو' },
            { materialId: 'pistachio', unit: 'g', amount: 100, unitPrice: 2000000, totalPrice: 200000, note: 'پسته' },
            { materialId: 'almond', unit: 'g', amount: 100, unitPrice: 1200000, totalPrice: 120000, note: 'بادام' },
            { materialId: 'cinnamon', unit: 'g', amount: 10, unitPrice: 400000, totalPrice: 4000, note: 'دارچین' },
            { materialId: 'cardamom', unit: 'g', amount: 5, unitPrice: 600000, totalPrice: 3000, note: 'هل' }
          ],
          notes: 'دستور پخت رنگینک با مغزیجات مخلوط',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Additional Sholeh Zard Recipe
        {
          id: 'sholeh-zard-special',
          productId: 'sholeh-zard',
          name: 'دستور پخت شله زرد ویژه',
          materials: [
            { materialId: 'rice', unit: 'g', amount: 500, unitPrice: 350000, totalPrice: 175000, note: 'برنج ایرانی' },
            { materialId: 'sugar', unit: 'g', amount: 400, unitPrice: 200000, totalPrice: 80000, note: 'شکر' },
            { materialId: 'saffron', unit: 'g', amount: 3, unitPrice: 12000000, totalPrice: 36000, note: 'زعفران' },
            { materialId: 'rosewater', unit: 'ml', amount: 150, unitPrice: 300000, totalPrice: 45000, note: 'گلاب دو آتشه' },
            { materialId: 'almond', unit: 'g', amount: 150, unitPrice: 1200000, totalPrice: 180000, note: 'بادام' },
            { materialId: 'pistachio', unit: 'g', amount: 150, unitPrice: 2000000, totalPrice: 300000, note: 'پسته' },
            { materialId: 'cinnamon', unit: 'g', amount: 10, unitPrice: 400000, totalPrice: 4000, note: 'دارچین' }
          ],
          notes: 'دستور پخت ویژه شله زرد با تزیین کامل',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        },

        // Additional Saffron Ice Cream Recipe
        {
          id: 'saffron-ice-special',
          productId: 'saffron-ice',
          name: 'دستور تهیه بستنی زعفرانی ویژه',
          materials: [
            { materialId: 'milk', unit: 'ml', amount: 1000, unitPrice: 180000, totalPrice: 180000, note: 'شیر پرچرب' },
            { materialId: 'cream', unit: 'ml', amount: 700, unitPrice: 250000, totalPrice: 175000, note: 'خامه' },
            { materialId: 'saffron', unit: 'g', amount: 2, unitPrice: 12000000, totalPrice: 24000, note: 'زعفران' },
            { materialId: 'rosewater', unit: 'ml', amount: 100, unitPrice: 300000, totalPrice: 30000, note: 'گلاب' },
            { materialId: 'pistachio', unit: 'g', amount: 200, unitPrice: 2000000, totalPrice: 400000, note: 'پسته' },
            { materialId: 'cardamom', unit: 'g', amount: 5, unitPrice: 600000, totalPrice: 3000, note: 'هل' }
          ],
          notes: 'دستور تهیه بستنی زعفرانی ویژه با هل و پسته',
          isActive: true,
          createdAt: getCurrentJalaliTimestamp(),
          updatedAt: getCurrentJalaliTimestamp()
        }
      ];
      await db.insertRecipes(recipes);

      // Generate sample sales data for the past month
      const salesData = [];
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      // Generate daily sales for all products
      for (let i = 0; i < 30; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        // Generate sales for each product
        for (const product of products) {
          if (Math.random() > 0.2) { // 80% chance of having sales for each product each day
        salesData.push({
          date: currentDate.toISOString(),
              department: product.saleDepartment,
              product_code: product.code,
              quantity: 1 + Math.floor(Math.random() * 10),
              totalAmount: 350000 + Math.floor(Math.random() * 650000),
              productId: product.id
            });
          }
        }
      }

      // Insert sales data and set as reference dataset
      const datasetId = await db.insertSales(salesData, 'Sample Historical Data');
      await db.setReferenceDataset(datasetId);

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
        ['کد', 'نام', 'مجموعه', 'گروه مواد غذایی', 'واحد', 'قیمت واحد', 'موجودی', 'حداقل موجودی', 'تاریخ انقضا', 'محل نگهداری'],
        ['FL001', 'آرد', 'مواد خشک', 'مواد پخت', 'kg', '150000', '100', '20', '1403/12/29', 'انبار مواد خشک'],
        ['SG001', 'شکر', 'مواد خشک', 'مواد پخت', 'kg', '200000', '50', '10', '1403/12/29', 'انبار مواد خشک'],
        ['ML001', 'شیر', 'مواد تر', 'لبنیات', 'l', '180000', '200', '50', '1402/12/15', 'یخچال اصلی'],
        ['CH001', 'شکلات', 'مواد خشک', 'مواد پخت', 'kg', '800000', '30', '5', '1403/06/30', 'انبار خنک']
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