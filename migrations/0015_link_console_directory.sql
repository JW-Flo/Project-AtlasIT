-- Link console users to directory users
ALTER TABLE directory_users ADD COLUMN source TEXT;
ALTER TABLE directory_users ADD COLUMN console_user_id TEXT;
CREATE INDEX idx_directory_users_console_user_id ON directory_users(console_user_id);
