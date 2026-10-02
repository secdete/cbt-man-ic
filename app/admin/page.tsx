"use client";

import { useState, useEffect, useRef } from "react";
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
  Upload as UploadIcon,
  Download,
  LogOut,
  Calendar,
  Lock,
  Unlock,
  X,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { imageSources, stripImageMarkdown } from "@/lib/question-images";
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
  explanation?: string | null;
}

interface StudentRow {
  id: string;
  name: string;
  nisn: string | null;
  username: string | null;
  email: string | null;
  school: string | null;
  phone: string | null;
  password: string;
  createdAt: string;
  _count?: { sessions: number };
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
  const [expandedExplanationAdmin, setExpandedExplanationAdmin] = useState<
    Record<string, boolean>
  >({});

  const toJakartaInput = (value: string) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(value));
    const part = (type: string) => parts.find((item) => item.type === type)?.value || "";
    return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
  };
  const fromJakartaInput = (value: string) =>
    value ? new Date(`${value}:00+07:00`).toISOString() : null;

  const toggleAdminExplanation = (id: string) => {
    setExpandedExplanationAdmin((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdateExplanation = (questionId: string, explanation: string) => {
    setKeyQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, explanation } : q)),
    );
  };

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [studentMessage, setStudentMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [studentForm, setStudentForm] = useState({
    name: "",
    nisn: "",
    school: "",
    phone: "",
    password: "",
  });
  const [savingStudent, setSavingStudent] = useState(false);
  const [uploadingStudents, setUploadingStudents] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Status & dialog hapus peserta
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentLoadError, setStudentLoadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    ids: string[];
    names: string[];
    sessionCount: number;
  } | null>(null);
  const [deletingStudent, setDeletingStudent] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteCancelRef = useRef<HTMLButtonElement>(null);

  const loadStudents = async () => {
    setLoadingStudents(true);
    setStudentLoadError(null);
    try {
      const res = await fetch("/api/admin/students");
      const json = await res.json();
      if (res.ok && json.success) {
        setStudents(json.data || []);
      } else {
        setStudentLoadError(json.message || "Daftar peserta gagal dimuat.");
      }
    } catch (error) {
      console.error("Load students failed", error);
      setStudentLoadError("Server tidak terjangkau. Periksa koneksi lalu muat ulang.");
    } finally {
      setLoadingStudents(false);
    }
  };

  const openStudentDelete = (ids: string[]) => {
    const targets = students.filter((s) => ids.includes(s.id));
    if (targets.length === 0) return;
    setDeleteError(null);
    setDeleteTarget({
      ids: targets.map((s) => s.id),
      names: targets.map((s) => s.name),
      sessionCount: targets.reduce((sum, s) => sum + (s._count?.sessions || 0), 0),
    });
  };

  const handleDeleteStudents = async () => {
    if (!deleteTarget) return;
    setDeletingStudent(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/admin/students", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: deleteTarget.ids }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        const removed = new Set(deleteTarget.ids);
        setStudents((prev) => prev.filter((s) => !removed.has(s.id)));
        setSelectedStudentIds((prev) => prev.filter((id) => !removed.has(id)));
        setStudentMessage({ type: "success", text: json.message || "Peserta dihapus." });
        setDeleteTarget(null);
      } else {
        setDeleteError(json?.message || "Peserta gagal dihapus.");
      }
    } catch (error) {
      console.error("Delete students failed", error);
      setDeleteError("Koneksi terputus saat menghapus. Coba lagi.");
    } finally {
      setDeletingStudent(false);
    }
  };

  // Esc menutup dialog yang sedang terbuka, termasuk modal jadwal & kunci jawaban.
  useEffect(() => {
    if (!deleteTarget && !editingExam && !keyModalExam) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (deleteTarget) setDeleteTarget(null);
      else if (keyModalExam) setKeyModalExam(null);
      else setEditingExam(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteTarget, editingExam, keyModalExam]);

  useEffect(() => {
    if (deleteTarget) deleteCancelRef.current?.focus();
  }, [deleteTarget]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentMessage(null);
    setSavingStudent(true);

    try {
      const payload = {
        name: studentForm.name.trim(),
        nisn: studentForm.nisn.trim(),
        school: studentForm.school.trim(),
        phone: studentForm.phone.trim(),
        password: studentForm.password.trim(),
      };

      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setStudentForm({ name: "", nisn: "", school: "", phone: "", password: "" });
        setStudentMessage({
          type: "success",
          text: json.message || "Peserta berhasil dibuat.",
        });
        await loadStudents();
      } else {
        setStudentMessage({ type: "error", text: json.message || "Gagal membuat peserta." });
      }
    } catch (error) {
      setStudentMessage({ type: "error", text: "Terjadi kesalahan saat membuat peserta." });
    } finally {
      setSavingStudent(false);
    }
  };

  const handleStudentExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingStudents(true);
    setStudentMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/students/import", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setStudentMessage({
          type: "success",
          text: `${json.message || "Import selesai."} (${json.createdCount || 0} peserta)`,
        });
        await loadStudents();
      } else {
        setStudentMessage({ type: "error", text: json.message || "Import gagal." });
      }
    } catch (error) {
      setStudentMessage({ type: "error", text: "Gagal mengimpor file Excel peserta." });
    } finally {
      setUploadingStudents(false);
      e.target.value = "";
    }
  };

  const handleDownloadCards = () => {
    const ids = selectedStudentIds.length ? selectedStudentIds.join(",") : students.map((s) => s.id).join(",");
    if (!ids) {
      setStudentMessage({ type: "error", text: "Belum ada peserta yang bisa diunduh." });
      return;
    }

    window.open(`/api/admin/students/card-pdf?ids=${encodeURIComponent(ids)}`, "_blank");
  };

  const handleDownloadStudentExcel = () => {
    const query = selectedStudentIds.length
      ? `?ids=${encodeURIComponent(selectedStudentIds.join(","))}`
      : "";
    window.location.assign(`/api/admin/students/export${query}`);
  };

  const handleDownloadStudentTemplate = () => {
    window.location.assign("/api/admin/students/export?template=1");
  };

  const toggleSelectedStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

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
            explanation: q.explanation || null,
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
    loadStudents();
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
    if (exam.openTime) {
      setSchedOpenTime(toJakartaInput(exam.openTime));
    } else {
      setSchedOpenTime("");
    }
    if (exam.closeTime) {
      setSchedCloseTime(toJakartaInput(exam.closeTime));
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
          openTime: fromJakartaInput(schedOpenTime),
          closeTime: fromJakartaInput(schedCloseTime),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setExams((prev) =>
          prev.map((e) =>
            e.id === editingExam.id
              ? {
                  ...e,
                  openTime: json.data.openTime,
                  closeTime: json.data.closeTime,
                }
              : e,
          ),
        );
        setEditingExam(null);
      } else {
        alert(json.message || "Jadwal ujian gagal disimpan.");
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
    <div className="flex-1 py-6 sm:py-10 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <CakrawalaLogo height={40} className="h-9 sm:h-11 w-auto flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-blue-100 text-blue-800 flex-shrink-0">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
              </span>
              <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                Panel Administrator Cakrawala
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Kelola naskah soal, atur jadwal buka-tutup ujian, salin token
              untuk siswa, dan pantau rekapitulasi nilai
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            href="/admin/exams/create"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload PDF / Buat Tryout</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-xs transition-colors cursor-pointer"
            title="Keluar dari Panel Admin"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Metrics Row - Minimalist Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">
              Total Paket Tryout
            </span>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            {exams.length}
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">
              Total Butir Soal Terdaftar
            </span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            {totalQuestions}
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium text-slate-500">
              Total Peserta Mengerjakan
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            {totalSessions}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Kelola Peserta Ujian
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Buat peserta baru, impor dari Excel, unduh kartu peserta ke PDF
                A4, atau hapus peserta yang keliru.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex min-h-11 items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-1 md:min-h-0">
                <UploadIcon />
                <span>{uploadingStudents ? "Mengimpor..." : "Import Excel"}</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleStudentExcelImport}
                  className="sr-only"
                />
              </label>

              <button
                type="button"
                onClick={handleDownloadStudentTemplate}
                className="inline-flex min-h-11 items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors md:min-h-0"
              >
                Template Excel
              </button>
              <button
                type="button"
                onClick={handleDownloadCards}
                className="inline-flex min-h-11 items-center gap-2 px-3 py-2 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 transition-colors md:min-h-0"
              >
                <FileText className="w-3.5 h-3.5" />
                Download Kartu PDF
              </button>
              {selectedStudentIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => openStudentDelete(selectedStudentIds)}
                  className="inline-flex min-h-11 items-center gap-2 px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors md:min-h-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus {selectedStudentIds.length} terpilih
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleCreateStudent} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
            <div className="xl:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Peserta</label>
              <input
                type="text"
                value={studentForm.name}
                onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                placeholder="Nama siswa"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[16px] md:text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div className="xl:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Asal Sekolah</label>
              <input
                type="text"
                value={studentForm.school}
                onChange={(e) => setStudentForm({ ...studentForm, school: e.target.value })}
                placeholder="MAN / SMK / dll"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[16px] md:text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">No WhatsApp</label>
              <input
                type="tel"
                value={studentForm.phone}
                onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                placeholder="08xxxx"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[16px] md:text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Password</label>
              <input
                type="text"
                value={studentForm.password}
                onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                placeholder="kosong = otomatis"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[16px] md:text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div className="xl:col-span-6 flex justify-end">
              <button
                type="submit"
                disabled={savingStudent}
                className="inline-flex min-h-11 items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors disabled:opacity-60 md:min-h-0"
              >
                {savingStudent ? "Menyimpan..." : "Tambah Peserta"}
              </button>
            </div>
          </form>

          {studentMessage && (
            <div
              className={`rounded-lg border px-3 py-2 text-xs ${
                studentMessage.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {studentMessage.text}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">
                  <label className="inline-flex h-11 w-11 items-center justify-center cursor-pointer sm:h-6 sm:w-6">
                    <input
                      type="checkbox"
                      aria-label="Pilih semua peserta"
                      checked={students.length > 0 && selectedStudentIds.length === students.length}
                      onChange={() =>
                        setSelectedStudentIds(
                          selectedStudentIds.length === students.length ? [] : students.map((s) => s.id),
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />
                  </label>
                </th>
                <th className="py-3 px-4">Nama</th>
                <th className="py-3 px-4">NISN / Nomor</th>
                <th className="py-3 px-4">Sekolah</th>
                <th className="py-3 px-4">WhatsApp</th>
                <th className="py-3 px-4">Password</th>
                <th className="py-3 px-4">Riwayat Ujian</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingStudents ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                      Memuat daftar peserta...
                    </span>
                  </td>
                </tr>
              ) : studentLoadError ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center">
                    <p className="text-sm font-semibold text-rose-700">
                      Daftar peserta tidak bisa dimuat.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{studentLoadError}</p>
                    <button
                      type="button"
                      onClick={loadStudents}
                      className="mt-3 inline-flex min-h-11 items-center px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors md:min-h-0"
                    >
                      Coba lagi
                    </button>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center px-6">
                    <p className="text-sm font-semibold text-slate-700">
                      Belum ada peserta terdaftar.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Isi form di atas untuk satu peserta, atau impor sekaligus
                      dari file Excel panitia.
                    </p>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <label className="inline-flex h-11 w-11 items-center justify-center cursor-pointer sm:h-6 sm:w-6">
                        <input
                          type="checkbox"
                          aria-label={`Pilih ${student.name}`}
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => toggleSelectedStudent(student.id)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                      </label>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{student.name}</td>
                    <td className="py-3 px-4">{student.nisn || "-"}</td>
                    <td className="py-3 px-4">{student.school || "-"}</td>
                    <td className="py-3 px-4">{student.phone || "-"}</td>
                    <td className="py-3 px-4 font-mono text-xs">{student.password || "-"}</td>
                    <td className="py-3 px-4">
                      {student._count?.sessions ? (
                        <span className="inline-flex items-center whitespace-nowrap text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          {student._count.sessions} sesi tercatat
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          Belum ujian
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openStudentDelete([student.id])}
                        aria-label={`Hapus peserta ${student.name}`}
                        className="inline-flex min-h-11 items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-white text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors sm:min-h-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table of Exams with Schedule & Token Control */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Daftar Paket Ujian &amp; Kontrol Jadwal
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Token di bawah bersifat rahasia dan dapat disalin untuk dibagikan
              kepada peserta saat sesi ujian dibuka
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 flex-shrink-0">
            {exams.length} Paket Terdaftar
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            Memuat daftar ujian...
          </div>
        ) : exams.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              Belum ada paket ujian yang dibuat.
            </p>
            <p className="text-xs text-slate-500">
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
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-xs cursor-pointer transition-colors border border-slate-200"
                        title="Klik untuk salin token dan bagikan ke siswa"
                      >
                        <span>{exam.token}</span>
                        {copiedToken === exam.token ? (
                          <span className="text-[#346538] flex items-center gap-0.5 text-[10px]">
                            <Check className="w-3 h-3" /> Tersalin
                          </span>
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                    </td>

                    {/* Status Akses & Buka/Tutup Sakelar */}
                    <td className="py-4 px-6">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(exam)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
                          exam.isActive
                            ? "bg-[#EDF3EC] text-[#346538] border-[#D5E3D4] hover:bg-[#E3EBE2]"
                            : "bg-[#FDEBEC] text-[#9F2F2D] border-[#F5CDCF] hover:bg-[#F9DCDD]"
                        }`}
                        title="Klik untuk Buka atau Tutup akses ujian"
                      >
                        {exam.isActive ? (
                          <>
                            <Unlock className="w-3 h-3 text-[#346538]" />
                            <span>DIBUKA</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-[#9F2F2D]" />
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
                                      timeZone: "Asia/Jakarta",
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
                                      timeZone: "Asia/Jakarta",
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
                          <span className="text-slate-500 italic">
                            24 Jam (Manual)
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => openScheduleModal(exam)}
                          className="text-[11px] font-medium text-slate-600 hover:text-slate-900 underline cursor-pointer flex items-center gap-1 pt-0.5"
                        >
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Atur Jadwal</span>
                        </button>
                      </div>
                    </td>

                    <td className="py-4 px-6 font-medium text-slate-700">
                      {exam._count?.sessions || 0} Siswa
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openAnswerKeyModal(exam)}
                          className="inline-flex min-h-11 md:min-h-0 items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-xs transition-colors cursor-pointer"
                          title="Kelola Kunci Jawaban Soal"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                          <span>Kunci Jawaban</span>
                        </button>

                        <Link
                          href={`/admin/exams/${exam.id}/monitoring`}
                          className="inline-flex min-h-11 md:min-h-0 items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition-colors shadow-2xs"
                          title="Pantau Peserta Ujian Real-Time (Live Proctoring)"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                          <span>Live Monitor</span>
                        </Link>

                        <Link
                          href={`/admin/exams/${exam.id}/results`}
                          className="inline-flex min-h-11 md:min-h-0 items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors"
                        >
                          <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Rekap Nilai</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDeleteExam(exam.id, exam.title)}
                          className="inline-flex min-h-11 md:min-h-0 items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Ujian"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
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
            <p className="text-[11px] text-slate-500">Jadwal memakai zona waktu WIB (UTC+7), dengan tanggal mulai dan kedaluwarsa yang pasti.</p>

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Waktu Buka Ujian (Mulai dapat diakses)
                </label>
                <input
                  type="datetime-local"
                  value={schedOpenTime}
                  onChange={(e) => setSchedOpenTime(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-[16px] md:text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                />
                <p className="text-[10px] text-slate-500 mt-1">
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
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-[16px] md:text-xs text-slate-800 focus:outline-none focus:border-blue-600"
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
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-2.5 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] space-y-3 sm:space-y-4 animate-in fade-in zoom-in duration-150">
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
                          : "bg-slate-100 text-slate-600 border border-slate-200"
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
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  keyModalTab === "GRID"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Grid Interaktif
              </button>
              <button
                type="button"
                onClick={() => setKeyModalTab("BULK")}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  keyModalTab === "BULK"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>Salin-Tempel Kunci (Bulk Paste)</span>
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
                  <p className="py-12 text-center text-xs text-slate-500">
                    Tidak ada butir soal pada paket ini.
                  </p>
                ) : (
                  keyQuestions.map((q) => {
                    const optionLetters = ["A", "B", "C", "D"];
                    if (q.optionE) optionLetters.push("E");

                    return (
                      <div
                        key={q.id}
                        className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-2.5 shadow-2xs"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                                {q.explanation && (
                                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                    Ada Pembahasan
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-700 truncate max-w-xl">
                                {stripImageMarkdown(q.questionText) ||
                                  "Butir ini hanya berisi gambar, lihat pratinjaunya di bawah."}
                              </p>
                              {imageSources(q.questionText).length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  {imageSources(q.questionText).map((src, imgIndex) => (
                                    <img
                                      key={imgIndex}
                                      src={src}
                                      alt={`Gambar soal #${q.questionNumber} (${imgIndex + 1})`}
                                      className="h-14 w-14 rounded-lg border border-slate-200 bg-white object-contain p-0.5"
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Option Select Buttons & Toggle Pembahasan */}
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <div className="flex items-center gap-1">
                              {optionLetters.map((letter) => {
                                const isSelected = q.correctAnswer === letter;
                                return (
                                  <button
                                    key={letter}
                                    type="button"
                                    onClick={() => handleSelectKey(q.id, letter)}
                                    className={`w-7 h-7 rounded-lg font-bold text-xs transition-colors cursor-pointer border ${
                                      isSelected
                                        ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                                    }`}
                                    title={`Pilih ${letter} sebagai Kunci Jawaban Soal #${q.questionNumber}`}
                                  >
                                    {letter}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleAdminExplanation(q.id)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                                expandedExplanationAdmin[q.id]
                                  ? "bg-blue-50 text-blue-900 border-blue-300"
                                  : q.explanation
                                    ? "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              }`}
                              title="Tulis atau edit pembahasan untuk soal ini"
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>{q.explanation ? "Pembahasan" : "+ Bahas"}</span>
                            </button>
                          </div>
                        </div>

                        {/* Expandable Textarea Pembahasan */}
                        {expandedExplanationAdmin[q.id] && (
                          <div className="pt-2 border-t border-slate-100 space-y-1.5 animate-in fade-in duration-150">
                            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                              <span>Pembahasan &amp; Trik Cepat Soal #{q.questionNumber}:</span>
                            </label>
                            <textarea
                              rows={3}
                              value={q.explanation || ""}
                              onChange={(e) => handleUpdateExplanation(q.id, e.target.value)}
                              placeholder="Tuliskan langkah penyelesaian rinci, rumus cepat, atau trik eliminasi pilihan untuk soal ini..."
                              className="w-full p-2.5 rounded-lg border border-slate-300 text-[16px] md:text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-slate-50/50"
                            />
                          </div>
                        )}
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
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-slate-300" />
                  <span>Terapkan Kunci ke Seluruh Soal</span>
                </button>
              </div>
            )}

            {/* Success Toast / Notification */}
            {keySuccessToast && (
              <div className="p-3 rounded-lg bg-[#EDF3EC] border border-[#D5E3D4] text-[#346538] text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                <Check className="w-4 h-4 text-[#346538]" />
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
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Tutup
                </button>

                <button
                  type="button"
                  disabled={savingKeys || loadingKeys}
                  onClick={handleSaveAnswerKeys}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
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
      {/* Dialog konfirmasi hapus peserta */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setDeleteTarget(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="hapus-peserta-judul"
            onKeyDown={(event) => {
              if (event.key !== "Tab") return;
              const nodes = Array.from(
                event.currentTarget.querySelectorAll<HTMLElement>(
                  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
                ),
              ).filter((node) => !node.hasAttribute("disabled"));
              if (nodes.length === 0) return;
              const first = nodes[0];
              const last = nodes[nodes.length - 1];
              if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
              } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
              }
            }}
            className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-start gap-2.5">
                <span className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </span>
                <div>
                  <h3
                    id="hapus-peserta-judul"
                    className="font-bold text-sm text-slate-900"
                  >
                    {deleteTarget.ids.length === 1
                      ? "Hapus peserta ini?"
                      : `Hapus ${deleteTarget.ids.length} peserta?`}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tindakan ini tidak bisa dibatalkan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                aria-label="Tutup dialog hapus peserta"
                className="p-2 rounded text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ul className="space-y-1 text-xs text-slate-700 max-h-32 overflow-y-auto pr-1">
              {deleteTarget.names.slice(0, 6).map((name, index) => (
                <li key={`${name}-${index}`} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                  <span className="truncate">{name}</span>
                </li>
              ))}
              {deleteTarget.names.length > 6 && (
                <li className="text-slate-500 pl-3.5">
                  + {deleteTarget.names.length - 6} nama lainnya
                </li>
              )}
            </ul>

            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                Akun dan kata sandinya dihapus permanen, sehingga peserta{" "}
                <b>tidak bisa login lagi</b> sampai panitia membuat akun baru.
              </p>
              {deleteTarget.sessionCount > 0 && (
                <p className="p-2.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-900">
                  <b>{deleteTarget.sessionCount} sesi ujian</b> sudah tercatat atas
                  nama ini. Nilai, sertifikat, dan analisa tetap tersimpan di
                  laporan hasil.
                </p>
              )}
              {deleteError && (
                <p className="p-2.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700">
                  {deleteError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                ref={deleteCancelRef}
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 min-h-11 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors md:min-h-0"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteStudents}
                disabled={deletingStudent}
                className="px-4 py-2 min-h-11 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold transition-colors disabled:opacity-60 md:min-h-0"
              >
                {deletingStudent ? "Menghapus..." : "Hapus permanen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
