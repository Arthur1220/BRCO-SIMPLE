-- CreateTable
CREATE TABLE "calculation_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "calculationType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "country" TEXT,
    "region" TEXT
);

-- CreateTable
CREATE TABLE "foods" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "defaultMin" REAL DEFAULT 0,
    "defaultMax" REAL DEFAULT 100,
    "MS" REAL NOT NULL,
    "MO" REAL NOT NULL,
    "EE" REAL NOT NULL,
    "PB" REAL NOT NULL,
    "PDR" REAL NOT NULL,
    "PNDR" REAL NOT NULL,
    "NDT" REAL NOT NULL,
    "FDNcp" REAL NOT NULL,
    "CNF" REAL NOT NULL,
    "Ca" REAL NOT NULL,
    "P" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
