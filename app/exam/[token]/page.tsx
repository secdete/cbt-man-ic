"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  HelpCircle,
  Award,
  AlertTriangle,
  Play,
  ArrowLeft,
  User,
  School,
  Phone,
  ShieldAlert,
  Maximize,
} from "lucide-react";
import Link from "next/link";
import CakrawalaLogo from "@/components/CakrawalaLogo";

export default function ExamConfirmationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = decodeURIComponent(resolvedParams.token).toUpperCase();
  const router = useRouter();

  const [studentData, setStudentData] = useState<{
    token: string;
    studentName: string;
    studentSchool: string;
    studentWhatsapp?: string | null;
  } | null>(null);

  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Ambil data identitas peserta dari sessionStorage
    const stored = sessionStorage.getItem("cbt_student_data");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setStudentData(parsed);
      } catch (e) {
        console.error(e);
      }
    }

    async function fetchExamDetails() {
      try {
        const res = await fetch("/api/exams");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const found = json.data.find((e: any) => e.token === token);
          if (found) {
            setExam(found);

            // Cek jika ujian ditutup atau di luar jam buka
            if (!found.isActive || found.isLocked) {
              setErrorMessage(
                "Ujian ini sedang ditutup atau belum diaktifkan oleh panitia/admin.",
              );
            }
            const now = new Date();
            if (found.openTime && new Date(found.openTime) > now) {
              const formattedOpen = new Date(found.openTime).toLocaleString(
                "id-ID",
                {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                },
              );
              setErrorMessage(
                `Ujian belum dibuka. Jadwal buka: ${formattedOpen}`,
              );
            }
            if (found.closeTime && new Date(found.closeTime) < now) {
              const formattedClose = new Date(found.closeTime).toLocaleString(
                "id-ID",
                {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                },
              );
              setErrorMessage(
                `Waktu pengerjaan ujian telah ditutup pada: ${formattedClose}`,
              );
            }
          } else {
            setErrorMessage(
              `Paket ujian dengan token "${token}" tidak ditemukan.`,
            );
          }
        }
      } catch (err) {
        setErrorMessage("Gagal memuat informasi naskah ujian.");
      } finally {
        setLoading(false);
      }
    }

    fetchExamDetails();
  }, [token]);

  const handleStartExam = async () => {
    if (!studentData?.studentName || !studentData?.studentSchool) {
      setErrorMessage(
        "Data identitas peserta tidak lengkap. Silakan kembali ke halaman utama untuk melengkapi data.",
      );
      return;
    }

    setStarting(true);
    setErrorMessage("");

    try {
      // Masuk ke mode fullscreen jika didukung browser
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (fsErr) {
        console.warn("Fullscreen request bypassed or denied:", fsErr);
      }

      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          studentName: studentData.studentName,
          studentSchool: studentData.studentSchool,
          studentWhatsapp: studentData.studentWhatsapp || null,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setErrorMessage(json.message || "Gagal memulai sesi ujian.");
        setStarting(false);
        return;
      }

      localStorage.setItem("cbt_active_session", JSON.stringify(json.data));
      router.push(`/exam/${encodeURIComponent(token)}/test`);
    } catch (err: any) {
      setErrorMessage("Terjadi kendala jaringan saat memulai sesi.");
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-600">
            Memeriksa token &amp; jadwal ujian...
          </p>
        </div>
      </div>
    );
  }

  // Jika siswa belum mengisi identitas di beranda
  if (!studentData?.studentName) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xs border border-slate-200 p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Identitas Peserta Belum Diisi
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Silakan kembali ke halaman utama untuk mengisi Nama Lengkap dan
              Asal Sekolah Anda terlebih dahulu sebelum memulai ujian.
            </p>
          </div>
          <Link
            href="/"
            className="w-full py-2.5 px-4 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Masuk</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 mb-5 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Kembali ke Halaman Masuk
      </Link>

      {errorMessage && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-rose-800 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {exam && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          {/* Slip Header */}
          <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <CakrawalaLogo className="h-11 w-auto" height={44} />
              <div className="border-l border-slate-700 pl-3">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-900 text-blue-200 border border-blue-700">
                  {exam.category}
                </span>
                <h1 className="mt-1 text-lg sm:text-xl font-bold text-white tracking-tight">
                  {exam.title}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lembar Konfirmasi Peserta Sebelum Memulai Ujian
                </p>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-right">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">
                Status Naskah
              </p>
              <p className="font-mono font-bold text-sm text-emerald-400">
                TERVERIFIKASI
              </p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Tabel Konfirmasi Identitas Siswa */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                1. Data Identitas Peserta Ujian
              </h2>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-slate-50/60">
                      <td className="w-1/3 py-2.5 px-4 font-semibold text-slate-600 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Nama Lengkap Peserta
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {studentData?.studentName}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <School className="w-3.5 h-3.5 text-slate-400" />
                          Asal Madrasah / Sekolah
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-800">
                        {studentData?.studentSchool}
                      </td>
                    </tr>
                    {studentData?.studentWhatsapp && (
                      <tr className="bg-slate-50/60">
                        <td className="py-2.5 px-4 font-semibold text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            No. WhatsApp
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-800 font-mono">
                          {studentData.studentWhatsapp}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Parameter Ujian */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                2. Spesifikasi Alokasi Ujian
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Alokasi Waktu
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {exam.durationMinutes} Menit
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Jumlah Butir Soal
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {exam._count?.questions || 0} Butir
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Passing Grade
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {exam.passingScore} Poin
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Peringatan Pengawasan & Anti-Curang */}
            <div className="p-4 rounded-lg bg-amber-50/90 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>Ketentuan Pengawasan Anti-Curang (CBT Proctoring)</span>
              </div>
              <ul className="text-xs text-amber-900/90 space-y-1.5 pl-6 list-disc leading-relaxed">
                <li>
                  Saat menekan tombol mulai, sistem akan mengaktifkan{" "}
                  <b>Mode Layar Penuh (Fullscreen)</b>.
                </li>
                <li>
                  <b>Dilarang berpindah tab atau meminimalkan browser</b>.
                  Setiap aktivitas keluar dicatat pengawas.
                </li>
                <li>
                  <b>Batas maksimal pelanggaran adalah 3 kali</b>. Pelanggaran
                  ke-3 akan menyebabkan ujian dikumpulkan otomatis!
                </li>
                <li>
                  Klik kanan, copy-paste, dan fungsi inspect element dimatikan
                  selama pengerjaan.
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              <Link
                href="/"
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 text-center transition-colors"
              >
                Koreksi Data / Token
              </Link>

              <button
                type="button"
                onClick={handleStartExam}
                disabled={starting || !studentData?.studentName}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {starting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Maximize className="w-3.5 h-3.5" />
                    <span>Mulai Pengerjaan Ujian (Fullscreen)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
