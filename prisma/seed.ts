import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Menjalankan Seeder CBT Tryout MAN Insan Cendekia...');

  // Hapus data lama jika ada
  await prisma.answerSubmission.deleteMany({});
  await prisma.examSession.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.exam.deleteMany({});

  const exam = await prisma.exam.create({
    data: {
      title: 'Simulasi Akbar SNPDB MAN Insan Cendekia 2025/2026',
      description: 'Latihan tryout resmi berbasis komputer (CBT) untuk persiapan Seleksi Nasional Peserta Didik Baru Madrasah Aliyah Negeri Insan Cendekia (SNPDB MAN IC). Mencakup Tes Potensi Skolastik (TPS), Literasi Akademik, dan Keagamaan.',
      category: 'SNPDB MAN IC',
      durationMinutes: 90,
      token: 'MANIC2025',
      passingScore: 65,
      isActive: true,
      questions: {
        create: [
          {
            questionNumber: 1,
            questionText: 'Semua siswa MAN Insan Cendekia gemar membaca buku sains atau buku sastra. Sebagian siswa yang gemar membaca buku sains juga aktif dalam kegiatan riset robotik. Ahmad adalah siswa MAN Insan Cendekia yang tidak gemar membaca buku sastra.\n\nKesimpulan yang tepat berdasarkan premis di atas adalah ...',
            optionA: 'Ahmad aktif dalam kegiatan riset robotik.',
            optionB: 'Ahmad gemar membaca buku sains.',
            optionC: 'Ahmad tidak gemar membaca buku sains maupun sastra.',
            optionD: 'Ahmad bukan siswa yang berprestasi di MAN Insan Cendekia.',
            optionE: 'Ahmad hanya membaca buku jika ditugaskan guru.',
            correctAnswer: 'B',
            explanation: 'Berdasarkan premis: Semua siswa MAN IC membaca buku sains ATAU sastra. Ahmad tidak membaca sastra, maka secara deduktif Ahmad PASTI membaca buku sains.',
            subject: 'Penalaran Logika',
            points: 4,
          },
          {
            questionNumber: 2,
            questionText: 'Sebuah tangki air di asrama MAN IC diisi oleh dua pipa. Pipa A dapat mengisi tangki hingga penuh dalam waktu 30 menit, sedangkan pipa B dapat mengisi penuh dalam waktu 45 menit. Jika kedua pipa dibuka bersamaan, berapa waktu yang dibutuhkan hingga tangki penuh?',
            optionA: '15 menit',
            optionB: '18 menit',
            optionC: '20 menit',
            optionD: '22,5 menit',
            optionE: '25 menit',
            correctAnswer: 'B',
            explanation: 'Debit gabungan = (1/30) + (1/45) = (3/90) + (2/90) = 5/90 = 1/18 tangki per menit. Maka waktu yang dibutuhkan untuk mengisi penuh adalah 18 menit.',
            subject: 'Penalaran Matematika',
            points: 4,
          },
          {
            questionNumber: 3,
            questionText: 'Dalam konteks sejarah peradaban Islam dan transmisi ilmu pengetahuan, lembaga keilmuan "Baitul Hikmah" mencapai puncak kejayaannya pada masa kekhalifahan Daulah Abbasiyah di bawah kepemimpinan Khalifah ...',
            optionA: 'Abu al-Abbas as-Saffah',
            optionB: 'Abu Ja’far al-Mansur',
            optionC: 'Harun ar-Rasyid dan al-Ma’mun',
            optionD: 'al-Mu’tashim Billah',
            optionE: 'Umar bin Abdul Aziz',
            correctAnswer: 'C',
            explanation: 'Baitul Hikmah didirikan pada masa Khalifah Harun ar-Rasyid dan mengalami masa keemasan puncaknya sebagai pusat riset dan penerjemahan internasional di era putranya, al-Ma’mun.',
            subject: 'Literasi Keagamaan',
            points: 4,
          },
          {
            questionNumber: 4,
            questionText: 'Perhatikan deret bilangan berikut:\n3, 6, 11, 18, 27, ..., ...\nDua bilangan selanjutnya dari deret di atas adalah ...',
            optionA: '36, 47',
            optionB: '38, 51',
            optionC: '38, 49',
            optionD: '36, 49',
            optionE: '37, 50',
            correctAnswer: 'B',
            explanation: 'Pola beda antar suku: +3, +5, +7, +9, bertingkat bilangan ganjil selanjutnya adalah +11 (27 + 11 = 38) dan +13 (38 + 13 = 51).',
            subject: 'Penalaran Matematika',
            points: 4,
          },
          {
            questionNumber: 5,
            questionText: 'Bacalah teks berikut secara saksama:\n\n"Transisi energi baru dan terbarukan (EBT) di Indonesia menghadapi tantangan intermitensi pada pembangkit tenaga surya dan bayu. Kendala ini menuntut investasi masif pada teknologi sistem penyimpanan energi baterai (BESS) serta modernisasi jaringan transmisi pintar (smart grid) agar keandalan pasokan listrik nasional tetap terjaga tanpa membebani tarif masyarakat."\n\nGagasan utama dari paragraf di atas adalah ...',
            optionA: 'Pembangkit tenaga surya dan bayu tidak cocok diterapkan di Indonesia.',
            optionB: 'Tarif listrik masyarakat akan naik drastis akibat investasi teknologi baterai.',
            optionC: 'Kebutuhan solusi teknologi penyimpanan dan jaringan pintar untuk mengatasi intermitensi EBT.',
            optionD: 'Kelemahan mutlak dari energi surya dalam sistem kelistrikan Indonesia.',
            optionE: 'Perlunya penundaan transisi energi terbarukan hingga biaya murah.',
            correctAnswer: 'C',
            explanation: 'Gagasan pokok teks menyoroti solusi yang diperlukan (sistem penyimpanan baterai dan smart grid) guna menghadapi tantangan intermitensi pada transisi EBT.',
            subject: 'Literasi Membaca',
            points: 4,
          },
          {
            questionNumber: 6,
            questionText: 'Read the following dialogue:\n\nRaihan: "The laboratory experiment deadline is approaching, yet our data simulation has not converged."\nNadia: "If we had calibrated the sensor sensors beforehand, we would not be re-running the test right now."\n\nWhat can be inferred from Nadia’s statement?',
            optionA: 'They calibrated the sensors and succeeded.',
            optionB: 'They did not calibrate the sensors, so they must re-run the test.',
            optionC: 'They will calibrate the sensors tomorrow.',
            optionD: 'The experiment was cancelled due to damaged sensors.',
            optionE: 'The simulation is already complete.',
            correctAnswer: 'B',
            explanation: 'Third conditional sentence ("If we had calibrated..., we would not be re-running..."): Fakta di dunia nyata adalah they didn\'t calibrate beforehand, so they are currently re-running the test.',
            subject: 'Literasi Bahasa Inggris',
            points: 4,
          },
          {
            questionNumber: 7,
            questionText: 'Seorang siswa melempar bola bermassa 200 gram secara vertikal ke atas dengan kecepatan awal 20 m/s. Jika percepatan gravitasi bumi g = 10 m/s², energi potensial bola pada saat mencapai titik tertinggi adalah ...',
            optionA: '20 Joule',
            optionB: '40 Joule',
            optionC: '80 Joule',
            optionD: '100 Joule',
            optionE: '200 Joule',
            correctAnswer: 'B',
            explanation: 'Berdasarkan hukum kekekalan energi mekanik: Em(awal) = Em(puncak). Ep(maks) = Ek(awal) = 1/2 * m * v^2 = 1/2 * 0,2 kg * (20 m/s)^2 = 0,1 * 400 = 40 Joule.',
            subject: 'Kemampuan Sains (Fisika)',
            points: 4,
          },
          {
            questionNumber: 8,
            questionText: 'Hukum bacaan tajwid ketika huruf Nun Sukun (نْ) bertemu dengan huruf Kaf (ك) adalah ...',
            optionA: 'Izhar Halqi',
            optionB: 'Idgham Bighunnah',
            optionC: 'Ikhfa Haqiqi',
            optionD: 'Iqlab',
            optionE: 'Idgham Bilaghunnah',
            correctAnswer: 'C',
            explanation: 'Huruf Kaf (ك) termasuk ke dalam salah satu dari 15 huruf Ikhfa Haqiqi, di mana bacaannya disamarkan disertai dengung (ghunnah).',
            subject: 'Literasi Keagamaan',
            points: 4,
          }
        ],
      },
    },
  });

  console.log(`✅ Tryout berhasil dibuat: "${exam.title}" (Token: ${exam.token}) dengan 8 butir soal.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

