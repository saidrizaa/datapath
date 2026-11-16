import { Fragment, type ReactNode } from 'react';

function renderInlineMarkdown(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<Fragment key={`t-${idx++}`}>{text.slice(lastIndex, match.index)}</Fragment>);
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`b-${idx++}`} className="font-semibold text-slate-900 dark:text-slate-100">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={`c-${idx++}`}
          className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={`i-${idx++}`} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('[')) {
      const linkMatch = /^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/.exec(token);
      if (linkMatch) {
        parts.push(
          <a
            key={`a-${idx++}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-blue-700 underline underline-offset-4 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        parts.push(<Fragment key={`raw-${idx++}`}>{token}</Fragment>);
      }
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(<Fragment key={`e-${idx++}`}>{text.slice(lastIndex)}</Fragment>);
  }
  return parts;
}

export function SimpleMarkdown({
  content,
  emptyText = 'Belum ada konten yang ditulis.',
  variant = 'compact',
}: {
  content: string;
  emptyText?: string;
  variant?: 'compact' | 'article';
}) {
  if (!content.trim()) {
    return (
      <p className="text-xs italic text-slate-500 dark:text-slate-400">
        {emptyText}
      </p>
    );
  }

  const lines = content.split(/\r?\n/);
  const nodes: ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];

  const isArticle = variant === 'article';

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        nodes.push(
          <pre
            key={`code-${i}`}
            className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100 dark:border-slate-800"
          >
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(rawLine);
      continue;
    }

    if (!trimmed) {
      nodes.push(<div key={`sp-${i}`} className={isArticle ? 'h-2' : 'h-1'} />);
      continue;
    }

    if (trimmed.startsWith('### ')) {
      nodes.push(
        <h4
          key={`h4-${i}`}
          className={`font-display font-bold text-slate-900 dark:text-slate-100 ${
            isArticle ? 'pt-3 text-lg' : 'text-sm'
          }`}
        >
          {renderInlineMarkdown(trimmed.slice(4))}
        </h4>
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      nodes.push(
        <h3
          key={`h3-${i}`}
          className={`font-display font-bold text-slate-900 dark:text-slate-50 ${
            isArticle ? 'pt-5 border-b border-slate-200 pb-2 text-xl dark:border-slate-800' : 'text-base'
          }`}
        >
          {renderInlineMarkdown(trimmed.slice(3))}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith('# ')) {
      nodes.push(
        <h2
          key={`h2-${i}`}
          className={`font-display font-bold text-slate-900 dark:text-slate-50 ${
            isArticle ? 'pt-4 text-2xl' : 'text-base'
          }`}
        >
          {renderInlineMarkdown(trimmed.slice(2))}
        </h2>
      );
      continue;
    }

    if (trimmed.startsWith('> ')) {
      nodes.push(
        <blockquote
          key={`q-${i}`}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300"
        >
          {renderInlineMarkdown(trimmed.slice(2))}
        </blockquote>
      );
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      nodes.push(
        <div key={`ul-${i}`} className="flex items-start gap-2.5 pl-1">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" />
          <span>{renderInlineMarkdown(trimmed.slice(2))}</span>
        </div>
      );
      continue;
    }

    const orderedMatch = /^(\d+)\.\s+(.*)$/.exec(trimmed);
    if (orderedMatch) {
      nodes.push(
        <div key={`ol-${i}`} className="flex items-start gap-2.5 pl-1">
          <span className="min-w-[1.25rem] font-mono text-xs font-semibold text-blue-700 tabular-nums dark:text-blue-400">
            {orderedMatch[1]}.
          </span>
          <span>{renderInlineMarkdown(orderedMatch[2])}</span>
        </div>
      );
      continue;
    }

    nodes.push(<p key={`p-${i}`}>{renderInlineMarkdown(rawLine)}</p>);
  }

  if (inCodeBlock && codeLines.length > 0) {
    nodes.push(
      <pre
        key="code-unclosed"
        className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100 dark:border-slate-800"
      >
        <code>{codeLines.join('\n')}</code>
      </pre>
    );
  }

  return (
    <div
      className={
        isArticle
          ? 'space-y-3 text-base leading-relaxed text-slate-700 dark:text-slate-300'
          : 'space-y-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300'
      }
    >
      {nodes}
    </div>
  );
}
