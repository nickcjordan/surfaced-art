-- CreateEnum
CREATE TYPE "ApplicationStatusType" AS ENUM ('pending', 'approved', 'rejected', 'withdrawn');

-- CreateTable
CREATE TABLE "artist_applications" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "instagram_url" TEXT,
    "website_url" TEXT,
    "statement" TEXT NOT NULL,
    "exhibition_history" TEXT,
    "categories" "CategoryType"[],
    "status" "ApplicationStatusType" NOT NULL DEFAULT 'pending',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "review_notes" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artist_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "artist_applications_email_key" ON "artist_applications"("email");

-- CreateIndex
CREATE INDEX "artist_applications_status_idx" ON "artist_applications"("status");
