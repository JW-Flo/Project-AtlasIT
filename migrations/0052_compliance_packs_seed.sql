-- AUTO-GENERATED: wire CDT rules onto existing compliance_packs + controls
-- Pre-existing tables: compliance_packs, compliance_pack_controls (both have TEXT ids, migrated from CF D1)
-- This migration creates: tenant_compliance_packs, tenant_control_state (per-tenant evaluation state)
-- and UPSERTs 64 CDT-backed controls across 5 packs.

CREATE TABLE IF NOT EXISTS tenant_compliance_packs (
  tenant_id TEXT NOT NULL,
  pack_id TEXT NOT NULL,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_evaluated_at TIMESTAMPTZ,
  pass_count INTEGER NOT NULL DEFAULT 0,
  fail_count INTEGER NOT NULL DEFAULT 0,
  unknown_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, pack_id)
);
CREATE INDEX IF NOT EXISTS idx_tenant_packs_tenant ON tenant_compliance_packs(tenant_id);

CREATE TABLE IF NOT EXISTS tenant_control_state (
  tenant_id TEXT NOT NULL,
  pack_id TEXT NOT NULL,
  control_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'unknown',
  rationale TEXT[] NOT NULL DEFAULT '{}',
  evaluated_at TIMESTAMPTZ,
  evidence_sample_size INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, pack_id, control_id)
);
CREATE INDEX IF NOT EXISTS idx_tenant_control_state_tenant ON tenant_control_state(tenant_id);

