"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Clock,
  KeyRound,
  FileUp,
  Check,
} from "lucide-react";

interface EditableQuestion {
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string;
  correctAnswer: string;
  explanation?: string;
  subject?: string;
  points: number;
}

export default function CreateExamPage() {
  const router = useRouter();

  // Step 1: Info Ujian
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("SNPDB MAN IC");
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [token, setToken] = useState("");
  const [passingScore, setPassingScore] = useState(65);

  // Tab Ekstraksi
  const [inputMode, setInputMode] = useState<"PDF" | "TEXT">("PDF");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Step 2: Butir Soal
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [saving, setSaving] = useState(false);

  // Generate acak token unik
  const generateRandomToken = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let res = "IC";
    for (let i = 0; i < 4; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setToken(res);
  };

  // Handle Upload & Ekstraksi PDF
  const handleParsePDF = async () => {
    if (!selectedFile) {
      setParseMessage({
        type: "error",
        text: "Silakan pilih berkas PDF terlebih dahulu.",
      });
      return;
    }

    setParsing(true);
    setParseMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/exams/parse-pdf", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (json.success && Array.isArray(json.questions)) {
        if (json.questions.length === 0) {
          setParseMessage({
            type: "error",
            text: "Tidak ada pola butir soal yang terdeteksi secara otomatis. Silakan cek teks atau gunakan tab Paste Teks.",
          });
        } else {
          setQuestions(json.questions);
          setParseMessage({
            type: "success",
            text: `Berhasil mengekstrak ${json.questions.length} butir soal dari berkas "${selectedFile.name}"! Silakan tinjau dan perbaiki di bawah.`,
          });
          // Set judul default jika masih kosong
          if (!title) {
            const cleanName = selectedFile.name
              .replace(/\.[^/.]+$/, "")
              .replace(/[-_]/g, " ");
            setTitle(`Tryout SNPDB - ${cleanName}`);
          }
          if (!token) {
            generateRandomToken();
          }
        }
      } else {
        setParseMessage({
          type: "error",
          text: json.message || "Gagal memproses berkas PDF.",
        });
      }
    } catch (err: any) {
      setParseMessage({
        type: "error",
        text: "Terjadi kesalahan saat mengunggah dan membaca PDF.",
      });
    } finally {
      setParsing(false);
    }
  };

  // Handle Ekstraksi dari Raw Text
  const handleParseText = async () => {
    if (!rawText.trim()) {
      setParseMessage({
        type: "error",
        text: "Silakan tempel teks naskah soal terlebih dahulu.",
      });
      return;
    }

    setParsing(true);
    setParseMessage(null);

    try {
      const res = await fetch("/api/exams/parse-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });

      const json = await res.json();

      if (json.success && Array.isArray(json.questions)) {
        setQuestions(json.questions);
        setParseMessage({
          type: "success",
          text: `Berhasil mengekstrak ${json.questions.length} butir soal dari teks!`,
        });
        if (!token) generateRandomToken();
      } else {
        setParseMessage({
          type: "error",
          text: json.message || "Gagal mengekstrak soal dari teks.",
        });
      }
    } catch (err) {
      setParseMessage({ type: "error", text: "Gagal memproses teks." });
    } finally {
      setParsing(false);
    }
  };

  // Menambah butir soal manual
  const handleAddQuestion = () => {
    const nextNum = questions.length + 1;
    const newQ: EditableQuestion = {
      questionNumber: nextNum,
      questionText: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      optionE: "",
      correctAnswer: "A",
      explanation: "",
      subject: "Penalaran Logika",
      points: 4,
    };
    setQuestions([...questions, newQ]);
  };

  // Menghapus butir soal
  const handleDeleteQuestion = (idx: number) => {
    const updated = questions
      .filter((_, i) => i !== idx)
      .map((q, i) => ({
        ...q,
        questionNumber: i + 1,
      }));
    setQuestions(updated);
  };

  // Mengubah butir soal
  const handleUpdateQuestion = (
    idx: number,
    field: keyof EditableQuestion,
    val: any,
  ) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: val };
    setQuestions(updated);
  };

  // Simpan dan Terbitkan Tryout ke Database
  const handleSaveExam = async () => {
    if (!title.trim()) {
      alert("Judul tryout wajib diisi.");
      return;
    }

    if (!token.trim()) {
      alert("Token ujian wajib diisi.");
      return;
    }

    if (questions.length === 0) {
      alert(
        "Harap masukkan atau ekstrak minimal 1 butir soal sebelum menerbitkan tryout.",
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        durationMinutes: parseInt(durationMinutes.toString(), 10) || 90,
        token: token.trim().toUpperCase(),
        passingScore: parseInt(passingScore.toString(), 10) || 65,
        questions,
      };

      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success) {
        alert(
          `Paket ujian "${title}" berhasil diterbitkan dengan Token: ${token.trim().toUpperCase()}!`,
        );
        router.push("/admin");
      } else {
        alert(json.message || "Gagal menyimpan ujian");
        setSaving(false);
      }
    } catch (err) {
      alert("Terjadi kendala jaringan saat menerbitkan ujian.");
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Panel Admin
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Unggah PDF & Buat Paket Tryout
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ekstraksi naskah soal PDF otomatis menjadi butir soal interaktif
            siap kerjakan untuk siswa
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveExam}
          disabled={saving || questions.length === 0}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Terbitkan Tryout ({questions.length} Soal)</span>
            </>
          )}
        </button>
      </div>

      {/* Grid: Form Setting Ujian & Ekstraksi PDF */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri: Metadata Ujian (4 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900 text-base pb-3 border-b border-slate-100 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-700" />
              <span>Pengaturan Paket Tryout</span>
            </h2>

            {/* Judul */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Judul Tryout <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Tryout Akbar SNPDB MAN IC 2025"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Token Ujian */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Token Akses Siswa <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateRandomToken}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Acak Token
                </button>
              </div>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
                placeholder="Contoh: MANIC01"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-base text-blue-800 tracking-wider placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Kategori Ujian
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SNPDB MAN IC">SNPDB MAN IC (Umum)</option>
                <option value="Tes Potensi Skolastik (TPS)">
                  Tes Potensi Skolastik (TPS)
                </option>
                <option value="Kemampuan Akademik (Sains & Matematika)">
                  Kemampuan Akademik (Sains & Matematika)
                </option>
                <option value="Literasi Keagamaan (PAI)">
                  Literasi Keagamaan (PAI)
                </option>
                <option value="Literasi Membaca (Bahasa)">
                  Literasi Membaca (Bahasa)
                </option>
              </select>
            </div>

            {/* Durasi & Passing Score */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Durasi (Menit)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={5}
                    max={360}
                    value={durationMinutes}
                    onChange={(e) =>
                      setDurationMinutes(parseInt(e.target.value, 10) || 60)
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Passing Score
                </label>
                <input
                  type="number"
                  min={0}
                  value={passingScore}
                  onChange={(e) =>
                    setPassingScore(parseInt(e.target.value, 10) || 60)
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Catatan / Petunjuk Ujian
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Petunjuk khusus untuk peserta tryout..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Modul Ekstraksi Soal (PDF / Teks) (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            {/* Tabs Mode */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileUp className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-slate-900 text-base">
                  Modul Ekstraksi Soal
                </h2>
              </div>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setInputMode("PDF")}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                    inputMode === "PDF"
                      ? "bg-white text-blue-800 shadow-2xs"
                      : "text-slate-500"
                  }`}
                >
                  Unggah Berkas PDF
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("TEXT")}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                    inputMode === "TEXT"
                      ? "bg-white text-blue-800 shadow-2xs"
                      : "text-slate-500"
                  }`}
                >
                  Tempel Teks Soal
                </button>
              </div>
            </div>

            {parseMessage && (
              <div
                className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 ${
                  parseMessage.type === "success"
                    ? "bg-blue-50 border-blue-300 text-blue-900"
                    : "bg-rose-50 border-rose-300 text-rose-900"
                }`}
              >
                {parseMessage.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-blue-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
                )}
                <span>{parseMessage.text}</span>
              </div>
            )}

            {/* TAB 1: UPLOAD PDF */}
            {inputMode === "PDF" && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 rounded-xl p-8 text-center transition-colors">
                  <Upload className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-800">
                    Pilih atau Geser (Drag & Drop) Berkas PDF Naskah Soal
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Mendukung dokumen PDF naskah tryout SNPDB MAN IC lengkap
                    dengan opsi A-E dan kunci jawaban
                  </p>

                  <input
                    type="file"
                    id="pdf-upload"
                    accept=".pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  <div className="mt-5 flex items-center justify-center gap-3">
                    <label
                      htmlFor="pdf-upload"
                      className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
                    >
                      Pilih File PDF...
                    </label>

                    {selectedFile && (
                      <span className="text-xs font-semibold text-blue-800 bg-blue-100 px-3 py-2 rounded-xl">
                        📄 {selectedFile.name} (
                        {(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!selectedFile || parsing}
                  onClick={handleParsePDF}
                  className="w-full py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {parsing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sedang Mengekstrak Butir Soal dari PDF...</span>
                    </div>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Proses & Ekstrak Soal Otomatis</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 2: PASTE RAW TEXT */}
            {inputMode === "TEXT" && (
              <div className="space-y-4">
                <textarea
                  rows={8}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Contoh naskah:\n1. Rukun iman yang ke-3 adalah...\nA. Iman kepada Allah\nB. Iman kepada Malaikat\nC. Iman kepada Kitab-kitab Allah\nD. Iman kepada Rasul\nE. Iman kepada Hari Akhir\nKunci: C\nPembahasan: Rukun iman ketiga adalah kitab Allah.\n\n2. Jika x + 5 = 12, maka x adalah...\nA. 5\nB. 6\nC. 7\nD. 8\nE. 9\nKunci: C`}
                  className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  type="button"
                  disabled={!rawText.trim() || parsing}
                  onClick={handleParseText}
                  className="w-full py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {parsing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menganalisis Teks Soal...</span>
                    </div>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Ekstrak Soal dari Teks</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section: Editor & Review Butir Soal */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Editor & Tinjau Butir Soal ({questions.length} Butir Soal)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Periksa pertanyaan, perbaiki teks bila perlu, tentukan kunci
              jawaban resmi, dan tambahkan pembahasan.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddQuestion}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Tambah Butir Soal Baru</span>
          </button>
        </div>

        {questions.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              Belum ada butir soal pada paket ini.
            </p>
            <p className="text-xs text-slate-400">
              Unggah file PDF atau tempelkan teks naskah soal di modul atas
              untuk mengekstrak secara otomatis.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="p-6 rounded-2xl border-2 border-slate-200 hover:border-slate-300 bg-slate-50/40 space-y-4 transition-all"
              >
                {/* Header Butir Soal */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-blue-800 text-white font-extrabold text-sm flex items-center justify-center">
                      {q.questionNumber}
                    </span>
                    <input
                      type="text"
                      value={q.subject || ""}
                      onChange={(e) =>
                        handleUpdateQuestion(qIndex, "subject", e.target.value)
                      }
                      placeholder="Subtes (Contoh: Penalaran Logika)"
                      className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <span>Poin:</span>
                      <input
                        type="number"
                        min={1}
                        value={q.points}
                        onChange={(e) =>
                          handleUpdateQuestion(
                            qIndex,
                            "points",
                            parseInt(e.target.value, 10) || 4,
                          )
                        }
                        className="w-14 px-2 py-1 bg-white border border-slate-300 rounded-md text-center font-bold text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(qIndex)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Soal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Teks Pertanyaan */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Teks Pertanyaan Soal:
                  </label>
                  <textarea
                    rows={3}
                    value={q.questionText}
                    onChange={(e) =>
                      handleUpdateQuestion(
                        qIndex,
                        "questionText",
                        e.target.value,
                      )
                    }
                    className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                  />
                </div>

                {/* Opsi Jawaban A, B, C, D, E & Kunci */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold uppercase text-slate-500">
                      Pilihan Jawaban (Klik lingkaran untuk memilih Kunci
                      Resmi):
                    </label>
                    <span className="text-[11px] font-extrabold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full">
                      Kunci Saat Ini: {q.correctAnswer}
                    </span>
                  </div>

                  {(["A", "B", "C", "D", "E"] as const).map((letter) => {
                    const fieldKey =
                      `option${letter}` as keyof EditableQuestion;
                    const val = (q[fieldKey] as string) || "";
                    const isCorrect = q.correctAnswer === letter;

                    return (
                      <div
                        key={letter}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                          isCorrect
                            ? "bg-blue-50/80 border-blue-500"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateQuestion(
                              qIndex,
                              "correctAnswer",
                              letter,
                            )
                          }
                          className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                            isCorrect
                              ? "bg-blue-600 text-white shadow-xs scale-105"
                              : "bg-slate-100 text-slate-600 hover:bg-blue-100"
                          }`}
                          title={`Jadikan pilihan ${letter} sebagai Kunci Jawaban`}
                        >
                          {letter}
                        </button>

                        <input
                          type="text"
                          value={val}
                          onChange={(e) =>
                            handleUpdateQuestion(
                              qIndex,
                              fieldKey,
                              e.target.value,
                            )
                          }
                          placeholder={`Teks pilihan ${letter}...`}
                          className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-slate-800 focus:outline-none"
                        />

                        {isCorrect && (
                          <span className="text-[10px] uppercase font-bold text-blue-800 bg-blue-200/80 px-2 py-0.5 rounded mr-1">
                            KUNCI
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pembahasan */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Pembahasan / Penjelasan Materi (Opsional):
                  </label>
                  <textarea
                    rows={2}
                    value={q.explanation || ""}
                    onChange={(e) =>
                      handleUpdateQuestion(
                        qIndex,
                        "explanation",
                        e.target.value,
                      )
                    }
                    placeholder="Tuliskan alasan atau cara penyelesaian soal untuk ditampilkan kepada siswa..."
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Action Bar */}
        {questions.length > 0 && (
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleAddQuestion}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Tambah 1 Butir Soal Lagi</span>
            </button>

            <button
              type="button"
              onClick={handleSaveExam}
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Simpan & Terbitkan Tryout Sekarang</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
