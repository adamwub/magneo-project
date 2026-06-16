-- AlterTable
ALTER TABLE "School" ADD COLUMN     "nisKey" TEXT;

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "total" INTEGER NOT NULL DEFAULT 0,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "succeeded" INTEGER NOT NULL DEFAULT 0,
    "created" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB NOT NULL DEFAULT '[]',
    "errorCsv" TEXT,
    "credentialsCsv" TEXT,
    "credentialsDownloadedAt" TIMESTAMP(3),
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);
