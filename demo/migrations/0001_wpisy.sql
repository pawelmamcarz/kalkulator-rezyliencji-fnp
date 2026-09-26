-- Rotunda: one row per booth entry. Judgments only; `text` is kept only
-- with consent and after the personal-data and offensive-content checks,
-- and is deleted on rejection. Raw IPs are never stored (ip_hash only).
CREATE TABLE IF NOT EXISTS wpisy (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  rola TEXT NOT NULL,
  starter TEXT NOT NULL,
  silence REAL NOT NULL,
  area TEXT,
  top_cause TEXT,
  causes TEXT NOT NULL DEFAULT '[]', -- JSON array of cause ids
  severity REAL,
  text TEXT NULL,
  quote_status TEXT NULL, -- pending | approved | rejected
  ip_hash TEXT NOT NULL,
  -- Moderation support: Jev check scores shown to the moderator, decision time.
  dane_osobowe REAL NULL,
  obrazliwe REAL NULL,
  moderated_at TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_wpisy_created_at ON wpisy (created_at);
CREATE INDEX IF NOT EXISTS idx_wpisy_ip_hash ON wpisy (ip_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_wpisy_quote_status ON wpisy (quote_status);
