-- CreateEnum
CREATE TYPE "Strategy" AS ENUM ('stitched', 'ai');

-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('queued', 'running', 'done', 'failed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ingredients" JSONB NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "analysis" JSONB,

    CONSTRAINT "Step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "strategy" "Strategy" NOT NULL,
    "status" "VideoStatus" NOT NULL DEFAULT 'queued',
    "url" TEXT,
    "costUsd" DOUBLE PRECISION,
    "durationS" DOUBLE PRECISION,
    "renderSeconds" DOUBLE PRECISION,
    "error" TEXT,
    "libraryGaps" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClipAsset" (
    "id" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "technique" TEXT NOT NULL,
    "tags" TEXT[],
    "durationS" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ClipAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "stepPosition" INTEGER,
    "techniqueCorrect" INTEGER NOT NULL,
    "ingredientsRight" INTEGER NOT NULL,
    "clarity" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("userId","recipeId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Step_recipeId_position_key" ON "Step"("recipeId", "position");

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
