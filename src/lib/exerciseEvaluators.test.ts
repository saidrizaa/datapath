import test from 'node:test';
import assert from 'node:assert/strict';
import {
  comparePythonOutput,
  compareSqlResults,
  evaluateExcelCellInput,
  parseSalesCsvForSql,
  shuffleQuizQuestions,
  validateExcelGridAnswers,
} from './exerciseEvaluators';
import type { QuizQuestion } from '../data/excelLessons';

test('comparePythonOutput membandingkan stdout dengan normalisasi baris dan spasi akhir', () => {
  const ok = comparePythonOutput('5720000\r\n', '5720000');
  assert.equal(ok.passed, true);

  const fail = comparePythonOutput('5700000\n', '5720000');
  assert.equal(fail.passed, false);
});

test('parseSalesCsvForSql mem-parsing kolom CSV dengan tipe numerik yang tepat', () => {
  const sampleCsv = [
    'ID Transaksi,Tanggal,Cabang,Kategori,Produk,Jumlah,Harga Satuan,Diskon,Nama Sales',
    'TRX-2026-0001,2026-01-10,Jakarta Selatan,Elektronik,"Monitor IPS, 24 Inci",2,1850000,0.1,Rina Wijaya',
  ].join('\n');

  const parsed = parseSalesCsvForSql(sampleCsv);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].produk, 'Monitor IPS, 24 Inci');
  assert.equal(parsed[0].jumlah, 2);
  assert.equal(parsed[0].harga_satuan, 1850000);
  assert.equal(parsed[0].diskon, 0.1);
});

test('compareSqlResults memvalidasi baris, urutan, dan toleransi numerik', () => {
  const expected = {
    columns: ['cabang', 'total'],
    values: [
      ['Jakarta Selatan', 1000000],
      ['Bandung', 750000],
    ],
  };

  assert.equal(
    compareSqlResults(
      {
        columns: ['cabang', 'omzet'],
        values: [
          ['Jakarta Selatan', 1000000],
          ['Bandung', 750000],
        ],
      },
      expected
    ).passed,
    true
  );

  const wrongOrder = compareSqlResults(
    {
      columns: ['cabang', 'total'],
      values: [
        ['Bandung', 750000],
        ['Jakarta Selatan', 1000000],
      ],
    },
    expected
  );
  assert.equal(wrongOrder.passed, false);
});

test('evaluateExcelCellInput dan validateExcelGridAnswers mendukung angka langsung dan rumus Excel', () => {
  const context = {
    F2: 2,
    G2: 1850000,
    H2: 0.1,
    P1: 0.11,
    P2: 5000,
  };
  // 2 * 1850000 * 0.9 * 1.11 - 5000 = 3691300
  const formulaIntl = evaluateExcelCellInput(
    '=ROUND(F2*G2*(1-H2)*(1+$P$1)-$P$2, 0)',
    context
  );
  assert.equal(formulaIntl.value, 3691300);

  const formulaIndo = evaluateExcelCellInput(
    '=ROUND(F2*G2*(1-H2)*(1+$P$1)-$P$2; 0)',
    context
  );
  assert.equal(formulaIndo.value, 3691300);

  const numericDirect = evaluateExcelCellInput('3691300', context);
  assert.equal(numericDirect.value, 3691300);

  const validation = validateExcelGridAnswers(
    { J2: '=ROUND(F2*G2*(1-H2)*(1+$P$1)-$P$2, 0)' },
    { J2: 3691300 },
    context
  );
  assert.equal(validation.allPassed, true);
  assert.equal(validation.passedCount, 1);
});

test('shuffleQuizQuestions menghasilkan urutan soal baru tanpa membuang soal', () => {
  const sample: QuizQuestion[] = [
    { id: 'q1', question: 'Q1', options: ['A', 'B'], correctIndex: 0, explanation: 'E1' },
    { id: 'q2', question: 'Q2', options: ['A', 'B'], correctIndex: 1, explanation: 'E2' },
    { id: 'q3', question: 'Q3', options: ['A', 'B'], correctIndex: 0, explanation: 'E3' },
  ];

  const shuffled = shuffleQuizQuestions(sample, () => 0.99);
  assert.equal(shuffled.length, 3);
  assert.notDeepEqual(
    shuffled.map((q) => q.id),
    sample.map((q) => q.id)
  );
  assert.deepEqual(
    shuffled.map((q) => q.id).sort(),
    ['q1', 'q2', 'q3']
  );
});
