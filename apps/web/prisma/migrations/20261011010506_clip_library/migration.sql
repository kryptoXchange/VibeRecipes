-- CreateEnum
CREATE TYPE "ClipSource" AS ENUM ('real', 'ai');

-- CreateEnum
CREATE TYPE "ClipStatus" AS ENUM ('approved', 'rejected');

-- AlterTable
ALTER TABLE "ClipAsset" ADD COLUMN     "costUsd" DOUBLE PRECISION,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "ingredient" TEXT,
ADD COLUMN     "prompt" TEXT,
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "source" "ClipSource" NOT NULL DEFAULT 'real',
ADD COLUMN     "status" "ClipStatus" NOT NULL DEFAULT 'approved';

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "stepSources" JSONB;

-- CreateIndex
CREATE INDEX "ClipAsset_source_status_technique_idx" ON "ClipAsset"("source", "status", "technique");
