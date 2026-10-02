"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import CakrawalaLogo from "@/components/CakrawalaLogo";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentSchool, setStudentSchool] = useState("");
  const [studentWhatsapp, setStudentWhatsapp] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const json = await res.json();

      if (json.success) {
        const targetPath = json.redirectTo || redirectPath || "/";
        router.push(targetPath);
        router.refresh();
      } else {
        setErrorMessage(json.message || "Username atau Password salah.");
        setLoading(false);
      }
    } catch (err) {
      setErrorMessage("Terjadi kendala jaringan saat menghubungi server.");
      setLoading(false);
    }
  };

  const handleParticipantRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!studentName.trim()) {
      setErrorMessage("Nama siswa wajib diisi untuk mendaftar.");
      return;
    }

    if (!studentSchool.trim()) {
      setErrorMessage("Asal sekolah wajib diisi untuk mendaftar.");
      return;
    }

    if (!studentWhatsapp.trim()) {
      setErrorMessage("Nomor WhatsApp wajib diisi untuk mendaftar.");
      return;
    }

    if (!registerPassword.trim()) {
      setErrorMessage("Password wajib diisi untuk mendaftar.");
      return;
    }

    const normalizedName = studentName.trim();
    const generatedUsername = normalizedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 16);

    const candidateUsername = generatedUsername || `siswa${Date.now()}`;
    const studentPayload = {
      username: candidateUsername,
      password: registerPassword.trim(),
      studentName: normalizedName,
      studentSchool: studentSchool.trim(),
      studentWhatsapp: studentWhatsapp.trim(),
    };

    sessionStorage.setItem("cbt_pending_student", JSON.stringify(studentPayload));
    setUsername(candidateUsername);
    setPassword(registerPassword.trim());
    setStudentName("");
    setStudentSchool("");
    setStudentWhatsapp("");
    setRegisterPassword("");
    setIsRegistering(false);
    router.push("/payment");
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 min-h-[75vh]">
      <div className="max-w-sm w-full space-y-4">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Portal Siswa
        </Link>

        {/* Clean Login Box */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 sm:p-7 space-y-5">
          {/* Header */}
          <div className="text-center space-y-2 pb-2">
            <div className="flex justify-center">
              <CakrawalaLogo className="h-12 w-auto" height={48} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Login CBT
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Masuk untuk admin atau peserta ujian
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isRegistering ? (
            <form onSubmit={handleParticipantRegistration} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Siswa
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Nama lengkap siswa"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Asal Sekolah
                </label>
                <input
                  type="text"
                  value={studentSchool}
                  onChange={(e) => setStudentSchool(e.target.value)}
                  placeholder="Contoh: MAN 1 Kota"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No WhatsApp
                </label>
                <input
                  type="tel"
                  value={studentWhatsapp}
                  onChange={(e) => setStudentWhatsapp(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Buat password peserta"
                    className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs transition-colors"
                >
                  Simpan Pendaftaran
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium text-xs hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username / No.Hp
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="contoh: Ahmad Safey"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Masuk ke Portal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end text-[11px] text-slate-500">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(true);
                    setErrorMessage("");
                  }}
                  className="text-blue-700 hover:underline font-semibold cursor-pointer"
                >
                  Daftar Peserta
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
