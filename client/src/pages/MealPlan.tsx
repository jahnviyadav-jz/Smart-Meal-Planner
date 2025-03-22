import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Recipe } from "@shared/schema";

export default function MealPlan() {
  // Fetch recipes
  const { data: recipes = [] } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  // Current week days
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const today = new Date().getDay(); // 0 is Sunday
  const currentDay = today === 0 ? 6 : today - 1; // Adjust to make Monday = 0
  
  // For this MVP, we'll just assign recipes randomly to days
  // In a full implementation, this would come from the backend
  const getRandomRecipes = (count: number) => {
    if (recipes.length === 0) return [];
    
    const result = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * recipes.length);
      result.push(recipes[randomIndex]);
    }
    return result;
  };

  return (
    <div className="space-y-6">
      <section>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Meal Plan</h1>
          <Button>
            <span className="material-icons mr-2">add</span>
            New Plan
          </Button>
        </div>
        
        <Tabs defaultValue={weekDays[currentDay].toLowerCase()}>
          <div className="overflow-x-auto pb-2">
            <TabsList className="w-full justify-start">
              {weekDays.map((day, index) => (
                <TabsTrigger 
                  key={day} 
                  value={day.toLowerCase()}
                  className={index === currentDay ? "font-bold" : ""}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-muted-foreground">{day.slice(0, 3)}</span>
                    <span className={index === currentDay ? "text-primary" : ""}>
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
                  <CardTitle className="text-lg">
                    {day}
                    {currentDay === weekDays.indexOf(day) && (
                      <span className="ml-2 text-xs bg-primary text-white px-2 py-1 rounded-full">Today</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recipes.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No recipes available.</p>
                        <p className="text-sm text-muted-foreground">Add ingredients and find recipes on the home page first.</p>
                      </div>
                    ) : (
                      <>
                        <MealCard title="Breakfast" recipes={getRandomRecipes(1)} />
                        <MealCard title="Lunch" recipes={getRandomRecipes(1)} />
                        <MealCard title="Dinner" recipes={getRandomRecipes(1)} />
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-center">
                <Button variant="outline">
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

function MealCard({ title, recipes }: { title: string, recipes: Recipe[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {recipes.length === 0 ? (
          <div className="flex justify-between items-center p-2 border border-dashed border-gray-200 rounded-lg">
            <span className="text-muted-foreground">No meal planned</span>
            <Button variant="ghost" size="sm">Add</Button>
          </div>
        ) : (
          recipes.map((recipe) => (
            <div key={recipe.id} className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden">
                  {recipe.imageUrl ? (
                    <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-icons text-muted-foreground">restaurant</span>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium">{recipe.title}</h4>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span className="material-icons text-xs mr-1">schedule</span>
                    <span>{recipe.prepTime} mins</span>
                    <span className="mx-1">•</span>
                    <span className="material-icons text-xs mr-1">local_fire_department</span>
                    <span>{recipe.calories} cal</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm">Change</Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
