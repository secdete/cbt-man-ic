"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Clock,
  HelpCircle,
  AlertCircle,
  KeyRound,
  User,
  School,
  FileCheck2,
  Info,
  Sparkles,
  ShieldCheck,
  Phone,
  Lock,
} from "lucide-react";
import CakrawalaLogo from "@/components/CakrawalaLogo";

interface ExamItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  durationMinutes: number;
  passingScore: number;
  isActive: boolean;
  isLocked: boolean;
  openTime: string | null;
  closeTime: string | null;
  _count: {
    questions: number;
    sessions: number;
  };
}

export default function StudentHomePage() {
  const router = useRouter();

  const [studentName, setStudentName] = useState("");
  const [studentSchool, setStudentSchool] = useState("");
  const [studentWhatsapp, setStudentWhatsapp] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  useEffect(() => {
    async function loadExams() {
      try {
        const res = await fetch("/api/exams");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setExams(json.data);
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

    if (!studentName.trim()) {
      setErrorMessage("Silakan masukkan Nama Lengkap Anda.");
      return;
    }

    if (!studentSchool.trim()) {
      setErrorMessage("Silakan masukkan Asal Madrasah / Sekolah Anda.");
      return;
    }

    if (!token.trim()) {
      setErrorMessage("Silakan masukkan Token Ujian yang diberikan panitia.");
      return;
    }

    const cleanToken = token.trim().toUpperCase();
    setLoading(true);

    try {
      // Simpan data identitas siswa ke sessionStorage untuk konfirmasi & sesi ujian
      const studentPayload = {
        token: cleanToken,
        studentName: studentName.trim(),
        studentSchool: studentSchool.trim(),
        studentWhatsapp: studentWhatsapp.trim() || null,
      };

      sessionStorage.setItem(
        "cbt_student_data",
        JSON.stringify(studentPayload),
      );

      // Verifikasi token & jadwal terlebih dahulu
      const checkRes = await fetch(
        `/api/exams?token=${encodeURIComponent(cleanToken)}`,
      );
      const checkJson = await checkRes.json();

      if (checkJson.success && Array.isArray(checkJson.data)) {
        const found = checkJson.data.find((ex: any) => ex.token === cleanToken);
        if (!found) {
          setErrorMessage(
            `Token "${cleanToken}" tidak valid. Periksa kembali token dari arahan pengawas.`,
          );
          setLoading(false);
          return;
        }

        // Cek status aktif & jadwal admin
        if (!found.isActive || found.isLocked) {
          setErrorMessage(
            "Ujian dengan token ini sedang ditutup atau belum diaktifkan oleh panitia/admin.",
          );
          setLoading(false);
          return;
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
            `Ujian belum dibuka. Jadwal pelaksanaan baru dimulai pada: ${formattedOpen}.`,
          );
          setLoading(false);
          return;
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
            `Waktu pelaksanaan ujian ini telah ditutup pada: ${formattedClose}.`,
          );
          setLoading(false);
          return;
        }
      }

      router.push(`/exam/${encodeURIComponent(cleanToken)}`);
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Terjadi kesalahan saat memeriksa token.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 pb-16">
      {/* Top Banner - Clean Institutional Style */}
      <section className="bg-slate-900 border-b border-slate-800 text-white py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-blue-950 border border-blue-800 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Sistem Ujian Berbasis Komputer (CBT)</span>
            </div>

            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
              Simulasi Seleksi Nasional Peserta Didik Baru (SNPDB)
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
              Madrasah Aliyah Negeri Insan Cendekia (MAN IC) • Didukung oleh
              Cakrawala Learning
            </p>
          </div>

          <div className="flex items-center gap-3.5 bg-slate-800/90 p-3 sm:p-3.5 rounded-2xl border border-slate-700 shadow-md flex-shrink-0">
            <CakrawalaLogo className="h-12 sm:h-14 w-auto" height={58} />
            <div className="text-left border-l border-slate-700 pl-3">
              <p className="text-sm font-bold text-white tracking-tight">
                Cakrawala Learning
              </p>
              <p className="text-[11px] text-slate-400">Portal Ujian Terpadu</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 -mt-3 sm:-mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Card Form Masuk Ujian (Left Column - 7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-7">
            <div className="pb-4 sm:pb-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Masuk Ruang Ujian
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Isi identitas peserta dan token yang diarahkan oleh panitia
                </p>
              </div>
              <span className="p-2 rounded-lg bg-slate-100 text-slate-700 flex-shrink-0">
                <KeyRound className="w-5 h-5" />
              </span>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleStartExam} className="mt-5 space-y-4">
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
                    placeholder="Ketik nama lengkap Anda"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>
              </div>

              {/* Asal Sekolah / Madrasah */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Asal Madrasah / Sekolah{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <School className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={studentSchool}
                    onChange={(e) => setStudentSchool(e.target.value)}
                    placeholder="Contoh: MTsN 1 Tangerang Selatan / SMPN 1"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>
              </div>

              {/* No. WhatsApp (Opsional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. WhatsApp Siswa / Orang Tua{" "}
                  <span className="text-slate-400 font-normal">
                    (Opsional, untuk info sertifikat &amp; kelas)
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={studentWhatsapp}
                    onChange={(e) => setStudentWhatsapp(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Token Ujian (Wajib, diisi manual dari arahan admin) */}
              <div className="pt-2 border-t border-slate-100">
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
                    onChange={(e) => {
                      setToken(e.target.value.toUpperCase());
                      setErrorMessage("");
                    }}
                    placeholder="Masukkan token dari panitia/admin"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-sm text-slate-900 placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>
                <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-amber-700 bg-amber-50/70 p-2 rounded border border-amber-200/60">
                  <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    Token naskah ujian bersifat rahasia dan dibagikan oleh
                    panitia/pengawas saat jadwal ujian resmi dibuka.
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Konfirmasi &amp; Masuk Ujian</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Daftar Paket Tryout (Tokens Hidden) & Petunjuk (5 cols) */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-5">
            {/* Paket Tryout Tersedia */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-slate-700" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Daftar Naskah Ujian Resmi
                  </h3>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  {exams.length} Paket Ujian
                </span>
              </div>

              {/* Category Filter Tabs (Swipeable on mobile) */}
              <div className="mt-3 flex overflow-x-auto gap-1.5 border-b border-slate-100 pb-2.5 sm:flex-wrap">
                {[
                  { key: "ALL", label: "Semua" },
                  { key: "SNPDB 2023", label: "SNPDB 2023" },
                  { key: "SNPDB 2022", label: "SNPDB 2022" },
                  { key: "SNPDB 2021", label: "SNPDB 2021" },
                  { key: "SNPDB 2020", label: "SNPDB 2020" },
                  { key: "Tryout Mandiri", label: "Mandiri" },
                ].map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`whitespace-nowrap flex-shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                      selectedCategory === cat.key
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="mt-3.5 space-y-2.5 max-h-[460px] overflow-y-auto pr-0.5 sm:pr-1">
                {loadingExams ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    Memuat daftar paket naskah...
                  </div>
                ) : exams.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    Belum ada paket ujian aktif saat ini.
                  </div>
                ) : (
                  exams
                    .filter(
                      (e) =>
                        selectedCategory === "ALL" ||
                        e.category === selectedCategory,
                    )
                    .map((exam) => (
                      <div
                        key={exam.id}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                              {exam.title}
                            </h4>
                            <span className="inline-block mt-0.5 text-[10px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                              {exam.category}
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700 flex-shrink-0">
                            <Lock className="w-3 h-3 text-slate-500" />
                            Wajib Token
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

                          <span className="text-[11px] text-slate-400 italic">
                            Arahan Panitia
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Petunjuk Teknis Ringkas */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-5 space-y-3">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-900">
                <Info className="w-3.5 h-3.5 text-blue-700" />
                Ketentuan &amp; Tata Tertib CBT
              </h3>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                  <span>
                    Jadwal ujian diatur oleh Panitia. Pastikan Anda masuk tepat
                    pada jam yang ditentukan.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                  <span>
                    Sistem pengawasan (anti-curang) aktif: peserta wajib mode
                    Fullscreen dan dilarang berpindah tab.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                  <span>
                    Setelah menyelesaikan ujian, Anda akan mendapatkan{" "}
                    <b>Sertifikat Hasil Tryout Resmi</b> yang dapat diunduh
                    langsung.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <span className="text-amber-900 font-medium">
                    Pelanggaran membuka tab lain lebih dari 3 kali akan
                    menyebabkan ujian di-submit otomatis.
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
