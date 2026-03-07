-- ============================================================================
-- Migration: Replace 9-category enum with 4 broad categories + structured tags
-- ============================================================================

-- Step 1: Migrate existing category data in artist_categories table
-- Map old values to new broad categories:
--   ceramics -> ceramics (unchanged)
--   painting, illustration -> drawing_painting
--   print, photography -> printmaking_photography
--   jewelry, woodworking, fibers, mixed_media -> mixed_media_3d

UPDATE "artist_categories"
SET "category" = CASE
  WHEN "category" = 'ceramics' THEN 'ceramics'
  WHEN "category" IN ('painting', 'illustration') THEN 'drawing_painting'
  WHEN "category" IN ('print', 'photography') THEN 'printmaking_photography'
  WHEN "category" IN ('jewelry', 'woodworking', 'fibers', 'mixed_media') THEN 'mixed_media_3d'
  ELSE "category"
END::text::"CategoryType";

-- Remove duplicates created by the mapping (e.g. an artist with both 'jewelry' and 'mixed_media'
-- now has two 'mixed_media_3d' entries). Keep the one with the lowest id.
DELETE FROM "artist_categories" a
USING "artist_categories" b
WHERE a."artist_id" = b."artist_id"
  AND a."category" = b."category"
  AND a."id" > b."id";

-- Step 2: Migrate existing category data in listings table
UPDATE "listings"
SET "category" = CASE
  WHEN "category" = 'ceramics' THEN 'ceramics'
  WHEN "category" IN ('painting', 'illustration') THEN 'drawing_painting'
  WHEN "category" IN ('print', 'photography') THEN 'printmaking_photography'
  WHEN "category" IN ('jewelry', 'woodworking', 'fibers', 'mixed_media') THEN 'mixed_media_3d'
  ELSE "category"
END::text::"CategoryType";

-- Step 3: Migrate existing category data in artist_applications table
-- CategoryType[] array column — update each element
UPDATE "artist_applications"
SET "categories" = (
  SELECT array_agg(DISTINCT mapped::text::"CategoryType")
  FROM unnest("categories") AS cat
  CROSS JOIN LATERAL (
    SELECT CASE
      WHEN cat::text = 'ceramics' THEN 'ceramics'
      WHEN cat::text IN ('painting', 'illustration') THEN 'drawing_painting'
      WHEN cat::text IN ('print', 'photography') THEN 'printmaking_photography'
      WHEN cat::text IN ('jewelry', 'woodworking', 'fibers', 'mixed_media') THEN 'mixed_media_3d'
      ELSE cat::text
    END AS mapped
  ) m
)
WHERE array_length("categories", 1) > 0;

-- Step 4: Now alter the enum to only have 4 values
-- PostgreSQL doesn't support removing enum values directly, so we need to:
-- 1. Create a new enum type
-- 2. Update columns to use the new type
-- 3. Drop the old type
-- 4. Rename the new type

-- Create temporary new enum
CREATE TYPE "CategoryType_new" AS ENUM ('ceramics', 'drawing_painting', 'printmaking_photography', 'mixed_media_3d');

-- Alter artist_categories to use new enum
ALTER TABLE "artist_categories" ALTER COLUMN "category" TYPE "CategoryType_new" USING ("category"::text::"CategoryType_new");

-- Alter listings to use new enum
ALTER TABLE "listings" ALTER COLUMN "category" TYPE "CategoryType_new" USING ("category"::text::"CategoryType_new");

-- Alter artist_applications to use new enum array
ALTER TABLE "artist_applications" ALTER COLUMN "categories" TYPE "CategoryType_new"[] USING ("categories"::text[]::"CategoryType_new"[]);

-- Drop old enum and rename new one
DROP TYPE "CategoryType";
ALTER TYPE "CategoryType_new" RENAME TO "CategoryType";

-- Step 5: Create tags table
CREATE TABLE "tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" "CategoryType",
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- Step 6: Create artist_tags join table
CREATE TABLE "artist_tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "artist_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "artist_tags_pkey" PRIMARY KEY ("id")
);

-- Step 7: Create listing_tags join table
CREATE TABLE "listing_tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "listing_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "listing_tags_pkey" PRIMARY KEY ("id")
);

