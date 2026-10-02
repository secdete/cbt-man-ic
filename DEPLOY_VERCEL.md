# 🚀 Panduan Lengkap Push ke GitHub & Deploy ke Vercel

Platform **CBT Tryout MAN Insan Cendekia (SNPDB)** telah siap 100% untuk di-push ke GitHub dan di-deploy ke **Vercel** dengan database cloud **Supabase (PostgreSQL)**.

---

## 🌟 Langkah 1: Buat Database Gratis di Supabase

Supabase menyediakan database PostgreSQL gratis dengan fitur _connection pooling_ bawaan (sangat aman dari kelebihan beban saat ratusan siswa submit bersamaan di Vercel).

1. Buka [https://supabase.com](https://supabase.com) dan login (bisa via akun GitHub).
2. Klik **New Project**, beri nama misal `cbt-man-ic`, dan buat password database yang kuat.
3. Tunggu 1 menit hingga database selesai disiapkan.
4. Buka menu **Project Settings** (ikon gerigi di kiri bawah) $\rightarrow$ **Database**.
5. Scroll ke bagian **Connection string**:
   - Pilih tab **URI**.
   - Pilih mode **Transaction** (Port 6543) $\rightarrow$ salin URL ini sebagai `DATABASE_URL`.
   - Pilih mode **Session** (Port 5432) $\rightarrow$ salin URL ini sebagai `DIRECT_URL`.

---

## 🌟 Langkah 2: Alihkan Skema ke PostgreSQL

Di terminal laptop Anda pada folder `C:\Startup\cbt-man-ic`, jalankan:

```bash
npm run db:supabase
```

Script ini otomatis memperbarui skema Prisma agar menggunakan provider PostgreSQL.

Jika Anda ingin mengisi database Supabase Anda dengan data awal (seed) tryout contoh, masukkan URL Supabase Anda ke `.env`, lalu jalankan:

```bash
npx prisma db push
npx prisma db seed
```

---

## 🌟 Langkah 3: Push ke GitHub

Di terminal `C:\Startup\cbt-man-ic`:

```bash
git add .
git commit -m "feat: CBT Tryout MAN IC siap deploy Vercel"
```

Jika belum menghubungkan ke remote repository GitHub Anda:

```bash
# Ganti URL di bawah dengan repository GitHub Anda
git remote add origin https://github.com/USERNAME/cbt-man-ic.git
git branch -M main
git push -u origin main
```

---

## 🌟 Langkah 4: Deploy ke Vercel

1. Buka [https://vercel.com](https://vercel.com) dan login dengan akun GitHub Anda.
2. Klik tombol **Add New...** $\rightarrow$ **Project**.
3. Cari repository `cbt-man-ic` yang baru Anda push, lalu klik **Import**.
4. Di bagian **Environment Variables**, tambahkan 2 variabel berikut:
   - `DATABASE_URL` : Tempelkan connection string Supabase (Port 6543 / Transaction mode).
   - `DIRECT_URL` : Tempelkan connection string Supabase (Port 5432 / Session mode).
5. Klik tombol **Deploy**!

Dalam 1–2 menit, website CBT MAN IC Anda sudah **LIVE** dan dapat diakses langsung oleh siswa dan admin melalui domain gratis Vercel (misal: `https://cbt-man-ic.vercel.app`).

---

## 🌟 Menjalankan di Komputer Lokal (Development)

Untuk menjalankan di komputer Anda secara lokal:

```bash
# Pastikan skema di mode SQLite untuk dev lokal tanpa koneksi internet
npm run db:sqlite

# Jalankan server development
npm run dev
```

Buka browser di:

- **Portal Siswa**: [http://localhost:3000](http://localhost:3000) (Token contoh: `IC-PAKET-UTUH`)
- **Panel Admin**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Upload Naskah PDF**: [http://localhost:3000/admin/exams/create](http://localhost:3000/admin/exams/create)
- File contoh PDF siap uji coba: `sample-naskah/naskah-soal-man-ic.pdf`

## Perubahan Skema Database

Build di Vercel menjalankan migrasi Prisma yang tercatat di `prisma/migrations` sebelum build aplikasi (`scripts/deploy-migrations.js` → `prisma migrate deploy`). Pastikan variabel `DATABASE_URL` dan `DIRECT_URL` tersedia di environment Vercel. Migrasi awal untuk versi ini menambahkan relasi paket subtest, kunci percobaan peserta, dan indeks pencarian tanpa menghapus data lama.

Migrasi terbaru:

- `20261003_student_identity_sortorder` — `Exam.sortOrder` (urutan seksi), `Student.phone` (unique, kunci 1x pengerjaan), `Student.nisn` jadi nullable.
- `20261003_student_roster_fields` — kolom data peserta panitia: `username` (unique), `email`, `parentWhatsapp`, `dreamCity`, `registrationTimestamp`, `password`, plus default `passwordHash`/`salt`.

Ketiganya sudah dijalankan ke Supabase dan tercatat di `_prisma_migrations` (jangan jalankan `db push`, cukup `migrate deploy`).

---

## 🧩 Paket Try Out Utuh (Satu Paket, 8 Subtest)

Satu paket gabungan untuk seluruh subtest IC:

| | |
|---|---|
| Judul | **Paket Try Out Utuh SNPDB MAN Insan Cendekia** |
| Token | `IC-PAKET-UTUH` |
| Kategori | SNPDB 2023 |
| Isi | **123 soal / 8 seksi** (INDO, ARAB, INGG, MTK, IPA, IPS, AGAMA, ANALITIK) |
| Durasi | 150 menit, KKM 70 |

Subtest aslinya otomatis dikunci (`isActive=false, isLocked=true`) dan tampil sebagai **seksi di dalam paket**, bukan ujian terpisah. Ujian lain (SNPDB 2021/2022, Paket 1 Lengkap) tetap berdiri sendiri.

Script sekali jalan: `npx tsx scripts/merge-ic-package.ts` (aman dijalankan ulang, ada penjaga idempoten).

---

## 👤 Alur Peserta (Identitas + 1x Pengerjaan)

1. Peserta mengisi **Nama, No. HP, Nama Sekolah, Token, dan PIN** di halaman utama.
2. PIN pertama kali **mendaftarkan** peserta (di-hash scrypt + salt). Kali berikutnya HP yang sama harus cocok dengan PIN yang sudah terdaftar.
3. **No. HP adalah kunci 1x pengerjaan** (`attemptKey = examId:student:studentId`):
   - Sesi selesai (COMPLETED/TIMEOUT) → **tidak bisa masuk lagi**, muncul pesan "sudah mengerjakan".
   - Sesi masih berjalan → dilanjutkan, bukan sesi baru.
4. Setelah submit, halaman hasil langsung **otomatis mengunduh Sertifikat + Analisa PDF**.

> Peserta yang **sudah diimpor panitia lewat Excel** tidak mendaftar sendiri: No. HP mereka sudah ada di database,
> jadi PIN yang dipakai adalah **password yang tertera di kartu peserta / Excel**. PIN lain akan ditolak.

---

## ⏰ Jadwal dari Panel Admin

Semua pengaturan waktu ada di panel admin (`/admin/exams/[id]`) — **Waktu Mulai** dan **Waktu Selesai**:

- Sebelum buka → peserta diblokir ("ujian belum dibuka").
- Setelah selesai → peserta diblokir ("jadwal sudah berakhir").
- Kosong = selalu terbuka.

> ⚠️ **Sebelum membagikan token `IC-PAKET-UTUH` ke peserta, admin WAJIB mengatur Waktu Mulai/Selesai dulu.** Saat ini kedua field masih kosong (ujian selalu terbuka).

---

## 🗂️ Data Peserta (Impor Excel, Kartu, Ekspor)

Panel `/admin` punya menu peserta yang terhubung ke tabel `Student`:

| Aksi | Endpoint | Keterangan |
|---|---|---|
| Daftar / tambah peserta | `GET` `POST /api/admin/students` | No. HP otomatis diformat `628xx`; nomor ganda ditolak (409) |
| Impor Excel | `POST /api/admin/students/import` | Kolom: Nama Siswa, Asal Sekolah, WA Siswa, WA Orang Tua, password, NISN |
| Ekspor Excel | `GET /api/admin/students/export` | `?template=1` hanya mengunduh template kosong |
| Cetak kartu peserta | `GET /api/admin/students/card-pdf` | 6 kartu per halaman, memuat username & password |

**Semua endpoint di atas wajib cookie admin** (dulu terbuka tanpa login — sudah ditutup).

No. HP disimpan seragam format `628xx` supaya peserta yang diimpor dari Excel bisa langsung masuk ujian
(memakai password dari Excel sebagai PIN) dan tercatat sebagai **satu baris yang sama**.

---

## 🔐 Keamanan Panel Admin

- Cookie admin kini **ditandatangani HMAC** (`lib/admin-auth.ts`), bukan cookie polos.
- Semua endpoint `/api/admin/**`, buat/ubah/hapus ujian, kunci jawaban, dan upload PDF **wajib login**.
- `GET /api/exams` daftar publik **tidak lagi membocorkan token**; token hanya untuk admin atau pencarian eksplisit `?token=`.
- `proxy.ts` melindungi halaman `/admin` (pengganti `middleware.ts` yang sudah deprecated di Next 16).
- Cookie admin lama **tidak berlaku lagi** → admin cukup login ulang sekali.

**Login (`POST /api/admin/auth/login`) melayani dua peran:**

- **Panitia** — username & password cocok dengan `ADMIN_USERNAME`/`ADMIN_PASSWORD` → cookie `cbt_admin_session` bertanda tangan HMAC → redirect `/admin`.
- **Peserta** — username (atau No. HP) + password **wajib cocok dengan data terdaftar** (impor Excel atau peserta yang dibuat lewat panel). Password diverifikasi sesuai asal data: baris impor memakai HMAC-SHA256(salt), baris pendaftaran lewat form ujian memakai scrypt.
- Akun tidak terdaftar / password salah → **401**, tidak ada cookie yang diterbitkan (sebelumnya login apapun dianggap berhasil).
- Peserta hanya menerima cookie `cbt_user_session` dan **tidak bisa membuka** endpoint `/api/admin/**` (diuji di `scripts/_e2e.mjs`).

Default bila env tidak diset: user `admin` / password `admin123`, `ADMIN_SECRET_KEY` = `cakrawala_admin_secret_2025`. **Segera ganti** di Environment Variables Vercel.

---

## ✅ Cara Verifikasi Sebelum Rilis

```bash
npm run build                      # build harus hijau
npm start                          # jalankan server
node scripts/_e2e.mjs              # 72 pemeriksaan ujung-ke-ujung
npx tsx scripts/_pdf-check.ts      # 13 pemeriksaan PDF sertifikat & analisa
```

Jangan mengubah data ujian asli saat uji coba — jalankan e2e lalu bersihkan sisanya dengan `npx tsx scripts/_cleanup-e2e-students.ts`.
