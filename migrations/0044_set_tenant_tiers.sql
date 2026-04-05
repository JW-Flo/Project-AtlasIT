-- Set AtlasIT tenant to enterprise tier, all others to professional
UPDATE tenants SET tier = 'enterprise', updated_at = datetime('now') WHERE name = 'AtlasIT';
UPDATE tenants SET tier = 'professional', updated_at = datetime('now') WHERE name != 'AtlasIT' AND (tier IS NULL OR tier NOT IN ('professional', 'enterprise'));
