'use client';

import { useState, useEffect, use } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowLeft,
  Printer,
  Sparkles,
  BookOpen,
  BarChart3,
  Check,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import CakrawalaLogo from '@/components/CakrawalaLogo';

export default function ExamResultPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = decodeURIComponent(resolvedParams.token).toUpperCase();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CORRECT' | 'INCORRECT' | 'UNANSWERED'>('ALL');

  useEffect(() => {
    if (!sessionId) {
      setErrorMessage('Sesi ujian tidak valid.');
      setLoading(false);
      return;
    }

    async function loadResult() {
      try {
        const res = await fetch(`/api/session/${sessionId}/result`);
        const json = await res.json();

        if (json.success) {
          setData(json.data);
          if (json.data.session.isPassed) {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
          }
        } else {
          setErrorMessage(json.message || 'Gagal memuat hasil ujian.');
        }
      } catch (err) {
        setErrorMessage('Gagal menghubungi server.');
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Mengkalkulasi Lembar Jawaban & Pembahasan...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !data) {
    return (
      <div className="flex-1 max-w-lg mx-auto p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Hasil Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500">{errorMessage || 'Data ujian tidak tersedia.'}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const { session, exam, subjectBreakdown, questions } = data;

  const filteredQuestions = questions.filter((q: any) => {
    if (activeFilter === 'CORRECT') return q.isCorrect;
    if (activeFilter === 'INCORRECT') return !q.isCorrect && q.studentAnswer !== null;
    if (activeFilter === 'UNANSWERED') return q.studentAnswer === null;
    return true;
  });

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-8">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Portal Utama
        </Link>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Lembar Nilai</span>
        </button>
      </div>

      {/* Main Score Banner - Blue Gradient */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
        <div
          className={`p-6 sm:p-8 text-white ${
            session.isPassed
              ? 'bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950'
              : 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CakrawalaLogo className="w-12 h-12 ring-2 ring-blue-400/40" size={48} />
              <div>
                <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-blue-900/90 text-blue-200 border border-blue-700/60">
                  {exam.category}
                </span>
                <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">{exam.title}</h1>
                <p className="text-xs sm:text-sm text-blue-100/90 mt-0.5">
                  Peserta: <span className="font-bold text-white">{session.studentName}</span>
                  {session.studentNisn && ` (NISN: ${session.studentNisn})`}
                  {session.studentSchool && ` • ${session.studentSchool}`}
                </p>
              </div>
            </div>

            {/* Status Kelulusan */}
            <div className="flex flex-col items-end">
              <span
                className={`text-xs sm:text-sm font-extrabold px-4 py-1.5 rounded-xl border tracking-wide uppercase shadow-sm ${
                  session.isPassed
                    ? 'bg-blue-400 text-blue-950 border-blue-300'
                    : 'bg-amber-400 text-amber-950 border-amber-300'
                }`}
              >
                {session.isPassed ? 'MEMENUHI PASSING GRADE' : 'BELUM MEMENUHI PASSING GRADE'}
              </span>
              <p className="text-[11px] text-white/70 mt-1">Passing Score: {session.passingScore} Poin</p>
            </div>
          </div>

          {/* Kartu Skor Besar */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15 text-center">
              <p className="text-xs text-white/80">Total Skor Perolehan</p>
              <p className="text-3xl sm:text-4xl font-black mt-1 text-white">
                {session.totalScore}
                <span className="text-sm font-normal text-white/60"> / {session.maxPossibleScore}</span>
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15 text-center">
              <p className="text-xs text-white/80">Akurasi Nilai</p>
              <p className="text-3xl sm:text-4xl font-black mt-1 text-white">
                {session.accuracy}%
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15 text-center">
              <p className="text-xs text-white/80">Jawaban Benar</p>
              <p className="text-3xl sm:text-4xl font-black mt-1 text-sky-300">
                {session.correctCount}
                <span className="text-sm font-normal text-white/60"> / {questions.length}</span>
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15 text-center">
              <p className="text-xs text-white/80">Salah / Kosong</p>
              <p className="text-3xl sm:text-4xl font-black mt-1 text-rose-300">
                {session.incorrectCount} / {session.unansweredCount}
              </p>
            </div>
          </div>
        </div>

        {/* Breakdown Subtes */}
        {subjectBreakdown.length > 0 && (
          <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-700" />
              <span>Analisis Performa Per Subtes / Bidang</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {subjectBreakdown.map((s: any) => (
                <div
                  key={s.subject}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-xs text-slate-800 truncate">{s.subject}</p>
                    <span className="text-xs font-extrabold text-blue-700">{s.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${s.percentage}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    {s.correct} dari {s.total} soal benar ({s.points} Poin)
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lembar Pembahasan Lengkap */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Lembar Pembahasan Soal</h2>
              <p className="text-xs text-slate-500">Kunci jawaban resmi dan penjelasan materi</p>
            </div>
          </div>

          {/* Filter Butir Soal */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                activeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Semua ({questions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('CORRECT')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                activeFilter === 'CORRECT' ? 'bg-white text-blue-800 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Benar ({session.correctCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('INCORRECT')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                activeFilter === 'INCORRECT' ? 'bg-white text-rose-800 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Salah ({session.incorrectCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('UNANSWERED')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                activeFilter === 'UNANSWERED' ? 'bg-white text-amber-800 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Kosong ({session.unansweredCount})
            </button>
          </div>
        </div>

        {/* List Soal & Pembahasan */}
        <div className="space-y-6">
          {filteredQuestions.length === 0 ? (
            <p className="py-8 text-center text-slate-400 text-xs">Tidak ada soal dengan filter ini.</p>
          ) : (
            filteredQuestions.map((q: any) => {
              const options = [
                { key: 'A', text: q.optionA },
                { key: 'B', text: q.optionB },
                { key: 'C', text: q.optionC },
                { key: 'D', text: q.optionD },
                ...(q.optionE ? [{ key: 'E', text: q.optionE }] : []),
              ];

              return (
                <div
                  key={q.id}
                  className={`p-5 sm:p-6 rounded-2xl border-2 space-y-4 ${
                    q.isCorrect
                      ? 'bg-blue-50/30 border-blue-200'
                      : q.studentAnswer === null
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-rose-50/30 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm px-3 py-1 bg-slate-800 text-white rounded-lg">
                        Soal No. {q.questionNumber}
                      </span>
                      {q.subject && (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                          {q.subject}
                        </span>
                      )}
                    </div>

                    {q.isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                        <Check className="w-3.5 h-3.5" />
                        Jawaban Anda Benar (+{q.points})
                      </span>
                    ) : q.studentAnswer === null ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-slate-200 text-slate-700">
                        Tidak Dijawab (0)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                        <X className="w-3.5 h-3.5" />
                        Jawaban Anda Salah (Pilihan: {q.studentAnswer})
                      </span>
                    )}
                  </div>

                  <div className="text-sm sm:text-base font-medium text-slate-800 whitespace-pre-line">
                    {q.questionText}
                  </div>

                  {/* Opsi Jawaban */}
                  <div className="space-y-2">
                    {options.map((opt) => {
                      const isCorrectKey = opt.key.toUpperCase() === q.correctAnswer.toUpperCase();
                      const isChosenByStudent = opt.key.toUpperCase() === q.studentAnswer?.toUpperCase();

                      let optClasses = 'bg-white border-slate-200 text-slate-700';
                      if (isCorrectKey) {
                        optClasses = 'bg-blue-100/70 border-blue-500 text-blue-950 font-bold';
                      } else if (isChosenByStudent && !isCorrectKey) {
                        optClasses = 'bg-rose-100/70 border-rose-400 text-rose-950 line-through';
                      }

                      return (
                        <div
                          key={opt.key}
                          className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-3 ${optClasses}`}
                        >
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                              isCorrectKey
                                ? 'bg-blue-600 text-white'
                                : isChosenByStudent
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span className="pt-0.5 flex-1">{opt.text}</span>
                          {isCorrectKey && (
                            <span className="text-[11px] font-bold text-blue-800 bg-blue-200/80 px-2 py-0.5 rounded">
                              KUNCI RESMI
                            </span>
                          )}
                          {isChosenByStudent && !isCorrectKey && (
                            <span className="text-[11px] font-bold text-rose-800 bg-rose-200/80 px-2 py-0.5 rounded">
                              PILIHAN ANDA
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Kotak Pembahasan */}
                  {q.explanation && (
                    <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-xs sm:text-sm text-sky-950 space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-blue-900">
                        <Sparkles className="w-4 h-4 text-blue-700" />
                        Pembahasan & Analisis Materi:
                      </p>
                      <p className="leading-relaxed whitespace-pre-line text-slate-800 font-light">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
