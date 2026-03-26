import type { AuthContext } from "./types.js";
import { AuthError } from "./middleware.js";
import type { AuthRepository } from "../data/interfaces.js";
interface LambdaEvent {
  headers?: Record<string, string | undefined>;
  requestContext: Record<string, unknown>;
}
export declare function extractAuth(
  event: LambdaEvent,
  authRepo?: AuthRepository,
): Promise<AuthContext>;
export { AuthError };
//# sourceMappingURL=lambda-auth.d.ts.map
