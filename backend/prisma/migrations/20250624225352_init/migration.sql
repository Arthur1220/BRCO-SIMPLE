-- CreateTable
CREATE TABLE "calculation_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "calculationType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
