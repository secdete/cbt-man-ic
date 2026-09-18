"use client";

import { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Printer,
  BookOpen,
  BarChart3,
  Check,
  X,
  FileText,
} from "lucide-react";
import confetti from "canvas-confetti";
import CakrawalaLogo from "@/components/CakrawalaLogo";
import FormattedQuestionText from "@/components/FormattedQuestionText";

export default function ExamResultPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = decodeURIComponent(resolvedParams.token).toUpperCase();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "ALL" | "CORRECT" | "INCORRECT" | "UNANSWERED"
  >("ALL");

  useEffect(() => {
    if (!sessionId) {
      setErrorMessage("Sesi ujian tidak valid.");
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
              particleCount: 60,
              spread: 60,
              origin: { y: 0.6 },
            });
          }
        } else {
          setErrorMessage(json.message || "Gagal memuat hasil ujian.");
        }
      } catch (err) {
        setErrorMessage("Gagal menghubungi server.");
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-700">
            Mengkalkulasi Lembar Jawaban & Pembahasan...
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage || !data) {
    return (
      <div className="flex-1 max-w-md mx-auto p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <XCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">
          Hasil Tidak Ditemukan
        </h2>
        <p className="text-xs text-slate-500">
          {errorMessage || "Data ujian tidak tersedia."}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const { session, exam, subjectBreakdown, questions } = data;

  const filteredQuestions = questions.filter((q: any) => {
    if (activeFilter === "CORRECT") return q.isCorrect;
    if (activeFilter === "INCORRECT")
      return !q.isCorrect && q.studentAnswer !== null;
    if (activeFilter === "UNANSWERED") return q.studentAnswer === null;
    return true;
  });

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Beranda
        </Link>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Cetak Lembar Hasil</span>
        </button>
      </div>

      {/* Official Result Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <CakrawalaLogo className="h-11 w-auto" height={44} />
            <div className="border-l border-slate-700 pl-3">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-900 text-blue-200 border border-blue-700">
                {exam.category}
              </span>
              <h1 className="mt-1 text-lg sm:text-xl font-bold tracking-tight text-white">
                {exam.title}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Peserta:{" "}
                <span className="font-bold text-slate-200">
                  {session.studentName}
                </span>
                {session.studentNisn && ` (NISN: ${session.studentNisn})`}
                {session.studentSchool && ` • ${session.studentSchool}`}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-block text-xs font-bold px-3 py-1 rounded border tracking-wide uppercase ${
                session.isPassed
                  ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                  : "bg-amber-100 text-amber-900 border-amber-300"
              }`}
            >
              {session.isPassed
                ? "LULUS (MEMENUHI PASSING GRADE)"
                : "BELUM MEMENUHI PASSING GRADE"}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Passing Grade: {session.passingScore} Poin
            </p>
          </div>
        </div>

        {/* Ringkasan Angka Nilai */}
        <div className="p-6 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/50 text-center">
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <p className="text-[11px] font-semibold text-slate-500 uppercase">
              Total Skor
            </p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {session.totalScore}
              <span className="text-xs font-normal text-slate-400">
                {" "}
                / {session.maxPossibleScore}
              </span>
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <p className="text-[11px] font-semibold text-slate-500 uppercase">
              Akurasi Nilai
            </p>
            <p className="text-2xl font-black text-blue-800 mt-0.5">
              {session.accuracy}%
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <p className="text-[11px] font-semibold text-slate-500 uppercase">
              Jawaban Benar
            </p>
            <p className="text-2xl font-black text-emerald-700 mt-0.5">
              {session.correctCount}
              <span className="text-xs font-normal text-slate-400">
                {" "}
                / {questions.length}
              </span>
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <p className="text-[11px] font-semibold text-slate-500 uppercase">
              Salah / Kosong
            </p>
            <p className="text-2xl font-black text-slate-700 mt-0.5">
              <span className="text-rose-600">{session.incorrectCount}</span> /{" "}
              {session.unansweredCount}
            </p>
          </div>
        </div>

        {/* Breakdown Subtes */}
        {subjectBreakdown.length > 0 && (
          <div className="p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-blue-700" />
              <span>Analisis Perolehan Nilai Per Subtes</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {subjectBreakdown.map((s: any) => (
                <div
                  key={s.subject}
                  className="bg-white p-3 rounded-lg border border-slate-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-xs text-slate-800 truncate">
                      {s.subject}
                    </p>
                    <span className="text-xs font-bold text-blue-800">
                      {s.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-blue-700 h-full rounded-full"
                      style={{ width: `${s.percentage}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {s.correct} dari {s.total} soal benar ({s.points} Poin)
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lembar Pembahasan Soal */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-700" />
            <h2 className="text-base font-bold text-slate-900">
              Lembar Pembahasan Soal
            </h2>
          </div>

          {/* Filter Status */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveFilter("ALL")}
              className={`px-2.5 py-1 rounded cursor-pointer ${
                activeFilter === "ALL"
                  ? "bg-white text-slate-900 font-semibold shadow-2xs"
                  : "text-slate-600"
              }`}
            >
              Semua ({questions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("CORRECT")}
              className={`px-2.5 py-1 rounded cursor-pointer ${
                activeFilter === "CORRECT"
                  ? "bg-white text-emerald-800 font-semibold shadow-2xs"
                  : "text-slate-600"
              }`}
            >
              Benar ({session.correctCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("INCORRECT")}
              className={`px-2.5 py-1 rounded cursor-pointer ${
                activeFilter === "INCORRECT"
                  ? "bg-white text-rose-800 font-semibold shadow-2xs"
                  : "text-slate-600"
              }`}
            >
              Salah ({session.incorrectCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("UNANSWERED")}
              className={`px-2.5 py-1 rounded cursor-pointer ${
                activeFilter === "UNANSWERED"
                  ? "bg-white text-amber-800 font-semibold shadow-2xs"
                  : "text-slate-600"
              }`}
            >
              Kosong ({session.unansweredCount})
            </button>
          </div>
        </div>

        {/* Daftar Butir Soal */}
        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <p className="py-6 text-center text-slate-400 text-xs">
              Tidak ada butir soal dengan filter ini.
            </p>
          ) : (
            filteredQuestions.map((q: any) => {
              const options = [
                { key: "A", text: q.optionA },
                { key: "B", text: q.optionB },
                { key: "C", text: q.optionC },
                { key: "D", text: q.optionD },
                ...(q.optionE ? [{ key: "E", text: q.optionE }] : []),
              ];

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-lg border space-y-3 ${
                    q.isCorrect
                      ? "bg-slate-50/40 border-slate-200"
                      : q.studentAnswer === null
                        ? "bg-slate-50/80 border-slate-200"
                        : "bg-rose-50/20 border-rose-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs px-2.5 py-0.5 bg-slate-900 text-white rounded">
                        Soal No. {q.questionNumber}
                      </span>
                      {q.subject && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                          {q.subject}
                        </span>
                      )}
                    </div>

                    {q.isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Check className="w-3 h-3" />
                        Jawaban Anda Benar (+{q.points})
                      </span>
                    ) : q.studentAnswer === null ? (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        Tidak Dijawab (0)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                        <X className="w-3 h-3" />
                        Jawaban Salah (Pilihan Anda: {q.studentAnswer})
                      </span>
                    )}
                  </div>

                  <div className="text-xs sm:text-sm text-slate-900 leading-relaxed">
                    <FormattedQuestionText text={q.questionText} />
                  </div>

                  {/* Pilihan Jawaban */}
                  <div className="space-y-1.5">
                    {options.map((opt) => {
                      const isCorrectKey =
                        opt.key.toUpperCase() === q.correctAnswer.toUpperCase();
                      const isChosenByStudent =
                        opt.key.toUpperCase() ===
                        q.studentAnswer?.toUpperCase();

                      let optClasses =
                        "bg-white border-slate-200 text-slate-700";
                      if (isCorrectKey) {
                        optClasses =
                          "bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold";
                      } else if (isChosenByStudent && !isCorrectKey) {
                        optClasses =
                          "bg-rose-50 border-rose-300 text-rose-900 line-through";
                      }

                      return (
                        <div
                          key={opt.key}
                          className={`p-2.5 rounded border text-xs flex items-start gap-2.5 ${optClasses}`}
                        >
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] flex-shrink-0 ${
                              isCorrectKey
                                ? "bg-emerald-700 text-white"
                                : isChosenByStudent
                                  ? "bg-rose-600 text-white"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {opt.key}
                          </span>
                          <div className="pt-0.5 flex-1">
                            <FormattedQuestionText
                              text={opt.text}
                              isOption={true}
                            />
                          </div>
                          {isCorrectKey && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                              KUNCI RESMI
                            </span>
                          )}
                          {isChosenByStudent && !isCorrectKey && (
                            <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded">
                              PILIHAN ANDA
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Pembahasan */}
                  {q.explanation && (
                    <div className="p-3 rounded bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-1">
                      <p className="font-bold text-blue-900 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-blue-700" />
                        Pembahasan & Kunci Analisis:
                      </p>
                      <p className="leading-relaxed whitespace-pre-line text-slate-800 font-normal">
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
