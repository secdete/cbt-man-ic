"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogIn, LogOut } from "lucide-react";
import CakrawalaLogo from "@/components/CakrawalaLogo";

interface StudentProfile {
  name: string;
  school: string | null;
  phone: string | null;
}

export default function SiteLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [viewer, setViewer] = useState<
    { role: "student"; profile: StudentProfile } | { role: "admin" } | null
  >(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Ditampilkan sesuai status login: tombol Login bila belum, ikon profil bila sudah.
  // Refetch tiap pindah halaman supaya status tidak basi setelah login/keluar.
  useEffect(() => {
    let active = true;

    async function loadViewer() {
      try {
        const res = await fetch("/api/auth/me");
        if (!active) return;
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setViewer({ role: "student", profile: json.data });
            return;
          }
        }

        // Belum login sebagai peserta: cek apakah ini cookie panitia
        const check = await fetch("/api/admin/auth/check");
        const checkJson = await check.json();
        if (active && checkJson?.authenticated && checkJson?.role === "admin") {
          setViewer({ role: "admin" });
        }
      } catch (err) {
        console.error("Failed to load login status:", err);
      }
    }

    loadViewer();

    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } finally {
      setViewer(null);
      // Reload penuh: status login harus dibaca ulang oleh semua halaman yang
      // sedang terbuka, bukan hanya navbar.
      if (pathname === "/") window.location.reload();
      else window.location.assign("/");
    }
  };

  // Jika berada di ruang ujian siswa (/exam/[token]/test), sembunyikan header & footer global
  // agar siswa fokus 100% pada lembar ujian tanpa distraksi atau navigasi tak sengaja.
  const isExamTestPage =
    pathname.includes("/test") && pathname.startsWith("/exam/");

  if (isExamTestPage) {
    return <main className="flex-1 flex flex-col">{children}</main>;
  }

  const student = viewer?.role === "student" ? viewer.profile : null;
  const isAdmin = viewer?.role === "admin";
  const nameParts = student
    ? student.name.trim().split(/\s+/)
    : isAdmin
      ? ["Panitia"]
      : [];
  const initials = nameParts
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <>
      {/* Top Institutional Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Logo & Identity */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 group min-w-0"
          >
            <CakrawalaLogo className="h-8 sm:h-10 w-auto flex-shrink-0" height={40} />
            <div className="border-l border-slate-200 pl-2.5 sm:pl-3 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 whitespace-nowrap">
                  CAKRAWALA{" "}
                  <span className="text-blue-700 font-extrabold">CBT</span>
                </span>
                <span className="hidden xs:inline-block text-[10px] sm:text-[11px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-1.5 sm:px-2 py-0.5 rounded">
                  SNPDB MAN IC
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate hidden sm:block">
                Madrasah Aliyah Negeri Insan Cendekia
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {student || isAdmin ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  title={student ? `Akun: ${student.name}` : "Akun panitia"}
                  className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-white text-[11px] sm:text-xs font-bold flex items-center justify-center ${
                      isAdmin ? "bg-blue-700" : "bg-slate-900"
                    }`}
                  >
                    {initials}
                  </span>
                  <span className="hidden sm:block text-xs font-semibold text-slate-700 max-w-[8rem] truncate">
                    {nameParts[0]}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      menuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {menuOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Tutup menu profil"
                      onClick={() => setMenuOpen(false)}
                      className="fixed inset-0 z-10 cursor-default"
                    />
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-2 w-60 z-20 bg-white border border-slate-200 rounded-xl shadow-md p-3.5 space-y-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-9 h-9 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                            isAdmin ? "bg-blue-700" : "bg-slate-900"
                          }`}
                        >
                          {initials}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {student ? student.name : "Panitia"}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {student
                              ? student.school || "Peserta ujian"
                              : "Administrator CBT"}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-2.5 text-[11px] text-slate-500 space-y-1">
                        {student ? (
                          <>
                            <p className="truncate">
                              No. HP: {student.phone || "-"}
                            </p>
                            <p>
                              Satu akun hanya berlaku untuk{" "}
                              <b>satu kali pengerjaan</b>.
                            </p>
                          </>
                        ) : (
                          <p>
                            Anda login sebagai panitia: bisa mengatur ujian,
                            jadwal, dan data peserta.
                          </p>
                        )}
                      </div>

                      {!student && (
                        <Link
                          href="/admin"
                          className="w-full py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          Buka Panel Admin
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Keluar
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/admin/login"
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
                title="Login pengguna"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-300" />
                <span>Login</span>
              </Link>
            )}
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
