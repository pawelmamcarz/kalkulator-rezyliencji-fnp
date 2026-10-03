-- Atomic rate limit for /rotunda/api/wpis: one row is reserved per accepted
-- request before Jev is called, in a single conditional INSERT. Hashes only,
-- never raw IPs, browser ids or answer text.
CREATE TABLE IF NOT EXISTS wpis_requests (
  id TEXT PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  client_hash TEXT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wpis_requests_client_time ON wpis_requests (client_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_wpis_requests_ip_time ON wpis_requests (ip_hash, created_at);
