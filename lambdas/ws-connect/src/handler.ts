import type { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { JwtVerifier } from "@atlasit/shared/auth/jwt-verifier.js";

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.CONNECTIONS_TABLE!;

const verifier = new JwtVerifier(
  process.env.COGNITO_ISSUER_URL ?? "",
  process.env.COGNITO_CLIENT_ID ?? "",
);

export async function handler(event: APIGatewayProxyWebsocketEventV2) {
  const connectionId = event.requestContext.connectionId;
  const token = event.queryStringParameters?.token;

  if (!token) {
    return { statusCode: 401, body: "Missing token" };
  }

  let tenantId: string;
  try {
    const auth = await verifier.verify(token);
    tenantId = auth.tenantId;
    if (!tenantId) {
      return { statusCode: 403, body: "Missing tenant" };
    }
  } catch {
    return { statusCode: 401, body: "Invalid token" };
  }

  const ttl = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

  await doc.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        connectionId,
        tenantId,
        connectedAt: new Date().toISOString(),
        ttl,
      },
    }),
  );

  console.log("WebSocket connected", { connectionId, tenantId });
  return { statusCode: 200, body: "Connected" };
}
