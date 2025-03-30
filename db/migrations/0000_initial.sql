CREATE TABLE IF NOT EXISTS "user_session" (
  "id" SERIAL PRIMARY KEY,
  "session_id" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "batch_id" INTEGER REFERENCES "batch"("id"),
  "meta" JSONB,
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "batch" (
  "id" SERIAL PRIMARY KEY,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "image_batch" (
  "id" SERIAL PRIMARY KEY,
  "class_name" TEXT NOT NULL,
  "batch_id" INTEGER REFERENCES "batch"("id"),
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "image" (
  "id" SERIAL PRIMARY KEY,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "is_first_image" BOOLEAN DEFAULT FALSE,
  "image_batch_id" INTEGER REFERENCES "image_batch"("id"),
  "image_key" VARCHAR NOT NULL,
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "results" (
  "id" SERIAL PRIMARY KEY,
  "image_id" INTEGER REFERENCES "image"("id"),
  "user_id" INTEGER REFERENCES "user_session"("id"),
  "score" INTEGER,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
); 