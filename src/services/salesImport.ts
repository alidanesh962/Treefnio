import { Product, Material, Item } from '../types';
import { db } from '../database';
import * as XLSX from 'xlsx';

interface ImportResult {
  success: boolean;
  materialUsage: { materialId: string; quantity: number; }[];
  errors: string[];
  updatedProducts?: string[];
  datasetId?: string;
}

interface Dataset {
  id: string;
  name: string;
  importDate: number;
  data?: any[];
}

export class SalesImportService {
  private static instance: SalesImportService;
  private products: Product[] = [];
  private materials: Material[] = [];

  private constructor() {}

  static getInstance(): SalesImportService {
    if (!SalesImportService.instance) {
      SalesImportService.instance = new SalesImportService();
    }
    return SalesImportService.instance;
  }

  setProducts(products: Product[]): void {
    this.products = products;
  }

  setMaterials(materials: Material[]): void {
    this.materials = materials;
  }

  async getProducts(): Promise<Product[]> {
    // TODO: Implement actual API call to get products
    return this.products;
  }

  async createProducts(products: Partial<Product>[]): Promise<void> {
    // TODO: Implement actual API call to create products
    const newProducts = products.map(p => ({
      ...p,
      id: Math.random().toString(36).substr(2, 9), // Temporary ID generation
    })) as Product[];
    
    this.products = [...this.products, ...newProducts];
  }

  async importSalesData(data: any[], name: string): Promise<ImportResult> {
    try {
      const datasetId = await db.insertSales(data, name);
      
      return {
        success: true,
        materialUsage: [],
        errors: [],
        updatedProducts: [],
        datasetId
      };
    } catch (error) {
      return {
        success: false,
        materialUsage: [],
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        updatedProducts: []
      };
    }
  }

  async exportToExcel(data: any[]): Promise<Blob> {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Data');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  async setReferenceDataset(datasetId: string | null): Promise<void> {
    db.setReferenceDataset(datasetId);
  }

  async getReferenceDataset(): Promise<string | null> {
    return db.getReferenceDataset();
  }

  async getDatasets(): Promise<Dataset[]> {
    const datasets = db.getSalesDatasets();
    return datasets.map(({ id, name, importDate }) => ({ id, name, importDate }));
  }

  async updateProductPrices(data: any[]): Promise<{
    updatedProducts: string[];
  }> {
    const products = await this.getProducts();
    const updatedProducts: string[] = [];

    // Update prices based on the imported data
    for (const row of data) {
      const product = products.find(p => p.code === row.product_code);
      if (product && row.price) {
        // Update product price
        product.price = row.price;
        updatedProducts.push(product.id);
      }
    }

    // Save updated products
    if (updatedProducts.length > 0) {
      const itemProducts: Item[] = products.map(p => ({
        ...p,
        type: 'product' as const,
        department: p.category || 'default'
      }));
      await db.saveProducts(itemProducts);
    }

    return {
      updatedProducts
    };
  }

  async getDatasetDetails(datasetId: string): Promise<Dataset | null> {
    const datasets = db.getSalesDatasets();
    const dataset = datasets.find(ds => ds.id === datasetId);
    if (!dataset) return null;
    
    return {
      id: dataset.id,
      name: dataset.name,
      importDate: dataset.importDate,
      data: dataset.data
    };
  }
} 