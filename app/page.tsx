"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Clock,
  HelpCircle,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  User,
  School,
  IdCard,
  FileCheck2,
  Info,
} from "lucide-react";
import CakrawalaLogo from "@/components/CakrawalaLogo";

interface ExamItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  durationMinutes: number;
  token: string;
  passingScore: number;
  _count: {
    questions: number;
    sessions: number;
  };
}

export default function StudentHomePage() {
  const router = useRouter();

  const [token, setToken] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentNisn, setStudentNisn] = useState("");
  const [studentSchool, setStudentSchool] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [activeExams, setActiveExams] = useState<ExamItem[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);

  useEffect(() => {
    async function loadExams() {
      try {
        const res = await fetch("/api/exams");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setActiveExams(json.data.filter((e: any) => e.isActive));
        }
      } catch (err) {
        console.error("Failed to load exams:", err);
      } finally {
        setLoadingExams(false);
      }
    }
    loadExams();
  }, []);

  const handleStartExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!token.trim()) {
      setErrorMessage("Silakan masukkan Token Ujian.");
      return;
    }

    if (!studentName.trim()) {
      setErrorMessage("Silakan masukkan Nama Lengkap Anda.");
      return;
    }

    setLoading(true);

    try {
      const studentPayload = {
        token: token.trim().toUpperCase(),
        studentName: studentName.trim(),
        studentNisn: studentNisn.trim(),
        studentSchool: studentSchool.trim(),
      };
      sessionStorage.setItem(
        "cbt_student_data",
        JSON.stringify(studentPayload),
      );

      router.push(`/exam/${encodeURIComponent(token.trim().toUpperCase())}`);
    } catch (err: any) {
      setErrorMessage(err?.message || "Terjadi kesalahan saat memulai ujian.");
      setLoading(false);
    }
  };

  const handleSelectToken = (selectedToken: string) => {
    setToken(selectedToken);
    window.scrollTo({ top: 100, behavior: "smooth" });
  };

  return (
    <div className="flex-1 pb-16">
      {/* Top Banner - Clean Institutional Style */}
      <section className="bg-slate-900 border-b border-slate-800 text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-blue-950 border border-blue-800 text-blue-300 text-xs font-semibold">
              <span>Sistem Ujian Berbasis Komputer (CBT)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Simulasi Seleksi Nasional Peserta Didik Baru (SNPDB)
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
              Madrasah Aliyah Negeri Insan Cendekia (MAN IC) • Didukung oleh
              Cakrawala
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <CakrawalaLogo className="h-12 w-auto" height={48} />
            <div className="text-left border-l border-slate-700 pl-3">
              <p className="text-xs font-bold text-slate-200">
                Cakrawala Learning
              </p>
              <p className="text-[11px] text-slate-400">Portal Ujian Terpadu</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Card Form Masuk Ujian (Left Column - 7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl shadow-xs border border-slate-200 p-6 sm:p-7">
            <div className="pb-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Masuk Ruang Ujian
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Isi identitas peserta dan token yang telah diberikan
                </p>
              </div>
              <span className="p-2 rounded-lg bg-blue-50 text-blue-700">
                <KeyRound className="w-5 h-5" />
              </span>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleStartExam} className="mt-5 space-y-4">
              {/* Token Ujian */}
              <div>
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
                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                    placeholder="Masukkan token (contoh: MANIC2025)"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-sm text-slate-900 placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Pilih dari daftar paket di sebelah kanan jika tersedia.
                </p>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Peserta <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Ketik nama lengkap sesuai berkas pendaftaran"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>
              </div>

              {/* NISN & Asal Sekolah */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NISN / Nomor Ujian
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <IdCard className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={studentNisn}
                      onChange={(e) => setStudentNisn(e.target.value)}
                      placeholder="Contoh: 0081234567"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Asal Madrasah / Sekolah
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <School className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={studentSchool}
                      onChange={(e) => setStudentSchool(e.target.value)}
                      placeholder="Contoh: MTsN 1 / SMPN 1"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Konfirmasi & Mulai Ujian</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Daftar Paket Tryout & Petunjuk (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Paket Tryout Tersedia */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-blue-700" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Paket Ujian Aktif
                  </h3>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-600">
                  {activeExams.length} Paket
                </span>
              </div>

              <div className="mt-3.5 space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {loadingExams ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    Memuat daftar paket...
                  </div>
                ) : activeExams.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    Belum ada paket ujian aktif saat ini.
                  </div>
                ) : (
                  activeExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-xs text-slate-900">
                            {exam.title}
                          </h4>
                          <span className="inline-block mt-0.5 text-[10px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                            {exam.category}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-800 rounded">
                          {exam.token}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/80">
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {exam.durationMinutes} Menit
                          </span>
                          <span className="flex items-center gap-1">
                            <HelpCircle className="w-3 h-3 text-slate-400" />
                            {exam._count.questions} Soal
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectToken(exam.token)}
                          className="text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          Pilih Token &rarr;
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Petunjuk Teknis Ringkas */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-900">
                <Info className="w-3.5 h-3.5 text-blue-700" />
                Ketentuan & Tata Tertib CBT
              </h3>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                  <span>
                    Timer ujian dimulai saat menekan tombol <b>Mulai Ujian</b>{" "}
                    pada lembar konfirmasi.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                  <span>
                    Jawaban tersimpan otomatis secara real-time ke server pada
                    setiap butir soal.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                  <span>
                    Gunakan tombol <b>Ragu-ragu</b> jika ingin meninjau kembali
                    pilihan sebelum submit.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <span className="text-amber-900 font-medium">
                    Sistem pengawas mencatat perpindahan jendela/tab browser
                    selama ujian berlangsung.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
