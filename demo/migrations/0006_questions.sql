CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY, question TEXT NOT NULL, created INTEGER NOT NULL,
  sender TEXT NOT NULL, approved INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS questions_sender_created ON questions(sender, created);
