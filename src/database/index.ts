// src/database/index.ts

import type {
  Item,
  Recipe,
  Department,
  ProductDefinition,
  ProductRecipe,
  MaterialUnit,
  ProductionBatch,
  RecipeMaterial,
  ExtendedProductDefinition
} from '../types';

import type { Product } from '../types/product';
import type { Material } from '../types/material';

// Step 1: Add this interface and export it
interface ImportColumnMapping {
  name: number | null;
  code: number | null;
  department: number | null;
  price: number | null;
  autoGenerateCode?: boolean;
}

export type { ImportColumnMapping };

// Storage Keys
const PRODUCTS_KEY = 'restaurant_inventory_products';
const MATERIALS_KEY = 'restaurant_inventory_materials';
const RECIPES_KEY = 'restaurant_recipes';
const DEPARTMENTS_KEY = 'restaurant_departments';
const PRODUCT_DEFINITIONS_KEY = 'restaurant_product_definitions';
const PRODUCT_RECIPES_KEY = 'restaurant_product_recipes';
const MATERIAL_UNITS_KEY = 'restaurant_material_units';
const PRODUCTION_BATCHES_KEY = 'restaurant_production_batches';
const PRODUCT_ACTIVE_STATUSES_KEY = 'product_active_statuses';

class Database {
  [x: string]: any;

  // Products Operations
  getProducts(): Item[] {
    const stored = localStorage.getItem(PRODUCTS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getProduct(id: string): Item | undefined {
    return this.getProducts().find(p => p.id === id);
  }

  saveProducts(products: Item[]): void {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }

  addProduct(product: Omit<Item, 'id'>): Item {
    const products = this.getProducts();
    const newProduct: Item = {
      ...product,
      id: Date.now().toString()
    };
    products.push(newProduct);
    this.saveProducts(products);
    return newProduct;
  }

  updateProduct(product: Item): boolean {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index !== -1) {
      products[index] = product;
      this.saveProducts(products);
      return true;
    }
    return false;
  }

  deleteProduct(id: string): boolean {
    const products = this.getProducts();
    const filteredProducts = products.filter(p => p.id !== id);
    if (filteredProducts.length < products.length) {
      this.saveProducts(filteredProducts);
      return true;
    }
    return false;
  }

  // Product Definitions Operations
  getProductDefinitions(): ExtendedProductDefinition[] {
    const stored = localStorage.getItem(PRODUCT_DEFINITIONS_KEY);
    const products: ProductDefinition[] = stored ? JSON.parse(stored) : [];
    const activeStatuses = this.getProductActiveStatuses();
    
    return products.map((product) => ({
      ...product,
      isActive: activeStatuses[product.id] ?? true
    }));
  }

  getProductDefinition(id: string): ExtendedProductDefinition | undefined {
    const product = this.getProductDefinitions().find(p => p.id === id);
    if (!product) return undefined;
    
    const activeStatuses = this.getProductActiveStatuses();
    return {
      ...product,
      isActive: activeStatuses[product.id] ?? true
    };
  }

  saveProductDefinitions(products: ProductDefinition[]): void {
    localStorage.setItem(PRODUCT_DEFINITIONS_KEY, JSON.stringify(products));
  }

  // Step 4: Update the generateNextProductCode and addProductDefinition methods
  generateNextProductCode(): string {
    const products = this.getProductDefinitions();
    let maxCode = 0;
    
    products.forEach(product => {
      const numericCode = parseInt(product.code);
      if (!isNaN(numericCode) && numericCode > maxCode) {
        maxCode = numericCode;
      }
    });

    return (maxCode + 1).toString().padStart(3, '0');
  }

  addProductDefinition(
    product: Omit<ProductDefinition, 'id' | 'createdAt' | 'updatedAt'> & { autoGenerateCode?: boolean }
  ): ProductDefinition {
    const products = this.getProductDefinitions();
    const now = Date.now();

    const productCode = product.autoGenerateCode 
      ? this.generateNextProductCode()
      : product.code;

    const newProduct: ProductDefinition = {
      ...product,
      id: now.toString(),
      code: productCode,
      createdAt: now,
      updatedAt: now
    };

    products.push(newProduct);
    this.saveProductDefinitions(products);
    
    // Save active status
    const activeStatuses = this.getProductActiveStatuses();
    activeStatuses[newProduct.id] = true;
    this.saveProductActiveStatuses(activeStatuses);

    return newProduct;
  }

  updateProductDefinition(product: ExtendedProductDefinition): boolean {
    const products = this.getProductDefinitions();
    const index = products.findIndex(p => p.id === product.id);
    if (index !== -1) {
      const statuses = this.getProductActiveStatuses();
      statuses[product.id] = product.isActive ?? true;
      this.saveProductActiveStatuses(statuses);

      const baseProduct: ProductDefinition = {
        id: product.id,
        name: product.name,
        code: product.code,
        saleDepartment: product.saleDepartment,
        productionSegment: product.productionSegment,
        createdAt: product.createdAt,
        updatedAt: Date.now()
      };

      const updatedProducts = products.map(p => 
        p.id === product.id ? baseProduct : p
      );
      
      this.saveProductDefinitions(updatedProducts);
      return true;
    }
    return false;
  }

  deleteProductDefinition(id: string): boolean {
    const products = this.getProductDefinitions();
    const filteredProducts = products.filter(p => p.id !== id);
    
    if (filteredProducts.length < products.length) {
      const statuses = this.getProductActiveStatuses();
      delete statuses[id];
      this.saveProductActiveStatuses(statuses);
      
      this.deleteProductRecipes(id);
      
      const baseProducts = filteredProducts.map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
        saleDepartment: p.saleDepartment,
        productionSegment: p.productionSegment,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }));
      
