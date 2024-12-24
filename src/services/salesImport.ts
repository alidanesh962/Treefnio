import { Product, Material } from '../types';

interface SalesImportData {
  productCode?: string;
  productName?: string;
  quantity: number;
  price?: number;
  date: string;
}

interface MaterialUsage {
  materialId: string;
  quantity: number;
}

interface ImportResult {
  success: boolean;
  materialUsage: MaterialUsage[];
  errors: string[];
  updatedProducts?: string[];
}

export class SalesImportService {
  private static instance: SalesImportService;
  private products: Map<string, Product> = new Map();
  private materials: Map<string, Material> = new Map();

  private constructor() {}

  public static getInstance(): SalesImportService {
    if (!SalesImportService.instance) {
      SalesImportService.instance = new SalesImportService();
    }
    return SalesImportService.instance;
  }

  public setProducts(products: Product[]) {
    this.products.clear();
    products.forEach(product => {
      this.products.set(product.code, product);
      if (product.name) {
        this.products.set(product.name.toLowerCase(), product);
      }
    });
  }

  public setMaterials(materials: Material[]) {
    this.materials.clear();
    materials.forEach(material => {
      this.materials.set(material.id, material);
    });
  }

  public async importSalesData(data: SalesImportData[]): Promise<ImportResult> {
    const errors: string[] = [];
    const materialUsage: MaterialUsage[] = [];
    const processedProducts = new Set<string>();

    for (const sale of data) {
      try {
        // Find product by code or name
        let product: Product | undefined;
        if (sale.productCode) {
          product = this.products.get(sale.productCode);
        }
        if (!product && sale.productName) {
          product = this.products.get(sale.productName.toLowerCase());
        }

        if (!product) {
          errors.push(`Product not found: ${sale.productCode || sale.productName}`);
          continue;
        }

        // Calculate material usage based on recipe
        if (product.recipe) {
          for (const ingredient of product.recipe) {
            const material = this.materials.get(ingredient.materialId);
            if (!material) {
              errors.push(`Material not found: ${ingredient.materialId} for product ${product.code}`);
              continue;
            }

            const usage = ingredient.quantity * sale.quantity;
            materialUsage.push({
              materialId: ingredient.materialId,
              quantity: usage
            });
          }
        }

        processedProducts.add(product.code);
      } catch (error) {
        if (error instanceof Error) {
          errors.push(`Error processing sale: ${error.message}`);
        } else {
          errors.push('An unknown error occurred while processing sale');
        }
      }
    }

    return {
      success: errors.length === 0,
      materialUsage,
      errors
    };
  }

  public async updateProductPrices(data: SalesImportData[]): Promise<{
    success: boolean;
    updatedProducts: string[];
    errors: string[];
  }> {
    const errors: string[] = [];
    const updatedProducts: string[] = [];

    for (const sale of data) {
      try {
        if (!sale.price) continue;

        // Find product by code or name
        let product: Product | undefined;
        if (sale.productCode) {
          product = this.products.get(sale.productCode);
        }
        if (!product && sale.productName) {
          product = this.products.get(sale.productName.toLowerCase());
        }

        if (!product) {
          errors.push(`Product not found: ${sale.productCode || sale.productName}`);
          continue;
        }

        // Update product price
        product.price = sale.price;
        updatedProducts.push(product.code);
      } catch (error) {
        if (error instanceof Error) {
          errors.push(`Error updating price: ${error.message}`);
        } else {
          errors.push('An unknown error occurred while updating price');
        }
      }
    }

    return {
      success: errors.length === 0,
      updatedProducts,
      errors
    };
  }
} 