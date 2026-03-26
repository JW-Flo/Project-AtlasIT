import React from "react";
import { useComplianceSnapshot } from "../api/hooks";
import { ComplianceDashboard } from "../components/ComplianceDashboard";
import { RiskMatrix } from "../components/RiskMatrix";
import { PolicyCards } from "../components/PolicyCards";

export const DemoApp: React.FC = () => {
  const { data, loading } = useComplianceSnapshot();
  return (
    <div className="px-5 py-5 max-w-[1400px] mx-auto">
      <h1 className="text-3xl mb-2 font-semibold">AtlasIT Demo Console</h1>
      <p className="text-sm text-white/60 mb-4">
        Mocked preview of the future compliance & risk view.
      </p>
      {loading && (
        <div className="text-sm text-white/70 animate-pulse">
          Loading snapshot...
        </div>
      )}
      {!loading && data && (
        <>
          <ComplianceDashboard snapshot={data} />
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex-1 basis-[480px] min-w-[420px]">
              <RiskMatrix risks={data.risks} />
            </div>
            <div className="flex-[2] basis-[640px] min-w-[480px]">
              <PolicyCards policies={data.policies} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
