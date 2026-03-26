import type { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.CONNECTIONS_TABLE!;

export async function handler(event: APIGatewayProxyWebsocketEventV2) {
  const connectionId = event.requestContext.connectionId;

  await doc.send(
    new DeleteCommand({
      TableName: TABLE,
      Key: { connectionId },
    }),
  );

  console.log("WebSocket disconnected", { connectionId });
  return { statusCode: 200, body: "Disconnected" };
}
