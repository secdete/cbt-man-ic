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

- **Portal Siswa**: [http://localhost:3000](http://localhost:3000) (Token contoh: `MANIC2025`)
- **Panel Admin**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Upload Naskah PDF**: [http://localhost:3000/admin/exams/create](http://localhost:3000/admin/exams/create)
- File contoh PDF siap uji coba: `sample-naskah/naskah-soal-man-ic.pdf`
