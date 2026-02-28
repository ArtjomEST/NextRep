import React from 'react';
import { theme } from '@/lib/theme';
import type { WeeklyDataPoint } from '@/lib/types';

interface LineChartProps {
  data: WeeklyDataPoint[];
  height?: number;
}

export default function LineChart({ data, height = 140 }: LineChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const padding = { top: 16, right: 8, bottom: 28, left: 8 };
  const chartWidth = 100;
  const chartHeight = height;

  const activePoints = data.filter((d) => d.value > 0);

  const getX = (index: number) => {
    const usable = chartWidth - padding.left - padding.right;
    return padding.left + (index / (data.length - 1)) * usable;
  };

  const getY = (value: number) => {
    const usable = chartHeight - padding.top - padding.bottom;
    return chartHeight - padding.bottom - (value / maxValue) * usable;
  };

  const pathPoints = data
    .map((d, i) => ({ x: getX(i), y: getY(d.value), value: d.value }))
    .filter((p) => p.value > 0);

  const linePath = pathPoints.length > 1
    ? pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    : '';

  const areaPath = linePath && pathPoints.length > 1
    ? `${linePath} L ${pathPoints[pathPoints.length - 1].x} ${chartHeight - padding.bottom} L ${pathPoints[0].x} ${chartHeight - padding.bottom} Z`
    : '';

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        style={{ width: '100%', height: 'auto' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.colors.primary} stopOpacity="0.25" />
            <stop offset="100%" stopColor={theme.colors.primary} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {areaPath && (
          <path d={areaPath} fill="url(#chartGrad)" />
        )}

        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={theme.colors.primary}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {activePoints.length > 0 && data.map((d, i) =>
          d.value > 0 ? (
            <circle
              key={i}
              cx={getX(i)}
              cy={getY(d.value)}
              r="2.5"
              fill={theme.colors.primary}
              stroke={theme.colors.card}
              strokeWidth="1"
            />
          ) : null
        )}

        {data.map((d, i) => (
          <text
            key={i}
            x={getX(i)}
            y={chartHeight - 6}
            textAnchor="middle"
            fill={theme.colors.textMuted}
            fontSize="6"
            fontFamily="inherit"
          >
            {d.day}
          </text>
        ))}
      </svg>
    </div>
  );
}
