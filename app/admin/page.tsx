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
  Trash2,
  Copy,
  Check,
  BarChart2,
  FileText,
  AlertCircle,
  LogOut,
  Calendar,
  Lock,
  Unlock,
  X,
  KeyRound,
  Sparkles,
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
  isLocked: boolean;
  openTime: string | null;
  closeTime: string | null;
  createdAt: string;
  _count: {
    questions: number;
    sessions: number;
  };
}

interface ExamKeyQuestion {
  id: string;
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string;
  correctAnswer: string;
  subject?: string;
  points: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Schedule modal states
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [schedOpenTime, setSchedOpenTime] = useState("");
  const [schedCloseTime, setSchedCloseTime] = useState("");
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Answer Key Modal states
  const [keyModalExam, setKeyModalExam] = useState<Exam | null>(null);
  const [keyQuestions, setKeyQuestions] = useState<ExamKeyQuestion[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [savingKeys, setSavingKeys] = useState(false);
  const [keyModalTab, setKeyModalTab] = useState<"GRID" | "BULK">("GRID");
  const [bulkPasteText, setBulkPasteText] = useState("");
  const [bulkParseMessage, setBulkParseMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [keySuccessToast, setKeySuccessToast] = useState<string | null>(null);

  const openAnswerKeyModal = async (exam: Exam) => {
    setKeyModalExam(exam);
    setLoadingKeys(true);
    setKeyModalTab("GRID");
    setBulkPasteText("");
    setBulkParseMessage(null);
    setKeySuccessToast(null);

    try {
      const res = await fetch(`/api/exams/${exam.id}/keys`);
      const json = await res.json();
      if (json.success && json.data?.questions) {
        setKeyQuestions(json.data.questions);
      } else {
        alert("Gagal memuat daftar butir soal.");
      }
    } catch (e) {
      console.error(e);
      alert("Gagal menghubungi server untuk memuat soal.");
    } finally {
      setLoadingKeys(false);
    }
  };

  const handleSelectKey = (questionId: string, letter: string) => {
    setKeyQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, correctAnswer: letter.toUpperCase() } : q,
      ),
    );
  };

  const handleApplyBulkPaste = () => {
    if (!bulkPasteText.trim()) {
      setBulkParseMessage({
        type: "error",
        text: "Silakan masukkan teks kunci jawaban terlebih dahulu.",
      });
      return;
    }

    const text = bulkPasteText.trim();
    const newKeys: Record<number, string> = {};

    // Format 1: Pasangan Nomor & Huruf (e.g. 1. A, 1: A, 1-A, 1 A, Soal 1 = B)
    const itemRegex =
      /(?:(?:soal|no\.?)\s*)?(\d+)\s*[\.\:\=\-\)]?\s*([A-Ea-e])\b/gi;
    let match: RegExpExecArray | null;
    let foundCount = 0;

    while ((match = itemRegex.exec(text)) !== null) {
      const num = parseInt(match[1], 10);
      const ans = match[2].toUpperCase();
      newKeys[num] = ans;
      foundCount++;
    }

    // Format 2: Deretan huruf murni tanpa nomor (misal: "ABCDEACBD...")
    if (foundCount === 0) {
      const cleanLetters = text.replace(/[\s\r\n\t,;.-]/g, "").toUpperCase();
      if (/^[A-E]+$/.test(cleanLetters)) {
        for (let i = 0; i < cleanLetters.length; i++) {
          newKeys[i + 1] = cleanLetters[i];
          foundCount++;
        }
      }
    }

    if (foundCount === 0) {
      setBulkParseMessage({
        type: "error",
        text: "Format kunci tidak dikenali. Gunakan format seperti '1. A' atau '1: B' atau deretan huruf 'ABCDE...'.",
      });
      return;
    }

    let appliedCount = 0;
    setKeyQuestions((prev) =>
      prev.map((q) => {
        if (newKeys[q.questionNumber]) {
          appliedCount++;
          return { ...q, correctAnswer: newKeys[q.questionNumber] };
        }
        return q;
      }),
    );

    setBulkParseMessage({
      type: "success",
      text: `Berhasil memetakan ${appliedCount} kunci jawaban ke butir soal! Silakan periksa di tab Grid Interaktif lalu klik Simpan Kunci Jawaban.`,
    });
  };

  const handleSaveAnswerKeys = async () => {
    if (!keyModalExam) return;
    setSavingKeys(true);
    setKeySuccessToast(null);

    try {
      const res = await fetch(`/api/exams/${keyModalExam.id}/keys`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keys: keyQuestions.map((q) => ({
            id: q.id,
            correctAnswer: q.correctAnswer,
          })),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setKeySuccessToast(
          json.message || "Kunci jawaban berhasil disimpan ke database!",
        );
        setTimeout(() => {
          setKeySuccessToast(null);
        }, 3500);
      } else {
        alert(json.message || "Gagal menyimpan kunci jawaban.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan jaringan saat menyimpan kunci jawaban.");
    } finally {
      setSavingKeys(false);
    }
  };

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

  const handleToggleStatus = async (exam: Exam) => {
    try {
      const nextActive = !exam.isActive;
      const res = await fetch(`/api/exams/${exam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      const json = await res.json();
      if (json.success) {
        setExams((prev) =>
          prev.map((e) =>
            e.id === exam.id ? { ...e, isActive: nextActive } : e,
          ),
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openScheduleModal = (exam: Exam) => {
    setEditingExam(exam);
    // Format YYYY-MM-DDTHH:mm untuk datetime-local
    if (exam.openTime) {
      setSchedOpenTime(new Date(exam.openTime).toISOString().slice(0, 16));
    } else {
      setSchedOpenTime("");
    }
    if (exam.closeTime) {
      setSchedCloseTime(new Date(exam.closeTime).toISOString().slice(0, 16));
    } else {
      setSchedCloseTime("");
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam) return;
    setSavingSchedule(true);

    try {
      const res = await fetch(`/api/exams/${editingExam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openTime: schedOpenTime
            ? new Date(schedOpenTime).toISOString()
            : null,
          closeTime: schedCloseTime
            ? new Date(schedCloseTime).toISOString()
            : null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setExams((prev) =>
          prev.map((e) =>
            e.id === editingExam.id
              ? {
                  ...e,
                  openTime: schedOpenTime
                    ? new Date(schedOpenTime).toISOString()
                    : null,
                  closeTime: schedCloseTime
                    ? new Date(schedCloseTime).toISOString()
                    : null,
                }
              : e,
          ),
        );
        setEditingExam(null);
      }
    } catch (err) {
      alert("Gagal menyimpan jadwal ujian.");
    } finally {
      setSavingSchedule(false);
    }
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
              Kelola naskah soal, atur jadwal buka-tutup ujian, salin token
              untuk siswa, dan pantau rekapitulasi nilai
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

      {/* Table of Exams with Schedule & Token Control */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Daftar Paket Ujian &amp; Kontrol Jadwal
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Token di bawah bersifat rahasia dan dapat disalin untuk dibagikan
              kepada peserta saat sesi ujian dibuka
            </p>
          </div>
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
                  <th className="py-4 px-6">Token (Salin ke Siswa)</th>
                  <th className="py-4 px-6">Status Akses</th>
                  <th className="py-4 px-6">Jadwal Pelaksanaan</th>
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
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {exam.category}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {exam.durationMinutes} Menit •{" "}
                          {exam._count?.questions || 0} Soal
                        </span>
                      </div>
                    </td>

                    {/* Token Ujian Rahasia khusus admin */}
                    <td className="py-4 px-6">
                      <button
                        type="button"
                        onClick={() => handleCopyToken(exam.token)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-mono font-bold text-xs cursor-pointer transition-colors border border-blue-200 shadow-2xs"
                        title="Klik untuk salin token dan bagikan ke siswa"
                      >
                        <span>{exam.token}</span>
                        {copiedToken === exam.token ? (
                          <span className="text-emerald-600 flex items-center gap-0.5 text-[10px]">
                            <Check className="w-3 h-3" /> Tersalin
                          </span>
                        ) : (
                          <Copy className="w-3 h-3 text-blue-600" />
                        )}
                      </button>
                    </td>

                    {/* Status Akses & Buka/Tutup Sakelar */}
                    <td className="py-4 px-6">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(exam)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                          exam.isActive
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                        }`}
                        title="Klik untuk Buka atau Tutup akses ujian"
                      >
                        {exam.isActive ? (
                          <>
                            <Unlock className="w-3 h-3 text-emerald-700" />
                            <span>DIBUKA</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-rose-700" />
                            <span>DITUTUP</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Jadwal Pelaksanaan */}
                    <td className="py-4 px-6">
                      <div className="text-xs space-y-0.5">
                        {exam.openTime || exam.closeTime ? (
                          <>
                            {exam.openTime && (
                              <p className="text-slate-700">
                                Buka:{" "}
                                <b>
                                  {new Date(exam.openTime).toLocaleDateString(
                                    "id-ID",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </b>
                              </p>
                            )}
                            {exam.closeTime && (
                              <p className="text-slate-700">
                                Tutup:{" "}
                                <b>
                                  {new Date(exam.closeTime).toLocaleDateString(
                                    "id-ID",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </b>
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 italic">
                            24 Jam (Manual)
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => openScheduleModal(exam)}
                          className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer flex items-center gap-1 pt-0.5"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Atur Jadwal</span>
                        </button>
                      </div>
                    </td>

                    <td className="py-4 px-6 font-medium text-slate-700">
                      {exam._count?.sessions || 0} Siswa
                    </td>

                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openAnswerKeyModal(exam)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs transition-colors cursor-pointer"
                        title="Kelola Kunci Jawaban Soal"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                        <span>Kunci Jawaban</span>
                      </button>

                      <Link
                        href={`/admin/exams/${exam.id}/results`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs transition-colors"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>Rekap Nilai</span>
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

      {/* Modal Pengaturan Jadwal Ujian */}
      {editingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-sm text-slate-900">
                  Atur Jadwal Pelaksanaan Ujian
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingExam(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Paket: <b>{editingExam.title}</b>
            </p>

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Waktu Buka Ujian (Mulai dapat diakses)
                </label>
                <input
                  type="datetime-local"
                  value={schedOpenTime}
                  onChange={(e) => setSchedOpenTime(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Kosongkan jika ingin dibuka secara manual via tombol status
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Waktu Tutup Ujian (Akses berakhir)
                </label>
                <input
                  type="datetime-local"
                  value={schedCloseTime}
                  onChange={(e) => setSchedCloseTime(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingExam(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingSchedule}
                  className="px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingSchedule ? "Menyimpan..." : "Simpan Jadwal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kelola Kunci Jawaban (Answer Key Manager) */}
      {keyModalExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] space-y-4 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                    <KeyRound className="w-5 h-5 text-amber-700" />
                  </span>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                    Kelola Kunci Jawaban Ujian
                  </h3>
                </div>
                <p className="text-xs text-slate-600">
                  Paket: <b className="text-slate-900">{keyModalExam.title}</b>{" "}
                  •{" "}
                  <span className="font-semibold text-blue-700">
                    {keyQuestions.length} Butir Soal
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setKeyModalExam(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Answer Distribution Badges */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-600">
                Sebaran Kunci Saat Ini:
              </span>
              <div className="flex items-center gap-2">
                {["A", "B", "C", "D", "E"].map((letter) => {
                  const count = keyQuestions.filter(
                    (q) => q.correctAnswer === letter,
                  ).length;
                  return (
                    <span
                      key={letter}
                      className={`px-2 py-0.5 rounded font-bold text-xs ${
                        count > 0
                          ? "bg-blue-100 text-blue-900 border border-blue-200"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}
                    >
                      {letter}: {count}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setKeyModalTab("GRID")}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  keyModalTab === "GRID"
                    ? "border-blue-700 text-blue-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Grid Interaktif (Pilih Kunci Soal)
              </button>
              <button
                type="button"
                onClick={() => setKeyModalTab("BULK")}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  keyModalTab === "BULK"
                    ? "border-blue-700 text-blue-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Salin-Tempel Cepat (Bulk Paste)</span>
              </button>
            </div>

            {/* Modal Body */}
            {loadingKeys ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-600">
                  Memuat lembar butir soal...
                </p>
              </div>
            ) : keyModalTab === "GRID" ? (
              /* TAB 1: GRID VIEW */
              <div className="flex-1 overflow-y-auto max-h-[50vh] pr-1 space-y-2.5">
                {keyQuestions.length === 0 ? (
                  <p className="py-12 text-center text-xs text-slate-400">
                    Tidak ada butir soal pada paket ini.
                  </p>
                ) : (
                  keyQuestions.map((q) => {
                    const optionLetters = ["A", "B", "C", "D"];
                    if (q.optionE) optionLetters.push("E");

                    return (
                      <div
                        key={q.id}
                        className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {q.questionNumber}
                          </span>
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {q.subject && (
                                <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  {q.subject}
                                </span>
                              )}
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                Kunci: {q.correctAnswer}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 truncate max-w-xl">
                              {q.questionText}
                            </p>
                          </div>
                        </div>

                        {/* Option Select Buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          {optionLetters.map((letter) => {
                            const isSelected = q.correctAnswer === letter;
                            return (
                              <button
                                key={letter}
                                type="button"
                                onClick={() => handleSelectKey(q.id, letter)}
                                className={`w-8 h-8 rounded-lg font-black text-xs transition-all cursor-pointer border ${
                                  isSelected
                                    ? "bg-emerald-600 border-emerald-700 text-white shadow-xs scale-105"
                                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                }`}
                                title={`Pilih ${letter} sebagai Kunci Jawaban Soal #${q.questionNumber}`}
                              >
                                {letter}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* TAB 2: BULK PASTE */
              <div className="flex-1 space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-700" />
                    <span>Petunjuk Salin-Tempel Cepat:</span>
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    Anda dapat menyalin daftar kunci jawaban dari dokumen atau
                    chat WhatsApp dan menempelkannya di bawah. Sistem otomatis
                    mendeteksi format:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-slate-700">
                    <div className="p-2 rounded bg-white border border-blue-200">
                      <b>Format 1 (Nomor &amp; Huruf):</b>
                      <br />
                      1. A<br />
                      2. C<br />
                      3. B (atau 1:A, 2:C...)
                    </div>
                    <div className="p-2 rounded bg-white border border-blue-200">
                      <b>Format 2 (Deretan Huruf):</b>
                      <br />
                      ACBDABCD... (otomatis memetakan mulai nomor 1)
                    </div>
                  </div>
                </div>

                <textarea
                  rows={6}
                  value={bulkPasteText}
                  onChange={(e) => setBulkPasteText(e.target.value)}
                  placeholder="Tempelkan daftar kunci jawaban di sini... Contoh:&#10;1. A&#10;2. B&#10;3. D&#10;..."
                  className="w-full p-3 rounded-xl border border-slate-300 font-mono text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />

                {bulkParseMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold border ${
                      bulkParseMessage.type === "success"
                        ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                        : "bg-rose-50 text-rose-900 border-rose-200"
                    }`}
                  >
                    {bulkParseMessage.text}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleApplyBulkPaste}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Terapkan Kunci ke Seluruh Soal</span>
                </button>
              </div>
            )}

            {/* Success Toast / Notification */}
            {keySuccessToast && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{keySuccessToast}</span>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                Total Soal: <b>{keyQuestions.length}</b>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setKeyModalExam(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Tutup
                </button>

                <button
                  type="button"
                  disabled={savingKeys || loadingKeys}
                  onClick={handleSaveAnswerKeys}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {savingKeys ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan ke Database...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Kunci Jawaban</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
