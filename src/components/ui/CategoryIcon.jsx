import React from 'react';
import { cn } from "@/lib/utils";

export const CATEGORIES = [
  { name: "Food", icon: "🍔", color: "orange" },
  { name: "Transport", icon: "🚗", color: "blue" },
  { name: "Fun", icon: "🎮", color: "purple" },
  { name: "Shopping", icon: "🛍️", color: "pink" },
  { name: "Utilities", icon: "💡", color: "amber" },
  { name: "Health", icon: "💊", color: "green" },
  { name: "Entertainment", icon: "🎬", color: "red" },
  { name: "Education", icon: "📚", color: "indigo" },
  { name: "Subscriptions", icon: "📱", color: "cyan" },
  { name: "Groceries", icon: "🥑", color: "emerald" },
  { name: "Travel", icon: "✈️", color: "sky" },
  { name: "Income", icon: "💰", color: "teal" },
  { name: "Salary", icon: "💵", color: "green" },
  { name: "Freelance", icon: "💻", color: "violet" },
  { name: "Other", icon: "📦", color: "slate" },
];

export function getCategoryByName(name) {
  return CATEGORIES.find(c => c.name.toLowerCase() === name?.toLowerCase()) || CATEGORIES[CATEGORIES.length - 1];
}

export default function CategoryIcon({ 
  category, 
  size = "md",
  showLabel = false,
  className 
}) {
  const cat = typeof category === 'string' ? getCategoryByName(category) : category;
  
  const sizes = {
    sm: "w-8 h-8 text-base",
    md: "w-10 h-10 text-xl",
    lg: "w-14 h-14 text-2xl",
  };

  const bgColors = {
    orange: "bg-orange-500/20",
    blue: "bg-blue-500/20",
    purple: "bg-purple-500/20",
    pink: "bg-pink-500/20",
    amber: "bg-amber-500/20",
    green: "bg-green-500/20",
    red: "bg-red-500/20",
    indigo: "bg-indigo-500/20",
    cyan: "bg-cyan-500/20",
    emerald: "bg-emerald-500/20",
    sky: "bg-sky-500/20",
    teal: "bg-teal-500/20",
    violet: "bg-violet-500/20",
    slate: "bg-slate-500/20",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "rounded-xl flex items-center justify-center",
        sizes[size],
        bgColors[cat.color]
      )}>
        <span>{cat.icon}</span>
      </div>
      {showLabel && (
        <span className="text-white font-medium">{cat.name}</span>
      )}
    </div>
  );
}