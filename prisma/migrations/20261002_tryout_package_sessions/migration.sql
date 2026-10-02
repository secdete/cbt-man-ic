ALTER TABLE "Exam" ADD COLUMN "parentExamId" TEXT;
ALTER TABLE "ExamSession" ADD COLUMN "attemptKey" TEXT;

ALTER TABLE "Exam"
ADD CONSTRAINT "Exam_parentExamId_fkey"
FOREIGN KEY ("parentExamId") REFERENCES "Exam"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Exam_parentExamId_idx" ON "Exam"("parentExamId");
CREATE UNIQUE INDEX "ExamSession_attemptKey_key" ON "ExamSession"("attemptKey");
CREATE INDEX "ExamSession_examId_studentName_idx" ON "ExamSession"("examId", "studentName");
CREATE INDEX "ExamSession_examId_studentNisn_idx" ON "ExamSession"("examId", "studentNisn");
CREATE INDEX "ExamSession_status_startTime_idx" ON "ExamSession"("status", "startTime");
CREATE INDEX "Question_examId_questionNumber_idx" ON "Question"("examId", "questionNumber");
CREATE INDEX "AnswerSubmission_questionId_idx" ON "AnswerSubmission"("questionId");
