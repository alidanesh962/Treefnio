// src/utils/recipes.ts
import { Recipe } from '../types';

const RECIPES_KEY = 'restaurant_recipes';

export const getStoredRecipes = (): Recipe[] => {
  const stored = localStorage.getItem(RECIPES_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveRecipe = (recipe: Recipe) => {
  const recipes = getStoredRecipes();
  const index = recipes.findIndex(r => r.id === recipe.id);
  
  if (index !== -1) {
    // Update existing recipe
    recipes[index] = recipe;
  } else {
    // Add new recipe with generated ID
    recipes.push({
      ...recipe,
      id: Date.now().toString()
    });
  }
  
  localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
  return recipe;
};

export const deleteRecipe = (id: string): boolean => {
  const recipes = getStoredRecipes();
  const filteredRecipes = recipes.filter(r => r.id !== id);
  
  if (filteredRecipes.length < recipes.length) {
    localStorage.setItem(RECIPES_KEY, JSON.stringify(filteredRecipes));
    return true;
  }
  return false;
};

export const calculateRecipeCost = (
  recipe: Recipe, 
  materials: { [key: string]: { price: number } }
): number => {
  return recipe.ingredients.reduce((total, ingredient) => {
    const material = materials[ingredient.materialId];
    if (material) {
      return total + (material.price * ingredient.quantity);
    }
    return total;
  }, 0);
};