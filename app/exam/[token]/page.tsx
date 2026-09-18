'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  HelpCircle,
  Award,
  AlertTriangle,
  Play,
  ArrowLeft,
  User,
  School,
  IdCard,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';

export default function ExamConfirmationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = decodeURIComponent(resolvedParams.token).toUpperCase();
  const router = useRouter();

  const [studentData, setStudentData] = useState<{
    token: string;
    studentName: string;
    studentNisn: string;
    studentSchool: string;
  } | null>(null);

  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('cbt_student_data');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setStudentData(parsed);
      } catch (e) {
        console.error(e);
      }
    }

    async function fetchExamDetails() {
      try {
        const res = await fetch('/api/exams');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const found = json.data.find((e: any) => e.token === token);
          if (found) {
            setExam(found);
          } else {
            setErrorMessage(`Paket ujian dengan token "${token}" tidak ditemukan.`);
          }
        }
      } catch (err) {
        setErrorMessage('Gagal memuat informasi ujian.');
      } finally {
        setLoading(false);
      }
    }

    fetchExamDetails();
  }, [token]);

  const handleStartExam = async () => {
    if (!studentData?.studentName) {
      setErrorMessage('Data identitas peserta tidak lengkap. Silakan kembali ke beranda.');
      return;
    }

    setStarting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          studentName: studentData.studentName,
          studentNisn: studentData.studentNisn,
          studentSchool: studentData.studentSchool,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setErrorMessage(json.message || 'Gagal memulai sesi ujian.');
        setStarting(false);
        return;
      }

      localStorage.setItem('cbt_active_session', JSON.stringify(json.data));
      router.push(`/exam/${encodeURIComponent(token)}/test`);
    } catch (err: any) {
      setErrorMessage('Terjadi kendala jaringan saat memulai sesi.');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Memeriksa token & naskah ujian...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Beranda
      </Link>

      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {exam && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
          {/* Header Banner - Deep Blue */}
          <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-blue-800/80 text-blue-200 border border-blue-600/40">
                {exam.category}
              </span>
              <span className="font-mono text-xs font-bold px-3 py-1 bg-white/10 text-blue-200 rounded-lg border border-white/10">
                TOKEN: {exam.token}
              </span>
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {exam.title}
            </h1>
            {exam.description && (
              <p className="mt-2 text-xs sm:text-sm text-blue-100/90 max-w-2xl font-light">
                {exam.description}
              </p>
            )}
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Kartu Identitas Peserta */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                Konfirmasi Identitas Peserta
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-500">Nama Lengkap</p>
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {studentData?.studentName || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center flex-shrink-0">
                    <IdCard className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-500">NISN / No. Peserta</p>
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {studentData?.studentNisn || 'Tidak diisi'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center flex-shrink-0">
                    <School className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-500">Asal Sekolah</p>
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {studentData?.studentSchool || 'Tidak diisi'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Spesifikasi Ujian */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
                Parameter & Alokasi Ujian
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Durasi Waktu</p>
                    <p className="text-lg font-extrabold text-slate-900">{exam.durationMinutes} Menit</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Jumlah Butir Soal</p>
                    <p className="text-lg font-extrabold text-slate-900">{exam._count?.questions || 0} Soal</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Passing Grade</p>
                    <p className="text-lg font-extrabold text-slate-900">{exam.passingScore} Poin</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Peringatan Anti-Curang */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <p className="font-bold mb-0.5">Pemberitahuan Sistem Pengawasan (CBT Proctoring):</p>
                Sistem CBT ini mencatat aktivitas peserta. Anda dilarang membuka tab lain, berpindah window,
                atau menyalin teks selama ujian berlangsung. Setiap pelanggaran tercatat dalam log pengawas ujian.
              </div>
            </div>

            {/* Tombol Mulai */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-center"
              >
                Ganti Identitas / Token
              </Link>

              <button
                type="button"
                onClick={handleStartExam}
                disabled={starting || !studentData?.studentName}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                {starting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>Mulai Kerjakan Ujian Sekarang</span>
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
