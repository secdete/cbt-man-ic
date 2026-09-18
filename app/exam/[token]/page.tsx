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
  IdCard,
  ShieldAlert,
  FileCheck2,
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
    studentNisn: string;
    studentSchool: string;
  } | null>(null);

  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
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
          } else {
            setErrorMessage(
              `Paket ujian dengan token "${token}" tidak ditemukan.`,
            );
          }
        }
      } catch (err) {
        setErrorMessage("Gagal memuat informasi ujian.");
      } finally {
        setLoading(false);
      }
    }

    fetchExamDetails();
  }, [token]);

  const handleStartExam = async () => {
    if (!studentData?.studentName) {
      setErrorMessage(
        "Data identitas peserta tidak lengkap. Silakan kembali ke beranda.",
      );
      return;
    }

    setStarting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          studentName: studentData.studentName,
          studentNisn: studentData.studentNisn,
          studentSchool: studentData.studentSchool,
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
            Memeriksa token & naskah ujian...
          </p>
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
                  Konfirmasi Data Peserta Sebelum Memulai Ujian
                </p>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-right">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">
                Token Ujian
              </p>
              <p className="font-mono font-bold text-sm text-blue-300">
                {exam.token}
              </p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Tabel Konfirmasi Identitas Siswa */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                1. Data Identitas Peserta
              </h2>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-slate-50/60">
                      <td className="w-1/3 py-2.5 px-4 font-semibold text-slate-600">
                        Nama Lengkap
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {studentData?.studentName || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-600">
                        NISN / Nomor Ujian
                      </td>
                      <td className="py-2.5 px-4 text-slate-800">
                        {studentData?.studentNisn || "Tidak diisi"}
                      </td>
                    </tr>
                    <tr className="bg-slate-50/60">
                      <td className="py-2.5 px-4 font-semibold text-slate-600">
                        Asal Madrasah / Sekolah
                      </td>
                      <td className="py-2.5 px-4 text-slate-800">
                        {studentData?.studentSchool || "Tidak diisi"}
                      </td>
                    </tr>
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

            {/* Peringatan Pengawasan */}
            <div className="p-3.5 rounded-lg bg-amber-50/80 border border-amber-200 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-bold">Pengawasan CBT:</span> Pastikan
                koneksi internet stabil. Dilarang berpindah window atau tab
                browser. Jawaban Anda akan tersimpan otomatis secara real-time.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              <Link
                href="/"
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 text-center transition-colors"
              >
                Koreksi Data / Ganti Token
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
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Mulai Pengerjaan Ujian</span>
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
