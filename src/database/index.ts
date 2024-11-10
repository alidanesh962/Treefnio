// src/database/index.ts
export interface Item {
  id: string;
  name: string;
  code: string;
  department: string;
  price: number;
  type?: 'product' | 'material';
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: {
    materialId: string;
    quantity: number;
  }[];
  finalProduct: string;
  yield: number;
  createdAt?: number;
  updatedAt?: number;
}

const PRODUCTS_KEY = 'restaurant_inventory_products';
const MATERIALS_KEY = 'restaurant_inventory_materials';
const RECIPES_KEY = 'restaurant_recipes';

class Database {
  // Products Methods
  getProducts(): Item[] {
    const stored = localStorage.getItem(PRODUCTS_KEY);
    return stored ? JSON.parse(stored) : [];
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

  isProductDuplicate(code: string, name: string, excludeId?: string): boolean {
    const products = this.getProducts();
    return products.some(p => 
      (p.code === code || p.name === name) && p.id !== excludeId
    );
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

  // Materials Methods
  getMaterials(): Item[] {
    const stored = localStorage.getItem(MATERIALS_KEY);
    return stored ? JSON.parse(stored) : [];
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

  isMaterialDuplicate(code: string, name: string, excludeId?: string): boolean {
    const materials = this.getMaterials();
    return materials.some(m => 
      (m.code === code || m.name === name) && m.id !== excludeId
    );
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

  // Recipes Methods
  getRecipes(): Recipe[] {
    const stored = localStorage.getItem(RECIPES_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  saveRecipes(recipes: Recipe[]): void {
    localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
  }

  addRecipe(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Recipe {
    const recipes = this.getRecipes();
    const now = Date.now();
    const newRecipe: Recipe = {
      ...recipe,
      id: now.toString(),
      createdAt: now,
      updatedAt: now
    };
    recipes.push(newRecipe);
    this.saveRecipes(recipes);
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
      this.saveRecipes(recipes);
      return true;
    }
    return false;
  }

  deleteRecipe(id: string): boolean {
    const recipes = this.getRecipes();
    const filteredRecipes = recipes.filter(r => r.id !== id);
    if (filteredRecipes.length < recipes.length) {
      this.saveRecipes(filteredRecipes);
      return true;
    }
    return false;
  }

  isRecipeDuplicate(name: string, excludeId?: string): boolean {
    const recipes = this.getRecipes();
    return recipes.some(r => r.name === name && r.id !== excludeId);
  }

  // Utility Methods
  calculateRecipeCost(recipe: Recipe): number {
    const materials = this.getMaterials();
    return recipe.ingredients.reduce((total, ingredient) => {
      const material = materials.find(m => m.id === ingredient.materialId);
      if (material) {
        return total + (material.price * ingredient.quantity);
      }
      return total;
    }, 0);
  }

  getRecipeByProduct(productId: string): Recipe | null {
    const recipes = this.getRecipes();
    return recipes.find(r => r.finalProduct === productId) || null;
  }

  searchItems(query: string, type?: 'product' | 'material'): Item[] {
    const products = type !== 'material' ? this.getProducts() : [];
    const materials = type !== 'product' ? this.getMaterials() : [];
    const allItems = [...products, ...materials];

    return allItems.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.code.toLowerCase().includes(query.toLowerCase()) ||
      item.department.toLowerCase().includes(query.toLowerCase())
    );
  }

  getDepartments(): string[] {
    const products = this.getProducts();
    const materials = this.getMaterials();
    const departments = new Set<string>();

    [...products, ...materials].forEach(item => {
      if (item.department) {
        departments.add(item.department);
      }
    });

    return Array.from(departments).sort();
  }

  exportData() {
    return {
      products: this.getProducts(),
      materials: this.getMaterials(),
      recipes: this.getRecipes()
    };
  }

  importData(data: {
    products?: Item[],
    materials?: Item[],
    recipes?: Recipe[]
  }) {
    if (data.products) this.saveProducts(data.products);
    if (data.materials) this.saveMaterials(data.materials);
    if (data.recipes) this.saveRecipes(data.recipes);
  }

  clearData() {
    localStorage.removeItem(PRODUCTS_KEY);
    localStorage.removeItem(MATERIALS_KEY);
    localStorage.removeItem(RECIPES_KEY);
  }
}

export const db = new Database();