-- Seed built-in compliance packs for Phase 16 Plugin API

INSERT OR IGNORE INTO compliance_packs (id, name, slug, description, author, version, framework_id, controls_count, status, is_builtin, created_at, updated_at) VALUES
  ('pack-soc2-builtin', 'SOC 2 Type II', 'soc2-type-ii', 'Trust Services Criteria for SOC 2 Type II audits covering security, availability, processing integrity, confidentiality, and privacy.', 'atlasit', '1.0.0', 'SOC2', 24, 'published', 1, datetime('now'), datetime('now')),
  ('pack-iso27001-builtin', 'ISO 27001:2022', 'iso-27001-2022', 'Information security management system controls aligned with Annex A of ISO/IEC 27001:2022.', 'atlasit', '1.0.0', 'ISO27001', 30, 'published', 1, datetime('now'), datetime('now')),
  ('pack-nist-csf-builtin', 'NIST CSF 2.0', 'nist-csf-2', 'NIST Cybersecurity Framework 2.0 functions: Govern, Identify, Protect, Detect, Respond, Recover.', 'atlasit', '1.0.0', 'NIST CSF', 22, 'published', 1, datetime('now'), datetime('now')),
  ('pack-hipaa-builtin', 'HIPAA Security Rule', 'hipaa-security', 'Administrative, physical, and technical safeguards required by the HIPAA Security Rule.', 'atlasit', '1.0.0', 'HIPAA', 18, 'published', 1, datetime('now'), datetime('now')),
  ('pack-gdpr-builtin', 'GDPR', 'gdpr', 'EU General Data Protection Regulation articles covering data processing, rights, and security obligations.', 'atlasit', '1.0.0', 'GDPR', 16, 'published', 1, datetime('now'), datetime('now'));
