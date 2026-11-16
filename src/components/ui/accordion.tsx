import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AccordionItemData {
  id: string;
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItemData[];
  defaultOpenId?: string;
}

// Komponen akordeon aksesibel dengan kontrol keyboard dan atribut ARIA lengkap
export function Accordion({ items, defaultOpenId }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? null);
  const baseId = useId();

  return (
    <div className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
      {items.map((item) => {
        const isOpen = openId === item.id;
        const buttonId = `${baseId}-btn-${item.id}`;
        const panelId = `${baseId}-panel-${item.id}`;

        return (
          <div key={item.id}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="flex w-full min-h-12 items-center justify-between gap-4 py-5 text-left text-base font-semibold text-slate-900 transition-colors hover:text-blue-700 dark:text-slate-100 dark:hover:text-blue-400 cursor-pointer"
              >
                <span>{item.question}</span>
                <ChevronDown
                  className={cn(
                    'h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200 dark:text-slate-400',
                    isOpen && 'rotate-180 text-blue-700 dark:text-blue-400'
                  )}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="pb-5 pr-8 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
