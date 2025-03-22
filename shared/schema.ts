import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").notNull(),
});

export const insertIngredientSchema = createInsertSchema(ingredients).pick({
  name: true,
  userId: true,
});

export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type Ingredient = typeof ingredients.$inferSelect;

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  instructions: text("instructions").notNull(),
  imageUrl: text("image_url"),
  prepTime: integer("prep_time").notNull(), // in minutes
  calories: integer("calories").notNull(),
  saved: boolean("saved").default(false),
});

export const insertRecipeSchema = createInsertSchema(recipes).pick({
  title: true,
  description: true,
  instructions: true,
  imageUrl: true,
  prepTime: true,
  calories: true,
  saved: true,
});

export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;

export const groceryItems = pgTable("grocery_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  completed: boolean("completed").default(false),
  userId: integer("user_id").notNull(),
});

export const insertGroceryItemSchema = createInsertSchema(groceryItems).pick({
  name: true,
  category: true,
  completed: true,
  userId: true,
});

export type InsertGroceryItem = z.infer<typeof insertGroceryItemSchema>;
export type GroceryItem = typeof groceryItems.$inferSelect;

export const nutritionData = pgTable("nutrition_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(),
  calories: integer("calories").notNull(),
  protein: integer("protein").notNull(),
  carbs: integer("carbs").notNull(),
  fat: integer("fat").notNull(),
  caloriesGoal: integer("calories_goal").notNull(),
  proteinGoal: integer("protein_goal").notNull(),
  carbsGoal: integer("carbs_goal").notNull(),
  fatGoal: integer("fat_goal").notNull(),
});

export const insertNutritionDataSchema = createInsertSchema(nutritionData).pick({
  userId: true,
  date: true,
  calories: true,
  protein: true,
  carbs: true,
  fat: true,
  caloriesGoal: true,
  proteinGoal: true,
  carbsGoal: true,
  fatGoal: true,
});

export type InsertNutritionData = z.infer<typeof insertNutritionDataSchema>;
export type NutritionData = typeof nutritionData.$inferSelect;

// Recipe recommendation request schema
export const recipeRecommendationRequestSchema = z.object({
  ingredients: z.array(z.string()),
  diet: z.enum(['none', 'vegetarian', 'vegan', 'high-protein']).optional(),
});

export type RecipeRecommendationRequest = z.infer<typeof recipeRecommendationRequestSchema>;
