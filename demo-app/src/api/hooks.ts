import { useEffect, useState } from "react";
import type { ComplianceSnapshot } from "./types";

export function useComplianceSnapshot() {
  const [data, setData] = useState<ComplianceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/mock-api/compliance/snapshot");
        if (!res.ok) throw new Error("snapshot fetch failed");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return { data, loading };
}
