"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, BookOpen } from "lucide-react";
import CakrawalaLogo from "@/components/CakrawalaLogo";

export default function SiteLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Jika berada di ruang ujian siswa (/exam/[token]/test), sembunyikan header & footer global
  // agar siswa fokus 100% pada lembar ujian tanpa distraksi atau navigasi tak sengaja.
  const isExamTestPage =
    pathname.includes("/test") && pathname.startsWith("/exam/");

  if (isExamTestPage) {
    return <main className="flex-1 flex flex-col">{children}</main>;
  }

  return (
    <>
      {/* Top Institutional Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3">
          {/* Logo & Identity */}
          <Link
            href="/"
            className="flex items-center gap-3 sm:gap-3.5 group min-w-0"
          >
            <CakrawalaLogo className="h-11 sm:h-13 w-auto flex-shrink-0" height={52} />
            <div className="border-l border-slate-200 pl-3 sm:pl-3.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 whitespace-nowrap">
                  CAKRAWALA{" "}
                  <span className="text-blue-700 font-extrabold">CBT</span>
                </span>
                <span className="hidden xs:inline-block text-[10px] sm:text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  SNPDB MAN IC
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate hidden sm:block">
                Madrasah Aliyah Negeri Insan Cendekia
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <Link
              href="/"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-700 hover:bg-slate-100 transition-colors"
              title="Ruang Ujian Siswa"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Ruang Ujian</span>
              <span className="sm:hidden text-[11px]">Siswa</span>
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
              title="Panel Panitia CBT"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Panel Panitia</span>
              <span className="sm:hidden text-[11px]">Admin</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Institutional Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 sm:py-5 text-[11px] sm:text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
          <p className="font-medium">
            © {new Date().getFullYear()} Cakrawala Learning • Platform Simulasi
            Resmi SNPDB MAN Insan Cendekia
          </p>
          <div className="flex items-center gap-2.5 text-slate-400 font-medium justify-center">
            <span>Sistem CBT Terstandar</span>
            <span>•</span>
            <span>Anti-Curang Real-time</span>
          </div>
        </div>
      </footer>
    </>
  );
}
