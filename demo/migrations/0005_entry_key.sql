-- Idempotent /rotunda/api/wpis: the phone sends a random id per submission attempt
-- and reuses it when it retries the same text after a lost response. Only a salted
-- hash of that id is kept. A repeated key returns the stored judgment instead of
-- calling Jev again, creating a second entry or taking another rate-limit slot.
ALTER TABLE wpis_requests ADD COLUMN entry_key TEXT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_wpis_requests_entry_key ON wpis_requests (entry_key);
ALTER TABLE wpisy ADD COLUMN entry_key TEXT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_wpisy_entry_key ON wpisy (entry_key);
