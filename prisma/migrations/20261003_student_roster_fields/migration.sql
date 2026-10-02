-- Kolom data peserta panitia (impor Excel): username, email, WA orang tua, kota impian, password
ALTER TABLE "Student" ADD COLUMN "username" TEXT;
ALTER TABLE "Student" ADD COLUMN "email" TEXT;
ALTER TABLE "Student" ADD COLUMN "parentWhatsapp" TEXT;
ALTER TABLE "Student" ADD COLUMN "dreamCity" TEXT;
ALTER TABLE "Student" ADD COLUMN "registrationTimestamp" TEXT;
ALTER TABLE "Student" ADD COLUMN "password" TEXT NOT NULL DEFAULT '';

-- Selaraskan default dengan skema Prisma
ALTER TABLE "Student" ALTER COLUMN "passwordHash" SET DEFAULT '';
ALTER TABLE "Student" ALTER COLUMN "salt" SET DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Student_username_key" ON "Student"("username");
