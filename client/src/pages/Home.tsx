import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import RecipeCard from "@/components/RecipeCard";
import NutritionRing from "@/components/NutritionRing";
import IngredientTag from "@/components/IngredientTag";
import { scanIngredientsFromImage } from "@/lib/openai";
import { Recipe, Ingredient, GroceryItem, NutritionData } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const [newIngredient, setNewIngredient] = useState("");
  const [newGroceryItem, setNewGroceryItem] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch ingredients
  const { data: ingredients = [], refetch: refetchIngredients } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  // Fetch recipes
  const { data: recipes = [] } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  // Fetch grocery items
  const { data: groceryItems = [], refetch: refetchGroceryItems } = useQuery<GroceryItem[]>({
    queryKey: ["/api/grocery-items"],
  });

  // Fetch nutrition data
  const { data: nutritionData } = useQuery<NutritionData>({
    queryKey: ["/api/nutrition"],
  });

  // Add ingredient mutation
  const addIngredientMutation = useMutation({
    mutationFn: (name: string) => 
      apiRequest("POST", "/api/ingredients", { name }),
    onSuccess: () => {
      setNewIngredient("");
      refetchIngredients();
      toast({
        title: "Ingredient added",
        description: "Your ingredient has been added to the list.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to add ingredient",
        description: "There was an error adding your ingredient.",
        variant: "destructive",
      });
    },
  });

  // Remove ingredient mutation
  const removeIngredientMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/ingredients/${id}`),
    onSuccess: () => {
      refetchIngredients();
    },
    onError: () => {
      toast({
        title: "Failed to remove ingredient",
        description: "There was an error removing your ingredient.",
        variant: "destructive",
      });
    },
  });

  // Find recipes mutation
  const findRecipesMutation = useMutation({
    mutationFn: () => 
      apiRequest("POST", "/api/recipe-recommendations", { 
        ingredients: ingredients.map(i => i.name),
      }),
    onSuccess: () => {
      toast({
        title: "Recipes found",
        description: "We've found some recipes based on your ingredients.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to find recipes",
        description: "There was an error finding recipes with your ingredients.",
        variant: "destructive",
      });
    },
  });

  // Add grocery item mutation
  const addGroceryItemMutation = useMutation({
    mutationFn: (name: string) => 
      apiRequest("POST", "/api/grocery-items", { 
        name,
        category: getCategoryForItem(name),
        completed: false,
      }),
    onSuccess: () => {
      setNewGroceryItem("");
      refetchGroceryItems();
      toast({
        title: "Item added",
        description: "Your item has been added to the grocery list.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to add item",
        description: "There was an error adding your grocery item.",
        variant: "destructive",
      });
    },
  });

  // Handle adding ingredient
  const handleAddIngredient = () => {
    if (newIngredient.trim()) {
      addIngredientMutation.mutate(newIngredient.trim());
    }
  };

  // Get location for navigation
  const [, setLocation] = useLocation();
  
  // Handle finding recipes
  const handleFindRecipes = () => {
    if (ingredients.length > 0) {
      findRecipesMutation.mutate();
      // Navigate to recipes page
      setLocation("/recipes");
    } else {
      toast({
        title: "No ingredients",
        description: "Please add some ingredients first.",
        variant: "destructive",
      });
    }
  };
  
  // Scan image mutation - to detect ingredients in an image
  const scanImageMutation = useMutation({
    mutationFn: (imageBase64: string) => 
      scanIngredientsFromImage(imageBase64),
    onSuccess: (data) => {
      setIsScanning(false);
      setUploadedImage(null);
      refetchIngredients();
      toast({
        title: "Scan complete",
        description: `Detected ${data.ingredients.length} ingredients and added to your kitchen.`,
      });
    },
    onError: () => {
      setIsScanning(false);
      setUploadedImage(null);
      toast({
        title: "Scan failed",
        description: "We couldn't process the image. Please try again with a clearer photo.",
        variant: "destructive",
      });
    },
  });
  
  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Image = e.target?.result as string;
      setUploadedImage(base64Image);
      setIsScanning(true);
      scanImageMutation.mutate(base64Image);
    };
    reader.readAsDataURL(file);
  };

  // Handle adding grocery item
  const handleAddGroceryItem = () => {
    if (newGroceryItem.trim()) {
      addGroceryItemMutation.mutate(newGroceryItem.trim());
    }
  };

  // Helper function to determine category for grocery item
  function getCategoryForItem(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("chicken") || lowerName.includes("beef") || lowerName.includes("fish") || lowerName.includes("meat")) {
      return "Protein";
    } else if (lowerName.includes("broccoli") || lowerName.includes("carrot") || lowerName.includes("lettuce") || lowerName.includes("vegetable")) {
      return "Vegetable";
    } else if (lowerName.includes("rice") || lowerName.includes("pasta") || lowerName.includes("bread") || lowerName.includes("flour")) {
      return "Grain";
    } else if (lowerName.includes("salt") || lowerName.includes("pepper") || lowerName.includes("spice") || lowerName.includes("herb")) {
      return "Seasoning";
    } else {
      return "Other";
    }
  }

  // Handle key press for ingredients input
  const handleIngredientKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddIngredient();
    }
  };

  // Handle key press for grocery item input
  const handleGroceryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddGroceryItem();
    }
  };

  // Toggle grocery item completion
  const toggleGroceryItemMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("PATCH", `/api/grocery-items/${id}/toggle`),
    onSuccess: () => {
      refetchGroceryItems();
    },
    onError: () => {
      toast({
        title: "Failed to update item",
        description: "There was an error updating your grocery item.",
        variant: "destructive",
      });
    },
  });

  // Remove grocery item
  const removeGroceryItemMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/grocery-items/${id}`),
    onSuccess: () => {
      refetchGroceryItems();
    },
    onError: () => {
      toast({
        title: "Failed to remove item",
        description: "There was an error removing your grocery item.",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      {/* Welcome Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Hey, Alex! 👋</h2>
        <p className="text-textSecondary">What are you cooking today?</p>
      </section>

      {/* Ingredient Scanner */}
      <section className="bg-white rounded-xl shadow-custom mb-8 p-5">
        <h3 className="text-lg font-semibold mb-4">What's in your kitchen?</h3>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label htmlFor="ingredient-input" className="block text-sm font-medium text-muted-foreground mb-2">
              Add ingredients
            </label>
            <div className="relative">
              <Input
                id="ingredient-input"
                type="text"
                placeholder="Type ingredient name"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyDown={handleIngredientKeyDown}
                className="w-full px-4 py-3 rounded-lg"
              />
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary"
                onClick={handleAddIngredient}
                disabled={addIngredientMutation.isPending}
              >
                <span className="material-icons">add_circle_outline</span>
              </button>
            </div>
          </div>
          
          <div className="sm:w-auto flex flex-col sm:flex-row gap-2">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <Button 
              variant="outline" 
              className="bg-beige text-textPrimary px-4 py-3 rounded-lg flex items-center justify-center border border-gray-200"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanImageMutation.isPending}
            >
              {scanImageMutation.isPending ? (
                <>
                  <span className="material-icons animate-spin mr-2">refresh</span>
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <span className="material-icons mr-2">photo_camera</span>
                  <span>Scan Items</span>
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex flex-wrap">
            {ingredients.map((ingredient) => (
              <IngredientTag 
                key={ingredient.id}
                name={ingredient.name}
                onRemove={() => removeIngredientMutation.mutate(ingredient.id)}
              />
            ))}
          </div>
        </div>
        
        <Button 
          className="w-full bg-primary text-white py-3 rounded-lg font-medium shadow-sm hover:bg-opacity-90 transition-colors"
          onClick={handleFindRecipes}
          disabled={findRecipesMutation.isPending || ingredients.length === 0}
        >
          {findRecipesMutation.isPending ? "Finding Recipes..." : "Find Recipes"}
        </Button>
      </section>

      {/* Recipe Suggestions */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Recipe Suggestions</h3>
          <Button 
            variant="link" 
            className="text-primary text-sm font-medium p-0"
            onClick={() => setLocation("/recipes")}
          >
            See All
          </Button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4">
          {recipes.length === 0 ? (
            <Card className="p-6 w-full text-center">
              <p className="text-muted-foreground">No recipes yet. Add ingredients and click "Find Recipes" to get suggestions.</p>
            </Card>
          ) : (
            recipes.slice(0, 3).map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))
          )}
        </div>
      </section>
      
      {/* Nutrition Section */}
      {nutritionData && (
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Your Nutrition Today</h3>
            <Button 
              variant="link" 
              className="text-primary text-sm font-medium p-0"
              onClick={() => setLocation("/nutrition")}
            >
              Details
            </Button>
          </div>
          
          <Card className="p-5">
            <CardContent className="p-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <NutritionRing
                  title="Calories"
                  value={nutritionData.calories}
                  max={nutritionData.caloriesGoal}
                  color="#4CAF50"
                />
                <NutritionRing
                  title="Protein"
                  value={nutritionData.protein}
                  max={nutritionData.proteinGoal}
                  color="#FF9800"
                  unit="g"
                />
                <NutritionRing
                  title="Carbs"
                  value={nutritionData.carbs}
                  max={nutritionData.carbsGoal}
                  color="#8BC34A"
                  unit="g"
                />
                <NutritionRing
                  title="Fats"
                  value={nutritionData.fat}
                  max={nutritionData.fatGoal}
                  color="#03A9F4"
                  unit="g"
                />
              </div>
            </CardContent>
          </Card>
        </section>
      )}
      
      {/* Grocery List Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Grocery List</h3>
          <Button variant="link" className="text-primary text-sm font-medium p-0">Edit List</Button>
        </div>
        
        <Card className="p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Input 
                type="text" 
                placeholder="Add item to list" 
                className="w-full px-4 py-2 pr-10 rounded-lg"
                value={newGroceryItem}
                onChange={(e) => setNewGroceryItem(e.target.value)}
                onKeyDown={handleGroceryKeyDown}
              />
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary"
                onClick={handleAddGroceryItem}
                disabled={addGroceryItemMutation.isPending}
              >
                <span className="material-icons">add_circle_outline</span>
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {groceryItems.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">Your grocery list is empty. Add some items!</p>
            ) : (
              groceryItems.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <label className="checkbox-container flex items-center">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={item.completed}
                      onChange={() => toggleGroceryItemMutation.mutate(item.id)}
                    />
                    <span className="checkmark w-5 h-5 mr-3 border border-gray-300 rounded-sm inline-block relative"></span>
                    <span className={item.completed ? "line-through text-gray-400" : ""}>
                      {item.name}
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-beige px-2 py-1 rounded">{item.category}</span>
                    <button 
                      className="text-gray-400"
                      onClick={() => removeGroceryItemMutation.mutate(item.id)}
                    >
                      <span className="material-icons text-sm">close</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      {/* FAB (Mobile Only) */}
      <button 
        className="sm:hidden fixed right-6 bottom-20 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center z-50"
        onClick={() => fileInputRef.current?.click()}
      >
        <span className="material-icons">add_photo_alternate</span>
      </button>
      
      {/* Scan Modal */}
      <Dialog open={isScanning} onOpenChange={setIsScanning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scanning Ingredients</DialogTitle>
            <DialogDescription>
              Analyzing your photo to identify ingredients
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center p-6">
            {uploadedImage && (
              <img 
                src={uploadedImage} 
                alt="Scanned Food" 
                className="max-h-64 rounded-lg mb-4 object-contain" 
              />
            )}
            
            <div className="flex items-center space-x-2">
              <span className="material-icons animate-spin text-primary">refresh</span>
              <p>AI is identifying ingredients...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
