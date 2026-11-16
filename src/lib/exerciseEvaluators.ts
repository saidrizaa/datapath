import type { QuizQuestion } from '../data/excelLessons';

export interface SqlTableResult {
  columns: string[];
  values: unknown[][];
}

export interface PythonValidationResult {
  passed: boolean;
  normalizedActual: string;
  normalizedExpected: string;
}

export function normalizeTextOutput(text: string): string {
  return text
    .replaceAll('\r\n', '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

export function comparePythonOutput(
  actualStdout: string,
  expectedOutput: string
): PythonValidationResult {
  const normalizedActual = normalizeTextOutput(actualStdout);
  const normalizedExpected = normalizeTextOutput(expectedOutput);

  if (!normalizedExpected) {
    return {
      passed: normalizedActual.length > 0,
      normalizedActual,
      normalizedExpected,
    };
  }

  return {
    passed: normalizedActual === normalizedExpected,
    normalizedActual,
    normalizedExpected,
  };
}

/**
 * Parser CSV standar yang mendukung tanda kutip ganda untuk pemuatan ke sql.js.
 */
export function parseCsvMatrix(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  const clean = csvText.replace(/^\uFEFF/, '');

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const next = clean[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentCell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentCell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      currentRow.push(currentCell);
      currentCell = '';
    } else if (ch === '\r' && next === '\n') {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
      i++;
    } else if (ch === '\n') {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += ch;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((cell) => cell.trim() !== ''));
}

export interface SalesSqlRow {
  id_transaksi: string;
  tanggal: string;
  cabang: string;
  kategori: string;
  produk: string;
  jumlah: number;
  harga_satuan: number;
  diskon: number;
  nama_sales: string;
}

export function parseSalesCsvForSql(csvText: string): SalesSqlRow[] {
  const matrix = parseCsvMatrix(csvText);
  if (matrix.length <= 1) return [];

  const [, ...dataRows] = matrix;
  return dataRows.map((cols) => ({
    id_transaksi: (cols[0] ?? '').trim(),
    tanggal: (cols[1] ?? '').trim(),
    cabang: (cols[2] ?? '').trim(),
    kategori: (cols[3] ?? '').trim(),
    produk: (cols[4] ?? '').trim(),
    jumlah: Number(cols[5] ?? 0) || 0,
    harga_satuan: Number(cols[6] ?? 0) || 0,
    diskon: Number(cols[7] ?? 0) || 0,
    nama_sales: (cols[8] ?? '').trim(),
  }));
}

function sqlCellMatches(actual: unknown, expected: unknown): boolean {
  if (actual === null && expected === null) return true;
  if (actual === null || expected === null) return false;

  const actualNum = typeof actual === 'number' ? actual : Number(actual);
  const expectedNum = typeof expected === 'number' ? expected : Number(expected);

  if (
    actual !== '' &&
    expected !== '' &&
    Number.isFinite(actualNum) &&
    Number.isFinite(expectedNum)
  ) {
    return Math.abs(actualNum - expectedNum) < 1e-4;
  }

  return String(actual).trim() === String(expected).trim();
}

export function compareSqlResults(
  actual: SqlTableResult | null,
  expected: SqlTableResult
): { passed: boolean; reason?: string } {
  if (!actual) {
    return {
      passed: false,
      reason: 'Query tidak mengembalikan tabel hasil. Pastikan Anda menulis pernyataan SELECT.',
    };
  }

  if (actual.columns.length !== expected.columns.length) {
    return {
      passed: false,
      reason: `Jumlah kolom berbeda: hasil Anda ${actual.columns.length} kolom, seharusnya ${expected.columns.length} kolom.`,
    };
  }

  if (actual.values.length !== expected.values.length) {
    return {
      passed: false,
      reason: `Jumlah baris berbeda: hasil Anda ${actual.values.length} baris, seharusnya ${expected.values.length} baris.`,
    };
  }

  for (let r = 0; r < expected.values.length; r++) {
    const actualRow = actual.values[r];
    const expectedRow = expected.values[r];
    for (let c = 0; c < expectedRow.length; c++) {
      if (!sqlCellMatches(actualRow[c], expectedRow[c])) {
        return {
          passed: false,
          reason: `Nilai berbeda pada baris ke-${r + 1}, kolom ke-${c + 1} (ditemukan "${String(actualRow[c])}", seharusnya "${String(expectedRow[c])}").`,
        };
      }
    }
  }

  return { passed: true };
}

type Token =
  | { type: 'number'; value: number }
  | { type: 'ident'; value: string }
  | { type: 'op'; value: '+' | '-' | '*' | '/' }
  | { type: 'paren'; value: '(' | ')' }
  | { type: 'sep' };

function tokenizeExcelFormula(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (/[0-9.]/.test(ch)) {
      let numStr = '';
      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        numStr += expr[i];
        i++;
      }
      const parsed = Number(numStr);
      if (!Number.isFinite(parsed)) {
        throw new Error(`Angka tidak valid: "${numStr}"`);
      }
      tokens.push({ type: 'number', value: parsed });
      continue;
    }

    if (/[A-Za-z$]/.test(ch)) {
      let ident = '';
      while (i < expr.length && /[A-Za-z0-9$]/.test(expr[i])) {
        ident += expr[i];
        i++;
      }
      tokens.push({ type: 'ident', value: ident.toUpperCase() });
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }

    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch });
      i++;
      continue;
    }

    if (ch === ',' || ch === ';') {
      tokens.push({ type: 'sep' });
      i++;
      continue;
    }

    throw new Error(`Karakter tidak dikenali dalam rumus: "${ch}"`);
  }

  return tokens;
}

