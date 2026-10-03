"use client";

import React from "react";
import CakrawalaLogo from "@/components/CakrawalaLogo";
import { Award, Printer, CheckCircle, X } from "lucide-react";
import { CERTIFICATE_SIGNATORIES } from "@/lib/certificate-signatories";

interface CertificateProps {
  studentName: string;
  studentSchool: string;
  examTitle: string;
  examCategory: string;
  totalScore: number;
  maxScore?: number;
  passingScore: number;
  accuracy: number;
  correctCount: number;
  totalQuestions: number;
  grade?: string;
  completedDate: string;
  certificateNumber: string;
  verificationHash?: string;
  proctorName?: string;
  headmasterName?: string;
  onClose?: () => void;
}

export default function ExamCertificate({
  studentName,
  studentSchool,
  examTitle,
  examCategory,
  totalScore,
  maxScore = 100,
  passingScore,
  accuracy,
  correctCount,
  totalQuestions,
  grade,
  completedDate,
  certificateNumber,
  verificationHash,
  proctorName = CERTIFICATE_SIGNATORIES.proctor.name,
  headmasterName = CERTIFICATE_SIGNATORIES.headmaster.name,
  onClose,
}: CertificateProps) {
  const isPassed = totalScore >= passingScore;

  const calculatedGrade =
    grade ||
    (totalScore >= passingScore * 1.25
      ? "SANGAT MEMUASKAN (LULUS)"
      : isPassed
        ? "MEMUASKAN (LULUS)"
        : "SELESAI MENGIKUTI");

  const hash =
    verificationHash ||
    `VERIF-${certificateNumber.replace(/[^a-zA-Z0-9]/g, "")}-${Math.abs(
      (studentName.length * 31 + Math.round(totalScore)) % 100000,
    ).toString(16).toUpperCase()}`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    `https://cbt.cakrawala-edu.com/verify?cert=${certificateNumber}&hash=${hash}`,
  )}`;

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
                No. Verifikasi:{" "}
                <span className="font-bold text-slate-700">
                  {certificateNumber}
                </span>
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
                Asal Madrasah / Sekolah:{" "}
                <span className="text-slate-900 font-bold">
                  {studentSchool}
                </span>
              </p>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2">
                Telah menyelesaikan simulasi Computer-Based Test (CBT) Seleksi
                Nasional Peserta Didik Baru (SNPDB) Madrasah Aliyah Negeri Insan
                Cendekia pada naskah:
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
                    <span className="text-xs font-normal text-slate-400"> / {maxScore}</span>
                  </p>
                  <p className="text-[9px] text-slate-400">
                    Passing: {passingScore}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">
                    Predikat
                  </p>
                  <div className="mt-0.5">
                    <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-100 text-[#B45309] border border-amber-200">
                      {calculatedGrade}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    Akurasi: {accuracy}%
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">
                    Status Verifikasi
                  </p>
                  <p className="text-xs font-black mt-1 text-emerald-700 flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>TERVERIFIKASI</span>
                  </p>
                  <p className="text-[9px] text-slate-400">
                    {correctCount}/{totalQuestions} Soal Benar
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Signature, QR Code & Date */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="grid grid-cols-3 items-end text-center px-4">
                {/* Left: Proctor Signature */}
                <div className="text-center space-y-1">
                  <p className="text-[10px] text-slate-500 mb-10">
                    {CERTIFICATE_SIGNATORIES.proctor.role}
                  </p>
                  <div className="h-8 flex items-center justify-center">
                    <span className="font-serif italic font-bold text-slate-900 text-[11px] tracking-normal whitespace-nowrap border-b border-slate-700 px-3">
                      {proctorName}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono">
                    {CERTIFICATE_SIGNATORIES.proctor.meta}
                  </p>
                </div>

                {/* Center: QR Code Verifikasi */}
                <div className="flex flex-col items-center justify-center">
                  <div className="p-1 bg-white border border-slate-300 rounded shadow-2xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrUrl}
                      alt="QR Code Verifikasi Sertifikat"
                      className="w-14 h-14 object-contain"
                    />
                  </div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-1 font-semibold">
                    Scan untuk Verifikasi
                  </p>
                </div>

                {/* Right: Headmaster Signature */}
                <div className="text-center space-y-1">
                  <p className="text-[10px] text-slate-500 mb-10">
                    {CERTIFICATE_SIGNATORIES.headmaster.role}
                  </p>
                  <div className="h-8 flex items-center justify-center">
                    <span className="font-serif italic font-bold text-blue-950 text-[11px] tracking-normal whitespace-nowrap border-b border-slate-700 px-3">
                      {headmasterName}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono">
                    {CERTIFICATE_SIGNATORIES.headmaster.meta}
                  </p>
                </div>
              </div>

              {/* Bottom Security Bar */}
              <div className="border-t border-slate-100 mt-4 pt-2 flex items-center justify-between text-[9px] text-slate-400 font-mono px-4">
                <span>Dokumen sah digital CBT Cakrawala berdasarkan UU ITE.</span>
                <span className="font-bold text-slate-600">Hash: {hash}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
