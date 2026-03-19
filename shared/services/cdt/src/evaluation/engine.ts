import { CdtEvent } from "../models";
import { evalSOC2_CC6_2 } from "./rules/soc2.cc6_2";
import { evalISO_A9_2_3 } from "./rules/iso.a9_2_3";
import { evalSOC2_CC1_1 } from "./rules/soc2.cc1_1";
import { evalISO_A12_6_1 } from "./rules/iso.a12_6_1";
import { evalISO_A9_4_2 } from "./rules/iso.a9_4_2";
import { evalSOC2_CC7_2 } from "./rules/soc2.cc7_2";
import { evalISO_A13_1_1 } from "./rules/iso.a13_1_1";
// SOC2 CC1 — Control Environment
import { evalSOC2_CC1_2 } from "./rules/soc2.cc1_2";
import { evalSOC2_CC1_3 } from "./rules/soc2.cc1_3";
// SOC2 CC2 — Communication
import { evalSOC2_CC2_1 } from "./rules/soc2.cc2_1";
import { evalSOC2_CC2_2 } from "./rules/soc2.cc2_2";
// SOC2 CC3 — Risk Assessment
import { evalSOC2_CC3_1 } from "./rules/soc2.cc3_1";
import { evalSOC2_CC3_2 } from "./rules/soc2.cc3_2";
// SOC2 CC4 — Monitoring
import { evalSOC2_CC4_1 } from "./rules/soc2.cc4_1";
import { evalSOC2_CC4_2 } from "./rules/soc2.cc4_2";
// SOC2 CC5 — Control Activities
import { evalSOC2_CC5_1 } from "./rules/soc2.cc5_1";
import { evalSOC2_CC5_2 } from "./rules/soc2.cc5_2";
import { evalSOC2_CC5_3 } from "./rules/soc2.cc5_3";
// SOC2 CC6 — Logical Access
import { evalSOC2_CC6_1 } from "./rules/soc2.cc6_1";
import { evalSOC2_CC6_3 } from "./rules/soc2.cc6_3";
import { evalSOC2_CC6_6 } from "./rules/soc2.cc6_6";
import { evalSOC2_CC6_7 } from "./rules/soc2.cc6_7";
import { evalSOC2_CC6_8 } from "./rules/soc2.cc6_8";
// SOC2 CC7 — Operations
import { evalSOC2_CC7_1 } from "./rules/soc2.cc7_1";
import { evalSOC2_CC7_3 } from "./rules/soc2.cc7_3";
import { evalSOC2_CC7_4 } from "./rules/soc2.cc7_4";
import { evalSOC2_CC7_5 } from "./rules/soc2.cc7_5";
// SOC2 CC8 — Change Management
import { evalSOC2_CC8_1 } from "./rules/soc2.cc8_1";
// SOC2 CC9 — Risk Mitigation
import { evalSOC2_CC9_1 } from "./rules/soc2.cc9_1";
import { evalSOC2_CC9_2 } from "./rules/soc2.cc9_2";
// ISO 27001 A.9 — Access Control
import { evalISO_A9_1_1 } from "./rules/iso.a9_1_1";
import { evalISO_A9_1_2 } from "./rules/iso.a9_1_2";
import { evalISO_A9_2_1 } from "./rules/iso.a9_2_1";
import { evalISO_A9_2_2 } from "./rules/iso.a9_2_2";
import { evalISO_A9_2_4 } from "./rules/iso.a9_2_4";
import { evalISO_A9_2_5 } from "./rules/iso.a9_2_5";
import { evalISO_A9_2_6 } from "./rules/iso.a9_2_6";
import { evalISO_A9_3_1 } from "./rules/iso.a9_3_1";
import { evalISO_A9_4_1 } from "./rules/iso.a9_4_1";
// ISO 27001 A.16 — Incident Management
import { evalISO_A16_1_1 } from "./rules/iso.a16_1_1";
import { evalISO_A16_1_2 } from "./rules/iso.a16_1_2";
import { evalISO_A16_1_4 } from "./rules/iso.a16_1_4";
// HIPAA Technical Safeguards
import { evalHIPAA_164_312_a1 } from "./rules/hipaa.164_312_a1";
import { evalHIPAA_164_312_a2i } from "./rules/hipaa.164_312_a2i";
import { evalHIPAA_164_312_a2ii } from "./rules/hipaa.164_312_a2ii";
import { evalHIPAA_164_312_b } from "./rules/hipaa.164_312_b";
import { evalHIPAA_164_312_c1 } from "./rules/hipaa.164_312_c1";
import { evalHIPAA_164_312_d } from "./rules/hipaa.164_312_d";
// NIST CSF
import { evalNIST_PR_AC_1 } from "./rules/nist.pr_ac_1";
import { evalNIST_PR_AC_3 } from "./rules/nist.pr_ac_3";
import { evalNIST_PR_AC_4 } from "./rules/nist.pr_ac_4";
import { evalNIST_RS_CO_2 } from "./rules/nist.rs_co_2";
import { evalNIST_DE_CM_1 } from "./rules/nist.de_cm_1";
// GDPR Article 5
import { evalGDPR_Art5_1a } from "./rules/gdpr.art5_1a";
import { evalGDPR_Art5_1b } from "./rules/gdpr.art5_1b";
import { evalGDPR_Art5_1c } from "./rules/gdpr.art5_1c";
import { evalGDPR_Art5_1d } from "./rules/gdpr.art5_1d";
import { evalGDPR_Art5_1e } from "./rules/gdpr.art5_1e";
import { evalGDPR_Art5_1f } from "./rules/gdpr.art5_1f";
import { evalGDPR_Art5_2 } from "./rules/gdpr.art5_2";

