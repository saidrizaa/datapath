import { cn } from '../../lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}

// Progress bar aksesibel dengan atribut ARIA dan transisi halus
export function Progress({
  value,
  max = 100,
  label = 'Progres belajar',
  className,
}: ProgressProps) {
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.min(safeMax, Math.max(0, value));
  const percent = Math.round((clamped / safeMax) * 100);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={clamped}
      className={cn(
        'h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800',
        className
      )}
    >
      <div
        className="h-full rounded-full bg-blue-700 transition-transform duration-300 ease-out dark:bg-blue-500"
        style={{
          width: '100%',
          transform: `translateX(-${100 - percent}%)`,
        }}
      />
    </div>
  );
}
