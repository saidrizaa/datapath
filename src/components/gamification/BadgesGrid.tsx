import { Award, Briefcase, Calendar, CheckCircle2, Code2, Database, Flame, Footprints, Lock, Trophy } from 'lucide-react';
import {
  BADGE_DEFINITIONS,
  type BadgeDefinition,
  type EarnedBadgeMap,
} from '../../lib/gamification';
import { Card } from '../ui/card';

function BadgeIcon({ name, unlocked }: { name: BadgeDefinition['iconName']; unlocked: boolean }) {
  const cls = unlocked
    ? 'h-5 w-5 text-blue-700 dark:text-blue-300'
    : 'h-5 w-5 text-slate-400 dark:text-slate-500';

  switch (name) {
    case 'footprints':
      return <Footprints className={cls} aria-hidden="true" />;
    case 'flame':
      return <Flame className={cls} aria-hidden="true" />;
    case 'award':
      return <Award className={cls} aria-hidden="true" />;
    case 'trophy':
      return <Trophy className={cls} aria-hidden="true" />;
    case 'code':
      return <Code2 className={cls} aria-hidden="true" />;
    case 'calendar':
      return <Calendar className={cls} aria-hidden="true" />;
    case 'database':
      return <Database className={cls} aria-hidden="true" />;
    case 'briefcase':
      return <Briefcase className={cls} aria-hidden="true" />;
    default:
      return <Award className={cls} aria-hidden="true" />;
  }
}

function formatEarnedDate(iso: string): string {
  const ts = Date.parse(iso);
  if (!ts) return '';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(ts));
}

export function BadgesGrid({ earnedBadges }: { earnedBadges: EarnedBadgeMap }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {BADGE_DEFINITIONS.map((badge) => {
        const earnedAt = earnedBadges[badge.id];
        const unlocked = Boolean(earnedAt);

        return (
          <Card
            key={badge.id}
            className={`flex flex-col justify-between p-5 transition-colors ${
              unlocked
                ? 'border-blue-200 bg-white dark:border-blue-900/70 dark:bg-slate-900'
                : 'border-slate-200 bg-slate-100/80 opacity-80 grayscale dark:border-slate-800 dark:bg-slate-900/40'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                    unlocked
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/60'
                      : 'border-slate-300 bg-slate-200/70 dark:border-slate-700 dark:bg-slate-800'
                  }`}
                >
                  <BadgeIcon name={badge.iconName} unlocked={unlocked} />
                </div>

                {unlocked ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Terbuka
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    Terkunci
                  </span>
                )}
              </div>

              <h3 className="mt-4 font-display text-base font-bold text-slate-900 dark:text-slate-100">
                {badge.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {badge.description}
              </p>
            </div>

            <div className="mt-4 border-t border-slate-200/80 pt-3 text-xs dark:border-slate-800">
              {unlocked ? (
                <p className="font-medium text-blue-700 dark:text-blue-400">
                  Diraih {formatEarnedDate(earnedAt)}
                </p>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">Syarat:</span> {badge.requirement}
                </p>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
