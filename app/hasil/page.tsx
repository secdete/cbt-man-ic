"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Loader2,
  XCircle,
} from "lucide-react";
import CakrawalaLogo from "@/components/CakrawalaLogo";

interface ResultRow {
  id: string;
  status: string;
  finished: boolean;
  startTime: string;
  endTime: string | null;
  totalScore: number;
  maxPossibleScore: number;
  passingScore: number;
  isPassed: boolean | null;
  accuracy: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  certificateNumber: string | null;
  exam: {
    id: string;
    token: string;
    title: string;
    category: string;
    durationMinutes: number;
  };
}

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function StudentResultsDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);
  const [student, setStudent] = useState<{ name: string; school: string | null } | null>(null);
  const [results, setResults] = useState<ResultRow[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/student/results", { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!active) return;

        if (res.status === 401) {
          setUnauthorized(true);
          return;
        }
        if (!res.ok || !json?.success) {
          setLoadError(json?.message || "Gagal memuat hasil ujian.");
          return;
        }

        setStudent(json.data.student);
        setResults(json.data.results || []);
      } catch (err) {
        console.error("Load results failed:", err);
        if (active) setLoadError("Server tidak terjangkau. Coba muat ulang halaman.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const finished = results.filter((row) => row.finished);
  const average =
    finished.length > 0
      ? Math.round(
          finished.reduce((sum, row) => sum + row.totalScore, 0) / finished.length,
        )
      : 0;
  const passed = finished.filter((row) => row.isPassed).length;

  return (
    <div className="flex-1 pb-14">
      {/* Header */}
      <section className="bg-slate-900 border-b border-slate-800 text-white px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-blue-950 border border-blue-800 text-blue-300 text-xs font-semibold">
              <Award className="w-3.5 h-3.5 text-blue-400" />
              Dashboard Hasil Peserta
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Hasil Ujian &amp; Sertifikat Saya
            </h1>
            {student && (
              <p className="text-xs sm:text-sm text-slate-300">
                {student.name}
                {student.school ? ` • ${student.school}` : ""}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 bg-slate-800/90 p-3 rounded-2xl border border-slate-700">
            <CakrawalaLogo className="h-10 w-auto" height={44} />
            <div className="border-l border-slate-700 pl-3">
              <p className="text-[11px] text-slate-400">Paket selesai</p>
              <p className="text-lg font-bold leading-tight">{finished.length}</p>
              <p className="text-[11px] text-slate-400">
                Tuntas: <span className="text-emerald-400 font-semibold">{passed}</span>
                {finished.length > 0 ? ` dari ${finished.length}` : ""}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-7 h-7 text-blue-700 animate-spin" />
            <p className="text-xs font-semibold text-slate-600">
              Memuat hasil ujian Anda...
            </p>
          </div>
        )}

        {!loading && unauthorized && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-8 text-center space-y-3">
            <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
              <ClipboardList className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              Login dulu untuk melihat hasil Anda
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Hasil, sertifikat, dan pembahasan tersimpan di akun peserta Anda. Login
              memakai username atau No. HP serta password dari kartu peserta.
            </p>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors"
            >
              Menuju Halaman Login
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {!loading && !unauthorized && loadError && (
          <div className="bg-white rounded-xl border border-rose-200 p-5 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-rose-700">
                Hasil tidak bisa dimuat
              </p>
              <p className="text-xs text-slate-500">{loadError}</p>
            </div>
          </div>
        )}

        {!loading && !unauthorized && !loadError && results.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-8 text-center space-y-3">
            <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              Belum ada ujian yang tercatat
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Setelah Anda mengerjakan paket tryout, nilai, sertifikat, dan pembahasan
              setiap soal akan muncul di halaman ini.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Beranda
            </Link>
          </div>
        )}

        {!loading && !unauthorized && !loadError && results.length > 0 && (
          <>
            {/* Ringkasan singkat */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total pengerjaan", value: results.length },
                { label: "Paket selesai", value: finished.length },
                { label: "Rata-rata nilai", value: average },
                { label: "Tuntas batas nilai", value: passed },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs px-3.5 py-3"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {item.label}
                  </p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {results.map((row) => (
                <div
                  key={row.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Identitas paket */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border ${
                            row.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : row.status === "TIMEOUT"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {row.status === "COMPLETED"
                            ? "Selesai"
                            : row.status === "TIMEOUT"
                              ? "Waktu Habis"
                              : "Sedang Berlangsung"}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          {row.exam.category}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {row.exam.title}
                      </h3>

                      <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Mulai: {formatDate(row.startTime)}
                        </span>
                        {row.endTime && <span>Selesai: {formatDate(row.endTime)}</span>}
                        <span>Durasi {row.exam.durationMinutes} menit</span>
                      </p>
                    </div>

                    {/* Nilai */}
                    <div className="flex items-center gap-4 sm:gap-5 lg:justify-end">
                      <div className="text-center">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Nilai
                        </p>
                        <p
                          className={`text-2xl font-extrabold leading-none mt-0.5 ${
                            row.finished
                              ? row.isPassed
                                ? "text-emerald-600"
                                : "text-slate-900"
                              : "text-slate-400"
                          }`}
                        >
                          {row.finished ? row.totalScore : "-"}
                          <span className="text-xs font-bold text-slate-400">
                            /{row.maxPossibleScore}
                          </span>
                        </p>
                        {row.finished && (
                          <p
                            className={`text-[11px] font-bold mt-0.5 ${
                              row.isPassed ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {row.isPassed ? "TUNTAS" : `BATAS ${row.passingScore}`}
                          </p>
                        )}
                      </div>

                      <div className="hidden sm:block w-px self-stretch bg-slate-200" />

                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        {[
                          { label: "Benar", value: row.correctCount, tone: "text-emerald-700" },
                          { label: "Salah", value: row.incorrectCount, tone: "text-rose-700" },
                          { label: "Kosong", value: row.unansweredCount, tone: "text-slate-500" },
                        ].map((stat) => (
                          <div key={stat.label}>
                            <p className={`text-sm font-bold ${stat.tone}`}>{stat.value}</p>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              {stat.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Aksi */}
                    <div className="flex flex-col items-stretch lg:items-end gap-2 lg:w-56">
                      {row.finished ? (
                        <>
                          <Link
                            href={`/exam/${encodeURIComponent(row.exam.token)}/result?sessionId=${encodeURIComponent(row.id)}`}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            Hasil, Sertifikat &amp; Pembahasan
                          </Link>
                          {row.certificateNumber && (
                            <p className="text-[11px] text-slate-500 text-center lg:text-right font-mono">
                              {row.certificateNumber}
                            </p>
                          )}
                        </>
                      ) : (
                        <Link
                          href={`/exam/${encodeURIComponent(row.exam.token)}`}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
                        >
                          <ArrowRight className="w-4 h-4" />
                          Lanjutkan Ujian
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Detail tambahan untuk yang sudah selesai */}
                  {row.finished && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Akurasi {row.accuracy}%
                      </span>
                      <span>Batas nilai kelulusan {row.passingScore}</span>
                      <span>Kode paket {row.exam.token}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2.5 p-3.5 rounded-lg border border-blue-200 bg-blue-50/70 text-xs text-blue-900">
              <AlertCircle className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Di halaman hasil Anda bisa mengunduh <b>Sertifikat PDF</b> dan{" "}
                <b>Analisa PDF</b>, melihat nilai per subtes, serta membuka pembahasan
                lengkap setiap soal beserta kunci jawabannya.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
