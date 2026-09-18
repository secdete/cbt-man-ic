import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { ShieldCheck, BookOpen } from 'lucide-react';
import CakrawalaLogo from '@/components/CakrawalaLogo';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Cakrawala CBT - Tryout MAN Insan Cendekia (SNPDB)',
  description: 'Platform Simulasi Ujian Mandiri Komputer (CBT) Seleksi Masuk MAN Insan Cendekia didukung oleh Cakrawala.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
        {/* Navigation Bar - Deep Royal Blue Theme */}
        <header className="sticky top-0 z-40 w-full border-b border-blue-900/30 bg-slate-950 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo & Brand */}
            <Link href="/" className="flex items-center gap-3 group">
              <CakrawalaLogo className="w-10 h-10 shadow-md ring-2 ring-blue-500/40 group-hover:scale-105 transition-transform" size={40} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight text-white">
                    CAKRAWALA <span className="text-blue-400">CBT</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-900/90 text-blue-200 border border-blue-700/60">
                    SNPDB MAN IC
                  </span>
                </div>
                <p className="text-xs text-blue-200/80 -mt-0.5">Madrasah Aliyah Negeri Insan Cendekia</p>
              </div>
            </Link>

            {/* Menu Links */}
            <nav className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-100 hover:text-white hover:bg-blue-900/60 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline">Ruang Ujian Siswa</span>
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all hover:shadow"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Panel Panitia</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">{children}</main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© {new Date().getFullYear()} Cakrawala CBT • Simulasi SNPDB MAN Insan Cendekia</p>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="font-semibold text-blue-600">Cakrawala</span>
              <span>•</span>
              <span>Next.js 15</span>
              <span>•</span>
              <span>Vercel Ready</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
