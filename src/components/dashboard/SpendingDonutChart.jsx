import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

const CATEGORY_COLORS = {
  'Food': '#FF8C42',
  'Transport': '#00D9FF',
  'Savings': '#00FF94',
  'Fun': '#FF0080',
  'Shopping': '#A855F7',
  'Home Expenses': '#FFD700',
  'Health': '#22D3EE',
  'Education': '#8B5CF6',
  'Subscriptions': '#EC4899',
  'Travel': '#10B981',
  'Gifts': '#F59E0B',
  'Debt': '#EF4444',
  'Entertainment': '#FF0080',
  'Healthcare': '#22D3EE',
  'Other': '#94A3B8'
};

const CATEGORY_ORDER = ['Food', 'Home Expenses', 'Transport', 'Fun', 'Shopping', 'Health', 'Education', 'Subscriptions', 'Travel', 'Savings', 'Debt', 'Gifts'];

export default function SpendingDonutChart({ transactions = [], currency = 'USD' }) {
  const [activeIndex, setActiveIndex] = useState(null);
  
  // Calculate spending by category (group Home Expenses as one bucket)
  const categoryData = transactions.reduce((acc, t) => {
    if (t.type === 'expense') {
      const cat = t.category || 'Other';
      acc[cat] = (acc[cat] || 0) + (t.amount || 0);
    }
    return acc;
  }, {});

  // Map Fun to Entertainment if needed
  if (categoryData['Entertainment'] && !categoryData['Fun']) {
    categoryData['Fun'] = categoryData['Entertainment'];
    delete categoryData['Entertainment'];
  }

  // Prepare chart data
  const chartData = CATEGORY_ORDER
    .filter(cat => categoryData[cat] > 0)
    .map(cat => ({
      name: cat,
      value: categoryData[cat],
      color: CATEGORY_COLORS[cat]
    }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="#0a0e1a"
          strokeWidth={2}
          style={{
            filter: `drop-shadow(0 0 12px ${fill})`,
          }}
        />
      </g>
    );
  };

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const CustomLegend = () => (
    <div className="grid grid-cols-2 gap-2 mt-3 sm:mt-4">
      {chartData.map((item, index) => (
        <div 
          key={item.name} 
          className="flex items-center gap-2 cursor-pointer transition-opacity active:opacity-70 min-h-[44px] p-1"
          onClick={() => setActiveIndex(index === activeIndex ? null : index)}
        >
          <div 
            className="w-3 h-3 rounded-full shadow-lg flex-shrink-0"
            style={{ 
              backgroundColor: item.color,
              boxShadow: `0 0 8px ${item.color}80`
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs sm:text-sm truncate font-medium">{item.name}</p>
            <p className="text-cyan-400 text-xs font-bold whitespace-nowrap">{formatCurrency(item.value)}</p>
          </div>
        </div>
      ))}
    </div>
  );

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">No spending data yet</p>
        <p className="text-slate-500 text-sm">Start tracking expenses to see your breakdown</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative">
        <ResponsiveContainer width="100%" height={260} className="mx-auto">
          <PieChart>
            <defs>
              {chartData.map((item) => (
                <radialGradient key={`gradient-${item.name}`} id={`gradient-${item.name}`}>
                  <stop offset="0%" stopColor={item.color} stopOpacity={1} />
                  <stop offset="100%" stopColor={item.color} stopOpacity={0.8} />
                </radialGradient>
              ))}
            </defs>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
              onClick={(data, index) => setActiveIndex(index === activeIndex ? null : index)}
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={`url(#gradient-${entry.name})`}
                  stroke="#0a0e1a"
                  strokeWidth={2}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </Pie>
            <Tooltip
              trigger="click"
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155', 
                borderRadius: '8px'
              }}
              itemStyle={{ color: '#ffffff !important', fontWeight: 'bold' }}
              labelStyle={{ color: '#ffffff !important', fontWeight: 'bold' }}
              formatter={(value, name) => [`${formatCurrency(value)}`, `${name}`]}
              labelFormatter={(name) => <span style={{ color: '#ffffff' }}>{name}</span>}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Label */}
        <div 
          className="absolute flex flex-col items-center justify-center pointer-events-none px-2"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '110px'
          }}
        >
          {activeIndex !== null ? (
            <>
              <p className="text-cyan-400 text-[11px] mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis w-full text-center font-semibold">
                {chartData[activeIndex].name}
              </p>
              <p className="text-white text-base sm:text-lg font-bold whitespace-nowrap">
                {formatCurrency(chartData[activeIndex].value)}
              </p>
              <p className="text-teal-400 text-[10px] whitespace-nowrap mt-0.5 font-bold">
                {((chartData[activeIndex].value / total) * 100).toFixed(0)}%
              </p>
            </>
          ) : (
            <>
              <p className="text-cyan-400 text-xs font-semibold mb-0.5">Total</p>
              <p className="text-white text-base sm:text-lg font-bold whitespace-nowrap">
                {formatCurrency(total)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <CustomLegend />
    </motion.div>
  );
}