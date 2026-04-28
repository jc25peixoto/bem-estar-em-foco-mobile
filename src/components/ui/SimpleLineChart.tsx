import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';

interface LineChartProps {
  data: { value: number; label: string }[];
  color?: string;
  width?: number;
  height?: number;
  unit?: string;
}

export function SimpleLineChart({
  data,
  color = '#d63f52',
  width = 300,
  height = 160,
  unit = '',
}: LineChartProps) {
  const padding = { top: 28, bottom: 32, left: 24, right: 24 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const values = data.map((d) => d.value).filter(v => !isNaN(v));
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const maxVal = values.length > 0 ? Math.max(...values) : 0;
  const range = maxVal - minVal || 1;

  const points = useMemo(() => {
    if (data.length === 0) return [];
    return data.map((d, i) => {
      const x = padding.left + (data.length > 1 ? (i / (data.length - 1)) * chartW : chartW / 2);
      const y = padding.top + (1 - (d.value - minVal) / range) * chartH;
      return { x, y, label: d.label, value: d.value };
    });
  }, [data, chartW, chartH, minVal, range]);

  const polylinePoints = points.length > 1 ? points.map((p) => `${p.x},${p.y}`).join(' ') : "";

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {[0, 0.5, 1].map((ratio, i) => {
          const y = padding.top + ratio * chartH;
          return (
            <Line
              key={i}
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#e5e5e5"
              strokeWidth="1"
            />
          );
        })}

        {/* Line */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots + Value Labels */}
        {points.map((p, i) => {
          const isFirst = i === 0;
          const isLast = i === points.length - 1;
          let textAnchor: "middle" | "start" | "end" = "middle";
          if (isFirst && points.length > 1) textAnchor = "start";
          if (isLast && points.length > 1) textAnchor = "end";

          return (
            <React.Fragment key={i}>
              <Circle cx={p.x} cy={p.y} r={5} fill={color} />
              <SvgText
                x={p.x}
                y={p.y - 10}
                fontSize="10"
                fontWeight="600"
                fill={color}
                textAnchor={textAnchor}
              >
                {Number.isInteger(p.value) ? p.value : p.value.toFixed(1)}{unit}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* X Labels */}
        {points.map((p, i) => {
          const isFirst = i === 0;
          const isLast = i === points.length - 1;
          let textAnchor: "middle" | "start" | "end" = "middle";
          if (isFirst && points.length > 1) textAnchor = "start";
          if (isLast && points.length > 1) textAnchor = "end";

          return (
            <SvgText
              key={`label-${i}`}
              x={p.x}
              y={height - 4}
              fontSize="10"
              fill="#888"
              textAnchor={textAnchor}
            >
              {p.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
