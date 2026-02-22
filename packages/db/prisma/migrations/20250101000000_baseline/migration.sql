-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRoleType" AS ENUM ('buyer', 'artist', 'admin', 'curator', 'moderator');

-- CreateEnum
CREATE TYPE "ArtistStatusType" AS ENUM ('pending', 'approved', 'suspended');

-- CreateEnum
CREATE TYPE "ListingStatusType" AS ENUM ('available', 'reserved_system', 'reserved_artist', 'sold');

-- CreateEnum
CREATE TYPE "ListingTypeType" AS ENUM ('standard', 'commission');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('ceramics', 'painting', 'print', 'jewelry', 'illustration', 'photography', 'woodworking', 'fibers', 'mixed_media');

-- CreateEnum
CREATE TYPE "CommissionStatusType" AS ENUM ('proposed', 'accepted', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "OrderStatusType" AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'complete', 'disputed', 'refunded');

-- CreateEnum
CREATE TYPE "CvEntryTypeType" AS ENUM ('exhibition', 'award', 'education', 'press', 'residency', 'other');

-- CreateEnum
CREATE TYPE "ProcessMediaTypeType" AS ENUM ('photo', 'video');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "cognito_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "preferences" JSONB,
    "last_active_at" TIMESTAMP(3),
    "acquisition_utm_source" TEXT,
    "acquisition_utm_medium" TEXT,
    "acquisition_utm_campaign" TEXT,
    "acquisition_self_reported" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "UserRoleType" NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "granted_by" UUID,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "website_url" TEXT,
    "instagram_url" TEXT,
    "stripe_account_id" TEXT,
    "origin_zip" TEXT NOT NULL,
    "status" "ArtistStatusType" NOT NULL DEFAULT 'pending',
    "commissions_open" BOOLEAN NOT NULL DEFAULT false,
    "cover_image_url" TEXT,
    "profile_image_url" TEXT,
    "application_source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artist_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist_categories" (
    "id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,
    "category" "CategoryType" NOT NULL,

    CONSTRAINT "artist_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist_cv_entries" (
    "id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,
    "type" "CvEntryTypeType" NOT NULL,
    "title" TEXT NOT NULL,
    "institution" TEXT,
    "year" INTEGER NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "artist_cv_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist_process_media" (
    "id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,
    "type" "ProcessMediaTypeType" NOT NULL,
    "url" TEXT,
    "video_asset_id" TEXT,
    "video_playback_id" TEXT,
    "video_provider" TEXT,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artist_process_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,
    "type" "ListingTypeType" NOT NULL DEFAULT 'standard',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "medium" TEXT NOT NULL,
    "category" "CategoryType" NOT NULL,
    "price" INTEGER NOT NULL,
    "status" "ListingStatusType" NOT NULL DEFAULT 'available',
    "is_documented" BOOLEAN NOT NULL DEFAULT false,
    "quantity_total" INTEGER NOT NULL DEFAULT 1,
    "quantity_remaining" INTEGER NOT NULL DEFAULT 1,
    "artwork_length" DECIMAL(10,2),
    "artwork_width" DECIMAL(10,2),
    "artwork_height" DECIMAL(10,2),
    "packed_length" DECIMAL(10,2) NOT NULL,
    "packed_width" DECIMAL(10,2) NOT NULL,
    "packed_height" DECIMAL(10,2) NOT NULL,
    "packed_weight" DECIMAL(10,2) NOT NULL,
    "edition_number" INTEGER,
    "edition_total" INTEGER,
    "reserved_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_images" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "is_process_photo" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "timeline_days" INTEGER,
    "status" "CommissionStatusType" NOT NULL DEFAULT 'proposed',
    "accepted_at" TIMESTAMP(3),
    "days_to_complete" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_updates" (
    "id" UUID NOT NULL,
    "commission_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,
    "stripe_payment_intent_id" TEXT NOT NULL,
    "artwork_price" INTEGER NOT NULL,
    "shipping_cost" INTEGER NOT NULL,
    "platform_commission" INTEGER NOT NULL,
    "artist_payout" INTEGER NOT NULL,
    "tax_amount" INTEGER NOT NULL,
    "status" "OrderStatusType" NOT NULL DEFAULT 'pending',
    "shipping_carrier" TEXT,
    "tracking_number" TEXT,
    "days_to_fulfill" INTEGER,
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "payout_released_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,
    "rating_product" INTEGER NOT NULL,
    "rating_communication" INTEGER NOT NULL,
    "rating_packaging" INTEGER NOT NULL,
    "overall_rating" DECIMAL(3,2) NOT NULL,
    "headline" TEXT,
    "content" TEXT,
    "arrived_damaged" BOOLEAN NOT NULL DEFAULT false,
    "arrived_late" BOOLEAN NOT NULL DEFAULT false,
    "shipping_issue" BOOLEAN NOT NULL DEFAULT false,
    "artist_response" TEXT,
    "artist_responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saves" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follows" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_cognito_id_key" ON "users"("cognito_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_key" ON "user_roles"("user_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "artist_profiles_user_id_key" ON "artist_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "artist_profiles_slug_key" ON "artist_profiles"("slug");

-- CreateIndex
CREATE INDEX "artist_profiles_status_idx" ON "artist_profiles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "artist_categories_artist_id_category_key" ON "artist_categories"("artist_id", "category");

-- CreateIndex
CREATE INDEX "listings_artist_id_idx" ON "listings"("artist_id");

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "listings"("status");

-- CreateIndex
CREATE INDEX "listings_category_idx" ON "listings"("category");

-- CreateIndex
CREATE INDEX "listings_artist_id_status_idx" ON "listings"("artist_id", "status");

-- CreateIndex
CREATE INDEX "listing_images_listing_id_idx" ON "listing_images"("listing_id");

-- CreateIndex
CREATE INDEX "listing_images_listing_id_is_process_photo_idx" ON "listing_images"("listing_id", "is_process_photo");

-- CreateIndex
CREATE UNIQUE INDEX "commissions_listing_id_key" ON "commissions"("listing_id");

-- CreateIndex
CREATE INDEX "commissions_buyer_id_idx" ON "commissions"("buyer_id");

-- CreateIndex
CREATE INDEX "commissions_status_idx" ON "commissions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "orders_stripe_payment_intent_id_key" ON "orders"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "orders_buyer_id_idx" ON "orders"("buyer_id");

-- CreateIndex
CREATE INDEX "orders_artist_id_idx" ON "orders"("artist_id");

-- CreateIndex
CREATE INDEX "orders_listing_id_idx" ON "orders"("listing_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_order_id_key" ON "reviews"("order_id");

-- CreateIndex
CREATE INDEX "reviews_artist_id_idx" ON "reviews"("artist_id");

-- CreateIndex
CREATE INDEX "reviews_listing_id_idx" ON "reviews"("listing_id");

-- CreateIndex
CREATE INDEX "saves_user_id_idx" ON "saves"("user_id");

-- CreateIndex
CREATE INDEX "saves_listing_id_idx" ON "saves"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "saves_user_id_listing_id_key" ON "saves"("user_id", "listing_id");

-- CreateIndex
CREATE INDEX "follows_user_id_idx" ON "follows"("user_id");

-- CreateIndex
CREATE INDEX "follows_artist_id_idx" ON "follows"("artist_id");

-- CreateIndex
CREATE UNIQUE INDEX "follows_user_id_artist_id_key" ON "follows"("user_id", "artist_id");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_email_key" ON "waitlist"("email");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_profiles" ADD CONSTRAINT "artist_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_categories" ADD CONSTRAINT "artist_categories_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_cv_entries" ADD CONSTRAINT "artist_cv_entries_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_process_media" ADD CONSTRAINT "artist_process_media_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_updates" ADD CONSTRAINT "commission_updates_commission_id_fkey" FOREIGN KEY ("commission_id") REFERENCES "commissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artist_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artist_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saves" ADD CONSTRAINT "saves_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saves" ADD CONSTRAINT "saves_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

