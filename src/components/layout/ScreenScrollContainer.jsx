import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { motion, useAnimation } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const widthMap = {
  full: 'max-w-none',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

/**
 * Scrollable screen container with pull-to-refresh and safe area support
 */
export default function ScreenScrollContainer({
  children,
  className,
  contentClassName,
  maxWidth = 'lg',
  safeTop = true,
}) {
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();
  const controls = useAnimation();

  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);

  const PULL_THRESHOLD = 80;
  const MAX_PULL = 120;

  const handleTouchStart = (e) => {
    if (scrollRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
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
        await new Promise((resolve) => setTimeout(resolve, 500));
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
      className={cn('screen-shell app-screen h-[100dvh] overflow-y-auto bg-background text-foreground', safeTop && 'safe-top', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ overscrollBehavior: 'none' }}
    >
      {showRefreshIndicator && (
        <motion.div
          animate={controls}
          initial={{ y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="absolute left-0 right-0 top-0 z-50 flex justify-center"
          style={{ opacity, paddingTop: 'var(--safe-top)' }}
        >
          <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/95 px-4 py-2 shadow-[var(--shadow-card)] backdrop-blur-sm">
            <Loader2 className={cn('h-5 w-5 text-cyan-400', isRefreshing && 'animate-spin')} />
            <span className="text-sm font-medium text-white">
              {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
            </span>
          </div>
        </motion.div>
      )}

      <div
        className={cn(
          'screen-shell__content screen-shell--with-tabbar mx-auto min-h-full w-full',
          widthMap[maxWidth],
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
