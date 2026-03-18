import React from 'react';
import { cn } from "@/lib/utils";
import { formatMoney } from '@/components/utils/formatMoney';

/**
 * Responsive currency component that auto-adjusts font size based on value length
 * Also provides optional number abbreviation (K/M/B format)
 */
export default function ResponsiveCurrency({ 
  amount, 
  currency = 'USD', 
  className = '',
  abbreviate = false,
  showSign = false,
  baseSize = 'text-2xl' // default size for normal numbers
}) {
  const formatAbbreviated = (value) => {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    
    if (absValue >= 1000000000) {
      return `${sign}${currency === 'USD' ? '$' : ''}${(absValue / 1000000000).toFixed(1)}B`;
    }
    if (absValue >= 1000000) {
      return `${sign}${currency === 'USD' ? '$' : ''}${(absValue / 1000000).toFixed(1)}M`;
    }
    if (absValue >= 1000) {
      return `${sign}${currency === 'USD' ? '$' : ''}${(absValue / 1000).toFixed(1)}K`;
    }
    
    return formatMoney(value, currency);
  };

  const formatCurrency = (value) => {
    if (abbreviate && Math.abs(value) >= 1000) {
      return formatAbbreviated(value);
    }
    return formatMoney(parseFloat(value) || 0, currency);
  };

  const formatted = formatCurrency(amount);
  const displayValue = (showSign && amount > 0 ? '+' : '') + formatted;
  
  // Auto-size based on length
  const getResponsiveSize = (text) => {
    const length = text.length;
    if (length > 15) return 'text-sm';
    if (length > 12) return 'text-base';
    if (length > 10) return 'text-lg';
    if (length > 8) return 'text-xl';
    return baseSize;
  };

  const responsiveSize = getResponsiveSize(displayValue);

  return (
    <span className={cn(responsiveSize, 'font-bold transition-all', className)}>
      {displayValue}
    </span>
  );
}

// Hook version for use in calculations
export function useResponsiveCurrency(currency = 'USD') {
  const formatAbbreviated = (value, curr) => {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    
    if (absValue >= 1000000000) {
      return `${sign}${curr === 'USD' ? '$' : ''}${(absValue / 1000000000).toFixed(1)}B`;
    }
    if (absValue >= 1000000) {
      return `${sign}${curr === 'USD' ? '$' : ''}${(absValue / 1000000).toFixed(1)}M`;
    }
    if (absValue >= 1000) {
      return `${sign}${curr === 'USD' ? '$' : ''}${(absValue / 1000).toFixed(1)}K`;
    }
    
    return formatMoney(parseFloat(value) || 0, curr);
  };

  const formatCurrency = (amount, abbreviate = false) => {
    if (abbreviate && Math.abs(amount) >= 1000) {
      return formatAbbreviated(amount, currency);
    }
    return formatMoney(parseFloat(amount) || 0, currency);
  };

  const getResponsiveClass = (amount, baseSize = 'text-2xl') => {
    const formatted = formatCurrency(amount);
    const length = formatted.length;
    
    if (length > 15) return 'text-sm';
    if (length > 12) return 'text-base';
    if (length > 10) return 'text-lg';
    if (length > 8) return 'text-xl';
    return baseSize;
  };

  return { formatCurrency, getResponsiveClass, formatAbbreviated };
}