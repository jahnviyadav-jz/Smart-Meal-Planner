import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Recipe } from "@shared/schema";
import RecipeCard from "@/components/RecipeCard";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Recipes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [mealType, setMealType] = useState("any");
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch recipes
  const { data: recipes = [], isLoading: isLoadingRecipes } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  // Get recipe recommendations based on ingredients
  const getRecommendations = async () => {
    setIsLoading(true);
    try {
      // Get ingredients from API
      const response = await fetch("/api/ingredients");
      if (!response.ok) {
        throw new Error("Failed to fetch ingredients");
      }
      const userIngredients = await response.json() as Array<{id: number, name: string, userId: number}>;
      const ingredientNames = userIngredients.map(ing => ing.name);
      
      // If no ingredients, use some defaults
      const ingredients = ingredientNames.length > 0 ? 
        ingredientNames : 
        ["Chicken", "Rice", "Bell Peppers", "Onions", "Garlic", "Olive oil", "Broccoli"];
      
      // Call our recipe recommendation endpoint
      const recipeResponse = await fetch("/api/recipe-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ingredients, 
          diet: "none",
          mealType: mealType
        })
      });
      
      if (!recipeResponse.ok) {
        throw new Error("Failed to generate recipes");
      }
      
      const data = await recipeResponse.json() as Recipe[];
      
      // Invalidate recipes cache to fetch the latest recipes
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      
      toast({
        title: "Recipes generated",
        description: `${data.length} recipes found based on your ingredients!`,
      });
    } catch (error) {
      console.error("Error getting recommendations:", error);
      toast({
        title: "Error",
        description: "Failed to get recipe recommendations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter recipes based on search term, active filter, and meal type
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = 
      activeFilter === "all" ? true :
      activeFilter === "saved" ? recipe.saved :
      activeFilter === "quick" ? (recipe.prepTime <= 30) :
      true;
    
    // Meal type filter
    const matchesMealType = 
      mealType === "any" ? true :
      (recipe.mealType === mealType);
    
    return matchesSearch && matchesCategory && matchesMealType;
  });

  return (
    <div className="space-y-6">
      <section>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Recipes</h1>
          <Button 
            onClick={getRecommendations} 
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <span className="material-icons text-sm mr-1">restaurant</span>
                Get Recipe Recommendations
              </>
            )}
          </Button>
        </div>
        
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 rounded-lg"
              />
              {searchTerm && (
                <button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  onClick={() => setSearchTerm("")}
                >
                  <span className="material-icons">close</span>
                </button>
              )}
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button 
                variant={activeFilter === "all" ? "default" : "outline"}
                onClick={() => setActiveFilter("all")}
                className="rounded-full"
              >
                All
              </Button>
              <Button 
                variant={activeFilter === "saved" ? "default" : "outline"}
                onClick={() => setActiveFilter("saved")}
                className="rounded-full"
              >
                <span className="material-icons text-sm mr-1">bookmark</span>
                Saved
              </Button>
              <Button 
                variant={activeFilter === "quick" ? "default" : "outline"}
                onClick={() => setActiveFilter("quick")}
                className="rounded-full"
              >
                <span className="material-icons text-sm mr-1">schedule</span>
                Quick
              </Button>
            </div>
          </div>
          
          {/* Meal Type Filters */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium my-auto mr-1">Meal Type:</span>
            <Button 
              variant={mealType === "any" ? "default" : "outline"}
              onClick={() => setMealType("any")}
              className="h-8 rounded-full text-xs"
              size="sm"
            >
              Any
            </Button>
            <Button 
              variant={mealType === "breakfast" ? "default" : "outline"}
              onClick={() => setMealType("breakfast")}
              className="h-8 rounded-full text-xs"
              size="sm"
            >
              Breakfast
            </Button>
            <Button 
              variant={mealType === "lunch" ? "default" : "outline"}
              onClick={() => setMealType("lunch")}
              className="h-8 rounded-full text-xs"
              size="sm"
            >
              Lunch
            </Button>
            <Button 
              variant={mealType === "dinner" ? "default" : "outline"}
              onClick={() => setMealType("dinner")}
              className="h-8 rounded-full text-xs"
              size="sm"
            >
              Dinner
            </Button>
            <Button 
              variant={mealType === "brunch" ? "default" : "outline"}
              onClick={() => setMealType("brunch")}
              className="h-8 rounded-full text-xs"
              size="sm"
            >
              Brunch
            </Button>
            <Button 
              variant={mealType === "snack" ? "default" : "outline"}
              onClick={() => setMealType("snack")}
              className="h-8 rounded-full text-xs"
              size="sm"
            >
              Snack
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="h-[280px]" />
            ))}
          </div>
        ) : filteredRecipes.length === 0 ? (
          <Card className="p-8 text-center">
            <span className="material-icons text-4xl text-muted-foreground mb-2">restaurant</span>
            <h3 className="text-lg font-medium mb-1">No recipes found</h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? "Try adjusting your search or filters." 
                : "Add ingredients and find recipes on the home page."}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} extended />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
