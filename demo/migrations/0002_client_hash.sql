-- Rate limit per browser (random id kept in localStorage) instead of only per IP,
-- so a room on one conference Wi-Fi address is not capped at a handful of entries.
ALTER TABLE wpisy ADD COLUMN client_hash TEXT;
CREATE INDEX IF NOT EXISTS wpisy_client_created ON wpisy (client_hash, created_at);
