import { Link } from "wouter";

interface BottomNavigationProps {
  currentPath: string;
}

export default function BottomNavigation({ currentPath }: BottomNavigationProps) {
  const navItems = [
    { name: "Home", path: "/", icon: "home" },
    { name: "Recipes", path: "/recipes", icon: "search" },
    { name: "Plan", path: "/meal-plan", icon: "calendar_today" },
    { name: "Grocery", path: "/grocery-list", icon: "shopping_cart" },
  ];

  return (
    <div className="sm:hidden fixed bottom-0 w-full bg-white shadow-custom border-t border-gray-200 z-50">
      <div className="flex justify-around py-2">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <a className={`flex flex-col items-center p-2 ${
              currentPath === item.path ? "text-primary" : "text-muted-foreground"
            }`}>
              <span className="material-icons">{item.icon}</span>
              <span className="text-xs mt-1">{item.name}</span>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}
