import React, { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { nativeHaptics } from '@/lib/native';

/**
 * Floating Action Button for quick actions
 * Draggable and positioned for easy thumb reach
 */
export default function FloatingActionButton({ onClick, className }) {
  const [isDragging, setIsDragging] = useState(false);
  const constraintsRef = useRef(null);

  const handleClick = () => {
    // Only trigger onClick if not dragging
    if (!isDragging) {
      nativeHaptics.tap();
      onClick();
    }
  };

  // Calculate drag constraints based on viewport
  const fabSize = 56; // 14 * 4 = 56px (w-14 h-14)
  const padding = 16; // Minimum padding from edges
  
  const constraints = {
    top: -(window.innerHeight - fabSize - padding - 100), // Account for bottom nav
    left: -(window.innerWidth - fabSize - padding),
    right: 0,
    bottom: 0,
  };

  return (
    <motion.button
      drag
      dragMomentum={false}
      dragElastic={0.05}
      dragConstraints={constraints}
      dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => {
        // Small delay to prevent click after drag
        setTimeout(() => setIsDragging(false), 100);
      }}
      onClick={handleClick}
      aria-label="Add transaction"
      className={cn(
        "fixed bottom-[100px] right-6 z-40",
        "w-14 h-14 rounded-full",
        "bg-cyan-500/5 backdrop-blur-sm border border-cyan-400/20",
        "shadow-[0_0_15px_rgba(0,255,255,0.2)]",
        "flex items-center justify-center",
        "active:scale-90 transition-transform duration-200",
        "cursor-grab active:cursor-grabbing",
        className
      )}
      style={{
        bottom: `calc(100px + var(--safe-bottom))`
      }}
    >
      <Plus className="w-7 h-7 text-white" strokeWidth={3} />
    </motion.button>
  );
}
