"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";

interface StudentRegistration {
  username: string;
  password: string;
  studentName: string;
  studentSchool: string;
  studentWhatsapp: string;
}

export default function PaymentPage() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentRegistration | null>(null);
  const [selectedMethod, setSelectedMethod] = useState("transfer");

  useEffect(() => {
    const raw = sessionStorage.getItem("cbt_pending_student");
    if (!raw) {
      router.push("/admin/login");
      return;
    }

    try {
      setStudent(JSON.parse(raw));
    } catch {
      router.push("/admin/login");
    }
  }, [router]);

  if (!student) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-sm text-slate-500">Memuat halaman pembayaran...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => router.push("/admin/login")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Login
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                  Pendaftaran Berhasil
                </p>
                <h1 className="text-2xl font-bold text-slate-900">Halaman Pembayaran</h1>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-700">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                  Data Peserta
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Nama</span>
                    <span className="font-semibold text-slate-800">{student.studentName}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Sekolah</span>
                    <span className="font-semibold text-slate-800">{student.studentSchool}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">WhatsApp</span>
                    <span className="font-semibold text-slate-800">{student.studentWhatsapp}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-3">
                  Pilih Metode Pembayaran
                </div>
                <div className="space-y-2">
                  <label className="flex items-center justify-between rounded-lg border border-slate-200 p-3 cursor-pointer hover:border-blue-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment-method"
                        checked={selectedMethod === "transfer"}
                        onChange={() => setSelectedMethod("transfer")}
                      />
                      <div>
                        <div className="font-semibold text-slate-800">Transfer Bank</div>
                        <div className="text-xs text-slate-500">BCA / Mandiri / BNI</div>
                      </div>
                    </div>
                    <CreditCard className="w-4 h-4 text-slate-400" />
                  </label>

                  <label className="flex items-center justify-between rounded-lg border border-slate-200 p-3 cursor-pointer hover:border-blue-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment-method"
                        checked={selectedMethod === "ewallet"}
                        onChange={() => setSelectedMethod("ewallet")}
                      />
                      <div>
                        <div className="font-semibold text-slate-800">E-Wallet</div>
                        <div className="text-xs text-slate-500">Dana / OVO / GoPay</div>
                      </div>
                    </div>
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <aside className="bg-slate-900 text-white rounded-2xl p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Ringkasan</p>
            <h2 className="mt-3 text-3xl font-bold">Rp 150.000</h2>
            <p className="mt-2 text-sm text-slate-300">Pendaftaran ujian CBT SNPDB / persiapan simulasi</p>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between text-slate-300">
                <span>Username</span>
                <span className="font-medium text-white">{student.username}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Metode</span>
                <span className="font-medium text-white">
                  {selectedMethod === "transfer" ? "Transfer Bank" : "E-Wallet"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/admin/login")}
              className="mt-8 w-full rounded-xl bg-white text-slate-900 font-semibold py-3 transition hover:bg-slate-100"
            >
              Konfirmasi Pembayaran
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
