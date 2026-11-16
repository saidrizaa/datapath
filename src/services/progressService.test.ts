import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgressService, type ProgressStorageAdapter } from './progressService';
import { buildExerciseKey } from '../lib/progressMigration';

function createMemoryAdapter(): ProgressStorageAdapter {
  let store: string | null = null;
  return {
    read: () => store,
    write: (raw: string) => {
      store = raw;
    },
  };
}

test('toggleLessonCompletion menambah dan menghapus status selesai pelajaran dengan format excel-01', () => {
  const service = createProgressService(createMemoryAdapter());
  assert.equal(service.isLessonCompleted('excel-01'), false);

  service.toggleLessonCompletion('excel-01');
  assert.equal(service.isLessonCompleted('excel-01'), true);
  assert.equal(service.isLessonCompleted('excel-1'), true);

  service.toggleLessonCompletion('excel-01');
  assert.equal(service.isLessonCompleted('excel-01'), false);
});

test('saveQuizAttempt dan getTrackStats menghitung progres akurat dan menormalkan id lama', () => {
  const adapter = createMemoryAdapter();
  adapter.write(
    JSON.stringify({
      completedLessons: ['excel-1', 'excel-01'],
      quizAttempts: {},
      updatedAt: '2026-03-01T00:00:00.000Z',
    })
  );
  const service = createProgressService(adapter);
  service.markLessonCompleted('excel-02');
  service.saveQuizAttempt('excel-01', 4, 5, { q1: 0, q2: 1 });

  const stats = service.getTrackStats(['excel-01', 'excel-02', 'excel-03', 'excel-04', 'excel-05']);
  assert.equal(stats.completedCount, 2);
  assert.equal(stats.totalCount, 5);
  assert.equal(stats.percentage, 40);

  const progress = service.getProgress();
  assert.deepEqual(progress.completedLessons, ['excel-01', 'excel-02']);
  assert.equal(progress.quizAttempts['excel-01']?.score, 4);
  assert.equal(progress.quizAttempts['excel-01']?.total, 5);
});

test('saveExerciseAttempt menyimpan status attempted lalu passed per latihan', () => {
  const service = createProgressService(createMemoryAdapter());
  service.saveExerciseAttempt('excel-1', 'py-01', 'python', false, 'print(0)');

  const key = buildExerciseKey('excel-01', 'py-01');
  const first = service.getProgress().exerciseAttempts[key];
  assert.equal(first?.lessonId, 'excel-01');
  assert.equal(first?.status, 'attempted');
  assert.equal(first?.attemptsCount, 1);

  service.saveExerciseAttempt('excel-01', 'py-01', 'python', true, 'print(5720000)');
  const second = service.getProgress().exerciseAttempts[key];
  assert.equal(second?.status, 'passed');
  assert.equal(second?.attemptsCount, 2);
  assert.ok(second?.passedAt);
});