      this.saveProductDefinitions(baseProducts);
      return true;
    }
    return false;
  }

  private getProductActiveStatuses(): { [key: string]: boolean } {
    const stored = localStorage.getItem(PRODUCT_ACTIVE_STATUSES_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  private saveProductActiveStatuses(statuses: { [key: string]: boolean }): void {
    localStorage.setItem(PRODUCT_ACTIVE_STATUSES_KEY, JSON.stringify(statuses));
  }

  isProductActive(id: string): boolean {
    const statuses = this.getProductActiveStatuses();
    return statuses[id] ?? true;
  }

  async updateProductStatus(id: string, status: boolean): Promise<void> {
    const statuses = this.getProductActiveStatuses();
    statuses[id] = status;
    this.saveProductActiveStatuses(statuses);
    return Promise.resolve();
  }

  bulkDeleteProducts(ids: string[]): void {
    const products = this.getProductDefinitions();
    const filteredProducts = products.filter(p => !ids.includes(p.id));
    
    const statuses = this.getProductActiveStatuses();
    ids.forEach(id => {
      delete statuses[id];
      this.deleteProductRecipes(id);
    });
    
    const baseProducts = filteredProducts.map(p => ({
      id: p.id,
      name: p.name,
      code: p.code,
      saleDepartment: p.saleDepartment,
      productionSegment: p.productionSegment,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));
    
    this.saveProductActiveStatuses(statuses);
    this.saveProductDefinitions(baseProducts);
  }

  // Materials Operations
  getMaterials(): Item[] {
    const stored = localStorage.getItem(MATERIALS_KEY);
    const materials = stored ? JSON.parse(stored) : [];
    return materials.map((material: { unit: any; }) => ({
      ...material,
      unit: material.unit || this.getMaterialUnits()[0]?.id || ''
    }));
  }

  getMaterial(id: string): Item | undefined {
    return this.getMaterials().find(m => m.id === id);
  }

  saveMaterials(materials: Item[]): void {
    localStorage.setItem(MATERIALS_KEY, JSON.stringify(materials));
  }

  addMaterial(material: Omit<Item, 'id'>): Item {
    const materials = this.getMaterials();
    const newMaterial: Item = {
      ...material,
      id: Date.now().toString(),
      unit: material.unit || this.getMaterialUnits()[0]?.id || ''
    };
    materials.push(newMaterial);
    this.saveMaterials(materials);
    return newMaterial;
  }

  bulkAddMaterials(materials: Array<Omit<Item, 'id' | 'type'>>): Item[] {
    const existingMaterials = this.getMaterials();
    const timestamp = Date.now();
    const defaultUnit = this.getMaterialUnits()[0]?.id || '';
    
    const newMaterials: Item[] = materials.map((material, index) => ({
      ...material,
      id: `${timestamp}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'material' as const,
      unit: material.unit || defaultUnit
    }));

    const updatedMaterials = [...existingMaterials, ...newMaterials];
    this.saveMaterials(updatedMaterials);
    return newMaterials;
  }

  validateMaterialImport(materials: Array<Omit<Item, 'id' | 'type'>>): {
    valid: boolean;
    errors: { [key: string]: string[] };
  } {
    const errors: { [key: string]: string[] } = {};
    const existingMaterials = this.getMaterials();
    const availableUnits = this.getMaterialUnits();

    materials.forEach((material, index) => {
      const materialErrors: string[] = [];

      if (!material.name?.trim()) {
        materialErrors.push('نام الزامی است');
      }
      if (!material.code?.trim()) {
        materialErrors.push('کد الزامی است');
      }
      if (!material.department?.trim()) {
        materialErrors.push('بخش الزامی است');
      }
      if (!material.price || material.price <= 0) {
        materialErrors.push('قیمت باید بزرگتر از صفر باشد');
      }
      if (material.unit && !availableUnits.some(u => u.id === material.unit)) {
        materialErrors.push('واحد اندازه‌گیری نامعتبر است');
      }

      if (existingMaterials.some(m => 
        m.code.toLowerCase() === material.code.toLowerCase() ||
        m.name.toLowerCase() === material.name.toLowerCase()
      )) {
        materialErrors.push('این کد یا نام قبلاً ثبت شده است');
      }

      if (materialErrors.length > 0) {
        errors[index] = materialErrors;
      }
    });

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  updateMaterial(material: Item): boolean {
    const materials = this.getMaterials();
    const index = materials.findIndex(m => m.id === material.id);
    if (index !== -1) {
      materials[index] = {
        ...material,
        unit: material.unit || this.getMaterialUnits()[0]?.id || ''
      };
      this.saveMaterials(materials);
      return true;
    }
    return false;
  }

  deleteMaterial(id: string): boolean {
    const materials = this.getMaterials();
    const filteredMaterials = materials.filter(m => m.id !== id);
    if (filteredMaterials.length < materials.length) {
      this.saveMaterials(filteredMaterials);
      return true;
    }
    return false;
  }

  isMaterialDuplicate(code: string, name: string, excludeId?: string): boolean {
    const materials = this.getMaterials();
    return materials.some(m => 
      (m.code.toLowerCase() === code.toLowerCase() || 
       m.name.toLowerCase() === name.toLowerCase()) && 
      m.id !== excludeId
    );
  }

  // Product Recipe Operations
  getProductRecipes(productId?: string): ProductRecipe[] {
    const stored = localStorage.getItem(PRODUCT_RECIPES_KEY);
    const recipes = stored ? JSON.parse(stored) : [];
    return productId 
      ? recipes.filter((recipe: ProductRecipe) => recipe.productId === productId) 
      : recipes;
  }

  getProductRecipe(id: string): ProductRecipe | undefined {
    return this.getProductRecipes().find(r => r.id === id);
  }

  getActiveRecipe(productId: string): ProductRecipe | undefined {
    const recipes = this.getProductRecipes(productId);
    return recipes.find(recipe => recipe.isActive);
  }

  saveProductRecipes(recipes: ProductRecipe[]): void {
    localStorage.setItem(PRODUCT_RECIPES_KEY, JSON.stringify(recipes));
  }

  addProductRecipe(recipe: Omit<ProductRecipe, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): ProductRecipe {
    const recipes = this.getProductRecipes();
    const now = Date.now();
    const newRecipe: ProductRecipe = {
      ...recipe,
      id: now.toString(),
      createdAt: now,
      updatedAt: now,
      isActive: false
    };
    recipes.push(newRecipe);
    this.saveProductRecipes(recipes);
    return newRecipe;
  }

  setActiveRecipe(productId: string, recipeId: string): boolean {
    const recipes = this.getProductRecipes();
    
    const updatedRecipes = recipes.map(recipe => 
      recipe.productId === productId 
        ? { ...recipe, isActive: false }
        : recipe
    );

    const recipeIndex = updatedRecipes.findIndex(r => r.id === recipeId);
    if (recipeIndex === -1) return false;

    updatedRecipes[recipeIndex] = {
      ...updatedRecipes[recipeIndex],
      isActive: true,
      updatedAt: Date.now()
    };

    this.saveProductRecipes(updatedRecipes);
    return true;
  }

  updateProductRecipe(recipe: ProductRecipe): boolean {
    const recipes = this.getProductRecipes();
    const index = recipes.findIndex(r => r.id === recipe.id);
    if (index === -1) return false;

    if (recipe.isActive) {
      recipes.forEach((r, i) => {
        if (r.productId === recipe.productId && r.id !== recipe.id) {
          recipes[i] = { ...r, isActive: false };
        }
      });
    }

    recipes[index] = {
      ...recipe,
      updatedAt: Date.now()
    };
    
    this.saveProductRecipes(recipes);
    return true;
  }

  deleteProductRecipe(id: string): boolean {
    const recipes = this.getProductRecipes();
    const recipeToDelete = recipes.find(r => r.id === id);
    
    if (!recipeToDelete) return false;

    const filteredRecipes = recipes.filter(r => r.id !== id);
    
    if (recipeToDelete.isActive) {
      const productRecipes = filteredRecipes
        .filter(r => r.productId === recipeToDelete.productId)
        .sort((a, b) => b.updatedAt - a.updatedAt);
      
      if (productRecipes.length > 0) {
        const newActiveIndex = filteredRecipes.findIndex(r => r.id === productRecipes[0].id);
        if (newActiveIndex !== -1) {
          filteredRecipes[newActiveIndex] = {
            ...filteredRecipes[newActiveIndex],
            isActive: true,
            updatedAt: Date.now()
          };
        }
      }
    }
    
    this.saveProductRecipes(filteredRecipes);
    return true;
  }

  deleteProductRecipes(productId: string): void {
    const recipes = this.getProductRecipes();
    const filteredRecipes = recipes.filter(r => r.productId !== productId);
    this.saveProductRecipes(filteredRecipes);
  }

  // Department Operations
  getDepartments(): Department[] {
    const stored = localStorage.getItem(DEPARTMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getDepartment(id: string): Department | undefined {
    return this.getDepartments().find(d => d.id === id);
  }

  getDepartmentsByType(type: 'sale' | 'production'): Department[] {
    return this.getDepartments().filter(d => d.type === type);
  }

  saveDepartments(departments: Department[]): void {
    localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(departments));
  }

  addDepartment(name: string, type: 'sale' | 'production'): Department {
    const departments = this.getDepartments();
    const newDepartment: Department = {
      id: Date.now().toString(),
      name,
      type,
      createdAt: Date.now()
    };
    departments.push(newDepartment);
    this.saveDepartments(departments);
    return newDepartment;
  }

  updateDepartment(department: Department): boolean {
    const departments = this.getDepartments();
    const index = departments.findIndex(d => d.id === department.id);
    if (index !== -1) {
      departments[index] = department;
      this.saveDepartments(departments);
      return true;
    }
    return false;
  }

  deleteDepartment(id: string): boolean {
    const departments = this.getDepartments();
    const filteredDepartments = departments.filter(d => d.id !== id);
    if (filteredDepartments.length < departments.length) {
      this.saveDepartments(filteredDepartments);
      return true;
    }
    return false;
  }

  searchDepartments(name: string): Department[] {
    const query = name.toLowerCase();
    return this.getDepartments().filter(dept => 
      dept.name.toLowerCase().includes(query)
    );
  }

  // Material Units Operations
  getMaterialUnits(): MaterialUnit[] {
    const stored = localStorage.getItem(MATERIAL_UNITS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getMaterialUnit(id: string): MaterialUnit | undefined {
    return this.getMaterialUnits().find(u => u.id === id);
  }

  saveMaterialUnits(units: MaterialUnit[]): void {
    localStorage.setItem(MATERIAL_UNITS_KEY, JSON.stringify(units));
  }

  addMaterialUnit(name: string, symbol: string): MaterialUnit {
    const units = this.getMaterialUnits();
    const newUnit: MaterialUnit = {
      id: Date.now().toString(),
      name,
      symbol
    };
    units.push(newUnit);
    this.saveMaterialUnits(units);
    return newUnit;
  }

  updateMaterialUnit(unit: MaterialUnit): boolean {
    const units = this.getMaterialUnits();
    const index = units.findIndex(u => u.id === unit.id);
    if (index !== -1) {
      units[index] = unit;
      this.saveMaterialUnits(units);
      return true;
    }
    return false;
  }

  deleteMaterialUnit(id: string): boolean {
    if (this.isMaterialUnitInUse(id)) {
      return false;
    }

    const units = this.getMaterialUnits();
    const filteredUnits = units.filter(u => u.id !== id);
    if (filteredUnits.length < units.length) {
      this.saveMaterialUnits(filteredUnits);
      return true;
    }
    return false;
  }

  isMaterialUnitInUse(unitId: string): boolean {
    const recipes = this.getProductRecipes();
    return recipes.some(recipe => 
      recipe.materials.some(material => material.unit === unitId)
    );
  }

  initializeDefaultUnits(): void {
    if (this.getMaterialUnits().length === 0) {
      const defaultUnits = [
        { name: 'گرم', symbol: 'g' },
        { name: 'کیلوگرم', symbol: 'kg' },
        { name: 'لیتر', symbol: 'l' },
        { name: 'میلی‌لیتر', symbol: 'ml' },
        { name: 'عدد', symbol: 'pcs' }
      ];

      defaultUnits.forEach(unit => {
        this.addMaterialUnit(unit.name, unit.symbol);
      });
    }
  }

  // Production Batches Operations
  getProductionBatches(): ProductionBatch[] {
    const stored = localStorage.getItem(PRODUCTION_BATCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  saveProductionBatches(batches: ProductionBatch[]): void {
    localStorage.setItem(PRODUCTION_BATCHES_KEY, JSON.stringify(batches));
  }

  addProductionBatch(batch: Omit<ProductionBatch, 'id' | 'createdAt' | 'updatedAt'>): ProductionBatch {
    const batches = this.getProductionBatches();
    const now = Date.now();
    const newBatch: ProductionBatch = {
      ...batch,
      id: now.toString(),
      createdAt: now,
      updatedAt: now
    };
    batches.push(newBatch);
    this.saveProductionBatches(batches);
    return newBatch;
  }

  updateProductionBatch(batch: ProductionBatch): boolean {
    const batches = this.getProductionBatches();
    const index = batches.findIndex(b => b.id === batch.id);
    if (index !== -1) {
      batches[index] = {
        ...batch,
        updatedAt: Date.now()
      };
      this.saveProductionBatches(batches);
      return true;
    }
    return false;
  }

  deleteProductionBatch(id: string): boolean {
    const batches = this.getProductionBatches();
    const filteredBatches = batches.filter(b => b.id !== id);
    if (filteredBatches.length < batches.length) {
      this.saveProductionBatches(filteredBatches);
      return true;
    }
    return false;
  }

  getProductionBatchesForProduct(productId: string): ProductionBatch[] {
    return this.getProductionBatches().filter(batch => batch.productId === productId);
  }

  getProductionBatchesByStatus(status: 'planned' | 'in-progress' | 'completed' | 'cancelled'): ProductionBatch[] {
    return this.getProductionBatches().filter(batch => batch.status === status);
  }

  // Validation Operations
  validateAll(): { 
    isValid: boolean, 
    errors: { 
      products: string[], 
      recipes: string[], 
      departments: string[], 
      materials: string[] 
    } 
  } {
    const errors = {
      products: [] as string[],
      recipes: [] as string[],
      departments: [] as string[],
      materials: [] as string[]
    };

    this.getProductDefinitions().forEach((product: ProductDefinition) => {
      if (!this.getDepartment(product.saleDepartment)) {
        errors.products.push(`Invalid sale department for product: ${product.name}`);
      }
      if (!this.getDepartment(product.productionSegment)) {
        errors.products.push(`Invalid production segment for product: ${product.name}`);
      }
    });

    this.getProductRecipes().forEach((recipe: ProductRecipe) => {
      if (!this.getProductDefinition(recipe.productId)) {
        errors.recipes.push(`Invalid product reference in recipe: ${recipe.name}`);
      }
      recipe.materials.forEach((material: RecipeMaterial) => {
        if (!this.getMaterial(material.materialId)) {
          errors.recipes.push(`Invalid material reference in recipe: ${recipe.name}`);
        }
        if (!this.getMaterialUnit(material.unit)) {
          errors.recipes.push(`Invalid unit reference in recipe: ${recipe.name}`);
        }
      });
    });

    this.getMaterials().forEach((material: Item) => {
      if (material.unit && !this.getMaterialUnit(material.unit)) {
        errors.materials.push(`Invalid unit reference for material: ${material.name}`);
      }
    });

    return {
      isValid: Object.values(errors).every(arr => arr.length === 0),
      errors
    };
  }

  validateProductDefinition(product: Omit<ProductDefinition, 'id' | 'createdAt' | 'updatedAt'>): boolean {
    return !!(
      product.name &&
      product.code &&
      product.saleDepartment &&
      product.productionSegment
    );
  }

  // Database integrity check and repair
  checkIntegrity(): void {
    const requiredKeys = [
      PRODUCTS_KEY,
      MATERIALS_KEY,
      RECIPES_KEY,
      DEPARTMENTS_KEY,
      PRODUCT_DEFINITIONS_KEY,
      PRODUCT_RECIPES_KEY,
      MATERIAL_UNITS_KEY,
      PRODUCTION_BATCHES_KEY,
      PRODUCT_ACTIVE_STATUSES_KEY
    ];

    requiredKeys.forEach(key => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '[]');
      }
    });

    this.initializeDefaultUnits();
    this.cleanupOrphanedData();
  }

  private cleanupOrphanedData(): void {
    const validProductIds = new Set(this.getProductDefinitions().map(p => p.id));
    let recipes = this.getProductRecipes();
    const validRecipes = recipes.filter(recipe => validProductIds.has(recipe.productId));
    if (validRecipes.length !== recipes.length) {
      this.saveProductRecipes(validRecipes);
    }

    const validRecipeIds = new Set(validRecipes.map(r => r.id));
    let batches = this.getProductionBatches();
    const validBatches = batches.filter(batch => 
      validProductIds.has(batch.productId) && validRecipeIds.has(batch.recipeId)
    );
    if (validBatches.length !== batches.length) {
      this.saveProductionBatches(validBatches);
    }

    const activeStatuses = this.getProductActiveStatuses();
    let hasChanges = false;
    Object.keys(activeStatuses).forEach(productId => {
      if (!validProductIds.has(productId)) {
        delete activeStatuses[productId];
        hasChanges = true;
      }
    });
    if (hasChanges) {
      this.saveProductActiveStatuses(activeStatuses);
    }
  }

  // Clear Operations
  clearProducts(): Promise<void> {
    localStorage.removeItem(PRODUCTS_KEY);
    localStorage.removeItem(PRODUCT_DEFINITIONS_KEY);
    localStorage.removeItem(PRODUCT_RECIPES_KEY);
    localStorage.removeItem(PRODUCT_ACTIVE_STATUSES_KEY);
    return Promise.resolve();
  }

  clearMaterials(): Promise<void> {
    localStorage.removeItem(MATERIALS_KEY);
    return Promise.resolve();
  }

  clearRecipes(): Promise<void> {
    localStorage.removeItem(RECIPES_KEY);
    return Promise.resolve();
  }

  clearUnits(): Promise<void> {
    localStorage.removeItem(MATERIAL_UNITS_KEY);
    return Promise.resolve();
  }

  clearSales(): Promise<void> {
    localStorage.removeItem('sales_data');
    return Promise.resolve();
  }

  // Insert Operations
  insertUnits(units: MaterialUnit[]): Promise<void> {
    this.saveMaterialUnits(units);
    return Promise.resolve();
  }

  insertMaterials(materials: Material[]): Promise<void> {
    const existingMaterials = this.getMaterials();
    const convertedMaterials = materials.map(material => ({
      ...material,
      type: 'material' as const,
      department: material.category || 'default',
      price: material.unitPrice
    }));
    const updatedMaterials = [...existingMaterials, ...convertedMaterials];
    this.saveMaterials(updatedMaterials);
    return Promise.resolve();
  }

  insertProducts(products: Product[]): Promise<void> {
    const existingProducts = this.getProducts();
    const convertedProducts = products.map(product => ({
      ...product,
      type: 'product' as const,
      department: product.category || 'default'
    }));
    const updatedProducts = [...existingProducts, ...convertedProducts];
    this.saveProducts(updatedProducts);
    return Promise.resolve();
  }

  insertRecipes(recipes: ProductRecipe[]): Promise<void> {
    const existingRecipes = this.getProductRecipes();
    const updatedRecipes = [...existingRecipes, ...recipes];
    this.saveProductRecipes(updatedRecipes);
    return Promise.resolve();
  }

  insertSales(salesData: { date: string; department: string; totalAmount: number; productId: string; quantity: number; }[]): Promise<void> {
    localStorage.setItem('sales_data', JSON.stringify(salesData));
    return Promise.resolve();
  }
}

const db = new Database();
db.checkIntegrity();

export { db };
export type DatabaseType = Database;

export type {
  Department,
  ProductDefinition,
  ProductRecipe,
  MaterialUnit,
  RecipeMaterial,
  ProductionBatch
};
