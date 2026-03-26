import { Telemetry } from "../shared/iface-telemetry";

export function makeTelemetry(): Telemetry {
  return {
    log(level, msg, fields) { console.log(JSON.stringify({ level, msg, ...fields })); },
    async span(name, fn) { return await fn(); },
    metric(name, value, labels) { console.log(JSON.stringify({ m: name, v: value, ...labels })); }
  };
}
