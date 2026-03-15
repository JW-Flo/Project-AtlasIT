import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 10,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<750"],
  },
};

const BASE_URL = __ENV.ORCHESTRATOR_URL || "http://localhost:8788";

export default function () {
  const response = http.get(`${BASE_URL}/health`);
  check(response, {
    "orchestrator health is 200": (r) => r.status === 200,
  });
  sleep(0.2);
}
