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
      (item.studentSchool && item.studentSchool.toLowerCase().includes(q))
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
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {exam.title}
            </h1>
            <span className="font-mono text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-md">
              TOKEN: {exam.token}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Rekap hasil pengerjaan CBT, peringkat siswa, dan analisis kelulusan
            passing grade
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak / Ekspor Rekap</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">
              Total Peserta Ujian
            </p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {analytics.totalParticipants}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Rata-Rata Skor</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {analytics.averageScore}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Skor Tertinggi</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {analytics.highestScore}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">
              Lulus Passing Grade
            </p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {analytics.passedCount}{" "}
              <span className="text-xs font-normal text-slate-400">
                ({analytics.passPercentage}%)
              </span>
            </p>
          </div>
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
                  <th className="py-3.5 px-4 text-center">Skor Akhir</th>
                  <th className="py-3.5 px-4 text-center">Akurasi</th>
                  <th className="py-3.5 px-4 text-center">
                    Benar/Salah/Kosong
                  </th>
                  <th className="py-3.5 px-4 text-center">Tab Switch</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLeaderboard.map((student: any) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-center font-extrabold text-slate-800">
                      {student.rank === 1 ? (
                        <span className="inline-block p-1 rounded-md bg-amber-100 text-amber-800">
                          🥇 #1
                        </span>
                      ) : student.rank === 2 ? (
                        <span className="inline-block p-1 rounded-md bg-slate-200 text-slate-700">
                          🥈 #2
                        </span>
                      ) : student.rank === 3 ? (
                        <span className="inline-block p-1 rounded-md bg-amber-50 text-amber-700">
                          🥉 #3
                        </span>
                      ) : (
                        `#${student.rank}`
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{student.studentName}</div>
                      {student.studentNisn && (
                        <span className="text-[10px] font-normal text-slate-400">
                          NISN: {student.studentNisn}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {student.studentSchool || "-"}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="text-base font-black text-slate-900">
                        {student.totalScore}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-blue-800">
                      {student.accuracy}%
                    </td>

                    <td className="py-3.5 px-4 text-center font-medium">
                      <span className="text-blue-600 font-bold">
                        {student.correctCount}
                      </span>{" "}
                      /{" "}
                      <span className="text-rose-600 font-bold">
                        {student.incorrectCount}
                      </span>{" "}
                      /{" "}
                      <span className="text-slate-400">
                        {student.unansweredCount}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {student.tabSwitchCount > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                          <ShieldAlert className="w-3 h-3" />
                          {student.tabSwitchCount}x
                        </span>
                      ) : (
                        <span className="text-blue-600 font-bold">0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                          student.isPassed
                            ? "bg-blue-100 text-blue-800 border border-blue-300"
                            : "bg-rose-100 text-rose-800 border border-rose-300"
                        }`}
                      >
                        {student.isPassed ? "LULUS" : "TIDAK LULUS"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
