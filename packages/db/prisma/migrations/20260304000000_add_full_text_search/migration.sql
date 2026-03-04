-- Add tsvector columns for full-text search (ADR-004)
ALTER TABLE "listings" ADD COLUMN "search_vector" tsvector;
ALTER TABLE "artist_profiles" ADD COLUMN "search_vector" tsvector;

-- Backfill existing rows with weighted tsvector
-- Weights: A = title/display_name (most important), B = medium, C = description/bio/location
UPDATE "listings" SET "search_vector" =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(medium, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'C');

UPDATE "artist_profiles" SET "search_vector" =
  setweight(to_tsvector('english', coalesce(display_name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(location, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(bio, '')), 'C');

-- Create GIN indexes for fast full-text search
CREATE INDEX "listings_search_vector_idx" ON "listings" USING GIN ("search_vector");
CREATE INDEX "artist_profiles_search_vector_idx" ON "artist_profiles" USING GIN ("search_vector");

-- Trigger function to keep listings search_vector updated on insert/update
CREATE OR REPLACE FUNCTION listings_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.medium, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER listings_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, medium, description
  ON "listings"
  FOR EACH ROW
  EXECUTE FUNCTION listings_search_vector_update();

-- Trigger function to keep artist_profiles search_vector updated on insert/update
CREATE OR REPLACE FUNCTION artist_profiles_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.location, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.bio, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER artist_profiles_search_vector_trigger
  BEFORE INSERT OR UPDATE OF display_name, location, bio
  ON "artist_profiles"
  FOR EACH ROW
  EXECUTE FUNCTION artist_profiles_search_vector_update();
