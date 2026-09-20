import React from 'react';
import type { IconProps } from '@phosphor-icons/react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<IconProps>;
  trend?: {
    value: string;
    positive: boolean;
  };
}

export function MetricCard({ title, value, subtitle, icon: Icon, trend }: MetricCardProps) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          {title}
        </span>
        <div className="p-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700/40 text-emerald-400">
          <Icon size={22} weight="duotone" />
        </div>
      </div>

      <div className="mt-4">
        <div className="text-3xl font-semibold text-zinc-100 font-mono tracking-tight">
          {value}
        </div>
        
        <div className="flex items-center justify-between mt-1 text-xs">
          {subtitle && <span className="text-zinc-500">{subtitle}</span>}
          {trend && (
            <span
              className={
                trend.positive
                  ? 'text-emerald-400 font-medium'
                  : 'text-rose-400 font-medium'
              }
            >
              {trend.positive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}