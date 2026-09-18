"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Plus,
  BookOpen,
  Users,
  Award,
  Clock,
  ExternalLink,
  Trash2,
  Copy,
  Check,
  BarChart2,
  FileText,
  AlertCircle,
  LogOut,
} from "lucide-react";
import CakrawalaLogo from "@/components/CakrawalaLogo";

interface Exam {
  id: string;
  title: string;
  description: string | null;
  category: string;
  durationMinutes: number;
  token: string;
  passingScore: number;
  isActive: boolean;
  createdAt: string;
  _count: {
    questions: number;
    sessions: number;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const loadExams = async () => {
    try {
      const res = await fetch("/api/exams");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setExams(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleDeleteExam = async (id: string, title: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus paket tryout "${title}"? Seluruh butir soal dan data sesi siswa akan terhapus permanen.`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/exams/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setExams((prev) => prev.filter((e) => e.id !== id));
      } else {
        alert(json.message || "Gagal menghapus ujian");
      }
    } catch (err) {
      alert("Gagal menghapus paket ujian");
    }
  };

  const totalQuestions = exams.reduce(
    (acc, e) => acc + (e._count?.questions || 0),
    0,
  );
  const totalSessions = exams.reduce(
    (acc, e) => acc + (e._count?.sessions || 0),
    0,
  );

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <CakrawalaLogo height={44} className="h-11 w-auto" />
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-blue-100 text-blue-800">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                Panel Administrator Cakrawala
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Kelola naskah soal, upload dokumen PDF, atur token, dan pantau
              rekapitulasi nilai siswa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/exams/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload PDF / Buat Tryout</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-xs transition-colors cursor-pointer"
            title="Keluar dari Panel Admin"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">
              Total Paket Tryout
            </p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {exams.length}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">
              Total Butir Soal Terdaftar
            </p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {totalQuestions}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">
              Total Peserta Mengerjakan
            </p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {totalSessions}
            </p>
          </div>
        </div>
      </div>

      {/* Table of Exams */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Daftar Paket Ujian Aktif
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            {exams.length} Paket Terdaftar
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Memuat daftar ujian...
          </div>
        ) : exams.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              Belum ada paket ujian yang dibuat.
            </p>
            <p className="text-xs text-slate-400">
              Klik tombol "Upload PDF / Buat Tryout" di atas untuk memulai.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-4 px-6">Nama Tryout</th>
                  <th className="py-4 px-6">Token Ujian</th>
                  <th className="py-4 px-6">Durasi</th>
                  <th className="py-4 px-6">Butir Soal</th>
                  <th className="py-4 px-6">Peserta</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.map((exam) => (
                  <tr
                    key={exam.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">
                        {exam.title}
                      </div>
                      <span className="inline-block mt-0.5 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {exam.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        type="button"
                        onClick={() => handleCopyToken(exam.token)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold text-xs cursor-pointer transition-colors"
                        title="Klik untuk salin token"
                      >
                        <span>{exam.token}</span>
                        {copiedToken === exam.token ? (
                          <Check className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-700">
                      {exam.durationMinutes} Menit
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-700">
                      {exam._count?.questions || 0} Soal
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-700">
                      {exam._count?.sessions || 0} Siswa
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <Link
                        href={`/admin/exams/${exam.id}/results`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs transition-colors"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>Rekap & Ranking</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDeleteExam(exam.id, exam.title)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus Ujian"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
