import React, { useRef, useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { useQueryClient } from '@tanstack/react-query';
import { motion, useAnimation } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * Scrollable screen container with pull-to-refresh and safe area support
 */
export default function ScreenScrollContainer({ children, className }) {
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();
  const controls = useAnimation();
  
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const scrollStartY = useRef(0);

  const PULL_THRESHOLD = 80;
  const MAX_PULL = 120;

  const handleTouchStart = (e) => {
    if (scrollRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      scrollStartY.current = 0;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    
    if (diff > 0 && scrollRef.current?.scrollTop === 0) {
      e.preventDefault();
      const distance = Math.min(diff * 0.5, MAX_PULL);
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      controls.start({ y: PULL_THRESHOLD });
      
      try {
        await queryClient.invalidateQueries();
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Refresh failed:', error);
      }
      
      setIsRefreshing(false);
      controls.start({ y: 0 });
    } else {
      controls.start({ y: 0 });
    }
    
    setPullDistance(0);
  };

  useEffect(() => {
    if (!isPulling && !isRefreshing) {
      controls.start({ y: 0 });
    }
  }, [isPulling, isRefreshing, controls]);

  const showRefreshIndicator = pullDistance > 0 || isRefreshing;
  const opacity = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return (
    <div 
      ref={scrollRef}
      className={cn(
        "bg-slate-950 overflow-y-auto relative app-screen safe-top safe-x",
        "pb-[calc(80px+var(--safe-bottom))]",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ 
        overscrollBehavior: 'none',
        height: '100dvh',
      }}
    >
      {/* Pull to refresh indicator */}
      {showRefreshIndicator && (
        <motion.div
          animate={controls}
          initial={{ y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="absolute top-0 left-0 right-0 flex justify-center z-50"
          style={{ 
            opacity,
            paddingTop: 'var(--safe-top)'
          }}
        >
          <div className="bg-slate-900/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg flex items-center gap-2 mt-4">
            <Loader2 className={cn(
              "w-5 h-5 text-cyan-400",
              isRefreshing && "animate-spin"
            )} />
            <span className="text-white text-sm font-medium">
              {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
            </span>
          </div>
        </motion.div>
      )}

      <div className="px-4">
        {children}
      </div>
    </div>
  );
}
