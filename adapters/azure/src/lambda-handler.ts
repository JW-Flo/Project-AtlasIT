import { createLambdaHandler } from "@atlasit/shared/platform/aws/hono-lambda-adapter.js";
import app from "./index.js";

export const handler = createLambdaHandler(app);
