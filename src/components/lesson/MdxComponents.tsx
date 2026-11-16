import { lazy, Suspense, type ComponentPropsWithoutRef } from 'react';
import type { EditorPythonProps } from './EditorPython';
import type { LatihanSQLProps } from './LatihanSQL';
import type { GridExcelProps } from './GridExcel';
import type { ExercisePlaceholderProps } from './ExercisePlaceholder';

const LazyEditorPython = lazy(() =>
  import('./EditorPython').then((m) => ({ default: m.EditorPython }))
);
const LazyLatihanSQL = lazy(() =>
  import('./LatihanSQL').then((m) => ({ default: m.LatihanSQL }))
);
const LazyGridExcel = lazy(() =>
  import('./GridExcel').then((m) => ({ default: m.GridExcel }))
);
const LazyExercisePlaceholder = lazy(() =>
  import('./ExercisePlaceholder').then((m) => ({ default: m.ExercisePlaceholder }))
);

function ExerciseSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400"
    >
      Memuat komponen {label}...
    </div>
  );
}

function slugifyHeading(children: unknown): string {
  const text = typeof children === 'string' ? children : String(children ?? '');
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

export const mdxComponents = {
  EditorPython: (props: EditorPythonProps) => (
    <Suspense fallback={<ExerciseSkeleton label="Editor Python" />}>
      <LazyEditorPython {...props} />
    </Suspense>
  ),
  LatihanSQL: (props: LatihanSQLProps) => (
    <Suspense fallback={<ExerciseSkeleton label="Latihan SQL" />}>
      <LazyLatihanSQL {...props} />
    </Suspense>
  ),
  GridExcel: (props: GridExcelProps) => (
    <Suspense fallback={<ExerciseSkeleton label="Grid Excel Interaktif" />}>
      <LazyGridExcel {...props} />
    </Suspense>
  ),
  ExercisePlaceholder: (props: ExercisePlaceholderProps) => (
    <Suspense fallback={<ExerciseSkeleton label="Kerangka Latihan" />}>
      <LazyExercisePlaceholder {...props} />
    </Suspense>
  ),
  h2: ({ children, ...props }: ComponentPropsWithoutRef<'h2'>) => {
    const id = slugifyHeading(children);
    return (
      <h2
        id={id}
        className="scroll-mt-24 mt-10 border-b border-slate-200 pb-2.5 font-display text-2xl font-bold tracking-tight text-slate-900 first:mt-0 dark:border-slate-800 dark:text-slate-50"
        {...props}
      >
        {children}
      </h2>
    );
  },
  h3: ({ children, ...props }: ComponentPropsWithoutRef<'h3'>) => (
    <h3
      className="mt-7 font-display text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100"
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ children, ...props }: ComponentPropsWithoutRef<'p'>) => (
    <p
      className="mt-4 text-[15.5px] leading-relaxed text-slate-700 dark:text-slate-300"
      {...props}
    >
      {children}
    </p>
  ),
  ul: ({ children, ...props }: ComponentPropsWithoutRef<'ul'>) => (
    <ul
      className="mt-4 list-disc space-y-2 pl-6 text-[15.5px] leading-relaxed text-slate-700 dark:text-slate-300"
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: ComponentPropsWithoutRef<'ol'>) => (
    <ol
      className="mt-4 list-decimal space-y-2 pl-6 text-[15.5px] leading-relaxed text-slate-700 dark:text-slate-300"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }: ComponentPropsWithoutRef<'li'>) => (
    <li className="pl-1" {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }: ComponentPropsWithoutRef<'strong'>) => (
    <strong className="font-semibold text-slate-900 dark:text-slate-100" {...props}>
      {children}
    </strong>
  ),
  code: ({ children, className, ...props }: ComponentPropsWithoutRef<'code'>) => {
    const isBlock = Boolean(className && className.includes('language-'));
    if (isBlock) {
      return (
        <code className="font-mono text-xs leading-relaxed text-slate-100" {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[13px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }: ComponentPropsWithoutRef<'pre'>) => (
    <pre
      className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs leading-relaxed text-slate-100 dark:border-slate-800"
      {...props}
    >
      {children}
    </pre>
  ),
  table: ({ children, ...props }: ComponentPropsWithoutRef<'table'>) => (
    <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full border-collapse text-left text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: ComponentPropsWithoutRef<'thead'>) => (
    <thead
      className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
      {...props}
    >
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: ComponentPropsWithoutRef<'tbody'>) => (
    <tbody className="divide-y divide-slate-200 dark:divide-slate-800" {...props}>
      {children}
    </tbody>
  ),
  th: ({ children, ...props }: ComponentPropsWithoutRef<'th'>) => (
    <th className="px-4 py-3 font-semibold" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: ComponentPropsWithoutRef<'td'>) => (
    <td className="px-4 py-3 text-slate-700 dark:text-slate-300" {...props}>
      {children}
    </td>
  ),
  blockquote: ({ children, ...props }: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote
      className="mt-5 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-3.5 text-sm leading-relaxed text-slate-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-slate-200 [&>p]:mt-0 [&>p]:text-sm [&>p]:text-slate-800 dark:[&>p]:text-slate-200"
      {...props}
    >
      {children}
    </blockquote>
  ),
  a: ({ children, href, ...props }: ComponentPropsWithoutRef<'a'>) => (
    <a
      href={href}
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noreferrer' : undefined}
      className="font-medium text-blue-700 underline underline-offset-4 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      {...props}
    >
      {children}
    </a>
  ),
};
