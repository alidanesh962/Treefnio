// src/database/index.ts

import type {
  Item,
  Recipe,
  Department,
  ProductDefinition,
  ProductRecipe,
  MaterialUnit,
  ProductionBatch,
  RecipeMaterial
} from '../types';

// Storage Keys
const PRODUCTS_KEY = 'restaurant_inventory_products';
const MATERIALS_KEY = 'restaurant_inventory_materials';
const RECIPES_KEY = 'restaurant_recipes';
const DEPARTMENTS_KEY = 'restaurant_departments';
const PRODUCT_DEFINITIONS_KEY = 'restaurant_product_definitions';
const PRODUCT_RECIPES_KEY = 'restaurant_product_recipes';
const MATERIAL_UNITS_KEY = 'restaurant_material_units';
const PRODUCTION_BATCHES_KEY = 'restaurant_production_batches';

class Database {
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
  // Materials Operations
  getMaterials(): Item[] {
    const stored = localStorage.getItem(MATERIALS_KEY);
    return stored ? JSON.parse(stored) : [];
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
      id: Date.now().toString()
    };
    materials.push(newMaterial);
    this.saveMaterials(materials);
    return newMaterial;
  }

  updateMaterial(material: Item): boolean {
    const materials = this.getMaterials();
    const index = materials.findIndex(m => m.id === material.id);
    if (index !== -1) {
      materials[index] = material;
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
      (m.code === code || m.name === name) && m.id !== excludeId
    );
  }
  // Recipe Operations
  getRecipes(): Recipe[] {
    const stored = localStorage.getItem(RECIPES_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  addRecipe(recipe: Omit<Recipe, 'id'>): Recipe {
    const recipes = this.getRecipes();
    const newRecipe: Recipe = {
      ...recipe,
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    recipes.push(newRecipe);
    localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
    return newRecipe;
  }

  updateRecipe(recipe: Recipe): boolean {
    const recipes = this.getRecipes();
    const index = recipes.findIndex(r => r.id === recipe.id);
    if (index !== -1) {
      recipes[index] = {
        ...recipe,
        updatedAt: Date.now()
      };
      localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
      return true;
    }
    return false;
  }

  deleteRecipe(id: string): boolean {
    const recipes = this.getRecipes();
    const filteredRecipes = recipes.filter(r => r.id !== id);
    if (filteredRecipes.length < recipes.length) {
      localStorage.setItem(RECIPES_KEY, JSON.stringify(filteredRecipes));
      return true;
    }
    return false;
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

  saveProductRecipes(recipes: ProductRecipe[]): void {
    localStorage.setItem(PRODUCT_RECIPES_KEY, JSON.stringify(recipes));
  }

  addProductRecipe(recipe: Omit<ProductRecipe, 'id' | 'createdAt' | 'updatedAt'>): ProductRecipe {
    const recipes = this.getProductRecipes();
    const now = Date.now();
    const newRecipe: ProductRecipe = {
      ...recipe,
      id: now.toString(),
      createdAt: now,
      updatedAt: now
    };
    recipes.push(newRecipe);
    this.saveProductRecipes(recipes);
    return newRecipe;
  }

  updateProductRecipe(recipe: ProductRecipe): boolean {
    const recipes = this.getProductRecipes();
    const index = recipes.findIndex(r => r.id === recipe.id);
    if (index !== -1) {
      recipes[index] = {
        ...recipe,
        updatedAt: Date.now()
      };
      this.saveProductRecipes(recipes);
      return true;
    }
    return false;
  }

  deleteProductRecipe(id: string): boolean {
    const recipes = this.getProductRecipes();
    const filteredRecipes = recipes.filter(r => r.id !== id);
    if (filteredRecipes.length < recipes.length) {
      this.saveProductRecipes(filteredRecipes);
      return true;
    }
    return false;
  }

  deleteProductRecipes(productId: string): void {
    const recipes = this.getProductRecipes();
    const filteredRecipes = recipes.filter(r => r.productId !== productId);
    this.saveProductRecipes(filteredRecipes);
  }
  // Product Definition Operations
  getProductDefinitions(): ProductDefinition[] {
    const stored = localStorage.getItem(PRODUCT_DEFINITIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getProductDefinition(id: string): ProductDefinition | undefined {
    return this.getProductDefinitions().find(p => p.id === id);
  }

  saveProductDefinitions(products: ProductDefinition[]): void {
    localStorage.setItem(PRODUCT_DEFINITIONS_KEY, JSON.stringify(products));
  }

  addProductDefinition(product: Omit<ProductDefinition, 'id' | 'createdAt' | 'updatedAt'>): ProductDefinition {
    const products = this.getProductDefinitions();
    const now = Date.now();
    const newProduct: ProductDefinition = {
      ...product,
      id: now.toString(),
      createdAt: now,
      updatedAt: now
    };
    products.push(newProduct);
    this.saveProductDefinitions(products);
    return newProduct;
  }

  updateProductDefinition(product: ProductDefinition): boolean {
    const products = this.getProductDefinitions();
    const index = products.findIndex(p => p.id === product.id);
    if (index !== -1) {
      products[index] = {
        ...product,
        updatedAt: Date.now()
      };
      this.saveProductDefinitions(products);
      return true;
    }
    return false;
  }

  deleteProductDefinition(id: string): boolean {
    const products = this.getProductDefinitions();
    const filteredProducts = products.filter(p => p.id !== id);
    if (filteredProducts.length < products.length) {
      this.saveProductDefinitions(filteredProducts);
      // Also delete associated recipes
      this.deleteProductRecipes(id);
      return true;
    }
    return false;
  }

  validateProductDefinition(product: Omit<ProductDefinition, 'id' | 'createdAt' | 'updatedAt'>): boolean {
    return !!(
      product.name &&
      product.code &&
      product.saleDepartment &&
      product.productionSegment
    );
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
    // First check if the unit is in use
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

    // Validate Products
    this.getProductDefinitions().forEach((product: ProductDefinition) => {
      if (!this.getDepartment(product.saleDepartment)) {
        errors.products.push(`Invalid sale department for product: ${product.name}`);
      }
      if (!this.getDepartment(product.productionSegment)) {
        errors.products.push(`Invalid production segment for product: ${product.name}`);
      }
    });

    // Validate Recipes
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

    return {
      isValid: Object.values(errors).every(arr => arr.length === 0),
      errors
    };
  }

  // Production Batches Operations
  getProductionBatches(): ProductionBatch[] {
    const stored = localStorage.getItem(PRODUCTION_BATCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  saveProductionBatches(batches: ProductionBatch[]): void {
    localStorage.setItem(PRODUCTION_BATCHES_KEY, JSON.stringify(batches));
  }
}

// Create and export the database instance
const db = new Database();
db.initializeDefaultUnits();

// Export database instance and types
export { db };
export type DatabaseType = Database;

// Re-export common types
export type {
  Department,
  ProductDefinition,
  ProductRecipe,
  MaterialUnit,
  RecipeMaterial,
  ProductionBatch
} from '../types';