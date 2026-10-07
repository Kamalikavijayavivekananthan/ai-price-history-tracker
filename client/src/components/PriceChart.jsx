import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';

const PriceChart = ({ historyData, predictionData }) => {
  const formattedHistory = historyData
    .map((item) => {
      const prices = item.storePrices?.map(s => s.price) || [Infinity];
      return {
        dateStr: new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        fullDate: new Date(item.date),
        price: Math.min(...prices),
        prediction: null,
      };
    })
    .sort((a, b) => a.fullDate - b.fullDate);

  let mergedData = [...formattedHistory];

  if (predictionData && predictionData.length > 0) {
    const lastHistory = formattedHistory[formattedHistory.length - 1];
    const formattedPredictions = predictionData.map((item) => ({
      dateStr: new Date(item.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      fullDate: new Date(item.date),
      price: null,
      prediction: item.price,
    }));

    if (lastHistory) {
      formattedPredictions.unshift({
        dateStr: lastHistory.dateStr,
        fullDate: lastHistory.fullDate,
        price: null,
        prediction: lastHistory.price,
      });
    }
    mergedData = [...mergedData, ...formattedPredictions];
  }

  const allPrices = [
    ...historyData.map((h) => h.price),
    ...(predictionData ? predictionData.map((p) => p.price) : []),
  ].filter(Boolean);

  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const yDomain = [
    Math.floor((minPrice * 0.92) / 100) * 100,
    Math.ceil((maxPrice * 1.08) / 100) * 100,
  ];

  // Derived stats for the legend
  const lowestP = Math.min(...historyData.map((h) => h.price));
  const highestP = Math.max(...historyData.map((h) => h.price));
  const currentP = historyData.length > 0 ? historyData[historyData.length - 1].price : null;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPrediction = data.price === null;
      const priceVal = isPrediction ? data.prediction : data.price;
      if (!priceVal) return null;

      return (
        <div className="bg-slate-900 text-white px-3 py-2.5 rounded-xl border border-slate-700/60 shadow-2xl text-xs min-w-[130px]">
          <p className="font-bold border-b border-slate-700 pb-1.5 mb-1.5 text-slate-300">{data.dateStr}</p>
          <p className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${isPrediction ? 'bg-rose-500' : 'bg-blue-500'}`} />
            <span className="text-slate-300">{isPrediction ? 'AI Forecast:' : 'Price:'}</span>
            <span className="font-extrabold text-white ml-auto">₹{priceVal.toLocaleString('en-IN')}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const hasPredictions = predictionData && predictionData.length > 0;

  if (historyData.length === 0) {
    return (
      <div className="w-full h-72 flex items-center justify-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/40">
        <p className="text-sm text-slate-400">No price history available yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-3 py-2 text-center">
          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1">
            <TrendingDown className="h-3 w-3" />
            Lowest
          </p>
          <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
            ₹{lowestP.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl px-3 py-2 text-center">
          <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Current
          </p>
          <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
            ₹{currentP ? currentP.toLocaleString('en-IN') : '—'}
          </p>
        </div>
        <div className="bg-rose-500/8 border border-rose-500/20 rounded-xl px-3 py-2 text-center">
          <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center justify-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Highest
          </p>
          <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
            ₹{highestP.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-72 bg-white/50 dark:bg-slate-900/40 p-2 rounded-2xl border border-slate-200/50 dark:border-slate-800/40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mergedData} margin={{ top: 10, right: 5, left: 5, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPrediction" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
            <XAxis
              dataKey="dateStr"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 600 }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={yDomain}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
              tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 600 }}
              width={42}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Lowest price reference line */}
            <ReferenceLine
              y={lowestP}
              stroke="#10b981"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ value: `Low ₹${lowestP.toLocaleString('en-IN')}`, position: 'insideTopLeft', fill: '#10b981', fontSize: 8, fontWeight: 'bold' }}
            />

            {/* Highest price reference line */}
            <ReferenceLine
              y={highestP}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ value: `High ₹${highestP.toLocaleString('en-IN')}`, position: 'insideBottomLeft', fill: '#f43f5e', fontSize: 8, fontWeight: 'bold' }}
            />

            {/* Historical price area */}
            <Area
              type="monotone"
              dataKey="price"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorHistory)"
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#3b82f6' }}
              dot={false}
            />

            {/* AI Predicted price area */}
            {hasPredictions && (
              <Area
                type="monotone"
                dataKey="prediction"
                stroke="#f43f5e"
                strokeDasharray="6 4"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorPrediction)"
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#f43f5e' }}
                dot={false}
              />
            )}

            {/* Transition marker */}
            {hasPredictions && formattedHistory.length > 0 && (
              <ReferenceLine
                x={formattedHistory[formattedHistory.length - 1].dateStr}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{ value: 'Forecast →', position: 'insideTopRight', fill: '#94a3b8', fontSize: 8, fontWeight: 'bold' }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceChart;
