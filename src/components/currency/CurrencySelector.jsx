import React from 'react';
import MobileSelect from '@/components/ui/MobileSelect';
import { CURRENCIES } from '@/components/constants/currencies';

export default function CurrencySelector({ value, onChange, currencies = null, className = "" }) {
  const availableCurrencies = currencies || CURRENCIES;

  return (
    <MobileSelect
      value={value}
      onValueChange={onChange}
      options={availableCurrencies.map(curr => ({
        value: curr.code,
        label: curr.code,
        icon: curr.flag,
        description: curr.name,
      }))}
      placeholder="Select currency"
      title="Select Currency"
      searchable={availableCurrencies.length > 10}
      triggerClassName={className}
    />
  );
}