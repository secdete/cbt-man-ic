// Format nomor HP diseragamkan supaya data peserta (impor Excel / panel admin)
// dan pendaftaran lewat form ujian menunjuk ke baris yang sama.
// 0812-xxxx / +62 812 / 812 semuanya diubah menjadi format 628xx
export function normalizePhone(raw: unknown): string {
  let digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith("8")) digits = `62${digits}`;
  while (digits.startsWith("6262")) digits = digits.slice(2);
  return digits;
}

// Untuk penyimpanan data peserta: kosong -> null, nomor tidak wajar -> disimpan
// apa adanya (tidak diubah agar tidak merusak data asli dari Excel).
export function phoneForStorage(raw: unknown): string | null {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 10) return trimmed;
  return normalizePhone(trimmed);
}
