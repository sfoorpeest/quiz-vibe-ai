import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Footer from './Footer';
import AnimatedBackground from './AnimatedBackground';

export default function StaticContentLayout({ title, subtitle, children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 font-sans text-slate-50 flex flex-col">
      <AnimatedBackground />

      <div className="relative z-10 flex-1">
        <header className="sticky top-0 z-30 border-b border-slate-800/70 bg-slate-950/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/80 text-slate-200 transition hover:border-blue-500/40 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">QuizVibe AI</p>
                <h1 className="text-lg font-extrabold text-white sm:text-xl">{title}</h1>
              </div>
            </div>
            <Link to="/" className="text-sm font-bold text-slate-300 transition hover:text-white">
              Quay về trang chủ
            </Link>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          {subtitle && (
            <p className="text-sm leading-7 text-slate-400">{subtitle}</p>
          )}
          {children}
        </main>
      </div>
      
      <Footer />
    </div>
  );
}
