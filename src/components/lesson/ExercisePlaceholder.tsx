import { Code2, Database, Table2 } from 'lucide-react';
import { Card } from '../ui/card';

export interface ExercisePlaceholderProps {
  exerciseType: 'python' | 'sql' | 'excel';
  title: string;
  description?: string;
}

export function ExercisePlaceholder({
  exerciseType,
  title,
  description,
}: ExercisePlaceholderProps) {
  const meta =
    exerciseType === 'python'
      ? { label: 'Kerangka Editor Python (Pyodide)', Icon: Code2 }
      : exerciseType === 'sql'
        ? { label: 'Kerangka Latihan SQL (sql.js)', Icon: Database }
        : { label: 'Kerangka Grid Excel Interaktif', Icon: Table2 };

  const Icon = meta.Icon;

  return (
    <Card className="mt-6 border-dashed border-slate-300 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {meta.label}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Soal interaktif disiapkan pada pembaruan berikutnya
        </span>
      </div>
      <h3 className="mt-2 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {description}
        </p>
      )}
    </Card>
  );
}
