import { ProductDefinition } from '../types';
import { db } from '../db';

export function calculateRawMaterialPrice(product: ProductDefinition): number {
  try {
    const recipes = db.getRecipes(product.id);
    if (!recipes || recipes.length === 0) return 0;

    return Math.min(...recipes.map(recipe => {
      return recipe.ingredients.reduce((total: number, ingredient) => {
        const material = db.getMaterial(ingredient.materialId);
        if (!material) return total;
        return total + (material.price * ingredient.amount);
      }, 0);
    }));
  } catch (error) {
    console.error('Error calculating raw material price:', error);
    return 0;
  }
}
