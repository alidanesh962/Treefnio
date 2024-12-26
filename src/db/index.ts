import { SalesDataset } from '../types';

export interface Recipe {
  id: string;
  productId: string;
  ingredients: Ingredient[];
}

export interface Ingredient {
  materialId: string;
  amount: number;
}

export interface Material {
  id: string;
  name: string;
  price: number;
  unit: string;
}

export interface Department {
  id: string;
  name: string;
  type: 'sale' | 'production';
}

export interface ProductDefinition {
  id: string;
  code: string;
  name: string;
  saleDepartment: string;
  productionSegment: string;
  createdAt: number;
  updatedAt: number;
}

export interface Database {
  getProducts(): ProductDefinition[];
  getProductDefinitions(): ProductDefinition[];
  getSalesDatasets(): SalesDataset[];
  getReferenceDataset(): string | null;
  insertProducts(products: ProductDefinition[]): void;
  isProductActive(id: string): boolean;
  updateProductStatus(id: string, status: boolean): void;
  deleteProductDefinition(id: string): void;
  getRecipes(productId: string): Recipe[];
  getMaterial(materialId: string): Material | null;
  getDepartment(departmentId: string): Department | null;
}

const PRODUCT_DEFINITIONS_KEY = 'restaurant_product_definitions';
const ACTIVE_PRODUCTS_KEY = 'product_active_statuses';
const RECIPES_KEY = 'restaurant_recipes';
const MATERIALS_KEY = 'restaurant_inventory_materials';
const DEPARTMENTS_KEY = 'restaurant_departments';
const SALES_DATASETS_KEY = 'sales_datasets';
const REFERENCE_DATASET_KEY = 'reference_dataset';

export class DatabaseImpl implements Database {
  private products: ProductDefinition[] = [];
  private recipes: { [key: string]: Recipe[] } = {};
  private materials: { [key: string]: Material } = {};
  private departments: { [key: string]: Department } = {};
  private salesDatasets: SalesDataset[] = [];
  private referenceDatasetId: string | null = null;

  constructor() {
    // Load initial data from localStorage
    const storedProducts = localStorage.getItem(PRODUCT_DEFINITIONS_KEY);
    if (storedProducts) {
      this.products = JSON.parse(storedProducts);
    }

    const storedRecipes = localStorage.getItem(RECIPES_KEY);
    if (storedRecipes) {
      this.recipes = JSON.parse(storedRecipes);
    }

    const storedMaterials = localStorage.getItem(MATERIALS_KEY);
    if (storedMaterials) {
      this.materials = JSON.parse(storedMaterials);
    }

    const storedDepartments = localStorage.getItem(DEPARTMENTS_KEY);
    if (storedDepartments) {
      this.departments = JSON.parse(storedDepartments);
    }

    const storedSalesDatasets = localStorage.getItem(SALES_DATASETS_KEY);
    if (storedSalesDatasets) {
      this.salesDatasets = JSON.parse(storedSalesDatasets);
    }

    const storedReferenceDataset = localStorage.getItem(REFERENCE_DATASET_KEY);
    if (storedReferenceDataset) {
      this.referenceDatasetId = storedReferenceDataset;
    }
  }

  private getActiveProducts(): Set<string> {
    const stored = localStorage.getItem(ACTIVE_PRODUCTS_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  }

  private saveActiveProducts(activeProducts: Set<string>): void {
    localStorage.setItem(ACTIVE_PRODUCTS_KEY, JSON.stringify(Array.from(activeProducts)));
  }

  getProducts(): ProductDefinition[] {
    return this.products;
  }

  getProductDefinitions(): ProductDefinition[] {
    const stored = localStorage.getItem(PRODUCT_DEFINITIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  insertProducts(products: ProductDefinition[]): void {
    this.products = products;
    localStorage.setItem(PRODUCT_DEFINITIONS_KEY, JSON.stringify(products));
    
    // Mark all products as active by default
    const activeProducts = this.getActiveProducts();
    products.forEach(product => {
      activeProducts.add(product.id);
    });
    this.saveActiveProducts(activeProducts);
  }

  isProductActive(id: string): boolean {
    return this.getActiveProducts().has(id);
  }

  updateProductStatus(id: string, status: boolean): void {
    const activeProducts = this.getActiveProducts();
    if (status) {
      activeProducts.add(id);
    } else {
      activeProducts.delete(id);
    }
    this.saveActiveProducts(activeProducts);
  }

  deleteProductDefinition(id: string): void {
    this.products = this.products.filter(p => p.id !== id);
    localStorage.setItem(PRODUCT_DEFINITIONS_KEY, JSON.stringify(this.products));
    
    const activeProducts = this.getActiveProducts();
    activeProducts.delete(id);
    this.saveActiveProducts(activeProducts);
  }

  getRecipes(productId: string): Recipe[] {
    return this.recipes[productId] || [];
  }

  getMaterial(materialId: string): Material | null {
    return this.materials[materialId] || null;
  }

  getDepartment(departmentId: string): Department | null {
    return this.departments[departmentId] || null;
  }

  getSalesDatasets(): SalesDataset[] {
    return this.salesDatasets;
  }

  getReferenceDataset(): string | null {
    return this.referenceDatasetId;
  }
}

export const db = new DatabaseImpl(); 