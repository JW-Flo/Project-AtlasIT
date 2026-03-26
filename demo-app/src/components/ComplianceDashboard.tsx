import React from "react";
import type { ComplianceSnapshot } from "../api/types";

export const ComplianceDashboard: React.FC<{
  snapshot: ComplianceSnapshot;
}> = ({ snapshot }) => {
  return (
    <section className="mt-4">
      <h2 className="text-lg font-semibold mb-3">Framework Coverage</h2>
      <div className="flex flex-wrap gap-3">
        {snapshot.frameworkSummary.map((f) => {
          const pct = f.coveragePercent.toFixed(1);
          return (
            <div
              key={f.framework}
              className="bg-[#18202b] rounded-lg px-4 py-3 flex-1 basis-[220px] min-w-[220px]"
            >
              <strong className="text-sm tracking-tight">{f.framework}</strong>
              <div className="text-[11px] text-white/60 mt-1 mb-2">
                {pct}% coverage
              </div>
              <div className="h-1.5 bg-[#334153] rounded overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: pct + "%" }}
                />
              </div>
              <div className="text-[10px] text-white/50 mt-2">
                {f.passing}/{f.total} controls passing
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
