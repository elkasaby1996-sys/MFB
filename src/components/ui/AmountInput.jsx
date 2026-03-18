import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Premium amount input with live formatting, validation, and currency display
 */
export default function AmountInput({ 
  value, 
  onChange, 
  currency = 'USD',
  placeholder = '0.00',
  className,
  ...props 
}) {
  const [displayValue, setDisplayValue] = useState('');

  // Format number with thousands separators
  const formatNumber = (num) => {
    if (!num) return '';
    const parts = num.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  // Parse formatted string to number
  const parseNumber = (str) => {
    return str.replace(/,/g, '');
  };

  useEffect(() => {
    if (value) {
      setDisplayValue(formatNumber(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e) => {
    let input = e.target.value;
    
    // Remove all non-digit and non-decimal characters except the first decimal
    input = input.replace(/[^\d.]/g, '');
    
    // Prevent multiple decimals
    const parts = input.split('.');
    if (parts.length > 2) {
      input = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Prevent multiple leading zeros
    if (input.startsWith('00')) {
      input = input.substring(1);
    }
    
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      input = parts[0] + '.' + parts[1].substring(0, 2);
    }

    const rawValue = parseNumber(input);
    setDisplayValue(formatNumber(rawValue));
    onChange(rawValue ? parseFloat(rawValue) : '');
  };

  const handleBlur = () => {
    // Format on blur to ensure consistent display
    if (displayValue) {
      const num = parseFloat(parseNumber(displayValue));
      if (!isNaN(num)) {
        setDisplayValue(formatNumber(num.toFixed(2)));
        onChange(num);
      }
    }
  };

  const getCurrencySymbol = (curr) => {
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      QAR: 'QR',
      AED: 'AED',
      SAR: 'SR',
    };
    return symbols[curr] || curr;
  };

  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl font-semibold pointer-events-none">
        {getCurrencySymbol(currency)}&nbsp;
      </div>
      <Input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn(
          "pl-14 text-xl font-semibold",
          className
        )}
        {...props}
      />
    </div>
  );
}