-- Step 8: Add indexes and constraints
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");
CREATE INDEX "tags_category_idx" ON "tags"("category");
CREATE UNIQUE INDEX "artist_tags_artist_id_tag_id_key" ON "artist_tags"("artist_id", "tag_id");
CREATE UNIQUE INDEX "listing_tags_listing_id_tag_id_key" ON "listing_tags"("listing_id", "tag_id");

-- Step 9: Add foreign keys
ALTER TABLE "artist_tags" ADD CONSTRAINT "artist_tags_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "artist_tags" ADD CONSTRAINT "artist_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "listing_tags" ADD CONSTRAINT "listing_tags_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "listing_tags" ADD CONSTRAINT "listing_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 10: Seed the tag vocabulary
INSERT INTO "tags" ("slug", "label", "category", "sort_order") VALUES
-- Ceramics tags
('stoneware', 'Stoneware', 'ceramics', 1),
('porcelain', 'Porcelain', 'ceramics', 2),
('earthenware', 'Earthenware', 'ceramics', 3),
('raku', 'Raku', 'ceramics', 4),
('hand-built', 'Hand-Built', 'ceramics', 5),
('wheel-thrown', 'Wheel-Thrown', 'ceramics', 6),
-- Drawing / Painting tags
('oil', 'Oil', 'drawing_painting', 1),
('acrylic', 'Acrylic', 'drawing_painting', 2),
('watercolor', 'Watercolor', 'drawing_painting', 3),
('gouache', 'Gouache', 'drawing_painting', 4),
('encaustic', 'Encaustic', 'drawing_painting', 5),
('tempera', 'Tempera', 'drawing_painting', 6),
('charcoal', 'Charcoal', 'drawing_painting', 7),
('graphite', 'Graphite', 'drawing_painting', 8),
('ink', 'Ink', 'drawing_painting', 9),
('pastel', 'Pastel', 'drawing_painting', 10),
-- Printmaking / Photography tags
('etching', 'Etching', 'printmaking_photography', 1),
('lithograph', 'Lithograph', 'printmaking_photography', 2),
('screenprint', 'Screenprint', 'printmaking_photography', 3),
('woodblock', 'Woodblock', 'printmaking_photography', 4),
('monoprint', 'Monoprint', 'printmaking_photography', 5),
('linocut', 'Linocut', 'printmaking_photography', 6),
('film', 'Film', 'printmaking_photography', 7),
('digital', 'Digital', 'printmaking_photography', 8),
('cyanotype', 'Cyanotype', 'printmaking_photography', 9),
('photogram', 'Photogram', 'printmaking_photography', 10),
('darkroom', 'Darkroom', 'printmaking_photography', 11),
-- Mixed Media / 3D tags
('bronze', 'Bronze', 'mixed_media_3d', 1),
('cast', 'Cast', 'mixed_media_3d', 2),
('carved', 'Carved', 'mixed_media_3d', 3),
('welded', 'Welded', 'mixed_media_3d', 4),
('assemblage', 'Assemblage', 'mixed_media_3d', 5),
('collage', 'Collage', 'mixed_media_3d', 6),
('installation', 'Installation', 'mixed_media_3d', 7),
('glass', 'Glass', 'mixed_media_3d', 8),
('wood', 'Wood', 'mixed_media_3d', 9),
('weaving', 'Weaving', 'mixed_media_3d', 10),
('tapestry', 'Tapestry', 'mixed_media_3d', 11),
('jewelry', 'Jewelry', 'mixed_media_3d', 12),
-- Style tags (cross-cutting, category = NULL)
('abstract', 'Abstract', NULL, 1),
('figurative', 'Figurative', NULL, 2),
('geometric', 'Geometric', NULL, 3),
('minimalist', 'Minimalist', NULL, 4),
('expressionist', 'Expressionist', NULL, 5),
('representational', 'Representational', NULL, 6),
('surrealist', 'Surrealist', NULL, 7),
('conceptual', 'Conceptual', NULL, 8),
('landscape', 'Landscape', NULL, 9),
('portrait', 'Portrait', NULL, 10),
('still-life', 'Still Life', NULL, 11),
('narrative', 'Narrative', NULL, 12);
