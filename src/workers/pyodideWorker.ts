// Web Worker khusus untuk menjalankan Python (Pyodide) di luar main thread.

interface RunMessage {
  type: 'run';
  id: string;
  code: string;
  packages?: string[];
}

interface PyodideInstance {
  loadPackage: (pkgs: string | string[]) => Promise<void>;
  loadPackagesFromImports: (code: string) => Promise<void>;
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: {
    set: (name: string, value: unknown) => void;
    get: (name: string) => unknown;
    delete: (name: string) => void;
  };
}

const PYODIDE_INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v0.27.4/full/';
const PYODIDE_MJS_URL = `${PYODIDE_INDEX_URL}pyodide.mjs`;

let pyodidePromise: Promise<PyodideInstance> | null = null;
const loadedPackages = new Set<string>();

async function ensurePyodide(): Promise<PyodideInstance> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      const mod = (await import(/* @vite-ignore */ PYODIDE_MJS_URL)) as {
        loadPyodide: (opts: { indexURL: string }) => Promise<PyodideInstance>;
      };
      return await mod.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
    })();
  }
  return pyodidePromise;
}

self.onmessage = async (event: MessageEvent<RunMessage>) => {
  const payload = event.data;
  if (!payload || payload.type !== 'run') return;

  const { id, code, packages = [] } = payload;

  try {
    self.postMessage({ type: 'status', id, stage: 'loading_runtime' });
    const pyodide = await ensurePyodide();

    const neededPackages = packages.filter((pkg) => !loadedPackages.has(pkg));
    if (neededPackages.length > 0 || /\bimport\s+pandas\b|\bfrom\s+pandas\b/.test(code)) {
      self.postMessage({ type: 'status', id, stage: 'loading_packages' });
      for (const pkg of neededPackages) {
        await pyodide.loadPackage(pkg);
        loadedPackages.add(pkg);
      }
      await pyodide.loadPackagesFromImports(code);
    }

    self.postMessage({ type: 'status', id, stage: 'running' });

    pyodide.globals.set('__datapath_user_code__', code);

    const runnerScript = `
import io, sys, traceback

_dp_stdout = io.StringIO()
_dp_stderr = io.StringIO()
_dp_orig_stdout = sys.stdout
_dp_orig_stderr = sys.stderr
_dp_tb = ""

sys.stdout = _dp_stdout
sys.stderr = _dp_stderr

try:
    _dp_ns = {"__name__": "__main__"}
    exec(compile(__datapath_user_code__, "<latihan.py>", "exec"), _dp_ns)
except Exception:
    _dp_tb = traceback.format_exc()
finally:
    sys.stdout = _dp_orig_stdout
    sys.stderr = _dp_orig_stderr

(_dp_stdout.getvalue(), _dp_stderr.getvalue(), _dp_tb)
`;

    const resultTuple = (await pyodide.runPythonAsync(runnerScript)) as {
      toJs?: () => unknown[];
    };

    const jsValues =
      resultTuple && typeof resultTuple.toJs === 'function'
        ? resultTuple.toJs()
        : ['', '', ''];

    pyodide.globals.delete('__datapath_user_code__');

    self.postMessage({
      type: 'result',
      id,
      stdout: String(jsValues[0] ?? ''),
      stderr: String(jsValues[1] ?? ''),
      traceback: String(jsValues[2] ?? ''),
    });
  } catch (err) {
    pyodidePromise = null;
    const message =
      err instanceof Error
        ? err.message
        : 'Gagal memuat atau menjalankan runtime Python (Pyodide).';
    self.postMessage({
      type: 'error',
      id,
      error: message,
    });
  }
};
