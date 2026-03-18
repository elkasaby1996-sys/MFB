import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, MapPin, Globe } from "lucide-react";

const CONTEXTS = [
  { value: 'current', label: 'Current Country', icon: MapPin, color: 'cyan' },
  { value: 'home', label: 'Home Country', icon: Home, color: 'green' },
  { value: 'other', label: 'Other', icon: Globe, color: 'slate' },
];

export default function CountryContextSelector({ value, onChange, className = "" }) {
  const selected = CONTEXTS.find(c => c.value === value) || CONTEXTS[0];
  const Icon = selected.icon;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`bg-slate-800 border-slate-700 text-white ${className}`}>
        <SelectValue>
          <span className="flex items-center gap-2">
            <Icon className={`w-4 h-4 text-${selected.color}-400`} />
            <span>{selected.label}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-slate-800 border-slate-700">
        {CONTEXTS.map(ctx => {
          const CtxIcon = ctx.icon;
          return (
            <SelectItem key={ctx.value} value={ctx.value} className="text-white">
              <span className="flex items-center gap-2">
                <CtxIcon className={`w-4 h-4 text-${ctx.color}-400`} />
                <span>{ctx.label}</span>
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}