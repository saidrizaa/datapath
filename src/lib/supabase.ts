import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const env = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};
const rawUrl = env.VITE_SUPABASE_URL?.trim() ?? '';
const rawAnonKey = env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

function isValidSupabaseUrl(url: string): boolean {
  if (!url || url.includes('your-project-ref')) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function isValidAnonKey(key: string): boolean {
  if (!key || key === 'your-public-anon-key' || key.length < 20) return false;
  return true;
}

export const isSupabaseConfigured =
  isValidSupabaseUrl(rawUrl) && isValidAnonKey(rawAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(rawUrl, rawAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function formatSupabaseError(error: unknown): string {
  if (!error) return 'Terjadi kesalahan yang tidak diketahui.';

  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : typeof (error as { message?: unknown }).message === 'string'
          ? String((error as { message: string }).message)
          : 'Terjadi kesalahan koneksi.';

  const lower = message.toLowerCase();

  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('fetch') && lower.includes('error')
  ) {
    return 'Gagal terhubung ke server Supabase. Periksa koneksi internet Anda lalu coba lagi.';
  }

  if (lower.includes('invalid login credentials')) {
    return 'Email atau kata sandi salah. Silakan periksa kembali.';
  }

  if (lower.includes('email not confirmed')) {
    return 'Email Anda belum dikonfirmasi. Cek kotak masuk atau folder spam untuk tautan verifikasi.';
  }

  if (lower.includes('user already registered')) {
    return 'Email ini sudah terdaftar. Silakan masuk menggunakan kata sandi atau Magic Link.';
  }

  if (lower.includes('password should be at least')) {
    return 'Kata sandi minimal terdiri dari 6 karakter.';
  }

  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Terlalu banyak percobaan dalam waktu singkat. Mohon tunggu sebentar sebelum mencoba lagi.';
  }

  if (lower.includes('row-level security') || lower.includes('permission denied')) {
    return 'Akses ditolak oleh kebijakan keamanan database (RLS). Pastikan Anda sudah masuk dengan akun yang benar.';
  }

  if (lower.includes('relation') && lower.includes('does not exist')) {
    return 'Tabel database belum dibuat di proyek Supabase Anda. Jalankan file supabase/schema.sql di SQL Editor terlebih dahulu.';
  }

  return message;
}
