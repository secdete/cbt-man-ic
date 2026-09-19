import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import CakrawalaLogo from "@/components/CakrawalaLogo";
import HeaderStudentStatus from "@/components/HeaderStudentStatus";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Cakrawala CBT - Seleksi Nasional MAN Insan Cendekia",
  description:
    "Sistem Ujian Berbasis Komputer (CBT) Simulasi SNPDB MAN Insan Cendekia.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
        {/* Top Institutional Header */}
        <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo & Identity */}
            <Link href="/" className="flex items-center gap-3 group">
              <CakrawalaLogo className="h-10 w-auto" height={40} />
              <div className="border-l border-slate-200 pl-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-slate-900">
                    CAKRAWALA{" "}
                    <span className="text-blue-700 font-extrabold">CBT</span>
                  </span>
                  <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    SNPDB MAN IC
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Madrasah Aliyah Negeri Insan Cendekia
                </p>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="flex items-center gap-2.5 sm:gap-3">
              <HeaderStudentStatus />
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden sm:inline">Panel Panitia</span>
                <span className="sm:hidden">Panitia</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">{children}</main>

        {/* Institutional Clean Footer */}
        <footer className="border-t border-slate-200 bg-white py-5 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="font-medium">
              © {new Date().getFullYear()} Cakrawala • Sistem CBT Simulasi SNPDB
              MAN Insan Cendekia
            </p>
            <div className="flex items-center gap-3 text-slate-400 font-medium">
              <span>Platform Simulasi Ujian Mandiri</span>
              <span>•</span>
              <span>Versi 1.0</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