INSERT INTO compliance_pack_controls (pack_id, control_id, title, rule_fn) VALUES
  ('pack-gdpr-builtin', 'GDPR-Art5.1a', 'Lawfulness, Fairness, Transparency', 'evalGDPR_Art5_1a'),
  ('pack-gdpr-builtin', 'GDPR-Art5.1b', 'Purpose Limitation', 'evalGDPR_Art5_1b'),
  ('pack-gdpr-builtin', 'GDPR-Art5.1c', 'Data Minimisation', 'evalGDPR_Art5_1c'),
  ('pack-gdpr-builtin', 'GDPR-Art5.1d', 'Accuracy', 'evalGDPR_Art5_1d'),
  ('pack-gdpr-builtin', 'GDPR-Art5.1e', 'Storage Limitation', 'evalGDPR_Art5_1e'),
  ('pack-gdpr-builtin', 'GDPR-Art5.1f', 'Integrity & Confidentiality', 'evalGDPR_Art5_1f'),
  ('pack-gdpr-builtin', 'GDPR-Art5.2', 'Accountability', 'evalGDPR_Art5_2'),
  ('pack-hipaa-builtin', 'HIPAA-164.312.a1', 'Access Control — Unique User Identification', 'evalHIPAA_164_312_a1'),
  ('pack-hipaa-builtin', 'HIPAA-164.312.a2i', 'Emergency Access Procedure', 'evalHIPAA_164_312_a2i'),
  ('pack-hipaa-builtin', 'HIPAA-164.312.a2ii', 'Automatic Logoff', 'evalHIPAA_164_312_a2ii'),
  ('pack-hipaa-builtin', 'HIPAA-164.312.a2iv', 'Encryption & Decryption', 'evalHIPAA_164_312_a2iv'),
  ('pack-hipaa-builtin', 'HIPAA-164.312.b', 'Audit Controls', 'evalHIPAA_164_312_b'),
  ('pack-hipaa-builtin', 'HIPAA-164.312.c1', 'Integrity Controls', 'evalHIPAA_164_312_c1'),
  ('pack-hipaa-builtin', 'HIPAA-164.312.d', 'Person or Entity Authentication', 'evalHIPAA_164_312_d'),
  ('pack-iso27001-builtin', 'ISO-A12.6.1', 'Management of Technical Vulnerabilities', 'evalISO_A12_6_1'),
  ('pack-iso27001-builtin', 'ISO-A13.1.1', 'Network Controls', 'evalISO_A13_1_1'),
  ('pack-iso27001-builtin', 'ISO-A16.1.1', 'Incident Response Responsibilities', 'evalISO_A16_1_1'),
  ('pack-iso27001-builtin', 'ISO-A16.1.2', 'Reporting Information Security Events', 'evalISO_A16_1_2'),
  ('pack-iso27001-builtin', 'ISO-A16.1.4', 'Assessment of Security Events', 'evalISO_A16_1_4'),
  ('pack-iso27001-builtin', 'ISO-A5.1.1', 'Information Security Policies', 'evalISO_A5_1_1'),
  ('pack-iso27001-builtin', 'ISO-A9.1.1', 'Access Control Policy', 'evalISO_A9_1_1'),
  ('pack-iso27001-builtin', 'ISO-A9.1.2', 'Access to Networks & Network Services', 'evalISO_A9_1_2'),
  ('pack-iso27001-builtin', 'ISO-A9.2.1', 'User Registration & De-registration', 'evalISO_A9_2_1'),
  ('pack-iso27001-builtin', 'ISO-A9.2.2', 'User Access Provisioning', 'evalISO_A9_2_2'),
  ('pack-iso27001-builtin', 'ISO-A9.2.3', 'Privileged Access Rights', 'evalISO_A9_2_3'),
  ('pack-iso27001-builtin', 'ISO-A9.2.4', 'Management of Secret Authentication', 'evalISO_A9_2_4'),
  ('pack-iso27001-builtin', 'ISO-A9.2.5', 'Review of User Access Rights', 'evalISO_A9_2_5'),
  ('pack-iso27001-builtin', 'ISO-A9.2.6', 'Removal/Adjustment of Access Rights', 'evalISO_A9_2_6'),
  ('pack-iso27001-builtin', 'ISO-A9.3.1', 'Use of Secret Authentication Information', 'evalISO_A9_3_1'),
  ('pack-iso27001-builtin', 'ISO-A9.4.1', 'Information Access Restriction', 'evalISO_A9_4_1'),
  ('pack-iso27001-builtin', 'ISO-A9.4.2', 'Secure Log-on Procedures', 'evalISO_A9_4_2'),
  ('pack-nist-csf-builtin', 'NIST-DE.CM-1', 'Network Monitored for Events', 'evalNIST_DE_CM_1'),
  ('pack-nist-csf-builtin', 'NIST-PR.AC-1', 'Identities & Credentials Managed', 'evalNIST_PR_AC_1'),
  ('pack-nist-csf-builtin', 'NIST-PR.AC-3', 'Remote Access Managed', 'evalNIST_PR_AC_3'),
  ('pack-nist-csf-builtin', 'NIST-PR.AC-4', 'Access Permissions & Authorizations', 'evalNIST_PR_AC_4'),
  ('pack-nist-csf-builtin', 'NIST-PR.AC-7', 'Users/Devices/Assets Authenticated', 'evalNIST_PR_AC_7'),
  ('pack-nist-csf-builtin', 'NIST-PR.IP-3', 'Configuration Change Control', 'evalNIST_PR_IP_3'),
  ('pack-nist-csf-builtin', 'NIST-RS.CO-2', 'Incidents Reported', 'evalNIST_RS_CO_2'),
  ('pack-soc2-builtin', 'SOC2-CC1.1', 'Control Environment — Integrity & Ethics', 'evalSOC2_CC1_1'),
  ('pack-soc2-builtin', 'SOC2-CC1.2', 'Board Independence & Oversight', 'evalSOC2_CC1_2'),
  ('pack-soc2-builtin', 'SOC2-CC1.3', 'Management Authority & Responsibility', 'evalSOC2_CC1_3'),
  ('pack-soc2-builtin', 'SOC2-CC2.1', 'Internal Communication of Objectives', 'evalSOC2_CC2_1'),
  ('pack-soc2-builtin', 'SOC2-CC2.2', 'External Communication of Objectives', 'evalSOC2_CC2_2'),
  ('pack-soc2-builtin', 'SOC2-CC3.1', 'Risk Assessment — Objectives Specified', 'evalSOC2_CC3_1'),
  ('pack-soc2-builtin', 'SOC2-CC3.2', 'Risk Identification & Analysis', 'evalSOC2_CC3_2'),
  ('pack-soc2-builtin', 'SOC2-CC4.1', 'Control Activities — Selected & Developed', 'evalSOC2_CC4_1'),
  ('pack-soc2-builtin', 'SOC2-CC4.2', 'Control Activities — Deployed Through Policies', 'evalSOC2_CC4_2'),
  ('pack-soc2-builtin', 'SOC2-CC5.1', 'Control Activities Over Technology', 'evalSOC2_CC5_1'),
  ('pack-soc2-builtin', 'SOC2-CC5.2', 'Policies & Procedures Established', 'evalSOC2_CC5_2'),
  ('pack-soc2-builtin', 'SOC2-CC5.3', 'Policies Deployed Through Management', 'evalSOC2_CC5_3'),
  ('pack-soc2-builtin', 'SOC2-CC6.1', 'Logical Access — Least Privilege', 'evalSOC2_CC6_1'),
  ('pack-soc2-builtin', 'SOC2-CC6.2', 'New User Access Authorization', 'evalSOC2_CC6_2'),
  ('pack-soc2-builtin', 'SOC2-CC6.3', 'Role-Based Access Modification', 'evalSOC2_CC6_3'),
  ('pack-soc2-builtin', 'SOC2-CC6.6', 'External Access Points Protected', 'evalSOC2_CC6_6'),
  ('pack-soc2-builtin', 'SOC2-CC6.7', 'Data Transmission Protection', 'evalSOC2_CC6_7'),
  ('pack-soc2-builtin', 'SOC2-CC6.8', 'Prevention of Unauthorized Software', 'evalSOC2_CC6_8'),
  ('pack-soc2-builtin', 'SOC2-CC7.1', 'Detection of Configuration Changes', 'evalSOC2_CC7_1'),
  ('pack-soc2-builtin', 'SOC2-CC7.2', 'Monitoring System Components', 'evalSOC2_CC7_2'),
  ('pack-soc2-builtin', 'SOC2-CC7.3', 'Security Event Evaluation', 'evalSOC2_CC7_3'),
  ('pack-soc2-builtin', 'SOC2-CC7.4', 'Security Incident Response', 'evalSOC2_CC7_4'),
  ('pack-soc2-builtin', 'SOC2-CC7.5', 'Recovery from Security Incidents', 'evalSOC2_CC7_5'),
  ('pack-soc2-builtin', 'SOC2-CC8.1', 'Change Management Process', 'evalSOC2_CC8_1'),
  ('pack-soc2-builtin', 'SOC2-CC9.1', 'Business Disruption Risk Mitigation', 'evalSOC2_CC9_1'),
  ('pack-soc2-builtin', 'SOC2-CC9.2', 'Vendor & Business Partner Management', 'evalSOC2_CC9_2')
ON CONFLICT (pack_id, control_id) DO UPDATE SET
  title = EXCLUDED.title,
  rule_fn = EXCLUDED.rule_fn;

-- Refresh controls_count on each pack to reflect real seeded count
UPDATE compliance_packs p SET controls_count = (
  SELECT COUNT(*) FROM compliance_pack_controls c WHERE c.pack_id = p.id
) WHERE p.id IN ('pack-soc2-builtin','pack-iso27001-builtin','pack-nist-csf-builtin','pack-hipaa-builtin','pack-gdpr-builtin');
