"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Clock,
  HelpCircle,
  AlertCircle,
  KeyRound,
  User,
  School,
  IdCard,
  FileCheck2,
  Info,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  LogOut,
  Sparkles,
  CheckCircle2,
  History,
  Award,
} from "lucide-react";
import CakrawalaLogo from "@/components/CakrawalaLogo";

interface ExamItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  durationMinutes: number;
  token: string;
  passingScore: number;
  _count: {
    questions: number;
    sessions: number;
  };
}

interface StudentSession {
  id: string;
  status: string;
  startTime: string;
  endTime: string | null;
  totalScore: number;
  accuracy: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  tabSwitchCount: number;
  exam: {
    id: string;
    title: string;
    category: string;
    token: string;
    durationMinutes: number;
    passingScore: number;
  };
}

interface StudentProfile {
  id: string;
  name: string;
  nisn: string;
  school: string | null;
  sessions: StudentSession[];
}

export default function StudentHomePage() {
  const router = useRouter();

  // Auth checking state
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [student, setStudent] = useState<StudentProfile | null>(null);

  // Auth Card Tab: 'login' | 'register'
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  // Login Form States
  const [loginNisn, setLoginNisn] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Register Form States
  const [regName, setRegName] = useState("");
  const [regNisn, setRegNisn] = useState("");
  const [regSchool, setRegSchool] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");

  // Exam Selection States
  const [token, setToken] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [activeExams, setActiveExams] = useState<ExamItem[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Load current student session & active exams
  useEffect(() => {
    async function init() {
      try {
        const [authRes, examRes] = await Promise.all([
          fetch("/api/student/me"),
          fetch("/api/exams"),
        ]);

        const authJson = await authRes.json();
        if (authJson.success && authJson.student) {
          setStudent(authJson.student);
        } else {
          setStudent(null);
        }

        const examJson = await examRes.json();
        if (examJson.success && Array.isArray(examJson.data)) {
          setActiveExams(examJson.data.filter((e: any) => e.isActive));
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setCheckingAuth(false);
        setLoadingExams(false);
      }
    }

    init();
  }, []);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginNisn.trim()) {
      setLoginError("Silakan masukkan NISN / Nomor Peserta Anda.");
      return;
    }
    if (!loginPassword) {
      setLoginError("Silakan masukkan Password Anda.");
      return;
    }

    setLoginLoading(true);

    try {
      const res = await fetch("/api/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nisn: loginNisn.trim(),
          password: loginPassword,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setLoginError(
          json.message || "Gagal masuk. Periksa NISN dan Password.",
        );
        setLoginLoading(false);
        return;
      }

      // Re-fetch student profile with history
      const meRes = await fetch("/api/student/me");
      const meJson = await meRes.json();
      if (meJson.success && meJson.student) {
        setStudent(meJson.student);
        window.dispatchEvent(new Event("cbt_auth_changed"));
      }
    } catch (err: any) {
      setLoginError("Terjadi kendala jaringan saat menghubungi server.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");

    if (!regName.trim()) {
      setRegError("Nama Lengkap wajib diisi.");
      return;
    }
    if (!regNisn.trim()) {
      setRegError("NISN wajib diisi.");
      return;
    }
    if (regPassword.length < 6) {
      setRegError("Password minimal terdiri dari 6 karakter.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError("Konfirmasi password tidak cocok dengan password.");
      return;
    }

    setRegLoading(true);

    try {
      const res = await fetch("/api/student/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          nisn: regNisn.trim(),
          school: regSchool.trim() || null,
          password: regPassword,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setRegError(json.message || "Pendaftaran akun gagal.");
        setRegLoading(false);
        return;
      }

      // Re-fetch student profile
      const meRes = await fetch("/api/student/me");
      const meJson = await meRes.json();
      if (meJson.success && meJson.student) {
        setStudent(meJson.student);
        window.dispatchEvent(new Event("cbt_auth_changed"));
      }
    } catch (err: any) {
      setRegError("Terjadi kendala jaringan saat mendaftar.");
    } finally {
      setRegLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/student/logout", { method: "POST" });
      sessionStorage.removeItem("cbt_student_data");
      setStudent(null);
      setToken("");
      window.dispatchEvent(new Event("cbt_auth_changed"));
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Start Exam with selected token
  const handleStartExam = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setTokenError("");

    if (!token.trim()) {
      setTokenError("Silakan masukkan atau pilih Token Ujian terlebih dahulu.");
      return;
    }

    const cleanToken = token.trim().toUpperCase();

    // Verify token exists in active exams
    const found = activeExams.find((ex) => ex.token === cleanToken);
    if (!found) {
      setTokenError(
        `Token "${cleanToken}" tidak ditemukan dalam daftar paket ujian.`,
      );
      return;
    }

    // Save student info into sessionStorage for the exam session
    if (student) {
      sessionStorage.setItem(
        "cbt_student_data",
        JSON.stringify({
          token: cleanToken,
          studentName: student.name,
          studentNisn: student.nisn,
          studentSchool: student.school || "",
        }),
      );
    }

    router.push(`/exam/${encodeURIComponent(cleanToken)}`);
  };

  const handleSelectToken = (selectedToken: string) => {
    setToken(selectedToken);
    setTokenError("");
    // Save student info into sessionStorage
    if (student) {
      sessionStorage.setItem(
        "cbt_student_data",
        JSON.stringify({
          token: selectedToken,
          studentName: student.name,
          studentNisn: student.nisn,
          studentSchool: student.school || "",
        }),
      );
      router.push(`/exam/${encodeURIComponent(selectedToken)}`);
    } else {
      // If not logged in, scroll to auth card
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-3 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">
            Memuat Portal Simulasi SNPDB CBT...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-16">
      {/* Top Banner - Clean Institutional Style */}
      <section className="bg-slate-900 border-b border-slate-800 text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-blue-950 border border-blue-800 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Sistem Ujian Berbasis Komputer (CBT)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Simulasi Seleksi Nasional Peserta Didik Baru (SNPDB)
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
              Madrasah Aliyah Negeri Insan Cendekia (MAN IC) • Didukung oleh
              Cakrawala Learning
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <CakrawalaLogo className="h-12 w-auto" height={48} />
            <div className="text-left border-l border-slate-700 pl-3">
              <p className="text-xs font-bold text-slate-200">
                Cakrawala Learning
              </p>
              <p className="text-[11px] text-slate-400">Portal Ujian Terpadu</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        {/* ========================================================================= */}
        {/* CONDITION 1: SISWA BELUM LOGIN -> TAMPILKAN LOGIN & REGISTER PORTAL */}
        {/* ========================================================================= */}
        {!student ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Auth Card (Left Column - 7 cols) */}
            <div
              id="auth"
              className="lg:col-span-7 bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden"
            >
              {/* Tab Selector Header */}
              <div className="flex border-b border-slate-200 bg-slate-50/80">
                <button
                  type="button"
                  onClick={() => setAuthTab("login")}
                  className={`flex-1 py-3.5 px-4 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border-b-2 ${
                    authTab === "login"
                      ? "bg-white text-blue-700 border-blue-700 shadow-2xs"
                      : "text-slate-600 border-transparent hover:text-slate-900"
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk Akun Siswa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthTab("register")}
                  className={`flex-1 py-3.5 px-4 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border-b-2 ${
                    authTab === "register"
                      ? "bg-white text-blue-700 border-blue-700 shadow-2xs"
                      : "text-slate-600 border-transparent hover:text-slate-900"
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Daftar Akun Baru</span>
                </button>
              </div>

              <div className="p-6 sm:p-7">
                {/* ----------------- TAB LOGIN ----------------- */}
                {authTab === "login" ? (
                  <div>
                    <div className="pb-4 border-b border-slate-100">
                      <h2 className="text-base font-bold text-slate-900">
                        Masuk ke Portal Ujian Siswa
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Gunakan Nomor Induk Siswa Nasional (NISN) dan password
                        yang telah Anda buat
                      </p>
                    </div>

                    {loginError && (
                      <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-rose-800 text-xs">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <form onSubmit={handleLogin} className="mt-5 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          NISN / Nomor Peserta{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <IdCard className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            required
                            value={loginNisn}
                            onChange={(e) => setLoginNisn(e.target.value)}
                            placeholder="Masukkan 10 digit NISN Anda"
                            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Password Akun <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input
                            type={showLoginPassword ? "text" : "password"}
                            required
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Masukkan password akun Anda"
                            className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowLoginPassword(!showLoginPassword)
                            }
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showLoginPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loginLoading}
                        className="w-full mt-3 py-2.5 px-4 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {loginLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Masuk ke Dashboard Ujian</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <div className="pt-2 text-center text-xs text-slate-500">
                        Belum memiliki akun siswa?{" "}
                        <button
                          type="button"
                          onClick={() => setAuthTab("register")}
                          className="font-bold text-blue-700 hover:underline cursor-pointer"
                        >
                          {"Daftar Akun Baru Sekarang →"}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* ----------------- TAB REGISTER ----------------- */
                  <div>
                    <div className="pb-4 border-b border-slate-100">
                      <h2 className="text-base font-bold text-slate-900">
                        Registrasi Akun Siswa Baru
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Daftar akun satu kali untuk mengerjakan seluruh 16 paket
                        simulasi SNPDB MAN IC
                      </p>
                    </div>

                    {regError && (
                      <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-rose-800 text-xs">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                        <span>{regError}</span>
                      </div>
                    )}

                    <form onSubmit={handleRegister} className="mt-5 space-y-4">
                      {/* Nama Lengkap */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Nama Lengkap Siswa{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <User className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            required
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            placeholder="Ketik nama lengkap sesuai ijazah/berkas"
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                          />
                        </div>
                      </div>

                      {/* NISN & Asal Sekolah */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            NISN / Nomor Peserta{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                              <IdCard className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              required
                              value={regNisn}
                              onChange={(e) => setRegNisn(e.target.value)}
                              placeholder="Contoh: 0081234567"
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Asal Madrasah / Sekolah
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                              <School className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              value={regSchool}
                              onChange={(e) => setRegSchool(e.target.value)}
                              placeholder="Contoh: MTsN 1 Serpong / SMPN 1"
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Password & Confirm Password */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Buat Password{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                              <Lock className="w-4 h-4" />
                            </div>
                            <input
                              type={showRegPassword ? "text" : "password"}
                              required
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              placeholder="Minimal 6 karakter"
                              className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowRegPassword(!showRegPassword)
                              }
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {showRegPassword ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Konfirmasi Password{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                              <Lock className="w-4 h-4" />
                            </div>
                            <input
                              type={showRegPassword ? "text" : "password"}
                              required
                              value={regConfirmPassword}
                              onChange={(e) =>
                                setRegConfirmPassword(e.target.value)
                              }
                              placeholder="Ulangi password"
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={regLoading}
                        className="w-full mt-3 py-2.5 px-4 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {regLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <UserCheckIcon className="w-4 h-4" />
                            <span>Daftar Akun &amp; Masuk Otomatis</span>
                          </>
                        )}
                      </button>

                      <div className="pt-2 text-center text-xs text-slate-500">
                        Sudah punya akun siswa?{" "}
                        <button
                          type="button"
                          onClick={() => setAuthTab("login")}
                          className="font-bold text-blue-700 hover:underline cursor-pointer"
                        >
                          {"Masuk di sini →"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Keunggulan CBT & Pratinjau Paket (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Petunjuk & Informasi SNPDB */}
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <FileCheck2 className="w-4 h-4 text-blue-700" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Keunggulan Sistem CBT Mandiri
                  </h3>
                </div>

                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1 rounded-md bg-blue-50 text-blue-700 mt-0.5 flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        Satu Akun untuk Semua Mata Uji
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Daftar sekali dan nikmati kemudahan akses ke seluruh 16
                        paket simulasi SNPDB tanpa perlu memasukkan ulang
                        identitas.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="p-1 rounded-md bg-emerald-50 text-emerald-700 mt-0.5 flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        Penyimpanan Jawaban Real-Time
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Setiap jawaban dan status ragu-ragu tersimpan otomatis
                        secara instan ke server database.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="p-1 rounded-md bg-amber-50 text-amber-700 mt-0.5 flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        Penilaian Otomatis &amp; Analisis Skor
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Langsung ketahui perolehan skor, akurasi pengerjaan, dan
                        riwayat simulasi setelah waktu berakhir.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sekilas Paket Ujian */}
              <div className="bg-slate-900 text-white rounded-xl shadow-xs border border-slate-800 p-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Bank Soal SNPDB Tersedia
                  </p>
                  <span className="text-[11px] px-2 py-0.5 rounded font-bold bg-blue-900/80 text-blue-300 border border-blue-700">
                    {activeExams.length} Paket Soal
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  Tersedia naskah resmi SNPDB MAN Insan Cendekia dari tahun 2020
                  hingga 2023 mencakup Tes Potensi Akademik (TPA), Bahasa Arab,
                  Bahasa Inggris, Literasi, dan Numerasi/IPA.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <span>
                    Silakan <b>Masuk</b> atau <b>Daftar</b> untuk mulai
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* CONDITION 2: SISWA SUDAH LOGIN -> TAMPILKAN DASHBOARD PORTAL SISWA */
          /* ========================================================================= */
          <div className="space-y-6">
            {/* Student Profile Greeting Banner */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center font-extrabold text-lg shadow-xs">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      Selamat Datang, {student.name}
                    </h2>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Akun Aktif
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      <IdCard className="w-3 h-3 text-slate-400" />
                      NISN: {student.nisn}
                    </span>
                    {student.school && (
                      <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        <School className="w-3 h-3 text-slate-400" />
                        {student.school}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full md:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar / Ganti Akun</span>
                </button>
              </div>
            </div>

            {/* Dashboard Content: Left = Start Exam & History, Right = 16 Exams */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (7 cols): Masuk Token & Riwayat Tryout */}
              <div className="lg:col-span-7 space-y-6">
                {/* Card Masuk Ruang Ujian via Token */}
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
                  <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Mulai Pengerjaan Ujian
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Ketik token ujian atau pilih dari daftar paket di
                        sebelah kanan
                      </p>
                    </div>
                    <span className="p-2 rounded-lg bg-blue-50 text-blue-700">
                      <KeyRound className="w-5 h-5" />
                    </span>
                  </div>

                  {tokenError && (
                    <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-rose-800 text-xs">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                      <span>{tokenError}</span>
                    </div>
                  )}

                  <form onSubmit={handleStartExam} className="mt-4 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Token Ujian Terpilih{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={token}
                          onChange={(e) => {
                            setToken(e.target.value.toUpperCase());
                            setTokenError("");
                          }}
                          placeholder="Contoh: MANIC2023IPA"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-sm text-slate-900 placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-slate-500">
                        {`Identitas nama (${student.name}) dan NISN (${student.nisn}) akan otomatis digunakan saat ujian dimulai.`}
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Masuk ke Lembar Konfirmasi Ujian</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                {/* Riwayat Pengerjaan Tryout Siswa */}
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
                  <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-blue-700" />
                      <h3 className="font-bold text-slate-900 text-sm">
                        Riwayat Tryout Saya
                      </h3>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {student.sessions?.length || 0} Sesi
                    </span>
                  </div>

                  {student.sessions && student.sessions.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {student.sessions.map((sess) => (
                        <div
                          key={sess.id}
                          className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs text-slate-900">
                                {sess.exam?.title || "Simulasi Ujian"}
                              </h4>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  sess.status === "COMPLETED"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : sess.status === "IN_PROGRESS"
                                      ? "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"
                                      : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {sess.status === "COMPLETED"
                                  ? "Selesai"
                                  : sess.status === "IN_PROGRESS"
                                    ? "Sedang Berlangsung"
                                    : "Waktu Habis"}
                              </span>
                            </div>

                            <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                              <span>
                                Token:{" "}
                                <b className="font-mono text-slate-700">
                                  {sess.exam?.token}
                                </b>
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(sess.startTime).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 self-end sm:self-center">
                            {sess.status === "COMPLETED" && (
                              <div className="text-right">
                                <p className="text-[10px] text-slate-400 font-semibold uppercase">
                                  Skor Akhir
                                </p>
                                <p className="font-bold text-sm text-blue-700">
                                  {sess.totalScore} Poin
                                </p>
                              </div>
                            )}

                            {sess.status === "IN_PROGRESS" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSelectToken(sess.exam.token)
                                }
                                className="px-3 py-1.5 rounded-md bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold cursor-pointer transition-colors"
                              >
                                {"Lanjutkan →"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSelectToken(sess.exam.token)
                                }
                                className="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                              >
                                Ulangi Ujian
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 p-6 text-center rounded-lg border border-dashed border-slate-200 bg-slate-50">
                      <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-700">
                        Belum ada riwayat ujian
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                        Pilih salah satu dari 16 paket tryout di sebelah kanan
                        untuk memulai latihan pertama Anda.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (5 cols): Daftar Paket Tryout */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-blue-700" />
                      <h3 className="font-bold text-slate-900 text-sm">
                        Pilihan Mata Uji / Paket
                      </h3>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                      {activeExams.length} Paket Ujian
                    </span>
                  </div>

                  {/* Category Filter Tabs */}
                  <div className="mt-3 flex flex-wrap gap-1.5 border-b border-slate-100 pb-2.5">
                    {[
                      { key: "ALL", label: "Semua" },
                      { key: "SNPDB 2023", label: "SNPDB 2023 (Per Mapel)" },
                      { key: "SNPDB 2022", label: "SNPDB 2022" },
                      { key: "SNPDB 2021", label: "SNPDB 2021" },
                      { key: "SNPDB 2020", label: "SNPDB 2020" },
                      { key: "Tryout Mandiri", label: "Mandiri" },
                    ].map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setSelectedCategory(cat.key)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                          selectedCategory === cat.key
                            ? "bg-blue-700 text-white shadow-2xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3.5 space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {loadingExams ? (
                      <div className="py-6 text-center text-slate-400 text-xs">
                        Memuat daftar paket...
                      </div>
                    ) : activeExams.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 text-xs">
                        Belum ada paket ujian aktif saat ini.
                      </div>
                    ) : (
                      activeExams
                        .filter(
                          (e) =>
                            selectedCategory === "ALL" ||
                            e.category === selectedCategory,
                        )
                        .map((exam) => (
                          <div
                            key={exam.id}
                            className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-xs text-slate-900">
                                  {exam.title}
                                </h4>
                                <span className="inline-block mt-0.5 text-[10px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                                  {exam.category}
                                </span>
                              </div>
                              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-800 rounded flex-shrink-0">
                                {exam.token}
                              </span>
                            </div>

                            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/80">
                              <div className="flex items-center gap-3 text-[11px]">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {exam.durationMinutes} Menit
                                </span>
                                <span className="flex items-center gap-1">
                                  <HelpCircle className="w-3 h-3 text-slate-400" />
                                  {exam._count.questions} Soal
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleSelectToken(exam.token)}
                                className="px-2.5 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                {"Pilih & Mulai →"}
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Petunjuk Teknis Ringkas */}
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-900">
                    <Info className="w-3.5 h-3.5 text-blue-700" />
                    Ketentuan &amp; Tata Tertib CBT
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                      <span>
                        Timer ujian dimulai saat menekan tombol{" "}
                        <b>Mulai Ujian</b> pada lembar konfirmasi.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                      <span>
                        Jawaban tersimpan otomatis secara real-time ke server
                        pada setiap butir soal.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                      <span>
                        Gunakan tombol <b>Ragu-ragu</b> jika ingin meninjau
                        kembali pilihan sebelum submit.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                      <span className="text-amber-900 font-medium">
                        Sistem pengawas mencatat perpindahan jendela/tab browser
                        selama ujian berlangsung.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UserCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}
