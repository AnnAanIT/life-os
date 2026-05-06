ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_contact_note text;
ALTER TABLE books ADD COLUMN IF NOT EXISTS key_takeaway text;
