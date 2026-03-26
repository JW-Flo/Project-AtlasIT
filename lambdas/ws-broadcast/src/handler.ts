import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
  GoneException,
} from "@aws-sdk/client-apigatewaymanagementapi";

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.CONNECTIONS_TABLE!;

interface BroadcastEvent {
  tenantId: string;
  type: string;
  payload: unknown;
  wsEndpoint: string;
}

export async function handler(event: BroadcastEvent): Promise<void> {
  const apigw = new ApiGatewayManagementApiClient({
    endpoint: event.wsEndpoint,
  });

  const result = await doc.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: "tenantIndex",
      KeyConditionExpression: "tenantId = :tid",
      ExpressionAttributeValues: { ":tid": event.tenantId },
    }),
  );

  const message = JSON.stringify({ type: event.type, payload: event.payload });

  const promises = (result.Items ?? []).map(async (item) => {
    try {
      await apigw.send(
        new PostToConnectionCommand({
          ConnectionId: item.connectionId as string,
          Data: new TextEncoder().encode(message),
        }),
      );
    } catch (err) {
      if (err instanceof GoneException) {
        // Connection stale, will be cleaned up by TTL
        console.log("Stale connection", { connectionId: item.connectionId });
      } else {
        throw err;
      }
    }
  });

  await Promise.allSettled(promises);
}
