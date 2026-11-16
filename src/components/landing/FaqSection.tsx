import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { FAQ_ITEMS } from '../../data/curriculum';
import { Accordion } from '../ui/accordion';

export function FaqSection() {
  return (
    <section
      id="faq"
      className="scroll-mt-20 bg-white py-16 dark:bg-slate-950 lg:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
              Pertanyaan Umum
            </p>
            <h2
              className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
              style={{ textWrap: 'balance' }}
            >
              Hal yang Sering Ditanyakan Sebelum Memulai
            </h2>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Masih ragu harus memulai dari jalur mana? Mulai saja dari Track 1 (Excel untuk Analisis Data) karena tidak membutuhkan latar belakang pemrograman apa pun.
            </p>
            <div className="pt-2">
              <Link
                to="/belajar/excel/mengenal-excel-dan-data-rapi"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <span>Mulai dari Track 1: Excel</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <Accordion items={FAQ_ITEMS} defaultOpenId="faq-1" />
          </div>
        </div>
      </div>
    </section>
  );
}
