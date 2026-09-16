'use client';
import { useEffect, useRef } from 'react';

interface Point { date: string; value: number; }

export default function VarroaChart({ data }: { data: Point[] }) {
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
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
            x: { ticks: { maxRotation: 45, maxTicksLimit: 12 } },
          },
        },
      });
    });
    return () => { chart?.destroy(); };
  }, [data]);

  return <canvas ref={canvasRef} />;
}
