"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  AlertCircle,
  KeyRound,
  User,
  ClipboardList,
  ListOrdered,
  Info,
  Sparkles,
  Lock,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import CakrawalaLogo from "@/components/CakrawalaLogo";

interface StudentProfile {
  id: string;
  name: string;
  school: string | null;
  phone: string | null;
  username: string | null;
}

export default function StudentHomePage() {
  const router = useRouter();

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Status login peserta: form hanya muncul setelah akun terkonfirmasi.
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadStudent() {
      try {
        const res = await fetch("/api/auth/me");
        if (!active) return;
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) setStudent(json.data);
        }
      } catch (err) {
        console.error("Failed to load student profile:", err);
      } finally {
        if (active) setAuthChecking(false);
      }
    }
    loadStudent();

    return () => {
      active = false;
    };
  }, []);

  const handleStartExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!student) {
      setErrorMessage("Silakan login terlebih dahulu sebelum memulai ujian.");
      return;
    }

    if (!token.trim()) {
      setErrorMessage("Silakan masukkan Token Ujian yang diberikan panitia.");
      return;
    }

    const cleanToken = token.trim().toUpperCase();
    setLoading(true);

    try {
      // Verifikasi token & jadwal terlebih dahulu
      const checkRes = await fetch(
        `/api/exams?token=${encodeURIComponent(cleanToken)}`,
      );
      const checkJson = await checkRes.json();

      if (checkJson.success && Array.isArray(checkJson.data)) {
        const found = checkJson.data.find((ex: any) => ex.token === cleanToken);
        if (!found) {
          setErrorMessage(
            `Token "${cleanToken}" tidak valid. Periksa kembali token dari arahan pengawas.`,
          );
          setLoading(false);
          return;
        }

        // Cek status aktif & jadwal admin
        if (!found.isActive || found.isLocked) {
          setErrorMessage(
            "Ujian dengan token ini sedang ditutup atau belum diaktifkan oleh panitia/admin.",
          );
          setLoading(false);
          return;
        }

        const now = new Date();
        if (found.openTime && new Date(found.openTime) > now) {
          const formattedOpen = new Date(found.openTime).toLocaleString(
            "id-ID",
            {
              timeZone: "Asia/Jakarta",
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            },
          );
          setErrorMessage(
            `Ujian belum dibuka. Jadwal pelaksanaan baru dimulai pada: ${formattedOpen}.`,
          );
          setLoading(false);
          return;
        }

        if (found.closeTime && new Date(found.closeTime) <= now) {
          const formattedClose = new Date(found.closeTime).toLocaleString(
            "id-ID",
            {
              timeZone: "Asia/Jakarta",
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            },
          );
          setErrorMessage(
            `Waktu pelaksanaan ujian ini telah ditutup pada: ${formattedClose}.`,
          );
          setLoading(false);
          return;
        }
      }

      router.push(`/exam/${encodeURIComponent(cleanToken)}`);
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Terjadi kesalahan saat memeriksa token.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 pb-16">
      {/* Top Banner - Clean Institutional Style */}
      <section className="bg-slate-900 border-b border-slate-800 text-white py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-blue-950 border border-blue-800 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Sistem Ujian Berbasis Komputer (CBT)</span>
            </div>

            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
              Simulasi Seleksi Nasional Peserta Didik Baru (SNPDB)
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
              Madrasah Aliyah Negeri Insan Cendekia (MAN IC) • Didukung oleh
              Cakrawala Learning
            </p>
          </div>

          <div className="flex items-center gap-3.5 bg-slate-800/90 p-3 sm:p-3.5 rounded-2xl border border-slate-700 shadow-md flex-shrink-0">
            <CakrawalaLogo className="h-12 sm:h-14 w-auto" height={58} />
            <div className="text-left border-l border-slate-700 pl-3">
              <p className="text-sm font-bold text-white tracking-tight">
                Cakrawala Learning
              </p>
              <p className="text-[11px] text-slate-400">Portal Ujian Terpadu</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 -mt-3 sm:-mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Card Form Masuk Ujian (Left Column - 7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-7">
            <div className="pb-4 sm:pb-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Masuk Ruang Ujian
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Login dengan akun peserta, lalu isi token yang diarahkan panitia
                </p>
              </div>
              <span className="p-2 rounded-lg bg-slate-100 text-slate-700 flex-shrink-0">
                <KeyRound className="w-5 h-5" />
              </span>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {authChecking ? (
              <div className="mt-5 py-8 flex flex-col items-center gap-2.5">
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                <p className="text-xs text-slate-500">
                  Memeriksa status login Anda...
                </p>
              </div>
            ) : !student ? (
              /* Belum login: form identitas tidak ditampilkan sama sekali */
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6 text-center space-y-3">
                <div className="w-11 h-11 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center mx-auto">
                  <LogIn className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Silakan login terlebih dahulu
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                    Akun peserta dibuat panitia melalui daftar peserta. Setelah
                    login, data Anda otomatis terisi dan tinggal menunggu token
                    ujian dari pengawas.
                  </p>
                </div>
                <Link
                  href="/admin/login"
                  className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Login Peserta
                </Link>
              </div>
            ) : (
              <form onSubmit={handleStartExam} className="mt-5 space-y-4">
                {/* Identitas dari akun yang login (terkunci, tidak bisa diedit) */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Data Peserta
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      <User className="w-3 h-3" />
                      Sudah login
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      readOnly
                      aria-readonly="true"
                      value={student.name}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 cursor-not-allowed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Asal Madrasah / Sekolah
                      </label>
                      <input
                        type="text"
                        readOnly
                        aria-readonly="true"
                        value={student.school || "-"}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        No. HP / WhatsApp
                      </label>
                      <input
                        type="tel"
                        readOnly
                        aria-readonly="true"
                        value={student.phone || "-"}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-mono cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] leading-relaxed text-slate-500">
                    Data diambil dari akun Anda dan tidak bisa diubah. Satu akun
                    hanya berlaku untuk <b>satu kali pengerjaan</b>.
                  </p>
                </div>

                {/* Token Ujian (Wajib, diisi manual dari arahan admin) */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Token Ujian <span className="text-rose-500">*</span>
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
                        setErrorMessage("");
                      }}
                      placeholder="Masukkan token dari panitia/admin"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-sm text-slate-900 placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                  </div>
                  <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-amber-700 bg-amber-50/70 p-2 rounded border border-amber-200/60">
                    <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-600" />
                    <span>
                      Token naskah ujian bersifat rahasia dan dibagikan oleh
                      panitia/pengawas saat jadwal ujian resmi dibuka.
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 py-3 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Konfirmasi &amp; Masuk Ujian</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Tata Tertib & Tata Cara Pelaksanaan Ujian (5 cols) */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-5">
            {/* Tata Tertib & Tata Cara Pelaksanaan Ujian */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-5 space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700 flex-shrink-0">
                    <ClipboardList className="w-4 h-4" />
                  </span>
                  Tata Tertib &amp; Tata Cara Pelaksanaan Ujian
                </h3>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  Baca sebelum mengikuti try out. Peserta dianggap sudah membaca
                  dan menyetujui seluruh ketentuan di bawah ini.
                </p>
              </div>

              {/* Tata cara pelaksanaan */}
              <div className="space-y-2.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <ListOrdered className="w-3.5 h-3.5 text-blue-700" />
                  Tata Cara Pelaksanaan
                </h4>
                <ol className="space-y-2 text-xs text-slate-600 leading-relaxed">
                  {[
                    "Login di halaman login memakai username atau No. HP serta password yang tertera pada kartu peserta.",
                    "Setelah login, nama, asal madrasah, dan No. HP Anda terisi otomatis. Pastikan datanya benar, lalu tunggu token dari pengawas.",
                    "Saat jadwal dibuka, masukkan token pada kolom Token Ujian lalu tekan Konfirmasi & Masuk Ujian.",
                    "Ujian berjalan dalam mode fullscreen. Jawaban tersimpan otomatis — pantau sisa waktu yang tampil di layar.",
                    "Tekan Selesai & Submit bila sudah yakin. Setelah submit, Sertifikat dan Analisa PDF terunduh otomatis ke perangkat Anda.",
                  ].map((step, index) => (
                    <li key={step} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Tata tertib peserta */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-700" />
                  Tata Tertib Peserta
                </h4>
                <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                    <span>
                      Hadir dan login paling lambat 15 menit sebelum jadwal.
                      Di luar <b>Waktu Mulai/Selesai</b> yang ditetapkan panitia,
                      ujian tetap terkunci.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                    <span>
                      Satu akun hanya berlaku untuk{" "}
                      <b>satu kali pengerjaan</b> dan tidak boleh dipinjamkan
                      kepada peserta lain.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                    <span>
                      Peserta wajib tetap dalam mode fullscreen: dilarang
                      berpindah tab/jendela, membuka aplikasi lain, atau membuka
                      situs lain selama ujian berlangsung.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    <span className="text-amber-900 font-medium">
                      Pelanggaran membuka tab lain lebih dari 3 kali akan
                      menyebabkan ujian di-submit otomatis oleh sistem.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                    <span>
                      Dilarang berbuat curang dan meminta bantuan orang lain.
                      Kerjakan sendiri agar hasil try out mencerminkan kemampuan
                      Anda.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                    <span>
                      Gangguan teknis (listrik/jaringan) segera dilaporkan ke
                      pengawas. Sesi dapat dilanjutkan selama waktu ujian belum
                      habis.
                    </span>
                  </li>
                </ul>
                <p className="text-[11px] leading-relaxed text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  Token naskah hanya dibagikan pengawas saat jadwal resmi dibuka
                  dan tidak dipublikasikan di halaman ini.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
