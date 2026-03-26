import React from "react";
import type { ComplianceSnapshot } from "../api/types";

function severityColor(sev: string) {
  switch (sev) {
    case "critical":
      return "bg-red-600";
    case "high":
      return "bg-orange-500";
    case "medium":
      return "bg-yellow-400 text-black";
    default:
      return "bg-green-600";
  }
}

export const RiskMatrix: React.FC<{ risks: ComplianceSnapshot["risks"] }> = ({
  risks,
}) => {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Risk Matrix</h2>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))" }}
      >
        {risks.map((r) => (
          <div key={r.id} className="bg-[#1e2733] rounded-lg px-3 py-3">
            <div className="flex items-center justify-between">
              <strong className="text-[13px] font-medium leading-tight tracking-tight">
                {r.title}
              </strong>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full capitalize text-white ${severityColor(r.severity)}`}
              >
                {r.severity}
              </span>
            </div>
            <div className="text-[11px] text-white/70 mt-1.5">
              L:{r.likelihood} / I:{r.impact}
            </div>
            {r.owner && (
              <div className="text-[11px] mt-1 text-white/80">
                Owner: {r.owner}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
