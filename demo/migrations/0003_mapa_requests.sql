-- Rate limit public bulk analyses. Never store response text or raw IPs.
CREATE TABLE IF NOT EXISTS mapa_requests (
  id TEXT PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mapa_requests_ip_time ON mapa_requests (ip_hash, created_at);
