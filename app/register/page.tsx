"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-3 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-600">
          Mengarahkan ke Halaman Pendaftaran Akun Siswa...
        </p>
      </div>
    </div>
  );
}

