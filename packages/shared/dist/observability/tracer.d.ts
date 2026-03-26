export interface TraceContext {
  traceId: string;
  segmentId: string;
}
export declare function getTraceContext(): TraceContext | null;
export declare function addAnnotation(
  key: string,
  value: string | number | boolean,
): void;
//# sourceMappingURL=tracer.d.ts.map
