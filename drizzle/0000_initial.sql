-- Create the users table if it doesn't exist
CREATE TABLE IF NOT EXISTS "users" (
  "id" text PRIMARY KEY,                -- Unique identifier for each user
  "name" text NOT NULL,                 -- User's name
  "profile_image" text,                 -- URL to the user's profile image
  "created_at" timestamp NOT NULL DEFAULT NOW(),  -- Timestamp for when the user was created
  "updated_at" timestamp NOT NULL DEFAULT NOW(),  -- Timestamp for the last update of the user
  "clerk_id" text NOT NULL UNIQUE,      -- Unique identifier for the user in Clerk
  "stripe_customer_id" text UNIQUE,     -- Unique identifier for the user in Stripe
  "email" text NOT NULL UNIQUE,          -- User's email address
  "username" text UNIQUE,                -- User's chosen username
  "email_verified" timestamp,            -- Timestamp for when the user's email was verified
  "points" integer NOT NULL DEFAULT 50,  -- Points associated with the user
  "credits" integer DEFAULT 30,          -- Credits associated with the user
  "subscription" boolean DEFAULT false    -- Subscription status of the user
);

-- Create the comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS "comments" (
  "id" serial PRIMARY KEY,               -- Unique identifier for each comment
  "content" text NOT NULL,               -- Content of the comment
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,  -- Reference to the user who made the comment
  "blog_slug" text NOT NULL,             -- Slug for the blog post related to the comment
  "parent_id" integer REFERENCES "comments"("id") ON DELETE CASCADE,   -- Reference to the parent comment for threaded comments
  "likes" integer NOT NULL DEFAULT 0,    -- Number of likes for the comment
  "created_at" timestamp NOT NULL DEFAULT NOW(),  -- Timestamp for when the comment was created
  "updated_at" timestamp NOT NULL DEFAULT NOW()   -- Timestamp for the last update of the comment
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS "comments_blog_slug_idx" ON "comments"("blog_slug");
CREATE INDEX IF NOT EXISTS "comments_user_id_idx" ON "comments"("user_id");
CREATE INDEX IF NOT EXISTS "comments_parent_id_idx" ON "comments"("parent_id");
