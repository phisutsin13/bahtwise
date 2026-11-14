"use client";

import { useId, useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

type SparklineProps = {
  values: number[];
  className?: string;
  stroke?: string;
  fill?: string;
  height?: number;
  animate?: boolean;
  strokeWidth?: number;
};

function buildPath(values: number[], width: number, height: number, pad: number) {
  if (values.length === 0) return { line: "", area: "" };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => {
    const x = pad + (index / Math.max(1, values.length - 1)) * (width - pad * 2);
    const y = height - pad - ((value - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  let line = `M ${points[0][0]} ${points[0][1]}`;
  for (let index = 1; index < points.length; index += 1) {
    const [x0, y0] = points[index - 1];
    const [x1, y1] = points[index];
    const midX = (x0 + x1) / 2;
    line += ` C ${midX} ${y0}, ${midX} ${y1}, ${x1} ${y1}`;
  }
  const area = `${line} L ${points[points.length - 1][0]} ${height} L ${points[0][0]} ${height} Z`;
  return { line, area };
}

export function Sparkline({
  values,
  className,
  stroke = "var(--accent)",
  fill = "var(--accent)",
  height = 72,
  animate = true,
  strokeWidth = 2,
}: SparklineProps) {
  const reduce = useReducedMotion();
  const id = useId().replace(/:/g, "");
  const width = 320;
  const pad = 3;
  const safeValues = useMemo(
    () => (values.length >= 2 ? values : [0, values[0] ?? 0]),
    [values],
  );
  const { line, area } = useMemo(
    () => buildPath(safeValues, width, height, pad),
    [safeValues, height],
  );
  const rising = safeValues[safeValues.length - 1] >= safeValues[0];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("h-full w-full overflow-visible", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity={rising ? 0.3 : 0.18} />
          <stop offset="100%" stopColor={fill} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={area}
        fill={`url(#spark-${id})`}
        initial={animate && !reduce ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate && !reduce ? { pathLength: 0, opacity: 0 } : false}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: reduce ? 0 : 1, ease: [0.22, 1, 0.36, 1] }}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
