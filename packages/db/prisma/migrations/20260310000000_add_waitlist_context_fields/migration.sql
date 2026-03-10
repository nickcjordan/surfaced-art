-- AlterTable
ALTER TABLE "waitlist" ADD COLUMN "source" TEXT,
ADD COLUMN "artist_id" UUID,
ADD COLUMN "listing_id" UUID;
