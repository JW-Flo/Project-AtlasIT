import type { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.CONNECTIONS_TABLE!;

export async function handler(event: APIGatewayProxyWebsocketEventV2) {
  const connectionId = event.requestContext.connectionId;
  const token = event.queryStringParameters?.token;

  if (!token) {
    return { statusCode: 401, body: "Missing token" };
  }

  // TODO: Verify JWT and extract tenantId
  const tenantId = "default"; // placeholder until JWT verifier is wired

  const ttl = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24h

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
