-- Identity peserta berbasis No. HP + PIN (data Excel panitia: nama, no. HP, password)
ALTER TABLE "Student" ADD COLUMN "phone" TEXT;
ALTER TABLE "Student" ALTER COLUMN "nisn" DROP NOT NULL;

-- Urutan seksi subtest di dalam satu paket try out
ALTER TABLE "Exam" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Student_phone_key" ON "Student"("phone");
