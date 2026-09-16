'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';

interface MoodChartProps {
  distribution: Record<string, number>;
}

// The legend used to be built from the raw API value ("calm" -> "Calm"), so the chart stayed
// English on the German, French and Spanish dashboards.
const MOOD_LABEL_KEYS: Record<string, string> = {
  calm: 'moodCalm',
  nervous: 'moodNervous',
  aggressive: 'moodAggressive',
};

const MOOD_COLORS: Record<string, string> = {
  calm: '#16a34a',
  nervous: '#f59e0b',
  aggressive: '#ef4444',
};

export default function MoodChart({ distribution }: MoodChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = useTranslations('dash.hive');

  const entries = useMemo(
    () => Object.entries(distribution).filter(([, v]) => v > 0),
    [distribution],
  );
  const labels = useMemo(
    () => entries.map(([k]) =>
      MOOD_LABEL_KEYS[k] ? t(MOOD_LABEL_KEYS[k]) : k.charAt(0).toUpperCase() + k.slice(1)),
    [entries, t],
  );

  useEffect(() => {
    if (!canvasRef.current || entries.length === 0) return;
    let chart: { destroy(): void } | undefined;
    import('chart.js/auto').then(({ Chart }) => {
      if (!canvasRef.current) return;
      const total = entries.reduce((s, [, v]) => s + v, 0);
      chart = new Chart(canvasRef.current, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: entries.map(([, v]) => v),
            backgroundColor: entries.map(([k]) => MOOD_COLORS[k] ?? '#6b7280'),
            borderWidth: 2,
            borderColor: '#fff',
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: {
              callbacks: {
                label: ctx => {
                  const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
                  return ` ${ctx.label}: ${pct}% (${ctx.parsed})`;
                },
              },
            },
          },
        },
      });
    });
    return () => { chart?.destroy(); };
  }, [entries, labels]);

  return <canvas ref={canvasRef} />;
}
