import { 
  users, type User, type InsertUser,
  ingredients, type Ingredient, type InsertIngredient,
  recipes, type Recipe, type InsertRecipe,
  groceryItems, type GroceryItem, type InsertGroceryItem,
  nutritionData, type NutritionData, type InsertNutritionData
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Ingredient methods
  getUserIngredients(userId: number): Promise<Ingredient[]>;
  addIngredient(ingredient: InsertIngredient): Promise<Ingredient>;
  removeIngredient(id: number): Promise<void>;
  
  // Recipe methods
  getAllRecipes(): Promise<Recipe[]>;
  getRecipe(id: number): Promise<Recipe | undefined>;
  addRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: number, recipe: InsertRecipe): Promise<Recipe>;
  
  // Grocery item methods
  getUserGroceryItems(userId: number): Promise<GroceryItem[]>;
  getGroceryItem(id: number): Promise<GroceryItem | undefined>;
  addGroceryItem(item: InsertGroceryItem): Promise<GroceryItem>;
  updateGroceryItem(id: number, item: InsertGroceryItem): Promise<GroceryItem>;
  removeGroceryItem(id: number): Promise<void>;
  
  // Nutrition data methods
  getNutritionData(userId: number, date: string): Promise<NutritionData | undefined>;
  addNutritionData(data: InsertNutritionData): Promise<NutritionData>;
  updateNutritionData(id: number, data: InsertNutritionData): Promise<NutritionData>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userIngredients: Map<number, Map<number, Ingredient>>;
  private recipeStore: Map<number, Recipe>;
  private userGroceryItems: Map<number, Map<number, GroceryItem>>;
  private userNutritionData: Map<string, NutritionData>; // key: userId-date
  
  currentUserId: number;
  currentIngredientId: number;
  currentRecipeId: number;
  currentGroceryItemId: number;
  currentNutritionDataId: number;

  constructor() {
    this.users = new Map();
    this.userIngredients = new Map();
    this.recipeStore = new Map();
    this.userGroceryItems = new Map();
    this.userNutritionData = new Map();
    
    this.currentUserId = 1;
    this.currentIngredientId = 1;
    this.currentRecipeId = 1;
    this.currentGroceryItemId = 1;
    this.currentNutritionDataId = 1;
    
    // Add a default user
    this.users.set(1, { id: 1, username: "alex", password: "password" });
    this.userIngredients.set(1, new Map());
    this.userGroceryItems.set(1, new Map());
    
    // Add some default ingredients for the default user
    const defaultIngredients = [
      { id: this.currentIngredientId++, name: "Chicken", userId: 1 },
      { id: this.currentIngredientId++, name: "Broccoli", userId: 1 },
      { id: this.currentIngredientId++, name: "Rice", userId: 1 },
      { id: this.currentIngredientId++, name: "Garlic", userId: 1 },
      { id: this.currentIngredientId++, name: "Olive oil", userId: 1 }
    ];
    
    for (const ingredient of defaultIngredients) {
      this.userIngredients.get(1)!.set(ingredient.id, ingredient);
    }
    
    // Add some default grocery items for the default user
    const defaultGroceryItems = [
      { id: this.currentGroceryItemId++, name: "Chicken breast (1 lb)", category: "Protein", completed: false, userId: 1 },
      { id: this.currentGroceryItemId++, name: "Broccoli (2 heads)", category: "Vegetable", completed: false, userId: 1 },
      { id: this.currentGroceryItemId++, name: "Jasmine rice (16 oz)", category: "Grain", completed: false, userId: 1 },
      { id: this.currentGroceryItemId++, name: "Garlic (1 bulb)", category: "Seasoning", completed: false, userId: 1 }
    ];
    
    for (const item of defaultGroceryItems) {
      this.userGroceryItems.get(1)!.set(item.id, item);
    }
    
    // Add default nutrition data for the default user
    const today = new Date().toISOString().split('T')[0];
    this.userNutritionData.set(`1-${today}`, {
      id: this.currentNutritionDataId++,
      userId: 1,
      date: today,
      calories: 1500,
      protein: 45,
      carbs: 160,
      fat: 24,
      caloriesGoal: 2000,
      proteinGoal: 90,
      carbsGoal: 200,
      fatGoal: 60
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    this.userIngredients.set(id, new Map());
    this.userGroceryItems.set(id, new Map());
    return user;
  }
  
  // Ingredient methods
  async getUserIngredients(userId: number): Promise<Ingredient[]> {
    const userIngredientsMap = this.userIngredients.get(userId);
    if (!userIngredientsMap) return [];
    return Array.from(userIngredientsMap.values());
  }
  
  async addIngredient(ingredient: InsertIngredient): Promise<Ingredient> {
    const id = this.currentIngredientId++;
    const newIngredient: Ingredient = { ...ingredient, id };
    
    if (!this.userIngredients.has(ingredient.userId)) {
      this.userIngredients.set(ingredient.userId, new Map());
    }
    
    this.userIngredients.get(ingredient.userId)!.set(id, newIngredient);
    return newIngredient;
  }
  
  async removeIngredient(id: number): Promise<void> {
    for (const userIngredientsMap of this.userIngredients.values()) {
      if (userIngredientsMap.has(id)) {
        userIngredientsMap.delete(id);
        return;
      }
    }
  }
  
  // Recipe methods
  async getAllRecipes(): Promise<Recipe[]> {
    return Array.from(this.recipeStore.values());
  }
  
  async getRecipe(id: number): Promise<Recipe | undefined> {
    return this.recipeStore.get(id);
  }
  
  async addRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const id = this.currentRecipeId++;
    const newRecipe: Recipe = { ...recipe, id };
    this.recipeStore.set(id, newRecipe);
    return newRecipe;
  }
  
  async updateRecipe(id: number, recipe: InsertRecipe): Promise<Recipe> {
    const updatedRecipe: Recipe = { ...recipe, id };
    this.recipeStore.set(id, updatedRecipe);
    return updatedRecipe;
  }
  
  // Grocery item methods
  async getUserGroceryItems(userId: number): Promise<GroceryItem[]> {
    const userGroceryItemsMap = this.userGroceryItems.get(userId);
    if (!userGroceryItemsMap) return [];
    return Array.from(userGroceryItemsMap.values());
  }
  
  async getGroceryItem(id: number): Promise<GroceryItem | undefined> {
    for (const userGroceryItemsMap of this.userGroceryItems.values()) {
      const item = userGroceryItemsMap.get(id);
      if (item) return item;
    }
    return undefined;
  }
  
  async addGroceryItem(item: InsertGroceryItem): Promise<GroceryItem> {
    const id = this.currentGroceryItemId++;
    const newItem: GroceryItem = { ...item, id };
    
    if (!this.userGroceryItems.has(item.userId)) {
      this.userGroceryItems.set(item.userId, new Map());
    }
    
    this.userGroceryItems.get(item.userId)!.set(id, newItem);
    return newItem;
  }
  
  async updateGroceryItem(id: number, item: InsertGroceryItem): Promise<GroceryItem> {
    const updatedItem: GroceryItem = { ...item, id };
    
    for (const userGroceryItemsMap of this.userGroceryItems.values()) {
      if (userGroceryItemsMap.has(id)) {
        userGroceryItemsMap.set(id, updatedItem);
        return updatedItem;
      }
    }
    
    throw new Error("Grocery item not found");
  }
  
  async removeGroceryItem(id: number): Promise<void> {
    for (const userGroceryItemsMap of this.userGroceryItems.values()) {
      if (userGroceryItemsMap.has(id)) {
        userGroceryItemsMap.delete(id);
        return;
      }
    }
  }
  
  // Nutrition data methods
  async getNutritionData(userId: number, date: string): Promise<NutritionData | undefined> {
    return this.userNutritionData.get(`${userId}-${date}`);
  }
  
  async addNutritionData(data: InsertNutritionData): Promise<NutritionData> {
    const id = this.currentNutritionDataId++;
    const newData: NutritionData = { ...data, id };
    this.userNutritionData.set(`${data.userId}-${data.date}`, newData);
    return newData;
  }
  
  async updateNutritionData(id: number, data: InsertNutritionData): Promise<NutritionData> {
    const updatedData: NutritionData = { ...data, id };
    this.userNutritionData.set(`${data.userId}-${data.date}`, updatedData);
    return updatedData;
  }
}

export const storage = new MemStorage();
