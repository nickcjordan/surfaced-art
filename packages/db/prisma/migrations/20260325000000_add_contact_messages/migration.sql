-- Add contact email and contact enabled fields to artist_profiles
ALTER TABLE "artist_profiles" ADD COLUMN "contact_email" TEXT;
ALTER TABLE "artist_profiles" ADD COLUMN "contact_enabled" BOOLEAN NOT NULL DEFAULT true;

-- Create contact_messages table
CREATE TABLE "contact_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "artist_id" UUID NOT NULL,
    "sender_name" VARCHAR(200) NOT NULL,
    "sender_email" VARCHAR(320) NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "ip_address" VARCHAR(45),
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- Add indexes
CREATE INDEX "contact_messages_artist_id_idx" ON "contact_messages"("artist_id");
CREATE INDEX "contact_messages_sender_email_artist_id_sent_at_idx" ON "contact_messages"("sender_email", "artist_id", "sent_at");

-- Add foreign key
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
