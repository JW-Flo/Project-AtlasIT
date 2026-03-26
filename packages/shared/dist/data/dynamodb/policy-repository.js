import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
export class DynamoPolicyRepository {
  docClient;
  tableName;
  constructor(docClient, tableName) {
    this.docClient = docClient;
    this.tableName = tableName;
  }
  async listTemplates() {
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
      key: item.key,
      name: item.name,
      format: item.format,
      body: item.body,
    }));
  }
  async getTemplate(key) {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: "SYSTEM", sk: `TEMPLATE#${key}` },
      }),
    );
    if (!result.Item) return null;
    return {
      key: result.Item.key,
      name: result.Item.name,
      format: result.Item.format,
      body: result.Item.body,
    };
  }
  async findGeneratedByContext(tenantId, templateKey, contextHash) {
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
      hash: result.Item.hash,
      tenantId: result.Item.tenantId,
      templateKey: result.Item.templateKey,
      content: result.Item.content,
      contextHash: result.Item.contextHash,
      createdAt: result.Item.createdAt,
      sizeBytes: result.Item.sizeBytes,
    };
  }
  async saveGenerated(policy, inputCanonical) {
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
  async recordEvaluation(data) {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const evaluation = {
      id,
      tenantId: data.tenantId,
      policyKey: data.policyKey,
      inputHash: data.inputHash,
      resultHash: data.resultHash,
      result: JSON.parse(data.resultJson),
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
  async upsertControlEvidenceLink(controlKey, evidenceHash, tenantId) {
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
    } catch (err) {
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
          createdAt: existing.Item?.createdAt ?? createdAt,
        };
      }
      throw err;
    }
  }
  async getCoverage(framework, tenantId) {
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
    const controlMap = new Map();
    for (const item of result.Items ?? []) {
      const key = item.controlKey;
      controlMap.set(key, (controlMap.get(key) ?? 0) + 1);
    }
    const controls = Array.from(controlMap.entries()).map(
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
//# sourceMappingURL=policy-repository.js.map