export function runControlEval(control_id: string, ev: CdtEvent) {
  switch (control_id) {
  // Original 7
  case "SOC2-CC6.2":              return evalSOC2_CC6_2(ev);
  case "ISO-27001-A.9.2.3":       return evalISO_A9_2_3(ev);
  case "SOC2-CC1.1":              return evalSOC2_CC1_1(ev);
  case "ISO-27001-A.12.6.1":      return evalISO_A12_6_1(ev);
  case "ISO-27001-A.9.4.2":       return evalISO_A9_4_2(ev);
  case "SOC2-CC7.2":              return evalSOC2_CC7_2(ev);
  case "ISO-27001-A.13.1.1":      return evalISO_A13_1_1(ev);
  // SOC2 CC1 — Control Environment
  case "SOC2-CC1.2":              return evalSOC2_CC1_2(ev);
  case "SOC2-CC1.3":              return evalSOC2_CC1_3(ev);
  // SOC2 CC2 — Communication
  case "SOC2-CC2.1":              return evalSOC2_CC2_1(ev);
  case "SOC2-CC2.2":              return evalSOC2_CC2_2(ev);
  // SOC2 CC3 — Risk Assessment
  case "SOC2-CC3.1":              return evalSOC2_CC3_1(ev);
  case "SOC2-CC3.2":              return evalSOC2_CC3_2(ev);
  // SOC2 CC4 — Monitoring
  case "SOC2-CC4.1":              return evalSOC2_CC4_1(ev);
  case "SOC2-CC4.2":              return evalSOC2_CC4_2(ev);
  // SOC2 CC5 — Control Activities
  case "SOC2-CC5.1":              return evalSOC2_CC5_1(ev);
  case "SOC2-CC5.2":              return evalSOC2_CC5_2(ev);
  case "SOC2-CC5.3":              return evalSOC2_CC5_3(ev);
  // SOC2 CC6 — Logical Access
  case "SOC2-CC6.1":              return evalSOC2_CC6_1(ev);
  case "SOC2-CC6.3":              return evalSOC2_CC6_3(ev);
  case "SOC2-CC6.6":              return evalSOC2_CC6_6(ev);
  case "SOC2-CC6.7":              return evalSOC2_CC6_7(ev);
  case "SOC2-CC6.8":              return evalSOC2_CC6_8(ev);
  // SOC2 CC7 — Operations
  case "SOC2-CC7.1":              return evalSOC2_CC7_1(ev);
  case "SOC2-CC7.3":              return evalSOC2_CC7_3(ev);
  case "SOC2-CC7.4":              return evalSOC2_CC7_4(ev);
  case "SOC2-CC7.5":              return evalSOC2_CC7_5(ev);
  // SOC2 CC8 — Change Management
  case "SOC2-CC8.1":              return evalSOC2_CC8_1(ev);
  // SOC2 CC9 — Risk Mitigation
  case "SOC2-CC9.1":              return evalSOC2_CC9_1(ev);
  case "SOC2-CC9.2":              return evalSOC2_CC9_2(ev);
  // ISO 27001 A.9 — Access Control
  case "ISO-27001-A.9.1.1":       return evalISO_A9_1_1(ev);
  case "ISO-27001-A.9.1.2":       return evalISO_A9_1_2(ev);
  case "ISO-27001-A.9.2.1":       return evalISO_A9_2_1(ev);
  case "ISO-27001-A.9.2.2":       return evalISO_A9_2_2(ev);
  case "ISO-27001-A.9.2.4":       return evalISO_A9_2_4(ev);
  case "ISO-27001-A.9.2.5":       return evalISO_A9_2_5(ev);
  case "ISO-27001-A.9.2.6":       return evalISO_A9_2_6(ev);
  case "ISO-27001-A.9.3.1":       return evalISO_A9_3_1(ev);
  case "ISO-27001-A.9.4.1":       return evalISO_A9_4_1(ev);
  // ISO 27001 A.16 — Incident Management
  case "ISO-27001-A.16.1.1":      return evalISO_A16_1_1(ev);
  case "ISO-27001-A.16.1.2":      return evalISO_A16_1_2(ev);
  case "ISO-27001-A.16.1.4":      return evalISO_A16_1_4(ev);
  // HIPAA Technical Safeguards
  case "HIPAA-164.312(a)(1)":     return evalHIPAA_164_312_a1(ev);
  case "HIPAA-164.312(a)(2)(i)":  return evalHIPAA_164_312_a2i(ev);
  case "HIPAA-164.312(a)(2)(ii)": return evalHIPAA_164_312_a2ii(ev);
  case "HIPAA-164.312(b)":        return evalHIPAA_164_312_b(ev);
  case "HIPAA-164.312(c)(1)":     return evalHIPAA_164_312_c1(ev);
  case "HIPAA-164.312(d)":        return evalHIPAA_164_312_d(ev);
  // NIST CSF
  case "NIST-CSF-PR.AC-1":        return evalNIST_PR_AC_1(ev);
  case "NIST-CSF-PR.AC-3":        return evalNIST_PR_AC_3(ev);
  case "NIST-CSF-PR.AC-4":        return evalNIST_PR_AC_4(ev);
  case "NIST-CSF-RS.CO-2":        return evalNIST_RS_CO_2(ev);
  case "NIST-CSF-DE.CM-1":        return evalNIST_DE_CM_1(ev);
  // GDPR Article 5
  case "GDPR-Art.5(1)(a)":        return evalGDPR_Art5_1a(ev);
  case "GDPR-Art.5(1)(b)":        return evalGDPR_Art5_1b(ev);
  case "GDPR-Art.5(1)(c)":        return evalGDPR_Art5_1c(ev);
  case "GDPR-Art.5(1)(d)":        return evalGDPR_Art5_1d(ev);
  case "GDPR-Art.5(1)(e)":        return evalGDPR_Art5_1e(ev);
  case "GDPR-Art.5(1)(f)":        return evalGDPR_Art5_1f(ev);
  case "GDPR-Art.5(2)":           return evalGDPR_Art5_2(ev);
    default: return { decision: "unknown" as const, rationale: ["no rule"], references: [] };
  }
}
