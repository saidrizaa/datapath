import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Code2,
  HelpCircle,
  Loader2,
  Play,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { comparePythonOutput } from '../../lib/exerciseEvaluators';
import { useProgress } from '../../hooks/useProgress';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

export interface EditorPythonProps {
  lessonId: string;
  exerciseId: string;
  title?: string;
  description?: string;
  initialCode: string;
  expectedOutput?: string;
  packages?: string[];
  hint?: string;
}

type WorkerStage = 'idle' | 'loading_runtime' | 'loading_packages' | 'running';

interface ExecutionResult {
  stdout: string;
  stderr: string;
  traceback: string;
  passed: boolean | null;
  runtimeError?: string;
}

export function EditorPython({
  lessonId,
  exerciseId,
  title = 'Latihan Python (pandas)',
  description,
  initialCode,
  expectedOutput = '',
  packages = ['pandas'],
  hint,
}: EditorPythonProps) {
  const editorId = useId();
  const { saveExercise, getExerciseAttempt } = useProgress();
  const savedAttempt = getExerciseAttempt(lessonId, exerciseId);

  const [code, setCode] = useState(initialCode);
  const [stage, setStage] = useState<WorkerStage>('idle');
  const [output, setOutput] = useState<ExecutionResult | null>(null);
  const [showHint, setShowHint] = useState(false);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    setCode(initialCode);
    setOutput(null);
    setStage('idle');
    setShowHint(false);
  }, [lessonId, exerciseId, initialCode]);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.currentTarget.blur();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const next = code.slice(0, start) + '  ' + code.slice(end);
      setCode(next);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    }
  };

  const handleRun = () => {
    if (typeof window === 'undefined' || typeof Worker === 'undefined' || typeof WebAssembly === 'undefined') {
      setOutput({
        stdout: '',
        stderr: '',
        traceback: '',
        passed: false,
        runtimeError:
          'Browser Anda belum mendukung Web Worker atau WebAssembly untuk menjalankan Python (Pyodide). Gunakan versi terbaru Chrome, Firefox, Edge, atau Safari.',
      });
      return;
    }

    if (!workerRef.current) {
      try {
        workerRef.current = new Worker(
          new URL('../../workers/pyodideWorker.ts', import.meta.url),
          { type: 'module' }
        );
      } catch {
        setOutput({
          stdout: '',
          stderr: '',
          traceback: '',
          passed: false,
          runtimeError:
            'Gagal menginisialisasi Web Worker Python di browser Anda. Coba muat ulang halaman.',
        });
        return;
      }
    }

    const worker = workerRef.current;
    const runId = `${exerciseId}-${Date.now()}`;
    setStage('loading_runtime');
    setOutput(null);

    const onMessage = (
      event: MessageEvent<
        | { type: 'status'; id: string; stage: WorkerStage }
        | { type: 'result'; id: string; stdout: string; stderr: string; traceback: string }
        | { type: 'error'; id: string; error: string }
      >
    ) => {
      const msg = event.data;
      if (!msg || msg.id !== runId) return;

      if (msg.type === 'status') {
        setStage(msg.stage);
        return;
      }

      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      setStage('idle');

      if (msg.type === 'error') {
        setOutput({
          stdout: '',
          stderr: '',
          traceback: '',
          passed: false,
          runtimeError: `Tidak dapat memuat runtime Python dari CDN (${msg.error}). Periksa koneksi internet Anda lalu coba lagi.`,
        });
        saveExercise(lessonId, exerciseId, 'python', false, code);
        return;
      }

      const hasTb = msg.traceback.trim().length > 0;
      const check = expectedOutput
        ? comparePythonOutput(msg.stdout, expectedOutput)
        : null;
      const passed = !hasTb && (check ? check.passed : msg.stdout.trim().length > 0);

      setOutput({
        stdout: msg.stdout,
        stderr: msg.stderr,
        traceback: msg.traceback,
        passed,
      });

      saveExercise(lessonId, exerciseId, 'python', passed, code);
    };

    const onError = () => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      setStage('idle');
      setOutput({
        stdout: '',
        stderr: '',
        traceback: '',
        passed: false,
        runtimeError: 'Terjadi kesalahan internal saat menjalankan Web Worker Python.',
      });
    };

    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
    worker.postMessage({
      type: 'run',
      id: runId,
      code,
      packages,
    });
  };

  const handleReset = () => {
    setCode(initialCode);
    setOutput(null);
  };

  const isRunning = stage !== 'idle';
  const stageLabel =
    stage === 'loading_runtime'
      ? 'Memuat runtime Python (Pyodide)...'
      : stage === 'loading_packages'
        ? 'Memuat pustaka pandas di browser...'
        : stage === 'running'
          ? 'Menjalankan kode Python...'
          : '';

  return (
    <Card className="mt-6 overflow-hidden border-slate-200 dark:border-slate-800">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/70">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-medium text-blue-700 dark:text-blue-400">
              <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
              Editor Python (Pyodide)
            </span>
            <span aria-hidden="true">·</span>
            <span>Berjalan langsung di browser</span>
          </div>
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-50">
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium">
          {savedAttempt?.status === 'passed' ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Jawaban Benar
            </span>
          ) : savedAttempt ? (
            <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Sudah Dicoba ({savedAttempt.attemptsCount}x)
            </span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">Belum Dicoba</span>
          )}
        </div>
      </div>

      <div className="space-y-4 p-5">
        {description && (
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {description}
          </p>
        )}

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor={editorId}
              className="text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              Kode Python (tekan Tab untuk indentasi)
            </label>
            {hint && (
              <button
                type="button"
                onClick={() => setShowHint((v) => !v)}
                aria-expanded={showHint}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline dark:text-blue-400 cursor-pointer"
              >
                <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{showHint ? 'Tutup Petunjuk' : 'Lihat Petunjuk'}</span>
              </button>
            )}
          </div>

          {showHint && hint && (
            <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50/70 px-3.5 py-2.5 text-xs leading-relaxed text-slate-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-slate-200">
              {hint}
            </div>
          )}

          <textarea
            id={editorId}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={10}
            spellCheck={false}
            aria-label={`Editor kode Python untuk ${title}`}
            className="w-full rounded-xl border border-slate-300 bg-slate-950 p-4 font-mono text-[13px] leading-relaxed text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <Button type="button" onClick={handleRun} disabled={isRunning} size="sm">
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{isRunning ? 'Memproses...' : 'Jalankan'}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isRunning}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset</span>
            </Button>
          </div>

          {expectedOutput && (
            <p className="font-mono text-xs text-slate-500 tabular-nums dark:text-slate-400">
              Target output: <span className="font-semibold text-slate-800 dark:text-slate-200">{expectedOutput}</span>
            </p>
          )}
        </div>

        {isRunning && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-medium text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200"
          >
            <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
            <span>{stageLabel} (pemakaian pertama kali mungkin butuh beberapa detik)</span>
          </div>
        )}

        {output && (
          <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            {output.runtimeError ? (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs leading-relaxed text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p>{output.runtimeError}</p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs font-mono text-slate-100 dark:border-slate-800">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Output (stdout)
                  </p>
                  <pre className="whitespace-pre-wrap break-words leading-relaxed">
                    {output.stdout.trim() ? output.stdout : '(tidak ada output tercetak)'}
                  </pre>

                  {output.stderr.trim() && (
                    <div className="mt-3 border-t border-slate-800 pt-3 text-amber-300">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide">
                        Stderr
                      </p>
                      <pre className="whitespace-pre-wrap break-words leading-relaxed">
                        {output.stderr}
                      </pre>
                    </div>
                  )}

                  {output.traceback.trim() && (
                    <div className="mt-3 border-t border-slate-800 pt-3 text-rose-300">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide">
                        Traceback Error Python
                      </p>
                      <pre className="whitespace-pre-wrap break-words leading-relaxed">
                        {output.traceback}
                      </pre>
                    </div>
                  )}
                </div>

                {output.passed !== null && !output.traceback.trim() && (
                  <div
                    role="status"
                    className={`flex items-start gap-2.5 rounded-lg border p-3.5 text-xs leading-relaxed ${
                      output.passed
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200'
                        : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200'
                    }`}
                  >
                    {output.passed ? (
                      <>
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>
                          <strong>Jawaban Benar.</strong> Output Anda sesuai dengan hasil yang diharapkan dan status latihan sudah disimpan.
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>
                          <strong>Output Belum Sesuai.</strong> Diharapkan <code className="font-mono font-semibold">{expectedOutput}</code>, tetapi program mencetak{' '}
                          <code className="font-mono font-semibold">{output.stdout.trim() || '(kosong)'}</code>. Periksa kembali perhitungan Anda.
                        </span>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
