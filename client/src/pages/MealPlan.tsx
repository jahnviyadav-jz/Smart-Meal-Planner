import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Recipe } from "@shared/schema";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function MealPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedDay, setSelectedDay] = useState<string>("");

  // Fetch recipes and meal plans
  const { data: recipes = [] } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const { data: mealPlans = {} } = useQuery<Record<string, Record<string, Recipe[]>>>({
    queryKey: ["/api/meal-plans"],
    defaultData: {},
  });

  // Current week days
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const today = new Date().getDay(); // 0 is Sunday
  const currentDay = today === 0 ? 6 : today - 1; // Adjust to make Monday = 0

  // Update meal plan
  const updateMealPlan = useMutation({
    mutationFn: async ({ day, mealType, recipe }: { day: string; mealType: string; recipe: Recipe }) => {
      const response = await fetch('/api/meal-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, mealType, recipeId: recipe.id }),
      });
      if (!response.ok) throw new Error('Failed to update meal plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      toast({
        title: "Success",
        description: "Meal plan updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update meal plan",
        variant: "destructive",
      });
    },
  });

  function MealCard({ title, recipes, day }: { title: string; recipes: Recipe[]; day: string }) {
    return (
      <Card className="mb-4"> {/* Added margin bottom */}
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">{title}</CardTitle> {/* Increased font size */}
        </CardHeader>
        <CardContent>
          {recipes.length === 0 ? (
            <div className="flex justify-between items-center p-2 border border-dashed border-gray-200 rounded-lg">
              <span className="text-muted-foreground">No meal planned</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedDay(day)}
              >
                Add
              </Button>
            </div>
          ) : (
            recipes.map((recipe) => (
              <div key={recipe.id} className="flex justify-between items-center mb-2"> {/* Added margin bottom */}
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden"> {/* Increased image size */}
                    {recipe.imageUrl ? (
                      <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-icons text-muted-foreground text-xl">restaurant</span> {/* Increased icon size */}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">{recipe.title}</h4>
                    <div className="flex items-center text-sm text-muted-foreground"> {/* Decreased font size */}
                      <span className="material-icons text-sm mr-1">schedule</span>
                      {recipe.prepTime} min
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => updateMealPlan.mutate({ day, mealType: title.toLowerCase(), recipe })}
                >
                  Change
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8"> {/* Kept the container for responsiveness */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold text-gray-800">Your Meal Plan</h1> {/* Improved title */}
          <Button className="bg-primary text-white"> {/* Added styling to the button */}
            <span className="material-icons mr-2">add</span>
            New Plan
          </Button>
        </div>

        <Tabs defaultValue={weekDays[currentDay].toLowerCase()} className="mb-6"> {/* Added margin bottom */}
          <div className="overflow-x-auto">
            <TabsList className="w-full justify-start">
              {weekDays.map((day, index) => (
                <TabsTrigger 
                  key={day} 
                  value={day.toLowerCase()}
                  className={index === currentDay ? "font-bold text-primary" : "text-gray-600"}
                >
                  <div className="flex flex-col items-center py-2 px-4 rounded hover:bg-gray-100"> {/* Added padding and hover effect */}
                    <span className="text-xs text-muted-foreground">{day.slice(0, 3)}</span>
                    <span className=""> {/* Removed conditional styling, handled above */}
                      {new Date(new Date().setDate(new Date().getDate() - today + 1 + index)).getDate()}
                    </span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {weekDays.map(day => (
            <TabsContent key={day} value={day.toLowerCase()}>
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">
                    {day}
                    {currentDay === weekDays.indexOf(day) && (
                      <span className="ml-2 text-xs bg-primary text-white px-2 py-1 rounded-full">Today</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <MealCard 
                      title="Breakfast" 
                      recipes={mealPlans[day.toLowerCase()]?.breakfast || []} 
                      day={day.toLowerCase()} 
                    />
                    <MealCard 
                      title="Lunch" 
                      recipes={mealPlans[day.toLowerCase()]?.lunch || []} 
                      day={day.toLowerCase()} 
                    />
                    <MealCard 
                      title="Dinner" 
                      recipes={mealPlans[day.toLowerCase()]?.dinner || []} 
                      day={day.toLowerCase()} 
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center mt-4"> {/* Added margin top */}
                <Button variant="outline" className="bg-gray-100 hover:bg-gray-200"> {/* Added styling to the button */}
                  <span className="material-icons mr-2">print</span>
                  Print Day's Plan
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>
    </div>
  );
}