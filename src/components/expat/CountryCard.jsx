import React from 'react';
import NeonCard from '@/components/ui/NeonCard';
import { ChevronRight, Home, MapPin, Globe, Trash2 } from "lucide-react";
import { formatCurrency } from '../currency/currencyUtils';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const COUNTRY_FLAGS = {
  QA: '🇶🇦', EG: '🇪🇬', US: '🇺🇸', GB: '🇬🇧', SA: '🇸🇦', AE: '🇦🇪',
  IN: '🇮🇳', PK: '🇵🇰', BD: '🇧🇩', PH: '🇵🇭', ID: '🇮🇩', MY: '🇲🇾',
  CA: '🇨🇦', AU: '🇦🇺', DE: '🇩🇪', FR: '🇫🇷', ES: '🇪🇸', IT: '🇮🇹'
};

export default function CountryCard({
  countryCode,
  countryName,
  context,
  assets,
  liabilities,
  currency,
  baseCurrency,
  onDelete
}) {
  const netWorth = assets - liabilities;
  const flag = COUNTRY_FLAGS[countryCode] || '🌍';

  const contextConfig = {
    current: { icon: MapPin, label: 'Current Country', color: 'cyan' },
    home: { icon: Home, label: 'Home Country', color: 'purple' },
    other: { icon: Globe, label: 'Other', color: 'teal' }
  };

  const config = contextConfig[context] || contextConfig.other;
  const ContextIcon = config.icon;

  return (
    <NeonCard className="p-5" glowColor={config.color} hover>
      <div className="flex items-start justify-between mb-4">
        <Link
          to={createPageUrl('CountryDetail') + `?country=${countryCode}`}
          className="flex items-center gap-3 flex-1">

          <div className="text-sky-400 text-4xl">{flag}</div>
          <div>
            <h3 className="text-white font-bold text-lg">{countryName}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <ContextIcon className={`w-3 h-3 text-${config.color}-400`} />
              <span className={`text-${config.color}-400 text-xs`}>{config.label}</span>
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link to={createPageUrl('CountryDetail') + `?country=${countryCode}`}>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </Link>
          {onDelete &&
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Remove ${countryName}? This won't delete your assets, just the country profile.`)) {
                onDelete();
              }
            }}
            className="p-2 text-slate-400 hover:text-red-400 transition-colors">

              <Trash2 className="w-4 h-4" />
            </button>
          }
        </div>
      </div>

      <Link to={createPageUrl('CountryDetail') + `?country=${countryCode}`}>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <p className="text-slate-400 text-xs">Assets</p>
            <p className="text-green-400 font-semibold text-sm">
              {formatCurrency(assets, baseCurrency)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Liabilities</p>
            <p className="text-red-400 font-semibold text-sm">
              {formatCurrency(liabilities, baseCurrency)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Net</p>
            <p className={`font-bold text-sm ${netWorth >= 0 ? 'text-cyan-400' : 'text-orange-400'}`}>
              {formatCurrency(netWorth, baseCurrency)}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-700">
          <p className="text-slate-500 text-xs">Local currency: {currency}</p>
        </div>
      </Link>
    </NeonCard>);

}