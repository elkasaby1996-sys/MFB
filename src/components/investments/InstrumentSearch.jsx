import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, CheckCircle } from "lucide-react";
import NeonCard from '@/components/ui/NeonCard';
import { motion, AnimatePresence } from 'framer-motion';

const ASSET_TYPE_ICONS = {
  stock: '📈',
  etf: '📊',
  crypto: '🪙',
  metal: '🥇',
};

export default function InstrumentSearch({ onSelect, selectedInstrument, assetType = 'stock' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchInstruments = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 1) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('market_resolveSymbolWithSector', {
        symbol: searchQuery,
        assetType,
      });

      setResults(response.data?.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    }
    setLoading(false);
  };

  const handleQueryChange = (value) => {
    setQuery(value);
    const timeout = setTimeout(() => searchInstruments(value), 500);
    return () => clearTimeout(timeout);
  };

  const handleSelect = async (result) => {
    // Create or find instrument
    try {
      const existing = await base44.entities.Instrument.filter({
        symbol: result.symbol,
        assetType,
      });

      let instrument;
      if (existing.length > 0) {
        instrument = existing[0];
      } else {
        // Create new instrument
        instrument = await base44.entities.Instrument.create({
          symbol: result.symbol,
          name: result.name,
          assetType,
          instrumentCurrency: result.currency || 'USD',
          providerSymbol: result.providerSymbol,
          providerMeta: JSON.stringify({
            exchange: result.exchange,
            sector: result.sector,
            geography: result.geography,
          }),
          sector: result.sector,
          geography: result.geography,
        });
      }

      onSelect(instrument);
      setQuery(result.symbol);
      setResults([]);
    } catch (error) {
      console.error('Failed to create instrument:', error);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-slate-300">
        Search Instrument
        {selectedInstrument && (
          <span className="text-green-400 ml-2 text-xs inline-flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Selected: {selectedInstrument.symbol}
          </span>
        )}
      </Label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={`Search ${assetType}... (e.g., ${assetType === 'crypto' ? 'BTC' : assetType === 'metal' ? 'Gold' : 'AAPL'})`}
          className="bg-slate-800 border-slate-700 text-white pl-10"
        />
      </div>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 max-h-64 overflow-y-auto"
          >
            <NeonCard className="p-2">
              {results.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(result)}
                  className="w-full p-3 text-left hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{ASSET_TYPE_ICONS[assetType] || '💼'}</span>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">
                        {result.symbol}
                        {result.exchange && <span className="text-slate-400 ml-2 text-xs">{result.exchange}</span>}
                      </p>
                      <p className="text-slate-400 text-xs">{result.name}</p>
                    </div>
                  </div>
                </button>
              ))}
            </NeonCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}