"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, LogOut, LogIn } from "lucide-react";

interface StudentInfo {
  id: string;
  name: string;
  nisn: string;
  school: string | null;
}

export default function HeaderStudentStatus() {
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/student/me");
        const json = await res.json();
        if (json.success && json.student) {
          setStudent(json.student);
        } else {
          setStudent(null);
        }
      } catch {
        setStudent(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();

    // Listen for custom auth change event
    const handleAuthChange = () => checkAuth();
    window.addEventListener("cbt_auth_changed", handleAuthChange);
    return () => {
      window.removeEventListener("cbt_auth_changed", handleAuthChange);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/student/logout", { method: "POST" });
      sessionStorage.removeItem("cbt_student_data");
      setStudent(null);
      window.dispatchEvent(new Event("cbt_auth_changed"));
      window.location.href = "/";
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-lg hidden sm:block" />
    );
  }

  if (!student) {
    return (
      <Link
        href="/#auth"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Masuk / Daftar</span>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-xs">
        <span className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-[11px]">
          {student.name.charAt(0).toUpperCase()}
        </span>
        <div className="text-left">
          <p className="font-bold text-slate-800 leading-tight line-clamp-1 max-w-[120px]">
            {student.name}
          </p>
          <p className="text-[10px] text-slate-500 font-mono leading-none">
            {student.nisn}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        title="Keluar dari akun"
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span className="hidden md:inline text-[11px]">Keluar</span>
      </button>
    </div>
  );
}

