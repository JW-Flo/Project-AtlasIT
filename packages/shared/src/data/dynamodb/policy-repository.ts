import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type {
  PolicyRepository,
  PolicyTemplate,
  GeneratedPolicy,
  PolicyEvaluation,
  CoverageSummary,
  CoverageControl,
} from "../interfaces.js";

export class DynamoPolicyRepository implements PolicyRepository {
  constructor(
    private readonly docClient: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  async listTemplates(): Promise<PolicyTemplate[]> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
        ExpressionAttributeValues: {
          ":pk": "SYSTEM",
          ":prefix": "TEMPLATE#",
        },
      }),
    );
    return (result.Items ?? []).map((item) => ({
      key: item.key as string,
      name: item.name as string,
      format: item.format as PolicyTemplate["format"],
      body: item.body as string,
    }));
  }

  async getTemplate(key: string): Promise<PolicyTemplate | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: "SYSTEM", sk: `TEMPLATE#${key}` },
      }),
    );
    if (!result.Item) return null;
    return {
      key: result.Item.key as string,
      name: result.Item.name as string,
      format: result.Item.format as PolicyTemplate["format"],
      body: result.Item.body as string,
    };
  }

  async findGeneratedByContext(
    tenantId: string,
    templateKey: string,
    contextHash: string,
  ): Promise<GeneratedPolicy | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          pk: `TENANT#${tenantId}`,
          sk: `POLICY#${templateKey}#${contextHash}`,
        },
      }),
    );
    if (!result.Item) return null;
    return {
      hash: result.Item.hash as string,
      tenantId: result.Item.tenantId as string,
      templateKey: result.Item.templateKey as string,
      content: result.Item.content as string,
      contextHash: result.Item.contextHash as string,
      createdAt: result.Item.createdAt as string,
      sizeBytes: result.Item.sizeBytes as number,
    };
  }

  async saveGenerated(
    policy: GeneratedPolicy,
    inputCanonical: string,
  ): Promise<void> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `TENANT#${policy.tenantId}`,
          sk: `POLICY#${policy.templateKey}#${policy.contextHash}`,
          ...policy,
          inputCanonical,
        },
      }),
    );
  }

  async recordEvaluation(data: {
    tenantId: string;
    policyKey: string;
    inputHash: string;
    resultHash: string;
    resultJson: string;
  }): Promise<void> {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const evaluation: PolicyEvaluation = {
      id,
      tenantId: data.tenantId,
      policyKey: data.policyKey,
      inputHash: data.inputHash,
      resultHash: data.resultHash,
      result: JSON.parse(data.resultJson) as Record<string, unknown>,
      createdAt,
    };
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `TENANT#${data.tenantId}`,
          sk: `EVAL#${id}`,
          ...evaluation,
        },
      }),
    );
  }

  async upsertControlEvidenceLink(
    controlKey: string,
    evidenceHash: string,
    tenantId: string,
  ): Promise<{ created: boolean; createdAt: string }> {
    const createdAt = new Date().toISOString();
    try {
      await this.docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: {
            pk: `TENANT#${tenantId}`,
            sk: `CTRL_EVIDENCE#${controlKey}#${evidenceHash}`,
            controlKey,
            evidenceHash,
            tenantId,
            createdAt,
          },
          ConditionExpression: "attribute_not_exists(pk)",
        }),
      );
      return { created: true, createdAt };
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        err.name === "ConditionalCheckFailedException"
      ) {
        const existing = await this.docClient.send(
          new GetCommand({
            TableName: this.tableName,
            Key: {
              pk: `TENANT#${tenantId}`,
              sk: `CTRL_EVIDENCE#${controlKey}#${evidenceHash}`,
            },
          }),
        );
        return {
          created: false,
          createdAt: (existing.Item?.createdAt as string) ?? createdAt,
        };
      }
      throw err;
    }
  }

  async getCoverage(
    framework: string,
    tenantId: string,
  ): Promise<CoverageSummary> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
        ExpressionAttributeValues: {
          ":pk": `TENANT#${tenantId}`,
          ":prefix": "CTRL_EVIDENCE#",
        },
      }),
    );

    const controlMap = new Map<string, number>();
    for (const item of result.Items ?? []) {
      const key = item.controlKey as string;
      controlMap.set(key, (controlMap.get(key) ?? 0) + 1);
    }

    const controls: CoverageControl[] = Array.from(controlMap.entries()).map(
      ([controlKey, evidenceCount]) => ({
        controlKey,
        title: controlKey,
        evidenceCount,
      }),
    );

    const totalControls = controls.length;
    const covered = controls.filter((c) => c.evidenceCount > 0).length;

    return {
      framework,
      totalControls,
      controls,
      coveragePercent: totalControls > 0 ? (covered / totalControls) * 100 : 0,
    };
  }
}
