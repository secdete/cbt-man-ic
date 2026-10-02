const BASE = "http://localhost:3000";
let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    failures.push(`${name} :: ${detail}`);
    console.log(`  FAIL  ${name} -> ${detail}`);
  }
}

async function call(method, path, { body, cookie } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non json */
  }
  return { status: res.status, json, headers: res.headers };
}

const STAMP = Date.now();
const TEST_NAME = `Siswa Uji E2E ${STAMP}`;
const TEST_PHONE = `0819${String(STAMP).slice(-8)}`;
const TEST_PASSWORD = "pin-uji-1234";
const SCHEDULE_PHONE = `0818${String(STAMP).slice(-8)}`;

async function waitForServer(timeoutMs = 60000) {
  const startedAt = Date.now();
  for (;;) {
    try {
      const res = await fetch(`${BASE}/api/exams`);
      if (res.status === 200) return;
    } catch {
      /* server belum siap */
    }
    if (Date.now() - startedAt > timeoutMs) throw new Error("Server tidak siap dalam 60 detik");
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

async function main() {
  await waitForServer();
  const examList = await call("GET", "/api/exams");
  check("GET /api/exams publik sukses", examList.status === 200 && examList.json?.success, JSON.stringify(examList.json)?.slice(0, 200));
  check(
    "GET /api/exams publik TIDAK membocorkan token",
    Array.isArray(examList.json?.data) && examList.json.data.every((e) => e.token === undefined),
    `token terlihat: ${JSON.stringify(examList.json?.data?.map((e) => e.token))}`,
  );

  const pkgLookup = await call("GET", "/api/exams?token=IC-PAKET-UTUH");
  const pkg = pkgLookup.json?.data?.[0];
  check("Lookup token paket ditemukan", pkgLookup.status === 200 && !!pkg, JSON.stringify(pkgLookup.json)?.slice(0, 200));
  check("Token paket ikut dikirim saat dicari eksplisit", pkg?.token === "IC-PAKET-UTUH", `token=${pkg?.token}`);
  check("Jumlah soal paket = 123 (8 subtest digabung)", pkg?._count?.questions === 123, `count=${pkg?._count?.questions}`);
  check("Paket punya 8 seksi", Array.isArray(pkg?.subtests) && pkg.subtests.length === 8, `subtests=${pkg?.subtests?.length}`);
  check("Subtest tidak lagi tampil terpisah di daftar publik",
    Array.isArray(examList.json?.data) && !examList.json.data.some((e) => e.title?.startsWith("Tryout SNPDB MAN IC:")),
    `masih tampil: ${JSON.stringify(examList.json?.data?.map((e) => e.title).filter((t) => t?.startsWith("Tryout SNPDB MAN IC:")))}`);

  // --- Proteksi endpoint admin & kunci jawaban ---
  const subtestOptions = await call("GET", "/api/exams?subtests=true");
  check("GET /api/exams?subtests=true ditolak tanpa login", subtestOptions.status === 401, `status=${subtestOptions.status}`);

  const keys = await call("GET", `/api/exams/${pkg.id}/keys`);
  check("GET kunci jawaban ditolak tanpa login", keys.status === 401, `status=${keys.status}`);

  const keysPut = await call("PUT", `/api/exams/${pkg.id}/keys`, { body: { keys: [] } });
  check("PUT kunci jawaban ditolak tanpa login", keysPut.status === 401, `status=${keysPut.status}`);

  const createExam = await call("POST", "/api/exams", { body: { title: "x", token: "X", questions: [{}] } });
  check("POST /api/exams ditolak tanpa login", createExam.status === 401, `status=${createExam.status}`);

  const patchExam = await call("PATCH", `/api/exams/${pkg.id}`, { body: { isActive: false } });
  check("PATCH jadwal/kunci ujian ditolak tanpa login", patchExam.status === 401, `status=${patchExam.status}`);

  const deleteExam = await call("DELETE", `/api/exams/${pkg.id}`);
  check("DELETE ujian ditolak tanpa login", deleteExam.status === 401, `status=${deleteExam.status}`);

  const parsePdf = await call("POST", "/api/exams/parse-pdf", { body: {} });
  check("POST parse-pdf ditolak tanpa login", parsePdf.status === 401, `status=${parsePdf.status}`);

  const adminResults = await call("GET", `/api/admin/exams/${pkg.id}/results`);
  check("GET rekap nilai admin ditolak tanpa login", adminResults.status === 401, `status=${adminResults.status}`);

  const adminMonitoring = await call("GET", `/api/admin/exams/${pkg.id}/monitoring`);
  check("GET monitoring admin ditolak tanpa login", adminMonitoring.status === 401, `status=${adminMonitoring.status}`);

  const adminAction = await call("POST", `/api/admin/exams/${pkg.id}/monitoring`, { body: { action: "RESET_SESSION", sessionId: "x" } });
  check("POST aksi proctoring (hapus sesi) ditolak tanpa login", adminAction.status === 401, `status=${adminAction.status}`);

  const deleteSession = await call("DELETE", "/api/admin/sessions/x");
  check("DELETE sesi siswa ditolak tanpa login", deleteSession.status === 401, `status=${deleteSession.status}`);

  const forged = await call("GET", `/api/admin/exams/${pkg.id}/results`, { cookie: "cbt_admin_session=YWRtaW46MTIz" });
  check("Cookie admin palsu ditolak", forged.status === 401, `status=${forged.status}`);

  // --- Panel data peserta (fitur impor Excel) wajib login ---
  const studentsNoAuth = await call("GET", "/api/admin/students");
  check("GET daftar peserta ditolak tanpa login", studentsNoAuth.status === 401, `status=${studentsNoAuth.status}`);

  const createStudentNoAuth = await call("POST", "/api/admin/students", { body: { name: "x" } });
  check("POST buat peserta ditolak tanpa login", createStudentNoAuth.status === 401, `status=${createStudentNoAuth.status}`);

  const importNoAuth = await call("POST", "/api/admin/students/import", { body: {} });
  check("POST impor Excel ditolak tanpa login", importNoAuth.status === 401, `status=${importNoAuth.status}`);

  const exportNoAuth = await call("GET", "/api/admin/students/export");
  check("GET ekspor Excel ditolak tanpa login", exportNoAuth.status === 401, `status=${exportNoAuth.status}`);

  const cardNoAuth = await call("GET", "/api/admin/students/card-pdf");
  check("GET kartu peserta PDF ditolak tanpa login", cardNoAuth.status === 401, `status=${cardNoAuth.status}`);

  const badLogin = await call("POST", "/api/admin/auth/login", { body: { username: "admin", password: "salah" } });
  check("Login admin dengan password salah ditolak", badLogin.status === 401, `status=${badLogin.status}`);

  const goodLogin = await call("POST", "/api/admin/auth/login", { body: { username: "admin", password: "admin123" } });
  const setCookie = goodLogin.headers.get("set-cookie") || "";
  const adminCookie = setCookie.split(";")[0];
  check("Login admin berhasil dan mengeluarkan cookie", goodLogin.status === 200 && adminCookie.startsWith("cbt_admin_session="), `status=${goodLogin.status} cookie=${adminCookie.slice(0, 40)}`);

  const adminResultsOk = await call("GET", `/api/admin/exams/${pkg.id}/results`, { cookie: adminCookie });
  check("GET rekap nilai admin sukses dengan login", adminResultsOk.status === 200, `status=${adminResultsOk.status}`);

  const adminList = await call("GET", "/api/exams", { cookie: adminCookie });
  check("Daftar ujian untuk admin memuat token", Array.isArray(adminList.json?.data) && adminList.json.data.some((e) => e.token === "IC-PAKET-UTUH"), JSON.stringify(adminList.json?.data?.map((e) => e.token)));

  const adminMonitoringOk = await call("GET", `/api/admin/exams/${pkg.id}/monitoring`, { cookie: adminCookie });
  check("Monitoring admin memakai jumlah soal gabungan (123)", adminMonitoringOk.json?.data?.exam?.totalQuestions === 123, `totalQuestions=${adminMonitoringOk.json?.data?.exam?.totalQuestions}`);

  // --- Data peserta: dibuat, dicek duplikasinya, lalu dipakai login ---
  const rosterPhone = `0817${String(STAMP).slice(-8)}`;
  const rosterUsername = `e2e${STAMP}`;
  const rosterPassword = "CBT-PW-1234";

  const createStudent = await call("POST", "/api/admin/students", {
    cookie: adminCookie,
    body: {
      name: TEST_NAME,
      school: "MTsN Uji",
      phone: rosterPhone,
      username: rosterUsername,
      nisn: `E2E-${STAMP}`,
      password: rosterPassword,
    },
  });
  check("Admin membuat peserta baru", createStudent.status === 200 && !!createStudent.json?.data?.id, JSON.stringify(createStudent.json)?.slice(0, 200));
  check(
    "No. HP peserta disimpan dalam format seragam (628xx)",
    createStudent.json?.data?.phone === `62817${String(STAMP).slice(-8)}`,
    `phone=${createStudent.json?.data?.phone}`,
  );

  const duplicatePhone = await call("POST", "/api/admin/students", {
    cookie: adminCookie,
    body: { name: "Peserta Duplikat", phone: rosterPhone, nisn: `E2E-DUP-${STAMP}` },
  });
  check("No. HP yang sama tidak boleh didaftarkan dua kali", duplicatePhone.status === 409, `status=${duplicatePhone.status} msg=${duplicatePhone.json?.message}`);

  const studentList = await call("GET", "/api/admin/students", { cookie: adminCookie });
  check(
    "Daftar peserta termasuk peserta baru",
    studentList.status === 200 && Array.isArray(studentList.json?.data) && studentList.json.data.some((s) => s.id === createStudent.json?.data?.id),
    `status=${studentList.status} jumlah=${studentList.json?.data?.length}`,
  );

  const studentBadLogin = await call("POST", "/api/admin/auth/login", { body: { username: rosterUsername, password: "password-salah" } });
  check("Login peserta dengan password salah ditolak", studentBadLogin.status === 401, `status=${studentBadLogin.status} msg=${studentBadLogin.json?.message}`);

  const unknownLogin = await call("POST", "/api/admin/auth/login", { body: { username: `nobody${STAMP}`, password: "apa-saja" } });
  check("Login dengan akun yang tidak terdaftar ditolak", unknownLogin.status === 401, `status=${unknownLogin.status} msg=${unknownLogin.json?.message}`);

  const studentLogin = await call("POST", "/api/admin/auth/login", { body: { username: rosterUsername, password: rosterPassword } });
  const studentSetCookie = studentLogin.headers.get("set-cookie") || "";
  const studentCookie = studentSetCookie.split(";")[0];
  check("Login peserta sukses dengan data impor", studentLogin.status === 200 && studentLogin.json?.role === "student", `status=${studentLogin.status} role=${studentLogin.json?.role}`);
  check(
    "Login peserta TIDAK mengeluarkan cookie admin",
    studentCookie.startsWith("cbt_user_session=") && !studentCookie.startsWith("cbt_admin_session="),
    `cookie=${studentCookie.slice(0, 40)}`,
  );

  const studentSeesAdmin = await call("GET", "/api/admin/students", { cookie: studentCookie });
  check("Cookie peserta tidak bisa membuka data admin", studentSeesAdmin.status === 401, `status=${studentSeesAdmin.status}`);

  const phoneLogin = await call("POST", "/api/admin/auth/login", { body: { username: rosterPhone, password: rosterPassword } });
  check("Login peserta bisa memakai No. HP", phoneLogin.status === 200 && phoneLogin.json?.role === "student", `status=${phoneLogin.status} msg=${phoneLogin.json?.message}`);

  // --- Pengujian jadwal oleh admin ---
  const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const setSchedule = await call("PATCH", `/api/exams/${pkg.id}`, { cookie: adminCookie, body: { openTime: future, closeTime: null } });
  check("Admin mengatur jadwal buka", setSchedule.status === 200, `status=${setSchedule.status} ${JSON.stringify(setSchedule.json)}`);

  const startBeforeOpen = await call("POST", "/api/session/start", {
    body: { token: "IC-PAKET-UTUH", studentName: TEST_NAME, studentSchool: "MTsN Uji", studentWhatsapp: SCHEDULE_PHONE, studentPassword: "pin-jadwal-1234" },
  });
  check("Peserta diblokir sebelum jadwal buka", startBeforeOpen.status === 403 && /belum dibuka/i.test(startBeforeOpen.json?.message || ""), `status=${startBeforeOpen.status} msg=${startBeforeOpen.json?.message}`);

  const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const setExpired = await call("PATCH", `/api/exams/${pkg.id}`, { cookie: adminCookie, body: { openTime: past, closeTime: new Date(Date.now() - 1000).toISOString() } });
  check("Admin mengatur jadwal kedaluwarsa", setExpired.status === 200, `status=${setExpired.status}`);

  const startExpired = await call("POST", "/api/session/start", {
    body: { token: "IC-PAKET-UTUH", studentName: TEST_NAME, studentSchool: "MTsN Uji", studentWhatsapp: SCHEDULE_PHONE, studentPassword: "pin-jadwal-1234" },
  });
  check("Peserta diblokir setelah jadwal selesai", startExpired.status === 403 && /berakhir/i.test(startExpired.json?.message || ""), `status=${startExpired.status} msg=${startExpired.json?.message}`);

  const clearSchedule = await call("PATCH", `/api/exams/${pkg.id}`, { cookie: adminCookie, body: { openTime: null, closeTime: null } });
  check("Admin membersihkan jadwal", clearSchedule.status === 200 && !clearSchedule.json?.data?.openTime, JSON.stringify(clearSchedule.json)?.slice(0, 160));

  // --- Peserta hasil impor Excel terhubung ke sesi ujian (satu kali pengerjaan) ---
  const rosterWrongPin = await call("POST", "/api/session/start", {
    body: { token: "IC-PAKET-UTUH", studentName: TEST_NAME, studentSchool: "MTsN Uji", studentWhatsapp: rosterPhone, studentPassword: "pin-lain-9999" },
  });
  check(
    "PIN berbeda dari data terdaftar ditolak (peserta terhubung ke data impor)",
    rosterWrongPin.status === 401,
    `status=${rosterWrongPin.status} msg=${rosterWrongPin.json?.message}`,
  );

  const rosterStart = await call("POST", "/api/session/start", {
    body: { token: "IC-PAKET-UTUH", studentName: TEST_NAME, studentSchool: "MTsN Uji", studentWhatsapp: rosterPhone, studentPassword: rosterPassword },
  });
  check(
    "Peserta impor bisa masuk ujian dengan password dari Excel",
    rosterStart.status === 200 && rosterStart.json?.data?.questions?.length === 123,
    `status=${rosterStart.status} msg=${rosterStart.json?.message} jumlah=${rosterStart.json?.data?.questions?.length}`,
  );
  const rosterSessionId = rosterStart.json?.data?.session?.id;

  // --- Alur peserta ---
  const start = await call("POST", "/api/session/start", {
    body: { token: "IC-PAKET-UTUH", studentName: TEST_NAME, studentSchool: "MTsN Uji", studentWhatsapp: TEST_PHONE, studentPassword: TEST_PASSWORD },
  });
  check("Mulai tryout sukses", start.status === 200 && start.json?.success, JSON.stringify(start.json)?.slice(0, 240));
  check("Soal yang dikirim berjumlah 123", start.json?.data?.questions?.length === 123, `jumlah=${start.json?.data?.questions?.length}`);
  check("Kunci jawaban & pembahasan tidak ikut dikirim ke peserta",
    Array.isArray(start.json?.data?.questions) && start.json.data.questions.every((q) => q.correctAnswer === undefined && q.explanation === undefined),
    JSON.stringify(Object.keys(start.json?.data?.questions?.[0] || {})));
  check("Sisa waktu terisi", typeof start.json?.data?.remainingSeconds === "number" && start.json.data.remainingSeconds > 0, `remaining=${start.json?.data?.remainingSeconds}`);
  const sessionId = start.json?.data?.session?.id;

  const wrongPin = await call("POST", "/api/session/start", {
    body: { token: "IC-PAKET-UTUH", studentName: TEST_NAME, studentSchool: "MTsN Uji", studentWhatsapp: TEST_PHONE, studentPassword: "pin-salah-9999" },
  });
  check("PIN salah ditolak", wrongPin.status === 401, `status=${wrongPin.status} msg=${wrongPin.json?.message}`);

  const resume = await call("POST", "/api/session/start", {
    body: { token: "IC-PAKET-UTUH", studentName: TEST_NAME, studentSchool: "MTsN Uji", studentWhatsapp: TEST_PHONE, studentPassword: TEST_PASSWORD },
  });
  check("Percobaan kedua melanjutkan sesi yang sama (bukan sesi baru)", resume.status === 200 && resume.json?.data?.session?.id === sessionId, `sessionId=${resume.json?.data?.session?.id} vs ${sessionId}`);

  const antiCheat = await call("GET", `/api/session/${sessionId}/anti-cheat`);
  check("Endpoint status sesi menyediakan closeTime untuk timer", antiCheat.status === 200 && "closeTime" in (antiCheat.json?.data?.exam || {}), JSON.stringify(antiCheat.json?.data?.exam));

  const questionId = start.json?.data?.questions?.[0]?.id;
  const answer = await call("POST", `/api/session/${sessionId}/answer`, { body: { questionId, selectedOption: "A" } });
  check("Menyimpan jawaban sukses", answer.status === 200 && answer.json?.success, JSON.stringify(answer.json)?.slice(0, 200));

  const wrongQuestion = await call("POST", `/api/session/${sessionId}/answer`, { body: { questionId: "tidak-ada", selectedOption: "A" } });
  check("Soal di luar paket ditolak", wrongQuestion.status === 400, `status=${wrongQuestion.status}`);

  const submit = await call("POST", `/api/session/${sessionId}/submit`);
  check("Submit ujian sukses", submit.status === 200 && submit.json?.success, JSON.stringify(submit.json)?.slice(0, 240));

  const restart = await call("POST", "/api/session/start", {
    body: { token: "IC-PAKET-UTUH", studentName: `${TEST_NAME} Baru`, studentSchool: "MTsN Uji", studentWhatsapp: TEST_PHONE, studentPassword: TEST_PASSWORD },
  });
  check("Setelah submit, peserta TIDAK BISA mengerjakan lagi (1x pengerjaan)", restart.status === 403, `status=${restart.status} msg=${restart.json?.message}`);

  const result = await call("GET", `/api/session/${sessionId}/result`);
  check("Hasil ujian bisa diambil", result.status === 200 && result.json?.success, JSON.stringify(result.json)?.slice(0, 200));
  check("Status hasil = COMPLETED", result.json?.data?.session?.status === "COMPLETED", `status=${result.json?.data?.session?.status}`);
  check("Nomor sertifikat tersedia", Boolean(result.json?.data?.session?.certificateNumber), `${result.json?.data?.session?.certificateNumber}`);
  check("Analisa per seksi berjumlah 8", result.json?.data?.subjectBreakdown?.length === 8, `breakdown=${result.json?.data?.subjectBreakdown?.length} ${JSON.stringify(result.json?.data?.subjectBreakdown?.map((s) => s.subject))}`);
  check("Jumlah butir analisa = 123", result.json?.data?.questions?.length === 123, `jumlah=${result.json?.data?.questions?.length}`);
  check("Data sesi memuat no. HP untuk PDF sertifikat", Boolean(result.json?.data?.session?.studentWhatsapp), `${result.json?.data?.session?.studentWhatsapp}`);
  const expectedMax = (result.json?.data?.questions || []).reduce((sum, q) => sum + (q.points || 0), 0);
  check("Skor maksimal memakai seluruh soal paket", result.json?.data?.session?.maxPossibleScore === expectedMax, `max=${result.json?.data?.session?.maxPossibleScore} expected=${expectedMax}`);
  check("Data PDF analisa lengkap (kunci + jawaban peserta)",
    Array.isArray(result.json?.data?.questions) &&
      result.json.data.questions.every((q) => "correctAnswer" in q && "studentAnswer" in q && "isCorrect" in q && "subject" in q),
    JSON.stringify(Object.keys(result.json?.data?.questions?.[0] || {})));

  // --- Halaman hasil (tempat unduh sertifikat & analisa PDF otomatis) ---
  const resultPage = await fetch(`${BASE}/exam/IC-PAKET-UTUH/result?sessionId=${sessionId}`);
  check("Halaman hasil terbuka", resultPage.status === 200, `status=${resultPage.status}`);
  const testPage = await fetch(`${BASE}/exam/IC-PAKET-UTUH/test`);
  check("Halaman pengerjaan terbuka", testPage.status === 200, `status=${testPage.status}`);
  const entryPage = await fetch(`${BASE}/exam/IC-PAKET-UTUH`);
  check("Halaman konfirmasi peserta terbuka", entryPage.status === 200, `status=${entryPage.status}`);
  const homePage = await fetch(`${BASE}/`);
  const homeHtml = await homePage.text();
  check("Halaman utama punya kolom PIN ujian", homeHtml.includes("PIN Ujian"), "kolom PIN tidak ditemukan");

  // --- Proteksi halaman admin (proxy.ts) ---
  const adminNoCookie = await fetch(`${BASE}/admin`, { redirect: "manual" });
  check("Halaman /admin tanpa login diarahkan ke login", adminNoCookie.status === 307 || adminNoCookie.status === 302, `status=${adminNoCookie.status} loc=${adminNoCookie.headers.get("location")}`);

  const adminForged = await fetch(`${BASE}/admin`, { redirect: "manual", headers: { cookie: "cbt_admin_session=YWRtaW46MTIz" } });
  check("Halaman /admin dengan cookie palsu tetap diarahkan", adminForged.status === 307 || adminForged.status === 302, `status=${adminForged.status}`);

  const adminOk = await fetch(`${BASE}/admin`, { redirect: "manual", headers: { cookie: adminCookie } });
  check("Halaman /admin terbuka setelah login", adminOk.status === 200, `status=${adminOk.status} loc=${adminOk.headers.get("location")}`);

  console.log(`\nRINGKASAN: ${passed} lulus, ${failed} gagal`);
  if (failures.length) {
    console.log("GAGAL:");
    for (const f of failures) console.log(` - ${f}`);
    process.exitCode = 1;
  }

  // Bersihkan data uji coba
  const cleanupSession = await call("DELETE", `/api/admin/sessions/${sessionId}`, { cookie: adminCookie });
  console.log(`cleanup sesi: ${cleanupSession.status}`);
  if (rosterSessionId) {
    const cleanupRoster = await call("DELETE", `/api/admin/sessions/${rosterSessionId}`, { cookie: adminCookie });
    console.log(`cleanup sesi impor: ${cleanupRoster.status}`);
  }
  await call("DELETE", `/api/admin/sessions/x`, { cookie: adminCookie });
}

main().catch((error) => {
  console.error("ERROR:", error);
  process.exitCode = 1;
});
