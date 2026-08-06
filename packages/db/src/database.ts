import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS communities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  external_guild_id TEXT,
  monitored_channel_ids TEXT NOT NULL,
  mode TEXT NOT NULL,
  creator_tone TEXT NOT NULL,
  autonomy_policy TEXT NOT NULL,
  retention_policy TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS community_tenets (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  statement TEXT NOT NULL,
  category TEXT NOT NULL,
  source TEXT NOT NULL,
  active INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS member_profiles (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  external_member_id TEXT,
  display_name TEXT NOT NULL,
  privacy_status TEXT NOT NULL,
  approved_notes TEXT NOT NULL,
  is_new_member INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS memory_receipts (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  claim TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_reference TEXT NOT NULL,
  learned_at TEXT NOT NULL,
  confidence REAL NOT NULL,
  status TEXT NOT NULL,
  why_relevant TEXT NOT NULL,
  mind_reference TEXT
);

CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  external_message_id TEXT NOT NULL UNIQUE,
  actor_id TEXT NOT NULL,
  affected_member_ids TEXT NOT NULL,
  message_excerpt TEXT NOT NULL,
  conversation_context TEXT NOT NULL,
  status TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  confidence REAL NOT NULL,
  summary TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  classification TEXT NOT NULL,
  policy_matches TEXT NOT NULL,
  memory_receipt_ids TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  created_at TEXT NOT NULL,
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS proposed_actions (
  id TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  target_id TEXT,
  content TEXT NOT NULL,
  risk_class TEXT NOT NULL,
  requires_approval INTEGER NOT NULL,
  status TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  proposed_at TEXT NOT NULL,
  approved_at TEXT,
  executed_at TEXT,
  execution_result TEXT
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  due_at TEXT NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  claimed_at TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT
);
CREATE INDEX IF NOT EXISTS follow_ups_due_idx ON follow_ups(status, due_at);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  incident_id TEXT,
  actor_type TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_summary TEXT NOT NULL,
  occurred_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS audit_events_incident_idx ON audit_events(incident_id, occurred_at);

CREATE TABLE IF NOT EXISTS community_pulses (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  positive_prompt TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS demo_state (
  community_id TEXT PRIMARY KEY REFERENCES communities(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS processed_messages (
  external_message_id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL,
  processed_at TEXT NOT NULL
);
`;

function defaultDatabasePath(): string {
  const configured = process.env.TEND_DB_PATH;
  if (configured) {
    return path.resolve(/* turbopackIgnore: true */ process.cwd(), configured);
  }

  let cursor = process.cwd();
  while (path.dirname(cursor) !== cursor) {
    if (fs.existsSync(path.join(cursor, "pnpm-workspace.yaml"))) {
      return path.join(cursor, "data", "tend.db");
    }
    cursor = path.dirname(cursor);
  }
  return path.resolve(process.cwd(), "data", "tend.db");
}

export type TendDatabase = Database.Database;

export function openDatabase(filename = defaultDatabasePath()): TendDatabase {
  if (filename !== ":memory:") {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
  }
  const database = new Database(filename);
  database.pragma("foreign_keys = ON");
  database.pragma("journal_mode = WAL");
  database.pragma("busy_timeout = 5000");
  database.exec(MIGRATION_SQL);
  return database;
}
