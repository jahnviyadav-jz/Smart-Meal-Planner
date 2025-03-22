interface NutritionRingProps {
  title: string;
  value: number;
  max: number;
  color: string;
  unit?: string;
}

export default function NutritionRing({ title, value, max, color, unit = "" }: NutritionRingProps) {
  // Calculate percentage
  const percentage = Math.min(100, Math.round((value / max) * 100));
  
  // Calculate stroke-dashoffset
  const radius = 35;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20 mb-2">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle 
            r="35" 
            cx="40" 
            cy="40" 
            fill="none" 
            stroke="#E0E0E0" 
            strokeWidth="6"
          />
          <circle 
            className="progress-ring-circle" 
            r="35" 
            cx="40" 
            cy="40" 
            fill="none" 
            stroke={color} 
            strokeWidth="6" 
            strokeDasharray={circumference} 
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-sm font-semibold">{percentage}%</span>
        </div>
      </div>
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs text-muted-foreground">{value}{unit}/{max}{unit}</span>
    </div>
  );
}