function parseFormulaTokens(
  tokens: Token[],
  cellValues: Record<string, number>
): number {
  let pos = 0;

  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];
  const isOp = (ops: Array<'+' | '-' | '*' | '/'>): boolean => {
    const tok = peek();
    return Boolean(tok && tok.type === 'op' && ops.includes(tok.value));
  };
  const isParen = (paren: '(' | ')'): boolean => {
    const tok = peek();
    return Boolean(tok && tok.type === 'paren' && tok.value === paren);
  };

  function parseExpression(): number {
    let left = parseTerm();
    while (isOp(['+', '-'])) {
      const op = (consume() as Extract<Token, { type: 'op' }>).value;
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number {
    let left = parseFactor();
    while (isOp(['*', '/'])) {
      const op = (consume() as Extract<Token, { type: 'op' }>).value;
      const right = parseFactor();
      if (op === '/' && right === 0) {
        throw new Error('#DIV/0! — Pembagian dengan angka nol.');
      }
      left = op === '*' ? left * right : left / right;
    }
    return left;
  }

  function parseFactor(): number {
    const tok = peek();
    if (!tok) {
      throw new Error('Rumus tidak lengkap.');
    }

    if (tok.type === 'op' && (tok.value === '+' || tok.value === '-')) {
      consume();
      const val = parseFactor();
      return tok.value === '-' ? -val : val;
    }

    if (tok.type === 'number') {
      consume();
      return tok.value;
    }

    if (tok.type === 'paren' && tok.value === '(') {
      consume();
      const inner = parseExpression();
      const close = consume();
      if (!close || close.type !== 'paren' || close.value !== ')') {
        throw new Error('Kurung tutup ")" tidak ditemukan.');
      }
      return inner;
    }

    if (tok.type === 'ident') {
      consume();
      if (isParen('(')) {
        consume(); // '('
        const args: number[] = [];
        if (!isParen(')')) {
          args.push(parseExpression());
          while (peek()?.type === 'sep') {
            consume();
            args.push(parseExpression());
          }
        }
        const close = consume();
        if (!close || close.type !== 'paren' || close.value !== ')') {
          throw new Error(`Kurung tutup untuk fungsi ${tok.value} tidak lengkap.`);
        }
        if (tok.value === 'ROUND') {
          if (args.length !== 2) {
            throw new Error('Fungsi ROUND membutuhkan tepat 2 argumen.');
          }
          const factor = Math.pow(10, Math.trunc(args[1]));
          return Math.round(args[0] * factor) / factor;
        }
        throw new Error(`Fungsi ${tok.value} tidak didukung pada simulator ringkas ini.`);
      }

      const cleanRef = tok.value.replaceAll('$', '');
      if (cleanRef in cellValues) {
        return cellValues[cleanRef];
      }
      throw new Error(`Referensi sel "${tok.value}" tidak ditemukan.`);
    }

    throw new Error('Format rumus tidak valid.');
  }

  const result = parseExpression();
  if (pos < tokens.length) {
    throw new Error('Terdapat token berlebih pada rumus.');
  }
  return result;
}

/**
 * Mengevaluasi input sel Excel: boleh berupa angka langsung maupun rumus '=' (mendukung ROUND & referensi sel).
 */
export function evaluateExcelCellInput(
  rawInput: string,
  cellValues: Record<string, number>
): { value: number | null; error?: string } {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { value: null, error: 'Sel masih kosong.' };
  }

  if (!trimmed.startsWith('=')) {
    const normalizedNum = trimmed.replace(/\s+/g, '');
    // Izinkan angka murni atau angka pemisah ribuan titik/koma sederhana
    const asNumber = Number(normalizedNum.replace(/,/g, ''));
    if (Number.isFinite(asNumber)) {
      return { value: asNumber };
    }
    return {
      value: null,
      error: 'Masukkan angka hasil perhitungan atau awali rumus dengan tanda "=".',
    };
  }

  try {
    const body = trimmed.slice(1).trim();
    if (!body) {
      return { value: null, error: 'Rumus setelah "=" masih kosong.' };
    }
    const tokens = tokenizeExcelFormula(body);
    const computed = parseFormulaTokens(tokens, cellValues);
    if (!Number.isFinite(computed)) {
      return { value: null, error: 'Hasil rumus bukan angka valid.' };
    }
    return { value: computed };
  } catch (err) {
    return {
      value: null,
      error: err instanceof Error ? err.message : 'Rumus tidak dapat dihitung.',
    };
  }
}

