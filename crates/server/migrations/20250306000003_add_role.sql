-- Add role column to waitlist table
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS role VARCHAR(255);
