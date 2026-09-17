'use client';
import { useEffect, useRef } from 'react';

interface Point { date: string; value: number; }

/** Values are varroa levels 0–3; `levelLabels[i]` names level i on the y axis (none … high). */
export default function VarroaChart({ data, levelLabels }: { data: Point[]; levelLabels?: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;
    let chart: { destroy(): void } | undefined;
    import('chart.js/auto').then(({ Chart }) => {
      if (!canvasRef.current) return;
      chart = new Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels: data.map(p => p.date),
          datasets: [{
            data: data.map(p => p.value),
            borderColor: '#b91c1c',
            backgroundColor: 'rgba(185,28,28,0.08)',
            tension: 0.3,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#b91c1c',
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              min: 0,
              max: 3,
              ticks: {
                stepSize: 1,
                callback: (value: string | number) => levelLabels?.[Number(value)] ?? value,
              },
            },
            x: { ticks: { maxRotation: 45, maxTicksLimit: 12 } },
          },
        },
      });
    });
    return () => { chart?.destroy(); };
  }, [data, levelLabels]);

  return <canvas ref={canvasRef} />;
}
