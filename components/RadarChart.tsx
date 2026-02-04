
import React from 'react';
import { Dimension5D } from '../types';

interface RadarChartProps {
  data: Dimension5D;
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ data, size = 300 }) => {
  const padding = 40;
  const radius = (size - padding * 2) / 2;
  const center = size / 2;
  
  const axes = ['IQ', 'EQ', 'Physical', 'Social', 'AQ'];
  const values = [data.iq, data.eq, data.physical, data.social, data.aq];
  
  const points = values.map((val, i) => {
    const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    const r = (val / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circles */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((p) => (
          <circle
            key={p}
            cx={center}
            cy={center}
            r={radius * p}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        ))}
        
        {/* Axes */}
        {axes.map((axis, i) => {
          const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
          const labelR = radius + 20;
          return (
            <g key={axis}>
              <line
                x1={center}
                y1={center}
                x2={center + radius * Math.cos(angle)}
                y2={center + radius * Math.sin(angle)}
                stroke="rgba(255,255,255,0.2)"
              />
              <text
                x={center + labelR * Math.cos(angle)}
                y={center + labelR * Math.sin(angle)}
                fill="#fff"
                fontSize="12"
                textAnchor="middle"
                dominantBaseline="middle"
                fontWeight="bold"
              >
                {axis}
              </text>
            </g>
          );
        })}

        {/* The data polygon */}
        <path
          d={pathData}
          fill="rgba(255, 215, 0, 0.3)"
          stroke="#FFD700"
          strokeWidth="2"
        />
        
        {/* Points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="#FFD700" />
        ))}
      </svg>
    </div>
  );
};
