import React from "react";
import type { ComplianceSnapshot } from "../api/types";

export const PolicyCards: React.FC<{
  policies: ComplianceSnapshot["policies"];
}> = ({ policies }) => {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Policies</h2>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))" }}
      >
        {policies.map((p) => (
          <div key={p.id} className="bg-[#202a36] rounded-lg px-4 py-3">
            <strong className="text-[13px] font-medium tracking-tight">
              {p.name}
            </strong>
            <div className="text-[11px] text-white/60 mt-1">
              Status: {p.status}
            </div>
            <div className="text-[10px] text-white/40 mt-1">
              Updated: {new Date(p.updated).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
