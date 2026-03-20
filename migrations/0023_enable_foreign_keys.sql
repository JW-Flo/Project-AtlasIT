-- Enable foreign key enforcement globally.
-- D1 requires this pragma per-connection; placing it as a migration
-- ensures it runs on every schema bootstrap.
PRAGMA foreign_keys = ON;
