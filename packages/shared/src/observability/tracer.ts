// X-Ray tracing helpers for Lambda
// AWS X-Ray SDK auto-instruments when XRAY tracing is active

export interface TraceContext {
  traceId: string;
  segmentId: string;
}

export function getTraceContext(): TraceContext | null {
  const header = process.env._X_AMZN_TRACE_ID;
  if (!header) return null;

  const parts = header.split(";").reduce(
    (acc, part) => {
      const [key, value] = part.trim().split("=");
      if (key && value) acc[key.toLowerCase()] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  return {
    traceId: parts.root ?? "",
    segmentId: parts.parent ?? "",
  };
}

export function addAnnotation(
  key: string,
  value: string | number | boolean,
): void {
  // When using X-Ray SDK, this would call AWSXRay.getSegment().addAnnotation()
  // For now, include in structured logs for correlation
  console.log(JSON.stringify({ _xray_annotation: { key, value } }));
}
