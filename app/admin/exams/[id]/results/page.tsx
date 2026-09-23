"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Award,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  ShieldAlert,
  Search,
  Sparkles,
  School,
  FileSpreadsheet,
  RotateCcw,
  AlertTriangle,
  Phone,
} from "lucide-react";

export default function AdminExamResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const examId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [sessionToReset, setSessionToReset] = useState<{
    id: string;
    studentName: string;
  } | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch(`/api/admin/exams/${examId}/results`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setErrorMessage(json.message || "Gagal memuat rekap nilai.");
        }
      } catch (err) {
        setErrorMessage("Gagal menghubungi server.");
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [examId]);

  const handleExportCSV = () => {
    if (!data || !data.leaderboard || data.leaderboard.length === 0) {
      alert("Belum ada data nilai peserta untuk diunduh.");
      return;
    }

    const { exam, leaderboard } = data;

    // Header Kolom CSV
    const headers = [
      "Peringkat",
      "Nama Lengkap",
      "Asal Madrasah/Sekolah",
      "No. WhatsApp",
      "Total Skor",
      "Akurasi (%)",
      "Jumlah Benar",
      "Jumlah Salah",
      "Jumlah Kosong",
      "Catatan Pindah Tab",
      "Status Kelulusan",
      "Waktu Mulai",
      "Waktu Selesai",
    ];

    // Baris Data Peserta
    const rows = leaderboard.map((item: any, idx: number) => {
      const escape = (val: any) => `"${String(val ?? "").replace(/"/g, '""')}"`;
      return [
        idx + 1,
        escape(item.studentName),
        escape(item.studentSchool || "Siswa Mandiri"),
        escape(item.studentWhatsapp || "-"),
        item.totalScore,
        `${item.accuracy}%`,
        item.correctCount,
        item.incorrectCount,
        item.unansweredCount,
        item.tabSwitchCount,
        item.isPassed ? "LULUS" : "TIDAK LULUS",
        escape(
          item.startTime
            ? new Date(item.startTime).toLocaleString("id-ID")
            : "-",
        ),
        escape(
          item.endTime ? new Date(item.endTime).toLocaleString("id-ID") : "-",
        ),
      ].join(",");
    });

    // Menggunakan UTF-8 BOM agar terbaca sempurna di Microsoft Excel
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    const safeTitle = exam.title.replace(/[^a-zA-Z0-9]/g, "_");

    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Nilai_${safeTitle}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleConfirmReset = async () => {
    if (!sessionToReset) return;
    setResetting(true);

    try {
      const res = await fetch(`/api/admin/sessions/${sessionToReset.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setData((prev: any) => {
          if (!prev) return prev;
          const updatedLeaderboard = prev.leaderboard.filter(
            (s: any) => s.id !== sessionToReset.id,
          );
          return {
            ...prev,
            leaderboard: updatedLeaderboard,
            analytics: {
              ...prev.analytics,
              totalParticipants: updatedLeaderboard.length,
            },
          };
        });
        setSessionToReset(null);
      } else {
        alert(json.message || "Gagal mereset sesi.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">
            Memuat Rekapitulasi Nilai Peserta...
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage || !data) {
    return (
      <div className="flex-1 max-w-lg mx-auto p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Gagal Memuat Rekap</h2>
        <p className="text-xs text-slate-500">{errorMessage}</p>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard Admin
        </Link>
      </div>
    );
  }

  const { exam, analytics, leaderboard } = data;

  const filteredLeaderboard = leaderboard.filter((item: any) => {
    const q = searchQuery.toLowerCase();
    return (
      item.studentName.toLowerCase().includes(q) ||
      (item.studentNisn && item.studentNisn.toLowerCase().includes(q)) ||
      (item.studentSchool && item.studentSchool.toLowerCase().includes(q)) ||
      (item.studentWhatsapp && item.studentWhatsapp.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Panel Admin
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {exam.title}
            </h1>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
              TOKEN: {exam.token}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rekap hasil pengerjaan CBT, peringkat peserta, dan analisis kelulusan passing grade
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors cursor-pointer"
            title="Unduh file spreadsheet Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Unduh Rekap Excel / CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap</span>
          </button>
        </div>
      </div>

      {/* Metric Cards - Minimalist Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Total Peserta</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            {analytics.totalParticipants}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Rata-Rata Skor</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            {analytics.averageScore}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Skor Tertinggi</span>
            <Award className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            {analytics.highestScore}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">Lulus Passing Grade</span>
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            {analytics.passedCount}{" "}
            <span className="text-xs font-normal text-slate-400 font-sans">
              ({analytics.passPercentage}%)
            </span>
          </p>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Peringkat & Hasil Peserta (Leaderboard)
            </h2>
            <p className="text-xs text-slate-500">
              Passing Grade: {exam.passingScore} Poin
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, NISN, sekolah..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {filteredLeaderboard.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            {leaderboard.length === 0
              ? "Belum ada siswa yang mengerjakan tryout ini."
              : "Tidak ditemukan peserta dengan kata kunci tersebut."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 text-center">Rank</th>
                  <th className="py-3.5 px-4">Nama Peserta</th>
                  <th className="py-3.5 px-4">Asal Sekolah</th>
                  <th className="py-3.5 px-4">No. WhatsApp</th>
                  <th className="py-3.5 px-4 text-center">Skor Akhir</th>
                  <th className="py-3.5 px-4 text-center">Akurasi</th>
                  <th className="py-3.5 px-4 text-center">
                    Benar/Salah/Kosong
                  </th>
                  <th className="py-3.5 px-4 text-center">Tab Switch</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLeaderboard.map((student: any) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-3 px-4 text-center font-mono text-xs font-medium text-slate-500">
                      #{student.rank}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900 block">{student.studentName}</span>
                      {student.studentNisn && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          NISN: {student.studentNisn}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {student.studentSchool || "-"}
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                      {student.studentWhatsapp || "-"}
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-sm font-semibold text-slate-900">
                      {student.totalScore}
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-xs text-slate-700">
                      {student.accuracy}%
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-xs text-slate-600">
                      <span className="text-emerald-700 font-medium">{student.correctCount}</span>
                      {" / "}
                      <span className="text-rose-600 font-medium">{student.incorrectCount}</span>
                      {" / "}
                      <span className="text-slate-400">{student.unansweredCount}</span>
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-xs">
                      {student.tabSwitchCount > 0 ? (
                        <span className="text-rose-600 font-medium">{student.tabSwitchCount}x</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                          student.isPassed
                            ? "bg-[#EDF3EC] text-[#346538] border border-[#d8e6d6]"
                            : "bg-[#FDEBEC] text-[#9F2F2D] border border-[#f7d6d8]"
                        }`}
                      >
                        {student.isPassed ? "Lulus" : "Tidak Lulus"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          setSessionToReset({
                            id: student.id,
                            studentName: student.studentName,
                          })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                        title={`Reset sesi ujian untuk ${student.studentName}`}
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Konfirmasi Reset Ujian Peserta */}
      {sessionToReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-sm border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150 text-center">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                Beri Kesempatan Ujian Ulang?
              </h3>
              <p className="text-xs text-slate-500">Sesi ujian atas nama:</p>
              <p className="text-xs font-mono font-medium text-slate-900 bg-slate-50 p-2 rounded border border-slate-200">
                {sessionToReset.studentName}
              </p>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 text-left leading-relaxed">
              Tindakan ini akan menghapus lembar jawaban siswa dari database sehingga siswa dapat menggunakan token ujian untuk mengerjakan kembali dari awal.
            </p>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                disabled={resetting}
                onClick={() => setSessionToReset(null)}
                className="flex-1 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={handleConfirmReset}
                className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {resetting ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <RotateCcw className="w-3 h-3" />
                    <span>Ya, Reset</span>
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
