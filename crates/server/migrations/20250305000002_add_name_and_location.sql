-- Add name and location columns to waitlist table
ALTER TABLE waitlist
    ADD COLUMN name VARCHAR(255),
    ADD COLUMN location VARCHAR(255);

-- Create index on location for filtering
CREATE INDEX IF NOT EXISTS idx_waitlist_location ON waitlist(location);
