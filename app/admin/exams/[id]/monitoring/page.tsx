"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  ShieldAlert,
  Search,
  RotateCcw,
  AlertTriangle,
  BarChart2,
  Radio,
  RefreshCw,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";

interface MonitoringSession {
  id: string;
  studentName: string;
  studentNisn: string | null;
  studentSchool: string;
  studentWhatsapp: string | null;
  status: "IN_PROGRESS" | "COMPLETED";
  startTime: string;
  endTime: string | null;
  updatedAt: string;
  answeredCount: number;
  totalQuestions: number;
  progressPercent: number;
  elapsedMinutes: number;
  remainingMinutes: number;
  isTimeUp: boolean;
  isLiveActive: boolean;
  tabSwitchCount: number;
  totalScore: number;
  accuracy: number;
}

interface MonitoringData {
  exam: {
    id: string;
    title: string;
    token: string;
    category: string;
    durationMinutes: number;
    passingScore: number;
    totalQuestions: number;
  };
  stats: {
    totalParticipants: number;
    activeCount: number;
    completedCount: number;
    violationCount: number;
  };
  sessions: MonitoringSession[];
  serverTime: string;
}

export default function AdminLiveMonitoringPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const examId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MonitoringData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "VIOLATION" | "COMPLETED"
  >("ALL");

  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(5000);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const [actionTarget, setActionTarget] = useState<{
    session: MonitoringSession;
    type: "FORCE_SUBMIT" | "RESET_VIOLATIONS" | "RESET_SESSION";
  } | null>(null);
  const [executingAction, setExecutingAction] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchMonitoringData = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setIsRefreshing(true);
      try {
        const res = await fetch(`/api/admin/exams/${examId}/monitoring`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          setLastRefreshedAt(new Date());
        } else {
          setErrorMessage(json.message || "Gagal memuat data live monitoring.");
        }
      } catch {
        setErrorMessage("Gagal menghubungi server live monitoring.");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [examId],
  );

  useEffect(() => {
    fetchMonitoringData();
  }, [fetchMonitoringData]);

  useEffect(() => {
    if (autoRefreshInterval <= 0) return;

    const timer = setInterval(() => {
      fetchMonitoringData(true);
    }, autoRefreshInterval);

    return () => clearInterval(timer);
  }, [autoRefreshInterval, fetchMonitoringData]);

  const handleExecuteAction = async () => {
    if (!actionTarget) return;
    setExecutingAction(true);

    try {
      const res = await fetch(`/api/admin/exams/${examId}/monitoring`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionTarget.type,
          sessionId: actionTarget.session.id,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToastMessage(json.message);
        setTimeout(() => setToastMessage(null), 4000);
        setActionTarget(null);
        await fetchMonitoringData(true);
      } else {
        alert(json.message || "Gagal memproses aksi pengawasan.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setExecutingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-700">
            Menghubungkan ke Ruang Live Proctoring...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">
          Gagal Memuat Sesi Ujian
        </h2>
        <p className="text-xs text-slate-600">{errorMessage}</p>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Panel Admin</span>
        </Link>
      </div>
    );
  }

  const { exam, stats, sessions } = data;

  const filteredSessions = sessions.filter((s) => {
    if (statusFilter === "ACTIVE" && s.status !== "IN_PROGRESS") return false;
    if (statusFilter === "COMPLETED" && s.status !== "COMPLETED") return false;
    if (statusFilter === "VIOLATION" && s.tabSwitchCount === 0) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.studentName.toLowerCase().includes(q) ||
      (s.studentNisn || "").toLowerCase().includes(q) ||
      (s.studentSchool || "").toLowerCase().includes(q) ||
      (s.studentWhatsapp || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 py-6 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 p-3.5 rounded-xl bg-emerald-900 text-white text-xs font-medium shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            title="Kembali ke Dashboard Admin"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                Live Proctoring Monitor
              </span>
              <span className="text-[11px] font-mono px-2 py-0.2 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                Token: {exam.token}
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
              {exam.title}
            </h1>
            <p className="text-xs text-slate-500">
              {exam.category} • Durasi {exam.durationMinutes} Menit • {exam.totalQuestions} Butir Soal
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1 text-xs">
            <Radio className="w-3.5 h-3.5 text-emerald-600 ml-1.5 animate-pulse" />
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer pr-1 text-xs"
            >
              <option value={3000}>Refresh 3 Detik</option>
              <option value={5000}>Refresh 5 Detik</option>
              <option value={10000}>Refresh 10 Detik</option>
              <option value={0}>Manual (Jeda)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => fetchMonitoringData(false)}
            disabled={isRefreshing}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
            title="Refresh data sekarang"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-600 ${
                isRefreshing ? "animate-spin text-emerald-600" : ""
              }`}
            />
            <span className="hidden sm:inline">Perbarui</span>
          </button>

          <Link
            href={`/admin/exams/${exam.id}/results`}
            className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Rekap Nilai</span>
          </Link>
        </div>
      </div>

      {/* Bento Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-4 rounded-xl border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Sedang Mengerjakan
            </span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono">
            {stats.activeCount}
            <span className="text-xs font-normal text-emerald-700 ml-1.5">
              Siswa Aktif
            </span>
          </p>
          <p className="text-[11px] text-emerald-700 mt-1">
            Live di ruang ujian saat ini
          </p>
        </div>

        <div
          className={`p-4 rounded-xl border shadow-2xs ${
            stats.violationCount > 0
              ? "bg-rose-50/80 border-rose-200 text-rose-950"
              : "bg-white border-slate-200 text-slate-900"
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Peringatan Pindah Tab
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono">
            {stats.violationCount}
            <span className="text-xs font-normal text-slate-500 ml-1.5">
              Peserta
            </span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Terdeteksi membuka aplikasi lain
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Selesai Ujian
            </span>
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {stats.completedCount}
            <span className="text-xs font-normal text-slate-500 ml-1.5">
              Siswa
            </span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Sudah mengumpulkan jawaban
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Partisipasi
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {stats.totalParticipants}
            <span className="text-xs font-normal text-slate-500 ml-1.5">
              Akun
            </span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Sinkron: {lastRefreshedAt.toLocaleTimeString("id-ID")}
          </p>
        </div>
      </div>

      {/* Filter and Real-Time Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden space-y-4">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`whitespace-nowrap px-3 py-1.5 rounded-md cursor-pointer font-semibold transition-colors ${
                statusFilter === "ALL"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua ({sessions.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ACTIVE")}
              className={`whitespace-nowrap px-3 py-1.5 rounded-md cursor-pointer font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === "ACTIVE"
                  ? "bg-white text-emerald-800 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Sedang Ujian ({stats.activeCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("VIOLATION")}
              className={`whitespace-nowrap px-3 py-1.5 rounded-md cursor-pointer font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === "VIOLATION"
                  ? "bg-white text-rose-800 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Pelanggaran ({stats.violationCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("COMPLETED")}
              className={`whitespace-nowrap px-3 py-1.5 rounded-md cursor-pointer font-semibold transition-colors ${
                statusFilter === "COMPLETED"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Selesai ({stats.completedCount})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, no. HP, sekolah..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Live Proctoring Table */}
        <div className="overflow-x-auto">
          {filteredSessions.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">
                Tidak ada peserta pada filter ini.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Identitas Peserta</th>
                  <th className="py-3 px-4 sm:px-6">Status Pengerjaan</th>
                  <th className="py-3 px-4 sm:px-6">Progress Soal</th>
                  <th className="py-3 px-4 sm:px-6">Sisa Waktu</th>
                  <th className="py-3 px-4 sm:px-6">Anti-Curang (Tab)</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Aksi Pengawas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.map((session) => {
                  const isDanger = session.tabSwitchCount >= 3;

                  return (
                    <tr
                      key={session.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isDanger
                          ? "bg-rose-50/30"
                          : session.status === "IN_PROGRESS"
                            ? "bg-emerald-50/15"
                            : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {session.studentName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {session.studentNisn && `NISN: ${session.studentNisn} • `}
                          <span>{session.studentSchool}</span>
                        </div>
                        {session.studentWhatsapp && session.studentWhatsapp !== "-" && (
                          <a
                            href={`https://wa.me/${session.studentWhatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                              `Halo ${session.studentName}, kami dari Panitia CBT ${exam.title}.`,
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold mt-1"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>{session.studentWhatsapp}</span>
                          </a>
                        )}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6">
                        {session.status === "IN_PROGRESS" ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              Mengerjakan
                            </span>
                            <p className="text-[10px] text-slate-400">
                              {session.isLiveActive ? (
                                <span className="text-emerald-600 font-semibold">● Aktif respon</span>
                              ) : (
                                <span>Sedang berpikir</span>
                              )}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              <CheckCircle2 className="w-3 h-3 text-slate-500" />
                              Selesai
                            </span>
                            <p className="text-[10px] text-slate-400">
                              Skor: <b className="text-slate-800">{session.totalScore}</b> ({session.accuracy}%)
                            </p>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 min-w-[150px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800">
                              {session.answeredCount} / {session.totalQuestions} Soal
                            </span>
                            <span className="text-slate-500 font-mono">
                              {session.progressPercent}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 rounded-full ${
                                session.status === "COMPLETED"
                                  ? "bg-slate-700"
                                  : session.progressPercent > 70
                                    ? "bg-emerald-600"
                                    : "bg-blue-600"
                              }`}
                              style={{ width: `${session.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6">
                        {session.status === "IN_PROGRESS" ? (
                          <div className="space-y-0.5">
                            <p
                              className={`font-bold font-mono text-xs ${
                                session.isTimeUp
                                  ? "text-rose-700"
                                  : session.remainingMinutes <= 10
                                    ? "text-amber-700"
                                    : "text-slate-900"
                              }`}
                            >
                              {session.isTimeUp
                                ? "WAKTU HABIS"
                                : `${session.remainingMinutes} Menit Tersisa`}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Berjalan: {session.elapsedMinutes}m
                            </p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400">
                            {session.endTime
                              ? new Date(session.endTime).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6">
                        {session.tabSwitchCount === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Aman (0x)
                          </span>
                        ) : isDanger ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                              <ShieldAlert className="w-3 h-3" />
                              Bahaya ({session.tabSwitchCount}x Pindah)
                            </span>
                            <p className="text-[9px] text-rose-600 font-semibold">
                              Diduga membuka tab/aplikasi
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            Peringatan ({session.tabSwitchCount}x)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {session.status === "IN_PROGRESS" && (
                            <button
                              type="button"
                              onClick={() =>
                                setActionTarget({
                                  session,
                                  type: "FORCE_SUBMIT",
                                })
                              }
                              className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] transition-colors cursor-pointer shadow-2xs"
                              title="Paksa kumpulkan lembar jawaban siswa sekarang"
                            >
                              Paksa Selesai
                            </button>
                          )}

                          {session.tabSwitchCount > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setActionTarget({
                                  session,
                                  type: "RESET_VIOLATIONS",
                                })
                              }
                              className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
                              title="Reset catatan pelanggaran pindah tab siswa menjadi 0"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setActionTarget({
                                session,
                                type: "RESET_SESSION",
                              })
                            }
                            className="px-2 py-1 rounded-md text-rose-700 hover:bg-rose-50 border border-rose-200 font-semibold text-[11px] transition-colors cursor-pointer"
                            title="Reset sesi (Siswa mengulang dari awal)"
                          >
                            Reset Ulang
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl flex-shrink-0 ${
                  actionTarget.type === "FORCE_SUBMIT"
                    ? "bg-amber-100 text-amber-800"
                    : actionTarget.type === "RESET_SESSION"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-blue-100 text-blue-800"
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  {actionTarget.type === "FORCE_SUBMIT" && "Paksa Kumpulkan Jawaban Siswa?"}
                  {actionTarget.type === "RESET_VIOLATIONS" && "Reset Pelanggaran Tab Siswa?"}
                  {actionTarget.type === "RESET_SESSION" && "Reset Total Sesi Ujian Siswa?"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Peserta: <b>{actionTarget.session.studentName}</b> ({actionTarget.session.studentSchool})
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 leading-relaxed border border-slate-200">
              {actionTarget.type === "FORCE_SUBMIT" && (
                <span>
                  Sistem akan mengunci seluruh jawaban peserta saat ini ({actionTarget.session.answeredCount} soal terjawab) dan langsung menghitung nilai akhir secara resmi. Siswa tidak dapat melanjutkan mengerjakan lagi.
                </span>
              )}
              {actionTarget.type === "RESET_VIOLATIONS" && (
                <span>
                  Catatan pelanggaran pindah tab ({actionTarget.session.tabSwitchCount}x) akan diatur ulang menjadi 0. Gunakan ini jika siswa mengalami gangguan teknis yang terbukti wajar.
                </span>
              )}
              {actionTarget.type === "RESET_SESSION" && (
                <span>
                  Seluruh lembar jawaban dan sesi saat ini akan <b>dihapus bersih</b>. Siswa dapat memasukkan token ujian kembali dan mengerjakan soal dari butir awal.
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActionTarget(null)}
                disabled={executingAction}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={executingAction}
                className={`px-4 py-2 rounded-lg text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  actionTarget.type === "RESET_SESSION"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : actionTarget.type === "FORCE_SUBMIT"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {executingAction ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Konfirmasi &amp; Eksekusi</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
