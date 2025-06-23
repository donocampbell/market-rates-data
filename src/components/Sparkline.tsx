import React, { useState } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  dates?: string[]; // ISO date strings, same length as data
  monthlyData?: number[];
  monthlyDates?: string[];
}

const getMonthAbbr = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', { month: 'short' });
};

const Sparkline: React.FC<SparklineProps> = ({ data, width = 100, height = 32, dates, monthlyData, monthlyDates }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  // Debug log
  // console.log('Sparkline data:', data);
  // console.log('Sparkline dates:', dates);
  if (!data || data.length === 0 || !dates || dates.length !== data.length || !monthlyData || !monthlyDates) return null;

  // Determine color based on trend
  let color = 'hsl(var(--bridge-teal))';
  if (data[data.length - 1] > data[0]) color = '#e11d48'; // red-600
  else if (data[data.length - 1] < data[0]) color = '#22c55e'; // green-500

  // Normalize data to fit the SVG
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - 4) + 2;
    const y = height - ((d - min) / range) * (height - 8) - 2;
    return `${x},${y}`;
  }).join(' ');

  // Calculate dot positions for monthly points
  const dotPositions = monthlyDates.map((md, i) => {
    const fullIdx = dates.findIndex(d => d === md);
    const x = (fullIdx / (data.length - 1)) * (width - 4) + 2;
    const y = height - ((data[fullIdx] - min) / range) * (height - 8) - 2;
    return { x, y, idx: i, value: monthlyData[i], date: md };
  });

  return (
    <div className="relative" style={{ width, height }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        className="block"
        style={{ cursor: 'pointer' }}
      >
        {/* Sparkline */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />
        {/* Dots for monthly points */}
        {dotPositions.map((dot, i) => (
          <circle
            key={i}
            cx={dot.x}
            cy={dot.y}
            r={2}
            fill={color}
            stroke={color}
            strokeWidth={hoverIdx === i ? 2 : 0}
            className="transition-colors"
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
            style={{ cursor: 'pointer' }}
          />
        ))}
        {/* Hover marker (enlarged dot) */}
        {hoverIdx !== null && dotPositions[hoverIdx] && (
          <circle
            cx={dotPositions[hoverIdx].x}
            cy={dotPositions[hoverIdx].y}
            r={4}
            fill={color}
            stroke="#fff"
            strokeWidth={2}
            style={{ pointerEvents: 'none' }}
          />
        )}
      </svg>
      {/* Tooltip */}
      {hoverIdx !== null && dotPositions[hoverIdx] && (
        <div
          className="absolute z-10 px-2 py-1 rounded bg-white border border-slate-200 text-xs text-slate-700 shadow"
          style={{
            left: dotPositions[hoverIdx].x,
            top: 0,
            pointerEvents: 'none',
            minWidth: 60,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-semibold">{getMonthAbbr(dotPositions[hoverIdx].date)} {new Date(dotPositions[hoverIdx].date).getFullYear()}</div>
          <div>Rate: <span className="font-mono">{dotPositions[hoverIdx].value.toFixed(2)}%</span></div>
        </div>
      )}
    </div>
  );
};

export default Sparkline; 