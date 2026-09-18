"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle2,
  Maximize2,
  Minimize2,
  ShieldAlert,
  Send,
} from "lucide-react";
import CakrawalaLogo from "@/components/CakrawalaLogo";

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
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">(
    "normal",
  );
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tabSwitchAlert, setTabSwitchAlert] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Inisialisasi Sesi Ujian
  useEffect(() => {
    const rawActive = localStorage.getItem("cbt_active_session");
    if (!rawActive) {
      router.push(`/exam/${encodeURIComponent(token)}`);
      return;
    }

    try {
      const active = JSON.parse(rawActive);
      setSessionData(active.session);
      setQuestions(active.questions || []);
      setAnswers(active.savedAnswers || {});
      setRemainingSeconds(
        active.remainingSeconds || active.exam.durationMinutes * 60,
      );
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

  // Anti-Cheat Proctoring
  useEffect(() => {
    if (!sessionData?.id) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        setTabSwitchAlert(true);
        setTabSwitchCount((prev) => prev + 1);

        try {
          await fetch(`/api/session/${sessionData.id}/anti-cheat`, {
            method: "POST",
          });
        } catch (e) {
          console.error(e);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [sessionData?.id]);

  // Auto-save Jawaban ke Server
  const saveAnswerToServer = useCallback(
    async (qId: string, option: string | null, doubtful: boolean) => {
      if (!sessionData?.id) return;
      try {
        await fetch(`/api/session/${sessionData.id}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: qId,
            selectedOption: option,
            isDoubtful: doubtful,
          }),
        });
      } catch (err) {
        console.error("Failed to auto-save answer:", err);
      }
    },
    [sessionData?.id],
  );

  const handleSelectOption = (optionLetter: string) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const existing = answers[currentQ.id] || {
      selectedOption: null,
      isDoubtful: false,
    };
    const newSelected =
      existing.selectedOption === optionLetter ? null : optionLetter;

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

    const existing = answers[currentQ.id] || {
      selectedOption: null,
      isDoubtful: false,
    };
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
      if (["A", "B", "C", "D", "E"].includes(key)) {
        handleSelectOption(key);
      } else if (key >= "1" && key <= "5") {
        const letters = ["A", "B", "C", "D", "E"];
        const opt = letters[parseInt(key, 10) - 1];
        if (opt) handleSelectOption(opt);
      } else if (e.key === "ArrowRight") {
        if (currentIndex < questions.length - 1)
          setCurrentIndex(currentIndex + 1);
      } else if (e.key === "ArrowLeft") {
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, questions, answers, showSubmitModal, tabSwitchAlert]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  };

  const handleConfirmSubmit = async () => {
    if (!sessionData?.id) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/session/${sessionData.id}/submit`, {
        method: "POST",
      });
      const json = await res.json();

      if (json.success) {
        localStorage.removeItem("cbt_active_session");
        router.push(
          `/exam/${encodeURIComponent(token)}/result?sessionId=${sessionData.id}`,
        );
      } else {
        alert(json.message || "Gagal mengirim lembar jawaban.");
        setSubmitting(false);
      }
    } catch (err) {
      alert("Terjadi kendala jaringan saat mengumpulkan lembar jawaban.");
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
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-700">
            Mempersiapkan Lembar Ujian CBT...
          </p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) {
    return <div className="p-8 text-center text-xs">Soal tidak ditemukan.</div>;
  }

  const currentAnswer = answers[currentQ.id] || {
    selectedOption: null,
    isDoubtful: false,
  };

  const answeredCount = Object.values(answers).filter(
    (a) => a.selectedOption !== null,
  ).length;
  const doubtfulCount = Object.values(answers).filter(
    (a) => a.isDoubtful,
  ).length;
  const unansweredCount = questions.length - answeredCount;

  const textSizeClass =
    fontSize === "large"
      ? "text-base leading-relaxed"
      : fontSize === "xlarge"
        ? "text-lg leading-loose"
        : "text-sm leading-normal";

  const isTimerCritical = remainingSeconds <= 300;
  const isTimerWarning = remainingSeconds <= 900 && remainingSeconds > 300;

  return (
    <div className="flex-1 flex flex-col bg-slate-100 min-h-screen">
      {/* Top Professional CBT Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs px-4 py-2 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Identitas Peserta */}
          <div className="flex items-center gap-3">
            <CakrawalaLogo className="h-8 w-auto" height={32} />
            <div className="border-l border-slate-200 pl-3">
              <p className="font-bold text-xs sm:text-sm text-slate-900 truncate max-w-[180px] sm:max-w-xs">
                {sessionData?.studentName}
              </p>
              <p className="text-[11px] text-slate-500">
                {sessionData?.studentNisn
                  ? `NISN: ${sessionData.studentNisn}`
                  : "Peserta CBT"}{" "}
                • {sessionData?.studentSchool || "SNPDB MAN IC"}
              </p>
            </div>
          </div>

          {/* Sisa Waktu Ujian (Countdown) */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-mono font-bold text-sm border ${
                isTimerCritical
                  ? "bg-rose-50 border-rose-300 text-rose-700 animate-pulse"
                  : isTimerWarning
                    ? "bg-amber-50 border-amber-300 text-amber-800"
                    : "bg-slate-100 border-slate-300 text-slate-900"
              }`}
            >
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Sisa Waktu: {formatTime(remainingSeconds)}</span>
            </div>
          </div>

          {/* Tools & Submit */}
          <div className="flex items-center gap-2">
            {/* Font Size Adjuster */}
            <div className="hidden md:flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 text-[11px]">
              <button
                type="button"
                onClick={() => setFontSize("normal")}
                className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                  fontSize === "normal"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500"
                }`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize("large")}
                className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                  fontSize === "large"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500"
                }`}
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setFontSize("xlarge")}
                className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                  fontSize === "xlarge"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500"
                }`}
              >
                A++
              </button>
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer hidden sm:inline-flex"
              title="Layar Penuh"
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="px-3.5 py-1.5 rounded bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Selesai Tes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main CBT Workspace */}
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
          {/* Main Question Pane (8 cols) */}
          <div className="lg:col-span-8 flex flex-col space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-7 flex-1 flex flex-col justify-between">
              <div>
                {/* Header Soal */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded bg-slate-900 text-white font-bold text-xs tracking-wider">
                      SOAL NO. {currentQ.questionNumber}
                    </span>
                    {currentQ.subject && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                        {currentQ.subject}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    Bobot: +{currentQ.points}
                  </span>
                </div>

                {/* Teks Soal */}
                <div className="mt-5 text-slate-900 font-normal whitespace-pre-line select-none">
                  <p className={textSizeClass}>{currentQ.questionText}</p>
                </div>

                {/* Opsi Pilihan Ganda A, B, C, D, E */}
                <div className="mt-6 space-y-2.5">
                  {[
                    { key: "A", text: currentQ.optionA },
                    { key: "B", text: currentQ.optionB },
                    { key: "C", text: currentQ.optionC },
                    { key: "D", text: currentQ.optionD },
                    ...(currentQ.optionE
                      ? [{ key: "E", text: currentQ.optionE }]
                      : []),
                  ].map((opt) => {
                    const isSelected = currentAnswer.selectedOption === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSelectOption(opt.key)}
                        className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-start gap-3.5 cursor-pointer ${
                          isSelected
                            ? "bg-blue-50/90 border-blue-600 shadow-2xs"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected
                              ? "bg-blue-700 text-white"
                              : "border border-slate-300 text-slate-600"
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span
                          className={`pt-0.5 text-xs sm:text-sm ${
                            isSelected
                              ? "text-blue-950 font-semibold"
                              : "text-slate-800 font-normal"
                          }`}
                        >
                          {opt.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() =>
                    setCurrentIndex((prev) => Math.max(0, prev - 1))
                  }
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>

                {/* Ragu-Ragu Button */}
                <button
                  type="button"
                  onClick={handleToggleDoubtful}
                  className={`px-4 py-2 rounded-lg font-bold text-xs border transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentAnswer.isDoubtful
                      ? "bg-amber-400 text-amber-950 border-amber-500"
                      : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                  }`}
                >
                  <Flag className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {currentAnswer.isDoubtful
                      ? "Tandai Ragu (Aktif)"
                      : "Ragu-Ragu"}
                  </span>
                </button>

                {/* Selanjutnya Button */}
                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                    className="px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Simpan & Lanjut</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Selesai & Kumpulkan</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Grid Nomor Soal (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center justify-between pb-2.5 border-b border-slate-100">
                <span>Daftar Nomor Soal</span>
                <span className="font-mono text-slate-500">
                  {questions.length} Soal
                </span>
              </h3>

              {/* Status Rangkuman */}
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="p-2 rounded border border-blue-200 bg-blue-50 text-blue-900">
                  <p className="font-bold text-xs">{answeredCount}</p>
                  <p className="text-[10px] text-blue-700">Dijawab</p>
                </div>
                <div className="p-2 rounded border border-amber-200 bg-amber-50 text-amber-900">
                  <p className="font-bold text-xs">{doubtfulCount}</p>
                  <p className="text-[10px] text-amber-700">Ragu</p>
                </div>
                <div className="p-2 rounded border border-slate-200 bg-slate-50 text-slate-700">
                  <p className="font-bold text-xs">{unansweredCount}</p>
                  <p className="text-[10px] text-slate-500">Belum</p>
                </div>
              </div>
            </div>

            {/* Grid Butir Soal */}
            <div className="grid grid-cols-5 gap-2 max-h-[360px] overflow-y-auto pr-0.5">
              {questions.map((q, idx) => {
                const ans = answers[q.id];
                const isCurrent = idx === currentIndex;
                const isAnswered = ans && ans.selectedOption !== null;
                const isDoubtful = ans && ans.isDoubtful;

                let colorClasses =
                  "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100";
                if (isDoubtful) {
                  colorClasses =
                    "bg-amber-400 text-amber-950 font-bold border-amber-500";
                } else if (isAnswered) {
                  colorClasses =
                    "bg-blue-700 text-white font-bold border-blue-800";
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded text-xs font-bold border transition-all flex flex-col items-center justify-center cursor-pointer ${colorClasses} ${
                      isCurrent
                        ? "ring-2 ring-blue-600 ring-offset-1 font-black z-10"
                        : ""
                    }`}
                  >
                    <span>{q.questionNumber}</span>
                    {isAnswered && (
                      <span className="text-[9px] leading-none opacity-90">
                        {ans.selectedOption}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 space-y-0.5">
              <p className="font-semibold text-slate-600">Pintasan Keyboard:</p>
              <p>
                • Tekan{" "}
                <kbd className="px-1 bg-slate-100 rounded border">A</kbd>–
                <kbd className="px-1 bg-slate-100 rounded border">E</kbd> untuk
                memilih jawaban
              </p>
              <p>
                • Tekan{" "}
                <kbd className="px-1 bg-slate-100 rounded border">&larr;</kbd>{" "}
                dan{" "}
                <kbd className="px-1 bg-slate-100 rounded border">&rarr;</kbd>{" "}
                untuk navigasi nomor
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Anti-Cheat Proctoring */}
      {tabSwitchAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-rose-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Peringatan Pengawas CBT
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Anda terdeteksi berpindah tab atau meninggalkan jendela tes.
              Seluruh aktivitas tercatat dalam sistem evaluasi.
            </p>
            <div className="p-2 bg-rose-50 border border-rose-200 rounded text-xs font-bold text-rose-700">
              Pelanggaran Tercatat: {tabSwitchCount} kali
            </div>
            <button
              type="button"
              onClick={() => setTabSwitchAlert(false)}
              className="w-full py-2.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs cursor-pointer"
            >
              Kembali ke Soal Ujian
            </button>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Selesai Ujian */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Konfirmasi Kumpulkan Ujian
                </h3>
                <p className="text-xs text-slate-500">
                  Periksa lembar jawaban sebelum mengakhiri
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Soal Terjawab:</span>
                <span className="font-bold text-blue-800">
                  {answeredCount} Soal
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Masih Ragu-ragu:</span>
                <span className="font-bold text-amber-700">
                  {doubtfulCount} Soal
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Belum Dijawab:</span>
                <span className="font-bold text-rose-700">
                  {unansweredCount} Soal
                </span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200 leading-relaxed">
                Terdapat {unansweredCount} butir soal yang belum dijawab.
                Pilihan yang kosong tidak memperoleh poin.
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmSubmit}
                className="flex-1 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Ya, Kumpulkan</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
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
