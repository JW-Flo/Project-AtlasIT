import type { HandleClientError } from "@sveltejs/kit";

export const handleError: HandleClientError = ({ error, event, status, message }) => {
  console.error("[client-error]", {
    message,
    status,
    path: event.url?.pathname,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  return {
    message: message || "An unexpected error occurred",
    code: "CLIENT_ERROR",
  };
};
