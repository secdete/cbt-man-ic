"use client";

import React from "react";
import CakrawalaLogo from "@/components/CakrawalaLogo";
import { Award, Printer, CheckCircle, X } from "lucide-react";

interface CertificateProps {
  studentName: string;
  studentSchool: string;
  examTitle: string;
  examCategory: string;
  totalScore: number;
  passingScore: number;
  accuracy: number;
  correctCount: number;
  totalQuestions: number;
  completedDate: string;
  certificateNumber: string;
  onClose?: () => void;
}

export default function ExamCertificate({
  studentName,
  studentSchool,
  examTitle,
  examCategory,
  totalScore,
  passingScore,
  accuracy,
  correctCount,
  totalQuestions,
  completedDate,
  certificateNumber,
  onClose,
}: CertificateProps) {
  const isPassed = totalScore >= passingScore;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      {/* Container Modal (Print area isolated via print: styles) */}
      <div className="relative max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-auto">
        {/* Action Header Bar (Hidden during print) */}
        <div className="print:hidden bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">
              Sertifikat Hasil Tryout SNPDB MAN IC
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* CERTIFICATE CANVAS (Print Target) */}
        {/* ========================================================= */}
        <div
          id="certificate-print-area"
          className="p-8 sm:p-12 bg-white text-slate-900 print:p-8 select-none relative"
          style={{
            backgroundImage:
              "radial-gradient(circle at center, #ffffff 60%, #f8fafc 100%)",
          }}
        >
          {/* Ornate Outer Border */}
          <div className="border-4 border-double border-amber-600/80 rounded-xl p-6 sm:p-8 relative">
            {/* Corner Decorative Ornaments */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-amber-700" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-amber-700" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-amber-700" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-amber-700" />

            {/* Certificate Header */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-3">
                <CakrawalaLogo className="h-12 w-auto" height={48} />
              </div>

              <p className="text-[11px] uppercase tracking-[0.25em] font-bold text-amber-800 pt-1">
                CAKRAWALA LEARNING CENTER • PORTAL CBT SNPDB MAN IC
              </p>

              <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-slate-900 uppercase pt-2">
                Sertifikat Hasil Tryout
              </h1>

              <p className="text-xs font-mono text-slate-500">
                No. Verifikasi: <span className="font-bold text-slate-700">{certificateNumber}</span>
              </p>
            </div>

            {/* Separator Divider */}
            <div className="my-6 flex items-center justify-center">
              <div className="h-0.5 w-16 bg-amber-600/60" />
              <div className="mx-3 text-amber-600 font-serif">✦</div>
              <div className="h-0.5 w-16 bg-amber-600/60" />
            </div>

            {/* Body Statement */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <p className="text-xs sm:text-sm text-slate-600 font-serif italic">
                Diberikan secara resmi kepada:
              </p>

              <h2 className="text-xl sm:text-3xl font-extrabold text-blue-950 underline decoration-amber-500/70 underline-offset-8 tracking-tight">
                {studentName}
              </h2>

              <p className="text-xs sm:text-sm font-semibold text-slate-700">
                Asal Madrasah / Sekolah: <span className="text-slate-900 font-bold">{studentSchool}</span>
              </p>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2">
                Telah menyelesaikan simulasi Computer-Based Test (CBT) Seleksi Nasional Peserta Didik Baru (SNPDB) Madrasah Aliyah Negeri Insan Cendekia pada naskah:
              </p>

              <div className="inline-block px-4 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
                <p className="font-bold text-xs sm:text-sm text-blue-900">
                  {examTitle}
                </p>
                <p className="text-[10px] text-blue-700 uppercase font-semibold">
                  {examCategory}
                </p>
              </div>

              {/* Score Recap Matrix */}
              <div className="grid grid-cols-3 gap-3 pt-3 max-w-lg mx-auto">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">
                    Skor Akhir
                  </p>
                  <p className="text-lg font-black text-blue-900">
                    {totalScore}
                  </p>
                  <p className="text-[9px] text-slate-400">
                    Passing: {passingScore}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">
                    Akurasi
                  </p>
                  <p className="text-lg font-black text-emerald-800">
                    {accuracy}%
                  </p>
                  <p className="text-[9px] text-slate-400">
                    {correctCount}/{totalQuestions} Benar
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">
                    Kualifikasi
                  </p>
                  <p
                    className={`text-xs font-black mt-1 ${
                      isPassed ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {isPassed ? "LULUS" : "SELESAI"}
                  </p>
                  <p className="text-[9px] text-slate-400">
                    {isPassed ? "Memenuhi Syarat" : "Tingkatkan Latihan"}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Signature & Date */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex items-end justify-between px-4">
              {/* Left: Security Digital Seal */}
              <div className="text-left space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                  <CheckCircle className="w-4 h-4" />
                  <span>TERVERIFIKASI SISTEM CBT</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  Diterbitkan pada: {completedDate}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Platform: cbt.cakrawala-edu.com
                </p>
              </div>

              {/* Right: Signature */}
              <div className="text-center space-y-1">
                <div className="h-10 flex items-center justify-center">
                  <span className="font-serif italic font-bold text-blue-950 text-sm tracking-widest border-b-2 border-slate-900 px-4">
                    Tim Pengembang Cakrawala
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  Direktur Akademik &amp; CBT
                </p>
                <p className="text-[9px] text-slate-400">
                  Cakrawala Learning Center
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

