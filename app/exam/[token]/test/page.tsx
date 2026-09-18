'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Flag,
  CheckCircle2,
  Maximize2,
  Minimize2,
  ShieldAlert,
  Send,
  Type,
} from 'lucide-react';
import CakrawalaLogo from '@/components/CakrawalaLogo';

interface Question {
  id: string;
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string | null;
  subject?: string | null;
  points: number;
}

interface SavedAnswer {
  selectedOption: string | null;
  isDoubtful: boolean;
}

export default function CBTTestInterfacePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = decodeURIComponent(resolvedParams.token).toUpperCase();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, SavedAnswer>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // UI States
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tabSwitchAlert, setTabSwitchAlert] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Inisialisasi Sesi Ujian
  useEffect(() => {
    const rawActive = localStorage.getItem('cbt_active_session');
    if (!rawActive) {
      router.push(`/exam/${encodeURIComponent(token)}`);
      return;
    }

    try {
      const active = JSON.parse(rawActive);
      setSessionData(active.session);
      setQuestions(active.questions || []);
      setAnswers(active.savedAnswers || {});
      setRemainingSeconds(active.remainingSeconds || active.exam.durationMinutes * 60);
      setTabSwitchCount(active.session.tabSwitchCount || 0);
    } catch (e) {
      console.error(e);
      router.push(`/exam/${encodeURIComponent(token)}`);
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  // Countdown Timer
  useEffect(() => {
    if (loading || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, remainingSeconds]);

  // Anti-Cheat: Tab Switch & Visibility Change
  useEffect(() => {
    if (!sessionData?.id) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        setTabSwitchAlert(true);
        setTabSwitchCount((prev) => prev + 1);

        try {
          await fetch(`/api/session/${sessionData.id}/anti-cheat`, {
            method: 'POST',
          });
        } catch (e) {
          console.error(e);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionData?.id]);

  // Auto-save Jawaban ke Server
  const saveAnswerToServer = useCallback(
    async (qId: string, option: string | null, doubtful: boolean) => {
      if (!sessionData?.id) return;
      try {
        await fetch(`/api/session/${sessionData.id}/answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: qId,
            selectedOption: option,
            isDoubtful: doubtful,
          }),
        });
      } catch (err) {
        console.error('Failed to auto-save answer:', err);
      }
    },
    [sessionData?.id]
  );

  const handleSelectOption = (optionLetter: string) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const existing = answers[currentQ.id] || { selectedOption: null, isDoubtful: false };
    const newSelected = existing.selectedOption === optionLetter ? null : optionLetter;

    const updated = {
      ...answers,
      [currentQ.id]: {
        selectedOption: newSelected,
        isDoubtful: existing.isDoubtful,
      },
    };

    setAnswers(updated);
    saveAnswerToServer(currentQ.id, newSelected, existing.isDoubtful);
  };

  const handleToggleDoubtful = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const existing = answers[currentQ.id] || { selectedOption: null, isDoubtful: false };
    const newDoubtful = !existing.isDoubtful;

    const updated = {
      ...answers,
      [currentQ.id]: {
        selectedOption: existing.selectedOption,
        isDoubtful: newDoubtful,
      },
    };

    setAnswers(updated);
    saveAnswerToServer(currentQ.id, existing.selectedOption, newDoubtful);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSubmitModal || tabSwitchAlert) return;

      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D', 'E'].includes(key)) {
        handleSelectOption(key);
      } else if (key >= '1' && key <= '5') {
        const letters = ['A', 'B', 'C', 'D', 'E'];
        const opt = letters[parseInt(key, 10) - 1];
        if (opt) handleSelectOption(opt);
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, questions, answers, showSubmitModal, tabSwitchAlert]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
      .toString()
      .padStart(2, '0')}`;
  };

  const handleConfirmSubmit = async () => {
    if (!sessionData?.id) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/session/${sessionData.id}/submit`, {
        method: 'POST',
      });
      const json = await res.json();

      if (json.success) {
        localStorage.removeItem('cbt_active_session');
        router.push(`/exam/${encodeURIComponent(token)}/result?sessionId=${sessionData.id}`);
      } else {
        alert(json.message || 'Gagal mengirim jawaban.');
        setSubmitting(false);
      }
    } catch (err) {
      alert('Terjadi kendala jaringan saat mengumpulkan lembar jawaban.');
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    handleConfirmSubmit();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Mempersiapkan Lembar Ujian CBT...</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) {
    return <div className="p-8 text-center">Soal tidak ditemukan.</div>;
  }

  const currentAnswer = answers[currentQ.id] || { selectedOption: null, isDoubtful: false };

  const answeredCount = Object.values(answers).filter((a) => a.selectedOption !== null).length;
  const doubtfulCount = Object.values(answers).filter((a) => a.isDoubtful).length;
  const unansweredCount = questions.length - answeredCount;

  const textSizeClass =
    fontSize === 'large'
      ? 'text-lg leading-relaxed'
      : fontSize === 'xlarge'
      ? 'text-xl leading-loose'
      : 'text-base leading-normal';

  const isTimerCritical = remainingSeconds <= 300;
  const isTimerWarning = remainingSeconds <= 900 && remainingSeconds > 300;

  return (
    <div className="flex-1 flex flex-col bg-slate-100 min-h-screen">
      {/* Top Floating CBT Bar - Blue Accent */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm px-4 py-2.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Info Peserta */}
          <div className="flex items-center gap-3">
            <CakrawalaLogo className="w-8 h-8 rounded-lg" size={32} />
            <div>
              <p className="font-bold text-xs sm:text-sm text-slate-800 truncate max-w-[200px] sm:max-w-xs">
                {sessionData?.studentName}
              </p>
              <p className="text-[11px] text-slate-500">
                {sessionData?.studentNisn ? `NISN: ${sessionData.studentNisn}` : 'Peserta CBT Cakrawala'}
              </p>
            </div>
          </div>

          {/* Real-time Countdown Timer */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-mono font-bold text-sm sm:text-base border shadow-sm transition-all ${
                isTimerCritical
                  ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                  : isTimerWarning
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>{formatTime(remainingSeconds)}</span>
            </div>
          </div>

          {/* Tools & Tombol Selesai */}
          <div className="flex items-center gap-2">
            {/* Font Size Selector */}
            <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setFontSize('normal')}
                className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                  fontSize === 'normal' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
                }`}
                title="Font Normal"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize('large')}
                className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                  fontSize === 'large' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
                }`}
                title="Font Sedang"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setFontSize('xlarge')}
                className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                  fontSize === 'xlarge' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
                }`}
                title="Font Besar"
              >
                A++
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer hidden sm:inline-flex"
              title="Layar Penuh"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Tombol Selesai Ujian */}
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Selesai Ujian</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Examination Grid */}
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
          
          {/* Main Question Canvas (Left / 8 cols) */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex-1 flex flex-col justify-between">
              <div>
                {/* Header Soal */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1 rounded-xl bg-blue-800 text-white font-extrabold text-sm tracking-wide">
                      SOAL NO. {currentQ.questionNumber}
                    </span>
                    {currentQ.subject && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
                        {currentQ.subject}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    Bobot: +{currentQ.points} Poin
                  </span>
                </div>

                {/* Teks Pertanyaan */}
                <div className="mt-6 text-slate-900 font-medium whitespace-pre-line select-none">
                  <p className={textSizeClass}>{currentQ.questionText}</p>
                </div>

                {/* Pilihan Jawaban A, B, C, D, E */}
                <div className="mt-8 space-y-3">
                  {[
                    { key: 'A', text: currentQ.optionA },
                    { key: 'B', text: currentQ.optionB },
                    { key: 'C', text: currentQ.optionC },
                    { key: 'D', text: currentQ.optionD },
                    ...(currentQ.optionE ? [{ key: 'E', text: currentQ.optionE }] : []),
                  ].map((opt) => {
                    const isSelected = currentAnswer.selectedOption === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSelectOption(opt.key)}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-4 cursor-pointer group ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-600 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/70'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl font-bold text-sm flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-800'
                          }`}
                        >
                          {opt.key}
                        </div>
                        <div
                          className={`pt-1 text-sm sm:text-base font-normal ${
                            isSelected ? 'text-blue-950 font-semibold' : 'text-slate-800'
                          }`}
                        >
                          {opt.text}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-10 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>

                {/* Tombol Ragu-ragu */}
                <button
                  type="button"
                  onClick={handleToggleDoubtful}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm border transition-all flex items-center gap-2 cursor-pointer ${
                    currentAnswer.isDoubtful
                      ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-sm'
                      : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  <Flag className="w-4 h-4 fill-current" />
                  <span>{currentAnswer.isDoubtful ? 'Telah Ditandai Ragu' : 'Ragu-Ragu'}</span>
                </button>

                {/* Tombol Selanjutnya */}
                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Simpan & Lanjut</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="px-6 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Selesai & Kumpulkan</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Grid Navigasi Soal (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center justify-between pb-3 border-b border-slate-100">
                <span>Daftar Nomor Soal</span>
                <span className="text-xs font-normal text-slate-400">Total: {questions.length}</span>
              </h3>

              {/* Legend Status Soal */}
              <div className="grid grid-cols-3 gap-2 mt-4 text-[11px] font-semibold text-center">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-900 border border-blue-200">
                  <p className="text-sm font-extrabold">{answeredCount}</p>
                  <p className="text-[10px] uppercase font-bold text-blue-700">Dijawab</p>
                </div>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                  <p className="text-sm font-extrabold">{doubtfulCount}</p>
                  <p className="text-[10px] uppercase font-bold text-amber-600">Ragu-Ragu</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                  <p className="text-sm font-extrabold">{unansweredCount}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-500">Belum</p>
                </div>
              </div>
            </div>

            {/* Grid Butir Soal */}
            <div className="grid grid-cols-5 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const ans = answers[q.id];
                const isCurrent = idx === currentIndex;
                const isAnswered = ans && ans.selectedOption !== null;
                const isDoubtful = ans && ans.isDoubtful;

                let colorClasses = 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200';
                if (isDoubtful) {
                  colorClasses = 'bg-amber-400 text-amber-950 font-bold border-amber-500 shadow-xs';
                } else if (isAnswered) {
                  colorClasses = 'bg-blue-600 text-white font-bold border-blue-700 shadow-xs';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-11 rounded-xl text-xs font-bold border-2 transition-all flex flex-col items-center justify-center relative cursor-pointer ${colorClasses} ${
                      isCurrent ? 'ring-3 ring-indigo-500 ring-offset-2 scale-105 z-10' : ''
                    }`}
                  >
                    <span>{q.questionNumber}</span>
                    {isAnswered && (
                      <span className="text-[9px] font-extrabold leading-none opacity-90">
                        {ans.selectedOption}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Petunjuk Pintas Keyboard */}
            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-600">Pintasan Keyboard:</p>
              <p>• Tekan <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border font-mono">A</kbd> - <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border font-mono">E</kbd> untuk memilih opsi</p>
              <p>• Tekan <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border font-mono">&larr;</kbd> dan <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border font-mono">&rarr;</kbd> untuk pindah nomor</p>
            </div>
          </div>

        </div>
      </div>

      {/* Modal Anti-Cheat Alert */}
      {tabSwitchAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-rose-200 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Peringatan Pengawas CBT!</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Anda terdeteksi berpindah tab atau meninggalkan jendela ujian. Aktivitas ini telah dicatat dalam log ujian.
            </p>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
              Total Peringatan: {tabSwitchCount} kali
            </div>
            <button
              type="button"
              onClick={() => setTabSwitchAlert(false)}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm cursor-pointer"
            >
              Saya Mengerti & Kembali ke Soal
            </button>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Selesai Ujian */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Konfirmasi Kumpulkan Ujian</h3>
                <p className="text-xs text-slate-500">Pastikan seluruh lembar jawaban sudah terisi</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Soal Sudah Dijawab:</span>
                <span className="font-bold text-blue-700">{answeredCount} Soal</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Soal Masih Ragu-ragu:</span>
                <span className="font-bold text-amber-600">{doubtfulCount} Soal</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Soal Belum Dijawab:</span>
                <span className="font-bold text-rose-600">{unansweredCount} Soal</span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
                ⚠️ Anda masih memiliki {unansweredCount} soal yang belum dijawab. Nilai untuk soal kosong adalah 0.
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal, Lanjut Kerjakan
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmSubmit}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Ya, Kumpulkan</span>
                    <CheckCircle2 className="w-4 h-4" />
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
