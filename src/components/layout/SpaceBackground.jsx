import React from 'react';
import { cn } from '@/lib/utils';

export default function SpaceBackground({ children, className }) {
  return (
    <div
      className={cn(
        'relative min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.95),_rgba(2,8,23,1)_58%)]',
        className,
      )}
    >
      <div className="relative">{children}</div>
    </div>
  );
}