export interface ExcelCellValidationDetail {
  raw: string;
  computed: number | null;
  expected: number;
  passed: boolean;
  error?: string;
}

export function validateExcelGridAnswers(
  inputs: Record<string, string>,
  expectedByCell: Record<string, number>,
  contextCells: Record<string, number>
): {
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
  results: Record<string, ExcelCellValidationDetail>;
} {
  const results: Record<string, ExcelCellValidationDetail> = {};
  const entries = Object.entries(expectedByCell);
  let passedCount = 0;

  for (const [cellId, expected] of entries) {
    const raw = inputs[cellId] ?? '';
    const evaluated = evaluateExcelCellInput(raw, contextCells);
    const passed =
      evaluated.value !== null && Math.abs(evaluated.value - expected) < 0.01;
    if (passed) passedCount++;
    results[cellId] = {
      raw,
      computed: evaluated.value,
      expected,
      passed,
      error: evaluated.error,
    };
  }

  return {
    allPassed: entries.length > 0 && passedCount === entries.length,
    passedCount,
    totalCount: entries.length,
    results,
  };
}

/**
 * Mengacak urutan soal kuis menggunakan Fisher-Yates (dipastikan berbeda jika jumlah soal > 1).
 */
export function shuffleQuizQuestions(
  questions: QuizQuestion[],
  randomFn: () => number = Math.random
): QuizQuestion[] {
  const copy = [...questions];
  if (copy.length <= 1) return copy;

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }

  const unchanged = copy.every((item, idx) => item.id === questions[idx].id);
  if (unchanged) {
    const first = copy[0];
    copy[0] = copy[1];
    copy[1] = first;
  }

  return copy;
}
