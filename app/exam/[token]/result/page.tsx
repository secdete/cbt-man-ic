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
  Lock,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import CakrawalaLogo from "@/components/CakrawalaLogo";
import FormattedQuestionText from "@/components/FormattedQuestionText";
import ExamCertificate from "@/components/ExamCertificate";

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
  const [showCertificate, setShowCertificate] = useState(false);
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
            Mengkalkulasi Lembar Jawaban &amp; Sertifikat...
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
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold text-xs cursor-pointer"
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

  const waMessage = encodeURIComponent(
    `Halo Admin Cakrawala Learning, saya *${session.studentName}* (${session.studentSchool}).\n\nSaya telah selesai mengerjakan simulasi *${exam.title}* di CBT SNPDB MAN IC dengan Skor: *${session.totalScore}* (Akurasi: ${session.accuracy}%).\n\nSaya ingin berkonsultasi dan mendaftar *Kelas Online Pembahasan Lengkap & Trik Lolos SNPDB MAN IC*. Terima kasih!`,
  );

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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCertificate(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>Unduh Sertifikat Resmi</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cetak Hasil</span>
          </button>
        </div>
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
                : "SELESAI MENGIKUTI SIMULASI"}
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
              Catatan Pengawas
            </p>
            <p
              className={`text-sm font-bold mt-1.5 ${
                session.tabSwitchCount > 0
                  ? "text-amber-700"
                  : "text-emerald-700"
              }`}
            >
              {session.tabSwitchCount > 0
                ? `${session.tabSwitchCount}x Pindah Tab`
                : "Tertib (0 Pelanggaran)"}
            </p>
          </div>
        </div>

        {/* Banner CTA Kelas Online & Pembahasan Intensif */}
        <div className="p-6 bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-5 border-t border-slate-800">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-800 text-blue-200 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Program Bimbingan Intensif SNPDB MAN IC</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Ingin Bahas Tuntas Soal &amp; Kuasai Trik Cepat Lolos MAN IC?
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed font-normal">
              Dapatkan bedah materi lengkap, kupas trik jawaban cepat, dan
              bimbingan langsung dari Master Tutor Cakrawala Learning.
            </p>
          </div>

          <a
            href={`https://wa.me/6281234567890?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs tracking-wide uppercase transition-all shadow-md flex items-center justify-center gap-2 flex-shrink-0"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Ikut Kelas Online &amp; Buka Pembahasan</span>
          </a>
        </div>
      </div>

      {/* Rincian Butir Soal */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Evaluasi Lembar Jawaban
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tinjau jawaban yang telah Anda pilih pada setiap butir soal
            </p>
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs">
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

                  {/* Pembahasan Terkunci / Lock Banner (Sesuai Arahan Pengguna) */}
                  <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200/80 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-blue-200 text-blue-900">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-blue-950 text-xs">
                          Pembahasan Analisis &amp; Trik Cepat Butir Soal #
                          {q.questionNumber}
                        </p>
                        <p className="text-[11px] text-slate-600">
                          Buka langkah penyelesaian runtut &amp; trik cepat di
                          kelas online bimbel Cakrawala.
                        </p>
                      </div>
                    </div>

                    <a
                      href={`https://wa.me/6281234567890?text=${waMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-end sm:self-center"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Buka Pembahasan</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Sertifikat Otomatis */}
      {showCertificate && (
        <ExamCertificate
          studentName={session.studentName}
          studentSchool={session.studentSchool || "Siswa Mandiri"}
          examTitle={exam.title}
          examCategory={exam.category}
          totalScore={session.totalScore}
          passingScore={session.passingScore}
          accuracy={session.accuracy}
          correctCount={session.correctCount}
          totalQuestions={questions.length}
          completedDate={new Date(
            session.endTime || session.createdAt,
          ).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          certificateNumber={
            session.certificateNumber ||
            `CERT-SNPDB/${new Date().getFullYear()}/${token}-001`
          }
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
}
