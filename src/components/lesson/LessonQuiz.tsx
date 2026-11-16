import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import type { QuizQuestion } from '../../data/excelLessons';
import { shuffleQuizQuestions } from '../../lib/exerciseEvaluators';
import type { QuizAttemptRecord } from '../../services/progressService';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';

interface LessonQuizProps {
  lessonId: string;
  questions: QuizQuestion[];
  savedAttempt?: QuizAttemptRecord;
  onSaveAttempt: (
    lessonId: string,
    score: number,
    total: number,
    answers: Record<string, number>
  ) => void;
}

export function LessonQuiz({
  lessonId,
  questions,
  savedAttempt,
  onSaveAttempt,
}: LessonQuizProps) {
  const prefersReducedMotion = useReducedMotion();

  const [orderedQuestions, setOrderedQuestions] = useState<QuizQuestion[]>(questions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>(
    () => savedAttempt?.answers ?? {}
  );
  const [showSummary, setShowSummary] = useState<boolean>(() => Boolean(savedAttempt));
  const [isRetaking, setIsRetaking] = useState(false);

  // Reset saat berpindah pelajaran
  useEffect(() => {
    setOrderedQuestions(questions);
    setCurrentIndex(0);
    setSelectedAnswers(savedAttempt?.answers ?? {});
    setShowSummary(Boolean(savedAttempt));
    setIsRetaking(false);
  }, [lessonId, questions]);

  // Sinkronkan skor tersimpan bila data cloud selesai dimuat dan user belum sedang mengerjakan ulang
  useEffect(() => {
    if (!isRetaking && savedAttempt) {
      setSelectedAnswers(savedAttempt.answers ?? {});
      setShowSummary(true);
    }
  }, [savedAttempt, isRetaking]);

  const totalCount = orderedQuestions.length;
  const activeQuestion = orderedQuestions[currentIndex];
  const activeChoice = activeQuestion ? selectedAnswers[activeQuestion.id] : undefined;
  const hasAnsweredCurrent = activeChoice !== undefined;

  const score = orderedQuestions.reduce(
    (sum, q) => (selectedAnswers[q.id] === q.correctIndex ? sum + 1 : sum),
    0
  );

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (selectedAnswers[questionId] !== undefined) return;
    setIsRetaking(true);
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (!hasAnsweredCurrent) return;
    if (currentIndex < totalCount - 1) {
      setCurrentIndex((idx) => idx + 1);
      return;
    }

    setShowSummary(true);
    setIsRetaking(false);
    onSaveAttempt(lessonId, score, totalCount, selectedAnswers);
  };

  const handleRetry = () => {
    setOrderedQuestions(shuffleQuizQuestions(questions));
    setSelectedAnswers({});
    setCurrentIndex(0);
    setShowSummary(false);
    setIsRetaking(true);
  };

  const stepProgress = showSummary
    ? 100
    : Math.round(((currentIndex + (hasAnsweredCurrent ? 1 : 0)) / Math.max(totalCount, 1)) * 100);

  return (
    <section id="kuis" className="scroll-mt-24 mt-10">
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">
              Kuis Pemahaman ({totalCount} Soal)
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {showSummary
                ? 'Ringkasan skor akhir dan pembahasan setiap soal.'
                : 'Pilih satu jawaban untuk langsung melihat penjelasan sebelum lanjut ke soal berikutnya.'}
            </p>
          </div>
          {showSummary ? (
            <Badge variant={score >= Math.ceil(totalCount * 0.8) ? 'success' : 'default'}>
              Skor: {score} / {totalCount} Benar
            </Badge>
          ) : (
            <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums dark:text-slate-300">
              Soal {currentIndex + 1} dari {totalCount}
            </span>
          )}
        </div>

        <Progress
          value={stepProgress}
          label="Progres pengerjaan kuis"
          className="mt-4"
        />

        {!showSummary && activeQuestion ? (
          <div className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeQuestion.id}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -16 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                <fieldset className="space-y-3">
                  <legend className="text-base font-semibold leading-relaxed text-slate-900 dark:text-slate-100">
                    <span className="mr-2 font-mono text-xs text-blue-700 tabular-nums dark:text-blue-400">
                      {currentIndex + 1}.
                    </span>
                    {activeQuestion.question}
                  </legend>

                  <div className="space-y-2.5 pt-2">
                    {activeQuestion.options.map((opt, optIdx) => {
                      const isPicked = activeChoice === optIdx;
                      const isRightOption = optIdx === activeQuestion.correctIndex;

                      let optionStyle =
                        'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/70';

                      if (hasAnsweredCurrent && isRightOption) {
                        optionStyle =
                          'border-emerald-500 bg-emerald-50/80 dark:border-emerald-700 dark:bg-emerald-950/35';
                      } else if (hasAnsweredCurrent && isPicked && !isRightOption) {
                        optionStyle =
                          'border-rose-400 bg-rose-50/80 dark:border-rose-800 dark:bg-rose-950/35';
                      }

                      const optionLetter = String.fromCharCode(65 + optIdx);

                      return (
                        <label
                          key={optIdx}
                          className={`flex min-h-11 items-start gap-3 rounded-lg border p-3.5 text-sm transition-colors ${
                            hasAnsweredCurrent ? 'cursor-default' : 'cursor-pointer'
                          } ${optionStyle}`}
                        >
                          <input
                            type="radio"
                            name={`quiz-${lessonId}-${activeQuestion.id}`}
                            value={optIdx}
                            checked={isPicked}
                            disabled={hasAnsweredCurrent}
                            onChange={() => handleSelectOption(activeQuestion.id, optIdx)}
                            className="mt-1 h-4 w-4 accent-blue-700 dark:accent-blue-500"
                          />
                          <span className="pt-0.5 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {optionLetter}.
                          </span>
                          <span className="text-slate-800 dark:text-slate-200">{opt}</span>
                        </label>
                      );
                    })}
                  </div>

                  {hasAnsweredCurrent && (
                    <motion.div
                      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: prefersReducedMotion ? 0 : 0.16 }}
                      role="status"
                      className={`mt-4 rounded-xl border p-4 text-xs leading-relaxed ${
                        activeChoice === activeQuestion.correctIndex
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
                          : 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200'
                      }`}
                    >
                      <p className="flex items-center gap-1.5 font-semibold">
                        {activeChoice === activeQuestion.correctIndex ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span>Jawaban Benar</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span>
                              Kurang Tepat — Jawaban benar:{' '}
                              {String.fromCharCode(65 + activeQuestion.correctIndex)}
                            </span>
                          </>
                        )}
                      </p>
                      <p className="mt-1.5">{activeQuestion.explanation}</p>
                    </motion.div>
                  )}
                </fieldset>
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
              <p className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
                {hasAnsweredCurrent
                  ? 'Penjelasan ditampilkan — siap melanjutkan.'
                  : 'Pilih salah satu opsi di atas.'}
              </p>

              <Button type="button" onClick={handleNext} disabled={!hasAnsweredCurrent}>
                <span>
                  {currentIndex < totalCount - 1 ? 'Soal Berikutnya' : 'Lihat Skor Akhir'}
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : (
          /* Layar Skor Akhir + Breakdown per Soal */
          <div className="mt-6 space-y-6">
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900/60">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Hasil Evaluasi Akhir
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-slate-900 tabular-nums dark:text-slate-50">
                  {score} dari {totalCount} Benar ({Math.round((score / Math.max(totalCount, 1)) * 100)}%)
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleRetry}>
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Coba Lagi</span>
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Rincian Jawaban per Soal
              </h3>
              <ol className="space-y-3">
                {orderedQuestions.map((q, idx) => {
                  const chosenIdx = selectedAnswers[q.id];
                  const isCorrect = chosenIdx === q.correctIndex;
                  const chosenText =
                    chosenIdx !== undefined
                      ? `${String.fromCharCode(65 + chosenIdx)}. ${q.options[chosenIdx] ?? ''}`
                      : 'Belum dijawab';
                  const rightText = `${String.fromCharCode(65 + q.correctIndex)}. ${q.options[q.correctIndex]}`;

                  return (
                    <li
                      key={q.id}
                      className="rounded-xl border border-slate-200 p-4 text-xs leading-relaxed dark:border-slate-800"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          <span className="mr-1.5 font-mono text-blue-700 tabular-nums dark:text-blue-400">
                            {idx + 1}.
                          </span>
                          {q.question}
                        </p>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 font-semibold ${
                            isCorrect
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {isCorrect ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Benar</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Salah</span>
                            </>
                          )}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1 text-slate-600 dark:text-slate-300">
                        <p>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            Jawaban Anda:
                          </span>{' '}
                          {chosenText}
                        </p>
                        {!isCorrect && (
                          <p>
                            <span className="font-medium text-emerald-700 dark:text-emerald-400">
                              Jawaban Benar:
                            </span>{' '}
                            {rightText}
                          </p>
                        )}
                        <p className="pt-1 text-slate-500 dark:text-slate-400">{q.explanation}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}
