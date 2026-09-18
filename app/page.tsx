'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
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
} from 'lucide-react';
import CakrawalaLogo from '@/components/CakrawalaLogo';

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

  const [token, setToken] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentNisn, setStudentNisn] = useState('');
  const [studentSchool, setStudentSchool] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [activeExams, setActiveExams] = useState<ExamItem[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);

  useEffect(() => {
    async function loadExams() {
      try {
        const res = await fetch('/api/exams');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setActiveExams(json.data.filter((e: any) => e.isActive));
        }
      } catch (err) {
        console.error('Failed to load exams:', err);
      } finally {
        setLoadingExams(false);
      }
    }
    loadExams();
  }, []);

  const handleStartExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token.trim()) {
      setErrorMessage('Silakan masukkan Token Ujian.');
      return;
    }

    if (!studentName.trim()) {
      setErrorMessage('Silakan masukkan Nama Lengkap Anda.');
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
      sessionStorage.setItem('cbt_student_data', JSON.stringify(studentPayload));

      router.push(`/exam/${encodeURIComponent(token.trim().toUpperCase())}`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan saat memulai ujian.');
      setLoading(false);
    }
  };

  const handleSelectToken = (selectedToken: string) => {
    setToken(selectedToken);
    window.scrollTo({ top: 140, behavior: 'smooth' });
  };

  return (
    <div className="flex-1 pb-16">
      {/* Hero Section - Deep Blue Gradient */}
      <section className="bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900 text-white py-14 px-4 sm:px-6 lg:px-8 shadow-inner">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          
          {/* Cakrawala Logo & Badge */}
          <div className="flex items-center justify-center gap-3">
            <CakrawalaLogo className="w-12 h-12 shadow-xl ring-2 ring-blue-400/50" size={48} />
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-900/80 border border-blue-500/40 text-blue-200 text-xs font-bold backdrop-blur-sm shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Cakrawala Simulasi Mandiri SNPDB MAN IC</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Portal Ujian Mandiri Komputer (CBT)
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
              MAN Insan Cendekia
            </span>
          </h1>

          <p className="text-sm sm:text-base text-blue-100/90 max-w-2xl mx-auto font-light leading-relaxed">
            Format simulasi ujian seleksi nasional (SNPDB) berbasis komputer dengan timer real-time,
            auto-save jawaban, dan pembahasan butir soal terstruktur.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Card Form Masuk Ujian (Left Column) */}
          <div className="lg:col-span-7 bg-white rounded-3xl shadow-xl border border-slate-200/90 p-6 sm:p-8">
            <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
              <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold shadow-xs">
                <KeyRound className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Masuk Ruang Ujian</h2>
                <p className="text-xs text-slate-500">Lengkapi data diri dan masukkan token tryout Anda</p>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleStartExam} className="mt-6 space-y-4">
              {/* Token Ujian */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Token Ujian <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                    placeholder="Contoh: MANIC2025"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-base text-blue-900 tracking-wider placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Dapatkan token dari panitia atau pilih paket aktif di samping.</p>
              </div>

              {/* Nama Siswa */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nama Lengkap Peserta <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Masukkan nama lengkap sesuai identitas"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* NISN & Asal Sekolah */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    NISN / No. Peserta
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <IdCard className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={studentNisn}
                      onChange={(e) => setStudentNisn(e.target.value)}
                      placeholder="Contoh: 0081234567"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Asal Madrasah / Sekolah
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <School className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={studentSchool}
                      onChange={(e) => setStudentSchool(e.target.value)}
                      placeholder="Contoh: MTsN 1 / SMPN 1"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Mulai Konfirmasi Ujian</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Active Tryouts & Info (Right Column) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Paket Tryout Tersedia */}
            <div className="bg-white rounded-3xl shadow-md border border-slate-200 p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-base">Paket Tryout Aktif</h3>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  {activeExams.length} Tersedia
                </span>
              </div>

              <div className="mt-4 space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {loadingExams ? (
                  <div className="py-8 text-center text-slate-400 text-sm">Memuat paket ujian...</div>
                ) : activeExams.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm">
                    Belum ada paket ujian aktif. Panitia dapat membuat atau mengunggah PDF soal di Panel Panitia.
                  </div>
                ) : (
                  activeExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/40 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition-colors">
                            {exam.title}
                          </h4>
                          <span className="inline-block mt-1 text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                            {exam.category}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-black px-2.5 py-1 bg-slate-200 text-slate-800 rounded-lg">
                          {exam.token}
                        </span>
                      </div>

                      <div className="mt-3.5 flex items-center justify-between text-xs text-slate-500 pt-2.5 border-t border-slate-200/70">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            {exam.durationMinutes} Menit
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                            {exam._count.questions} Soal
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectToken(exam.token)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          Gunakan Token &rarr;
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Petunjuk CBT Cakrawala */}
            <div className="bg-slate-950 text-white rounded-3xl p-6 shadow-md border border-blue-900/60 space-y-3">
              <h3 className="font-bold text-blue-300 text-sm uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                Ketentuan & Tata Tertib CBT
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed font-light">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                  <span>Waktu pengerjaan dimulai tepat saat Anda mengklik tombol <b>Mulai Ujian</b>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                  <span>Jawaban tersimpan otomatis secara real-time ke server setiap kali memilih opsi.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                  <span>Gunakan tombol <b>Ragu-ragu</b> (warna kuning) jika belum yakin dengan jawaban.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  <span className="text-amber-200 font-normal">
                    <b>Anti-Cheat:</b> Dilarang berpindah tab browser atau meminimalkan jendela selama ujian.
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
