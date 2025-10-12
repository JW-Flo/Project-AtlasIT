import { CdtEvent } from "../models";
import { evalSOC2_CC6_2 } from "./rules/soc2.cc6_2";
import { evalISO_A9_2_3 } from "./rules/iso.a9_2_3";
import { evalSOC2_CC1_1 } from "./rules/soc2.cc1_1";
import { evalISO_A12_6_1 } from "./rules/iso.a12_6_1";
import { evalISO_A9_4_2 } from "./rules/iso.a9_4_2";
import { evalSOC2_CC7_2 } from "./rules/soc2.cc7_2";
import { evalISO_A13_1_1 } from "./rules/iso.a13_1_1";

export function runControlEval(control_id: string, ev: CdtEvent) {
  switch (control_id) {
  case "SOC2-CC6.2": return evalSOC2_CC6_2(ev);
  case "ISO-27001-A.9.2.3": return evalISO_A9_2_3(ev);
  case "SOC2-CC1.1": return evalSOC2_CC1_1(ev);
  case "ISO-27001-A.12.6.1": return evalISO_A12_6_1(ev);
  case "ISO-27001-A.9.4.2": return evalISO_A9_4_2(ev);
  case "SOC2-CC7.2": return evalSOC2_CC7_2(ev);
  case "ISO-27001-A.13.1.1": return evalISO_A13_1_1(ev);
    default: return { decision: "unknown" as const, rationale: ["no rule"], references: [] };
  }
}
