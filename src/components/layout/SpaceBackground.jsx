import React from 'react';

export default function SpaceBackground({ children, className }) {
  return (
    <div className={`min-h-screen bg-slate-950 relative ${className}`}>
      {/* Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}