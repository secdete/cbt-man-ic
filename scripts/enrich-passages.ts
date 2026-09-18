import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function enrich() {
  console.log(
    "📖 Menambahkan Teks Bacaan / Narasi Stimulus pada butir-butir soal...",
  );

  // ==========================================
  // 1. LITERASI KEAGAMAAN ISLAM (IC-AGAMA)
  // ==========================================
  const agamaExam = await prisma.exam.findUnique({
    where: { token: "IC-AGAMA" },
    include: { questions: { orderBy: { questionNumber: "asc" } } },
  });

  if (agamaExam) {
    const wacanaAriAri = `[BACAAN UNTUK SOAL NO. 1 - 3]
Tradisi Mengubur Ari-ari dalam Pandangan Islam:
Keluarga Andi baru saja dikaruniai seorang bayi mungil. Setelah persalinan, sang ayah membersihkan ari-ari (plasenta) bayi tersebut dengan air bersih, membungkusnya dengan kain putih suci, menaruh garam dan asam secukupnya, kemudian menguburkannya di pekarangan rumah serta menyalakan lampu penerangan di dekatnya selama beberapa malam.

Andi yang memperhatikan perbuatan ayahnya merasa penasaran dan bertanya kepada temannya, Ahmad, seorang santri madrasah. Ahmad menjelaskan bahwa tradisi mengubur ari-ari pada dasarnya merupakan wujud memuliakan dan menghormati bagian tubuh manusia yang pernah menjadi saluran rezeki dan kehidupan janin di dalam kandungan, sebagaimana ajaran Islam menganjurkan agar bagian tubuh manusia yang terpisah diperlakukan dengan baik dan dikubur ke dalam tanah. Namun, Ahmad juga mengingatkan agar niat dan pelaksanaannya tetap dijaga dari keyakinan mistis atau syirik, melainkan sebagai bentuk ikhtiar kebersihan dan rasa syukur atas karunia Allah SWT.`;

    const wacanaUangTemuan = `[BACAAN UNTUK SOAL NO. 4 - 6]
Kejujuran dan Amanah Barang Temuan:
Di sebuah lorong madrasah sebelum jam istirahat pertama, dua siswi bernama Naila dan Ajwa menemukan sejumlah uang kertas yang terjatuh di dekat tangga. Uang tersebut cukup banyak dan tidak diketahui siapa pemiliknya. Naila dan Ajwa sempat bimbang apakah uang tersebut sebaiknya dibiarkan saja, dimasukkan ke kotak infak masjid sekolah, atau diserahkan kepada pihak sekolah. 

Tidak lama kemudian, terdengar pengumuman dari pengeras suara ruang audio sekolah bahwa ada seorang siswa yang kehilangan uang tabungan pembayaran buku. Di dalam kelas, guru agama mereka, Bu Alifia, menerangkan konsep fiqih luqathah (barang temuan) dan nilai kejujuran. Bu Alifia menegaskan bahwa menemukan barang berharga menuntut sikap amanah, wajib diumumkan, dan tidak boleh langsung dipergunakan atau dibagi begitu saja demi ketenteraman batin dan ridha Allah SWT.`;

    const wacanaAisyah = `[BACAAN UNTUK SOAL NO. 7 - 9]
Menghargai Keberagaman Fisik dan Akhlakul Karimah:
Aisyah adalah seorang siswi yang lahir dengan kondisi fisik yang berbeda dengan teman-teman sebayanya. Di lingkungan sekolah, ada siswa seperti Badrul yang bersikap sombong dan sempat mengejek kekurangan fisik Aisyah. 

Namun, siswa lain bernama Budiman mengingatkan Badrul bahwa seluruh manusia diciptakan oleh Allah SWT dalam bentuk yang sebaik-baiknya (Ahsani Taqwim) dan tidak boleh ada seorang pun yang mencela ciptaan Allah sebagaimana firman-Nya dalam QS. Al-Hujurat ayat 11. Aisyah sendiri merespons perlakuan teman-temannya dengan penuh kesabaran, berlapang dada, dan tetap bersemangat belajar tanpa menyimpan rasa dendam di hatinya.`;

    const wacanaTarawih = `[BACAAN UNTUK SOAL NO. 10 - 12]
Toleransi dalam Pelaksanaan Salat Tarawih:
Di sebuah masjid pada malam bulan Ramadan, dua orang pemuda bernama Aiman dan Rafi berbincang hangat mengenai perbedaan amaliah salat tarawih di kalangan umat Islam. Aiman terbiasa melaksanakan salat tarawih 8 rakaat ditambah 3 witir, sedangkan Rafi terbiasa mengikuti salat tarawih 20 rakaat ditambah 3 witir di lingkungan keluarganya. Keduanya sempat bingung mengenai mengapa terdapat perbedaan jumlah rakaat tersebut.

Sahabat mereka, Budi, menyarankan agar mereka menanyakan persoalan tersebut langsung kepada Ustadz Abdullah. Ustadz Abdullah menjelaskan dengan bijak bahwa kedua amalan tersebut sama-sama memiliki dasar riwayat yang kuat dari sunnah Nabi SAW dan amaliyah para sahabat Khulafaur Rasyidin (Umar bin Khattab ra). Ustadz Abdullah mengingatkan bahwa perbedaan cabang fiqih (furu'iyah) adalah rahmat yang harus disikapi dengan saling menghormati dan mempererat ukhuwah islamiyah.`;

    const wacanaGowa = `[BACAAN UNTUK SOAL NO. 16 - 18]
Sejarah Dakwah Islam Dato Ribandang di Sulawesi:
Dato Ribandang (Abdul Makmur Khatib Tunggal) adalah ulama besar asal Minangkabau yang berdakwah menyebarkan agama Islam di wilayah Sulawesi Selatan, khususnya di Kerajaan Gowa dan Tallo pada awal abad ke-17. Dalam dakwahnya, Dato Ribandang menggunakan pendekatan yang arif, penuh keteladanan, mengutamakan dialog yang santun, dan menghargai kearifan lokal masyarakat setempat tanpa paksaan. Berkat ketulusan dan ketinggian ilmunya, Raja Gowa Sultan Alauddin dan Raja Tallo Karaeng Matoaya memeluk agama Islam secara sukarela, yang kemudian diikuti oleh seluruh rakyatnya.`;

    for (const q of agamaExam.questions) {
      let updatedText = q.questionText;

      if (q.questionNumber === 1) {
        updatedText = `${wacanaAriAri}\n\nPertanyaan:\nSetelah mendapat penjelasan Ahmad, apa makna yang dapat ditangkap Andi dari perbuatan ayahnya? (Pilihlah satu jawaban yang paling benar!)`;
      } else if (q.questionNumber === 2) {
        updatedText = `Berdasarkan bacaan tradisi mengubur ari-ari oleh ayah Andi:\nPasangkan antara tradisi yang dikerjakan ayah Andi (seperti meletakkan lampu penerangan dan membersihkan ari-ari) dengan penerapan makna simboliknya dalam kehidupan sehari-hari!`;
      } else if (q.questionNumber === 3) {
        updatedText = `Berdasarkan bacaan tradisi mengubur ari-ari:\nMakna dalam bidang akidah yang dijelaskan Ahmad terhadap perbuatan ayah Andi adalah .... (Pilihlah dua jawaban yang benar!)`;
      } else if (q.questionNumber === 4) {
        updatedText = `${wacanaUangTemuan}\n\nPertanyaan:\nApa yang seharusnya dilakukan Naila dan Ajwa sebelum mendengar pengumuman dari ruang audio sekolah? (Pilihlah satu jawaban yang paling benar!)`;
      } else if (q.questionNumber === 5) {
        updatedText = `Berdasarkan bacaan barang temuan Naila dan Ajwa:\nPasangkan dua konsep kejujuran yang diterangkan Bu Alifia dengan perilaku yang bertentangan dengan tindakan Naila dan Ajwa!`;
      } else if (q.questionNumber === 6) {
        updatedText = `Berdasarkan bacaan barang temuan di sekolah:\nApa yang dirasakan Naila setelah mendengarkan penjelasan Bu Alifia? (Pilihlah dua jawaban yang paling benar!)`;
      } else if (q.questionNumber === 7) {
        updatedText = `${wacanaAisyah}\n\nPertanyaan:\nPasangkanlah konsep ajaran al-Quran pada narasi di atas dengan sikap menghargai keberadaan fisik Aisyah!`;
      } else if (q.questionNumber === 8) {
        updatedText = `Berdasarkan narasi tentang Aisyah dan Badrul:\nPasangkanlah konsep hadis larangan mencela sesama muslim dengan perilaku tokoh yang ada dalam cerita!`;
      } else if (q.questionNumber === 9) {
        updatedText = `Berdasarkan narasi tentang Aisyah:\nBagaimana pendapatmu tentang tindakan Aisyah dalam merespons teman-temannya? (Pilihlah satu jawaban yang paling tepat!)`;
      } else if (q.questionNumber === 10) {
        updatedText = `${wacanaTarawih}\n\nPertanyaan:\nPasangkan antara peristiwa perbedaan salat tarawih dalam kisah tersebut dengan cara yang tepat dalam menyikapinya!`;
      } else if (q.questionNumber === 11) {
        updatedText = `Berdasarkan wacana salat tarawih antara Aiman dan Rafi:\nPasangkan antara tindakan yang diambil dalam menghadapi perbedaan jumlah rakaat dengan dampak positif yang ditimbulkannya!`;
      } else if (q.questionNumber === 12) {
        updatedText = `Berdasarkan wacana salat tarawih:\nTindakan Budi, Rafi, dan Aiman yang tepat dalam menghadapi perbedaan adalah …. (Pilihlah dua jawaban yang paling benar!)`;
      } else if (q.questionNumber === 16) {
        updatedText = `${wacanaGowa}\n\nPertanyaan:\nPasangkanlah konsep ajaran al-Quran tentang dakwah bil hikmah dengan perilaku Dato Ribandang dalam kisah dakwah di Kerajaan Gowa di atas!`;
      } else if (q.questionNumber === 17) {
        updatedText = `Berdasarkan narasi dakwah Dato Ribandang:\nBentuk penerapan prinsip dakwah Islam yang santun dalam kehidupan sehari-hari adalah …. (Pilihlah dua jawaban yang paling benar!)`;
      }

      await prisma.question.update({
        where: { id: q.id },
        data: { questionText: updatedText },
      });
    }

    console.log(
      `✅ Berhasil memperkaya seluruh wacana soal Keagamaan Islam (IC-AGAMA).`,
    );
  }

  // ==========================================
  // 2. LITERASI BAHASA INDONESIA (IC-INDO)
  // ==========================================
  const indoExam = await prisma.exam.findUnique({
    where: { token: "IC-INDO" },
    include: { questions: { orderBy: { questionNumber: "asc" } } },
  });

  if (indoExam) {
    const wacanaDigital = `[BACAAN UNTUK SOAL NO. 3 - 5]
Perkembangan Transaksi Keuangan Digital di Indonesia:
(1) Penggunaan internet dan telepon seluler pintar di era modern saat ini semakin mempermudah akses masyarakat terhadap berbagai kebutuhan harian, termasuk transaksi perbankan dan keuangan. (2) Sebagian besar masyarakat di wilayah perkotaan maupun pedesaan kini telah beralih menggunakan pembayaran non-tunai melalui Quick Response Code (QRIS) dan dompet digital. (3) Bank Indonesia selaku bank sentral terus memperkuat dan memperketat regulasi standar pembayaran guna menjamin keamanan transaksi digital dari ancaman siber. (4) Namun, anak-anak usia dini sebaiknya tidak dibiarkan bermain gawai tanpa pengawasan orang tua. (5) Kehadiran uang elektronik pada akhirnya telah menjadi bagian tak terpisahkan dari denyut nadi perekonomian masyarakat modern.`;

    const wacanaGeotermal = `[BACAAN UNTUK SOAL NO. 6 - 8]
Potensi dan Keunggulan Energi Geotermal (Panas Bumi):
Energi panas bumi (geotermal) merupakan salah satu sumber energi terbarukan yang sangat melimpah di Indonesia karena posisi geografisnya yang dilalui jalur cincin api pasifik (ring of fire). Pemanfaatan energi geotermal memiliki keunggulan signifikan dibandingkan bahan bakar fosil. Energi ini ramah lingkungan karena proses pembangkitannya tidak menghasilkan emisi karbon yang merusak lapisan ozon. Selain itu, pasokan energi panas bumi bersifat konstan sepanjang musim dan tidak bergantung pada cuaca layaknya tenaga angin atau surya. [...bagian rumpang...] Pemerintah bersama BUMN terus mendorong program Gerakan Energi Bersih dan Indonesia Menabung guna mempercepat transisi energi hijau nasional.`;

    const wacanaCerpen = `[BACAAN UNTUK SOAL NO. 9 - 10]
Kutipan Cerpen "Pulang Menjenguk Ayah":
Dengan malas kuhubungi biro travel langganan Yu Ning. Entah mengapa aku tidak merasa kecewa saat operator memberitahukan bahwa tiket untuk jadwal petang ini telah habis terjual. Tiba-tiba di sudut hatiku yang paling dalam menyelinap rasa bersalah yang teramat perih. Aku dan Yu Ning selama ini terlalu sibuk mengejar karier dan kehidupan masing-masing di kota besar, hingga selalu lupa bahwa di kampung halaman ada seorang ayah tua yang terus menunggu kepulangan kami dengan penuh kerinduan. Aku tahu hidup terus berjalan dan setiap anak pasti mencari sarangnya yang baru, tetapi melupakan baktiku kepada ayah adalah kekeliruan yang tak termaafkan.`;

    for (const q of indoExam.questions) {
      let updatedText = q.questionText;

      if (q.questionNumber === 1) {
        updatedText = `Perhatikan kalimat berikut:\n"Pemerintah terus berupaya agar limbah organik dapat dikonversi menjadi sumber energi terbarukan yang bermanfaat bagi masyarakat."\n\nMakna istilah dikonversi dalam kalimat di atas adalah ….`;
      } else if (q.questionNumber === 2) {
        updatedText = `Perhatikan kalimat berikut:\n"Pendidikan karakter sangat penting ditanamkan sejak dini [...] membentuk generasi yang cerdas, berakhlak mulia, [...] memiliki empati terhadap sesama."\n\nKata hubung (konjungsi) yang tepat untuk melengkapi bagian rumpang pada kalimat tersebut adalah ….`;
      } else if (q.questionNumber === 3) {
        updatedText = `${wacanaDigital}\n\nPertanyaan:\nIde pokok dari paragraf tersebut adalah ….`;
      } else if (q.questionNumber === 4) {
        updatedText = `${wacanaDigital}\n\nPertanyaan:\nPernyataan yang sesuai dengan isi bacaan transaksi keuangan digital di atas adalah … (Pilihlah dua pernyataan yang benar)`;
      } else if (q.questionNumber === 5) {
        updatedText = `${wacanaDigital}\n\nPertanyaan:\nKalimat sumbang (tidak padu) yang menyimpang dari gagasan utama pada paragraf di atas adalah kalimat nomor ….`;
      } else if (q.questionNumber === 6) {
        updatedText = `${wacanaGeotermal}\n\nPertanyaan:\nKalimat yang paling tepat dan padu untuk melengkapi bagian rumpang pada paragraf di atas adalah …`;
      } else if (q.questionNumber === 7) {
        updatedText = `${wacanaGeotermal}\n\nPertanyaan:\nPernyataan yang merupakan opini (bukan fakta empiris) pada paragraf tentang energi di atas adalah …. (Pilihlah dua jawaban benar)`;
      } else if (q.questionNumber === 8) {
        updatedText = `${wacanaGeotermal}\n\nPertanyaan:\nSimpulan yang paling tepat sesuai dengan isi paragraf tentang energi terbarukan di atas adalah …`;
      } else if (q.questionNumber === 9) {
        updatedText = `${wacanaCerpen}\n\nPertanyaan:\nPernyataan dalam kutipan cerpen yang membuktikan bahwa tokoh 'aku' merasa bersalah dan kurang memperhatikan ayahnya adalah …`;
      } else if (q.questionNumber === 10) {
        updatedText = `${wacanaCerpen}\n\nPertanyaan:\nSetelah membaca kutipan cerpen di atas, apa nilai moral dan refleksi yang dapat Anda petik berdasarkan tindakan dan pikiran tokoh 'aku'?`;
      }

      await prisma.question.update({
        where: { id: q.id },
        data: { questionText: updatedText },
      });
    }

    console.log(
      `✅ Berhasil memperkaya seluruh wacana soal Bahasa Indonesia (IC-INDO).`,
    );
  }

  // ==========================================
  // 3. LITERASI BAHASA INGGRIS (IC-INGG)
  // ==========================================
  const inggExam = await prisma.exam.findUnique({
    where: { token: "IC-INGG" },
    include: { questions: { orderBy: { questionNumber: "asc" } } },
  });

  if (inggExam) {
    const readingPassage1 = `[READING PASSAGE FOR QUESTIONS NO. 1 - 3]
Evaluating Digital Information in the Modern Age:
In today's interconnected world, discerning credible information from misinformation has become an indispensable life skill. Not every article published on social media or search engines can be trusted as factual. When conducting research or reading online news, critical thinkers must look for specific indicators of validity. A reliable source typically provides a verifiable author with relevant credentials, clearly lists the exact date of publication or latest update, cites empirical data or trusted references, and presents content with an objective tone rather than emotionally charged sensationalism.`;

    const readingPassage2 = `[READING PASSAGE FOR QUESTIONS NO. 4 - 6]
Life in the Boarding School Dormitory:
Living in an Islamic boarding school (madrasah asrama) requires students to adhere to a structured daily routine. Every student is assigned a specific schedule for waking up before dawn, performing congregational prayers, memorizing verses of the holy Quran, and maintaining cleanliness in their shared rooms. Once in a while, some students bring homemade delicacies prepared by their families to share with their dorm mates, fostering a strong sense of brotherhood and empathy that lasts well beyond their academic years.`;

    for (const q of inggExam.questions) {
      let updatedText = q.questionText;

      if (q.questionNumber === 1) {
        updatedText = `${readingPassage1}\n\nQuestion:\nChoose two signs of a reliable source of information based on the passage above!`;
      } else if (q.questionNumber === 2) {
        updatedText = `${readingPassage1}\n\nQuestion:\nAccording to the passage, why is it essential for readers to verify the author's credentials and publication date?`;
      } else if (q.questionNumber === 3) {
        updatedText = `${readingPassage2}\n\nQuestion:\nChoose two correct answers based on the text. Why does the writer occasionally bring food to the boarding school dormitory?`;
      }

      await prisma.question.update({
        where: { id: q.id },
        data: { questionText: updatedText },
      });
    }

    console.log(
      `✅ Berhasil memperkaya seluruh wacana soal Bahasa Inggris (IC-INGG).`,
    );
  }

  console.log(
    "\n🎉 SELURUH TEKS BACAAN & WACANA STIMULUS TELAH MASUK KE DATABASE SUPABASE!",
  );
}

enrich()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
