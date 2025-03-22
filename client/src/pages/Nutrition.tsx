import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NutritionRing from "@/components/NutritionRing";
import { NutritionData } from "@shared/schema";
import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function Nutrition() {
  // Fetch nutrition data
  const { data: nutritionData } = useQuery<NutritionData>({
    queryKey: ["/api/nutrition"],
  });

  // Create data for pie chart
  const pieData = nutritionData ? [
    { name: "Protein", value: nutritionData.protein, color: "#FF9800" },
    { name: "Carbs", value: nutritionData.carbs, color: "#8BC34A" },
    { name: "Fat", value: nutritionData.fat, color: "#03A9F4" },
  ] : [];

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold mb-6">Nutrition</h1>
        
        <Tabs defaultValue="today">
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>
          
          <TabsContent value="today" className="space-y-6 mt-6">
            {!nutritionData ? (
              <Card className="p-8 text-center">
                <span className="material-icons text-4xl text-muted-foreground mb-2">restaurant</span>
                <h3 className="text-lg font-medium mb-1">No nutrition data available</h3>
                <p className="text-muted-foreground">
                  Start adding meals to track your nutrition.
                </p>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Today's Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Macronutrient Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Daily Goals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Calories</span>
                            <span className="text-sm text-muted-foreground">
                              {nutritionData.calories} / {nutritionData.caloriesGoal}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary" 
                              style={{ width: `${Math.min(100, (nutritionData.calories / nutritionData.caloriesGoal) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Protein</span>
                            <span className="text-sm text-muted-foreground">
                              {nutritionData.protein}g / {nutritionData.proteinGoal}g
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full" 
                              style={{ 
                                width: `${Math.min(100, (nutritionData.protein / nutritionData.proteinGoal) * 100)}%`,
                                backgroundColor: '#FF9800'
                              }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Carbs</span>
                            <span className="text-sm text-muted-foreground">
                              {nutritionData.carbs}g / {nutritionData.carbsGoal}g
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full" 
                              style={{ 
                                width: `${Math.min(100, (nutritionData.carbs / nutritionData.carbsGoal) * 100)}%`,
                                backgroundColor: '#8BC34A'
                              }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Fats</span>
                            <span className="text-sm text-muted-foreground">
                              {nutritionData.fat}g / {nutritionData.fatGoal}g
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full" 
                              style={{ 
                                width: `${Math.min(100, (nutritionData.fat / nutritionData.fatGoal) * 100)}%`,
                                backgroundColor: '#03A9F4'
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="week" className="mt-6">
            <Card className="p-8 text-center">
              <h3 className="text-lg font-medium mb-1">Weekly statistics coming soon</h3>
              <p className="text-muted-foreground">
                We're working on aggregating your weekly nutrition data.
              </p>
            </Card>
          </TabsContent>
          
          <TabsContent value="month" className="mt-6">
            <Card className="p-8 text-center">
              <h3 className="text-lg font-medium mb-1">Monthly statistics coming soon</h3>
              <p className="text-muted-foreground">
                We're working on aggregating your monthly nutrition data.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
