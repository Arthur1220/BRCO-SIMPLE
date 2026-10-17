-- CreateIndex
CREATE INDEX "calculation_logs_createdAt_idx" ON "calculation_logs"("createdAt");

-- CreateIndex
CREATE INDEX "calculation_logs_calculationType_createdAt_idx" ON "calculation_logs"("calculationType", "createdAt");
