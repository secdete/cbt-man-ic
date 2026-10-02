"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle2,
  Maximize2,
  ShieldAlert,
  Send,
  Lock,
  Wifi,
  WifiOff,
  LayoutGrid,
  X,
} from "lucide-react";
import CakrawalaLogo from "@/components/CakrawalaLogo";
import FormattedQuestionText from "@/components/FormattedQuestionText";

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
  const [showMobileNav, setShowMobileNav] = useState(false);

  // Anti-Cheat Proctoring States
  const [tabSwitchAlert, setTabSwitchAlert] = useState(false);
  const [violationReason, setViolationReason] = useState("");
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoSubmittedDueToCheat, setAutoSubmittedDueToCheat] = useState(false);
  const lastViolationRef = useRef(0);

  // Network Online/Offline Monitor
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Inisialisasi Sesi Ujian
  useEffect(() => {
    const restoreSession = async () => {
      const rawActive = localStorage.getItem("cbt_active_session");
      if (!rawActive) {
        router.replace(`/exam/${encodeURIComponent(token)}`);
        return;
      }

      try {
        const active = JSON.parse(rawActive);
        const statusResponse = await fetch(
          `/api/session/${active.session?.id}/anti-cheat`,
          { cache: "no-store" },
        );
        const statusJson = await statusResponse.json();

        if (!statusJson.success || statusJson.data?.status !== "IN_PROGRESS") {
          localStorage.removeItem("cbt_active_session");
          router.replace(`/exam/${encodeURIComponent(token)}`);
          return;
        }

        setSessionData(active.session);
        setQuestions(active.questions || []);
        setAnswers(active.savedAnswers || {});
        setRemainingSeconds(
          active.remainingSeconds || active.exam.durationMinutes * 60,
        );
        setTabSwitchCount(statusJson.data.tabSwitchCount || 0);

        // Sinkronisasi soal naskah terbaru dari server
        if (active.exam?.id) {
          fetch(`/api/exams/${active.exam.id}`)
            .then((res) => res.json())
            .then((json) => {
              if (
                json.success &&
                json.data?.questions &&
                json.data.questions.length > 0
              ) {
                setQuestions(json.data.questions);
              }
            })
            .catch((err) => console.warn("Auto-sync questions warning:", err));
        }
      } catch (e) {
        console.error(e);
        localStorage.removeItem("cbt_active_session");
        router.replace(`/exam/${encodeURIComponent(token)}`);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
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

  // Submit Handler
  const handleConfirmSubmit = useCallback(async () => {
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
  }, [sessionData?.id, token, router]);

  const handleAutoSubmit = useCallback(() => {
    handleConfirmSubmit();
  }, [handleConfirmSubmit]);

  // Trigger Pelanggaran Anti-Cheat dengan debounce
  const triggerViolation = useCallback(
    async (reason: string) => {
      const now = Date.now();
      // Debounce 2.5 detik agar tidak terhitung ganda dalam satu aksi
      if (now - lastViolationRef.current < 2500) return;
      lastViolationRef.current = now;

      setViolationReason(reason);
      setTabSwitchAlert(true);
      const nextCount = tabSwitchCount + 1;
      setTabSwitchCount(nextCount);

      if (!sessionData?.id) return;

      try {
        const antiCheatResponse = await fetch(
          `/api/session/${sessionData.id}/anti-cheat`,
          {
            method: "POST",
          },
        );
        const antiCheatJson = await antiCheatResponse.json();
        const recordedCount = antiCheatJson.tabSwitchCount || nextCount;
        setTabSwitchCount(recordedCount);

        // Jika pelanggaran mencapai 3 kali, otomatis submit paksa setelah
        // server selesai mencatat pelanggaran tersebut.
        if (recordedCount >= 3) {
          setAutoSubmittedDueToCheat(true);
          handleAutoSubmit();
        }
      } catch (e) {
        console.error(e);
      }
    },
    [tabSwitchCount, sessionData?.id, handleAutoSubmit],
  );

  // Fullscreen & Window Anti-Cheat Listeners
  useEffect(() => {
    if (loading || !sessionData?.id) return;

    // 1. Cek perubahan status fullscreen
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (!isFs && !showSubmitModal) {
        triggerViolation(
          "Anda terdeteksi keluar dari Mode Layar Penuh (Fullscreen)!",
        );
      }
    };

    // 2. Cek tab switch / minimize browser
    const handleVisibilityChange = () => {
      if (document.hidden && !showSubmitModal) {
        triggerViolation(
          "Anda terdeteksi berpindah tab atau meminimalkan browser ujian!",
        );
      }
    };

    // 3. Cek window blur (mengklik aplikasi di luar browser)
    const handleWindowBlur = () => {
      if (!showSubmitModal) {
        triggerViolation(
          "Anda terdeteksi mengalihkan fokus dari jendela lembar ujian!",
        );
      }
    };

    // 4. Cegah inspect element shortcuts dan copy/paste
    const handlePreventCheatingKeys = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) &&
          (e.key === "u" ||
            e.key === "U" ||
            e.key === "s" ||
            e.key === "S" ||
            e.key === "p" ||
            e.key === "P" ||
            e.key === "c" ||
            e.key === "C" ||
            e.key === "v" ||
            e.key === "V")) ||
        ((e.ctrlKey || e.metaKey) &&
          e.shiftKey &&
          (e.key === "I" ||
            e.key === "i" ||
            e.key === "J" ||
            e.key === "j" ||
            e.key === "C" ||
            e.key === "c"))
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("keydown", handlePreventCheatingKeys);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("keydown", handlePreventCheatingKeys);
    };
  }, [loading, sessionData?.id, showSubmitModal, triggerViolation]);

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

  // Keyboard Navigation Shortcuts
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
          setCurrentIndex((prev) => prev + 1);
      } else if (e.key === "ArrowLeft") {
        if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
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

  const reEnterFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    setTabSwitchAlert(false);
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
  const currentAnswer = currentQ ? answers[currentQ.id] : null;
  const answeredCount = Object.values(answers).filter(
    (a) => a.selectedOption !== null && !a.isDoubtful,
  ).length;
  const doubtfulCount = Object.values(answers).filter(
    (a) => a.isDoubtful,
  ).length;
  const unansweredCount = questions.length - answeredCount - doubtfulCount;

  return (
    <div
      className="flex-1 flex flex-col min-h-screen bg-slate-100 select-none pb-24 lg:pb-8"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
    >
      {/* Top Test Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-13 sm:h-14 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <CakrawalaLogo className="h-7 sm:h-8 w-auto flex-shrink-0" height={32} />
            <div className="border-l border-slate-700 pl-2.5 sm:pl-3 min-w-0">
              <p className="font-bold text-xs tracking-tight text-white line-clamp-1">
                {sessionData?.exam?.title || "Simulasi SNPDB MAN IC"}
              </p>
              <p className="text-[10px] text-slate-400 truncate hidden xs:block">
                Peserta: {sessionData?.studentName}
              </p>
            </div>
          </div>

          {/* Anti-cheat Violation Counter, Network Status & Timer */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Network Indicator Badge */}
            <div
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                isOnline
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                  : "bg-amber-950/80 text-amber-300 border-amber-700 animate-pulse"
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400" />
                  <span>Offline (Tersimpan)</span>
                </>
              )}
            </div>

            {tabSwitchCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                <ShieldAlert className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Pelanggaran:</span>
                <span>{tabSwitchCount}/3</span>
              </span>
            )}

            {/* Countdown Timer */}
            <div
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border font-mono font-bold text-xs sm:text-sm ${
                remainingSeconds < 300
                  ? "bg-rose-950/80 border-rose-700 text-rose-300 animate-pulse"
                  : "bg-slate-800 border-slate-700 text-blue-300"
              }`}
            >
              <Clock className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-blue-400" />
              <span>{formatTime(remainingSeconds)}</span>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1 sm:gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Selesai Ujian</span>
              <span className="sm:hidden text-[11px]">Selesai</span>
            </button>
          </div>
        </div>
      </header>

      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-3 py-2 text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-2 shadow-sm text-center">
          <WifiOff className="w-4 h-4 shrink-0 text-slate-900" />
          <span>
            Koneksi terputus. Jawaban Anda tetap tersimpan otomatis di perangkat dan disinkronkan saat online.
          </span>
        </div>
      )}

      {/* Main Examination Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Left Column: Question Area (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-7 relative overflow-hidden">
          {/* Subtle Anti-Photo Watermark */}
          <div className="pointer-events-none select-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-[0.035]">
            <div className="rotate-[-25deg] text-center font-black tracking-widest text-slate-900 leading-relaxed text-xs sm:text-sm whitespace-pre">
              {`${(sessionData?.studentName || "PESERTA").toUpperCase()} • ${(sessionData?.studentSchool || "SEKOLAH").toUpperCase()}\nTOKEN: ${token} • CBT MAN IC\n`.repeat(
                12,
              )}
            </div>
          </div>

          <div className="relative z-10 space-y-5 sm:space-y-6">
            {/* Question Header & Font Resizer */}
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="font-extrabold text-xs sm:text-sm px-2.5 sm:px-3 py-1 bg-slate-900 text-white rounded-lg whitespace-nowrap">
                  Soal No.{" "}
                  {currentQ ? currentQ.questionNumber : currentIndex + 1}
                </span>
                {currentQ?.subject && (
                  <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 truncate">
                    {currentQ.subject}
                  </span>
                )}
              </div>

              {/* Font Size Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 sm:p-1 rounded-lg text-xs flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setFontSize("normal")}
                  className={`px-1.5 sm:px-2 py-0.5 rounded font-bold cursor-pointer ${
                    fontSize === "normal"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500"
                  }`}
                  title="Ukuran Font Normal"
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize("large")}
                  className={`px-1.5 sm:px-2 py-0.5 rounded font-bold text-sm cursor-pointer ${
                    fontSize === "large"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500"
                  }`}
                  title="Ukuran Font Besar"
                >
                  A+
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize("xlarge")}
                  className={`px-1.5 sm:px-2 py-0.5 rounded font-bold text-base cursor-pointer ${
                    fontSize === "xlarge"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500"
                  }`}
                  title="Ukuran Font Ekstra Besar"
                >
                  A++
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div
              className={`text-slate-900 leading-relaxed overflow-x-auto ${
                fontSize === "normal"
                  ? "text-sm sm:text-base"
                  : fontSize === "large"
                    ? "text-base sm:text-lg"
                    : "text-lg sm:text-xl"
              }`}
            >
              {currentQ && (
                <FormattedQuestionText text={currentQ.questionText} />
              )}
            </div>

            {/* Options A - E */}
            {currentQ && (
              <div className="space-y-2.5 sm:space-y-3 pt-1 sm:pt-2">
                {[
                  { key: "A", text: currentQ.optionA },
                  { key: "B", text: currentQ.optionB },
                  { key: "C", text: currentQ.optionC },
                  { key: "D", text: currentQ.optionD },
                  ...(currentQ.optionE
                    ? [{ key: "E", text: currentQ.optionE }]
                    : []),
                ]
                  .filter(
                    (opt) =>
                      opt.text &&
                      opt.text.trim() !== "" &&
                      opt.text.trim() !== "-" &&
                      opt.text.trim() !== `Pilihan ${opt.key}`,
                  )
                  .map((opt) => {
                    const isSelected =
                      currentAnswer?.selectedOption === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSelectOption(opt.key)}
                        className={`w-full p-2.5 sm:p-3.5 rounded-xl border text-left flex items-start gap-2.5 sm:gap-3.5 transition-all cursor-pointer min-h-[44px] ${
                          isSelected
                            ? "bg-blue-50 border-blue-600 shadow-2xs text-blue-950"
                            : "bg-slate-50/60 border-slate-200 hover:bg-slate-100/70 text-slate-800"
                        }`}
                      >
                        <span
                          className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors ${
                            isSelected
                              ? "bg-blue-700 text-white shadow-xs"
                              : "bg-white text-slate-700 border border-slate-300"
                          }`}
                        >
                          {opt.key}
                        </span>
                        <div className="pt-0.5 flex-1 text-xs sm:text-sm overflow-x-auto">
                          <FormattedQuestionText
                            text={opt.text}
                            isOption={true}
                          />
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}

            {/* Navigation Controls & Doubtful Button */}
            <div className="pt-5 sm:pt-6 border-t border-slate-100 grid grid-cols-3 gap-2 sm:flex sm:items-center sm:justify-between sm:gap-3">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="py-2.5 px-2 sm:px-4 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden xs:inline">Sebelumnya</span>
                <span className="xs:hidden">Prev</span>
              </button>

              <button
                type="button"
                onClick={handleToggleDoubtful}
                className={`py-2.5 px-2 sm:px-4 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                  currentAnswer?.isDoubtful
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100"
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>
                  {currentAnswer?.isDoubtful ? "Yakin" : "Ragu-ragu"}
                </span>
              </button>

              <button
                type="button"
                disabled={currentIndex === questions.length - 1}
                onClick={() =>
                  setCurrentIndex((prev) =>
                    Math.min(questions.length - 1, prev + 1),
                  )
                }
                className="py-2.5 px-2 sm:px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <span className="hidden xs:inline">Selanjutnya</span>
                <span className="xs:hidden">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Desktop Numbers Navigation Matrix */}
        <div className="hidden lg:block lg:col-span-4 bg-white rounded-xl shadow-xs border border-slate-200 p-4 space-y-3 sticky top-20">
          <div className="pb-2.5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Nomor Soal ({questions.length})
            </h3>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              {answeredCount + doubtfulCount}/{questions.length} Terjawab
            </span>
          </div>

          {/* Legend Indicators */}
          <div className="flex items-center gap-3 text-[11px] text-slate-600 pb-2 border-b border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-700 inline-block" />
              Terjawab
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
              Ragu
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-300 inline-block" />
              Kosong
            </span>
          </div>

          {/* Compact Number Grid (10 kolom) */}
          <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5">
            {questions.map((q, idx) => {
              const ans = answers[q.id];
              const isCurrent = idx === currentIndex;
              const isAnswered = ans && ans.selectedOption && !ans.isDoubtful;
              const isDoubt = ans && ans.isDoubtful;

              let colorClasses =
                "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300";
              if (isAnswered) {
                colorClasses =
                  "bg-blue-700 border-blue-700 text-white font-bold";
              } else if (isDoubt) {
                colorClasses =
                  "bg-amber-500 border-amber-500 text-white font-bold";
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-8 sm:h-8.5 rounded-md text-[11px] font-bold border transition-all flex flex-col items-center justify-center cursor-pointer p-0.5 ${colorClasses} ${
                    isCurrent
                      ? "ring-2 ring-blue-600 ring-offset-1 font-black z-10 scale-105 shadow-xs"
                      : ""
                  }`}
                  title={`Soal No. ${q.questionNumber}${ans?.selectedOption ? ` (Jawaban: ${ans.selectedOption})` : ""}`}
                >
                  <span className="leading-none">{q.questionNumber}</span>
                  {ans?.selectedOption && (
                    <span className="text-[8px] leading-none font-black opacity-95 mt-0.5">
                      {ans.selectedOption}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Shortcuts Info */}
          <div className="pt-2.5 border-t border-slate-100 text-[10px] text-slate-500 flex flex-wrap items-center justify-between gap-1">
            <span>
              <kbd className="px-1 bg-slate-100 rounded border font-mono">
                A
              </kbd>
              –
              <kbd className="px-1 bg-slate-100 rounded border font-mono">
                E
              </kbd>{" "}
              Opsi
            </span>
            <span>
              <kbd className="px-1 bg-slate-100 rounded border font-mono">
                &larr;
              </kbd>
              <kbd className="px-1 bg-slate-100 rounded border font-mono">
                &rarr;
              </kbd>{" "}
              Nomor
            </span>
            <span>
              <kbd className="px-1 bg-slate-100 rounded border font-mono">
                R
              </kbd>{" "}
              Ragu
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-white px-3 py-2 flex items-center justify-between gap-2 shadow-2xl safe-area-bottom">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => {
            setCurrentIndex((prev) => Math.max(0, prev - 1));
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-30"
          title="Soal Sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden xs:inline">Prev</span>
        </button>

        <button
          type="button"
          onClick={() => setShowMobileNav(true)}
          className="flex-1 max-w-[230px] py-2 px-3 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
          title="Buka Lembar Kisi Nomor Soal"
        >
          <LayoutGrid className="w-4 h-4" />
          <span>
            Soal No. {currentQ ? currentQ.questionNumber : currentIndex + 1}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/80 text-blue-200 font-semibold">
            {answeredCount + doubtfulCount}/{questions.length}
          </span>
        </button>

        <button
          type="button"
          disabled={currentIndex === questions.length - 1}
          onClick={() => {
            setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-30"
          title="Soal Selanjutnya"
        >
          <span className="hidden xs:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Slide-up Drawer Sheet (Daftar Nomor Soal) */}
      {showMobileNav && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setShowMobileNav(false)}
          />
          <div className="relative z-10 bg-white rounded-t-2xl shadow-2xl border-t border-slate-200 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* Drag Handle */}
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1" />

            {/* Sheet Header */}
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-slate-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Daftar Nomor Soal ({questions.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  {answeredCount + doubtfulCount}/{questions.length} Terjawab
                </span>
                <button
                  type="button"
                  onClick={() => setShowMobileNav(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  title="Tutup Lembar Nomor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-around text-[11px] text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-blue-700 inline-block" />
                Terjawab ({answeredCount})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
                Ragu ({doubtfulCount})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-200 border border-slate-300 inline-block" />
                Kosong ({unansweredCount})
              </span>
            </div>

            {/* Number Matrix Grid */}
            <div className="p-3 sm:p-4 overflow-y-auto max-h-[50vh] grid grid-cols-6 xs:grid-cols-7 sm:grid-cols-10 gap-1.5">
              {questions.map((q, idx) => {
                const ans = answers[q.id];
                const isCurrent = idx === currentIndex;
                const isAnswered = ans && ans.selectedOption && !ans.isDoubtful;
                const isDoubt = ans && ans.isDoubtful;

                let colorClasses =
                  "bg-slate-50 border-slate-200 text-slate-700 active:bg-slate-200";
                if (isAnswered) {
                  colorClasses =
                    "bg-blue-700 border-blue-700 text-white font-bold";
                } else if (isDoubt) {
                  colorClasses =
                    "bg-amber-500 border-amber-500 text-white font-bold";
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowMobileNav(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`h-10 rounded-lg text-xs font-bold border transition-all flex flex-col items-center justify-center cursor-pointer p-0.5 ${colorClasses} ${
                      isCurrent
                        ? "ring-2 ring-blue-600 ring-offset-2 scale-105 shadow-md z-10"
                        : ""
                    }`}
                  >
                    <span className="leading-none text-xs">{q.questionNumber}</span>
                    {ans?.selectedOption && (
                      <span className="text-[9px] leading-none font-black opacity-90 mt-0.5">
                        {ans.selectedOption}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sheet Footer Actions */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleToggleDoubtful}
                className={`flex-1 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                  currentAnswer?.isDoubtful
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white text-amber-900 border-amber-300"
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{currentAnswer?.isDoubtful ? "Tandai Yakin" : "Tandai Ragu"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMobileNav(false);
                  setShowSubmitModal(true);
                }}
                className="flex-1 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kumpulkan Ujian</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Anti-Cheat Proctoring Warning */}
      {tabSwitchAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-rose-300 text-center space-y-4 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                {tabSwitchCount >= 3
                  ? "Batas Pelanggaran Terlampaui!"
                  : "Peringatan Pengawasan CBT"}
              </h3>
              <p className="text-xs text-rose-800 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200">
                {violationReason || "Anda terdeteksi meninggalkan layar ujian!"}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span>Pelanggaran Tercatat:</span>
                <span className="text-rose-600 text-sm">
                  {tabSwitchCount} / 3 Kali
                </span>
              </div>
              <p className="text-[11px] text-slate-500 text-left pt-1 leading-relaxed">
                Sistem pengawas mendeteksi aktivitas di luar lembar ujian. Jika
                melakukan 3 kali pelanggaran, lembar jawaban Anda akan otomatis
                dikumpulkan ke server dan sesi ujian diakhiri.
              </p>
            </div>

            {tabSwitchCount >= 3 ? (
              <div className="p-3 bg-rose-600 text-white rounded-xl text-xs font-bold animate-pulse">
                Ujian sedang dikumpulkan otomatis ke server oleh pengawas...
              </div>
            ) : (
              <button
                type="button"
                onClick={reEnterFullscreen}
                className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Kembali ke Ujian &amp; Masuk Fullscreen (Wajib)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Selesai Ujian */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 sm:p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
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
                className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmSubmit}
                className="flex-1 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
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
