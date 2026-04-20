# Stripe Evidence Collection Implementation

## Overview

This document describes the compliance evidence collection capabilities of the Stripe adapter. Evidence collection supports SOC2 and PCI-DSS compliance frameworks for financial controls.

## Endpoint

`POST /api/evidence`

### Request

```json
{
  "tenantId": "tenant-123"
}
```

Or via header: `X-Tenant-ID: tenant-123`

### Response

```json
{
  "items": [
    {
      "type": "api_key_permissions",
      "controlRefs": ["SOC2-CC6.1"],
      "status": "pass",
      "details": {
        "totalKeys": 5,
        "testKeys": 3,
        "liveKeys": 2,
        "note": "API keys managed via Stripe Dashboard"
      }
    }
  ]
}
```

## Evidence Types Collected

### 1. API Key Permissions (SOC2-CC6.1)

**Control Mapping**: SOC2 Trust Service Criteria CC6.1 - Logical and Physical Access Controls

**What is collected**:

- API key validation (via balance check)
- Key mode (live vs. test)
- Account balance availability

**Pass/Fail Criteria**:

- **Pass**: API key is valid and active
- **Unknown**: API key validation failed

**API Calls**: `stripe.balance.retrieve()`

**Security Note**: Stripe does not expose API keys via API (by design). We validate the current key by attempting to retrieve account balance.

### 2. Webhook Security (SOC2-CC6.6)

**Control Mapping**: SOC2 Trust Service Criteria CC6.6 - Logical and Physical Access Security

**What is collected**:

- Webhook endpoint URLs
- HTTPS enforcement status
- Webhook enabled/disabled status
- Event types configured per webhook

**Pass/Fail Criteria**:

- **Pass**: All webhooks use HTTPS and are enabled
- **Fail**: Any webhook uses HTTP or is disabled
- **Unknown**: No webhooks configured or fetch failed

**API Calls**: `stripe.webhookEndpoints.list({ limit: 100 })`

**Security Note**: Stripe webhook signature verification should be enforced on the receiving endpoint using the `STRIPE_WEBHOOK_SECRET`.

### 3. Payment Events (SOC2-CC7.2, PCI-DSS 10.2)

**Control Mapping**:

- SOC2 CC7.2 - System Operations
- PCI-DSS 10.2 - Audit Trails

**What is collected**:

- Payment event count (last 90 days)
- Successful payment count
- Failed payment count
- Event types: `payment_intent.succeeded`, `charge.failed`, `payment_intent.payment_failed`

**Pass/Fail Criteria**:

- **Pass**: Payment events exist (audit trail available)
- **Unknown**: No payment events in 90-day period or fetch failed

**API Calls**:

```javascript
stripe.events.list({
  limit: 100,
  created: { gte: ninetyDaysAgo },
  types: ["payment_intent.succeeded", "charge.failed", "payment_intent.payment_failed"],
});
```

**Compliance Note**: Demonstrates availability of payment processing audit logs for compliance auditors.

### 4. Dispute/Chargeback Tracking (SOC2-CC7.3)

**Control Mapping**: SOC2 CC7.3 - Incident Response

**What is collected**:

- Total disputes (last 90 days)
- Open disputes requiring response
- Closed disputes (won/lost)
- Dispute statuses: `warning_needs_response`, `needs_response`, `under_review`, `won`, `lost`

**Pass/Fail Criteria**:

- **Pass**: No disputes, or all disputes are closed
- **Fail**: Open disputes requiring response
- **Unknown**: Fetch failed

**API Calls**:

```javascript
stripe.disputes.list({
  limit: 100,
  created: { gte: ninetyDaysAgo },
});
```

**Operational Impact**: Open disputes failing evidence check should trigger automated incident response workflows.

### 5. PCI Compliance Status (PCI-DSS 12.8)

**Control Mapping**: PCI-DSS 12.8 - Service Provider Management

**What is collected**:

- Stripe PCI-DSS Level 1 Service Provider attestation
- Compliance verification timestamp

**Pass/Fail Criteria**:

- **Pass**: Always (Stripe maintains Level 1 certification)

**API Calls**: None (attestation-based evidence)

**Compliance Note**: Using Stripe as a PCI Level 1 Service Provider significantly reduces PCI compliance scope for the merchant. This evidence documents the service provider's compliance status per PCI-DSS requirement 12.8.

## Rate Limiting

Stripe API rate limits:

- **Default**: 100 requests/second per API key
- **Burst**: 1000 requests/second (short bursts)

Evidence collection makes 4 API calls per tenant:

1. `balance.retrieve` (1 call)
2. `webhookEndpoints.list` (1 call)
3. `events.list` (1 call)
4. `disputes.list` (1 call)

**Recommendation**: Schedule evidence collection at most once per hour per tenant to stay well within rate limits.

## Error Handling

### Graceful Degradation

The evidence endpoint returns **partial results** on API errors. If one evidence type fails to collect, the others still return.

Example:

```json
{
  "items": [
    {
      "type": "api_key_permissions",
      "controlRefs": ["SOC2-CC6.1"],
      "status": "unknown",
      "details": {
        "error": "Insufficient permissions"
      }
    },
    {
      "type": "webhook_security",
      "controlRefs": ["SOC2-CC6.6"],
      "status": "pass",
      "details": { ... }
    }
  ]
}
```

### No Credentials

If `STRIPE_SECRET_KEY` is not configured or `tenantId` is missing, the endpoint returns:

```json
{
  "items": []
}
```

This is **not an error** — it gracefully handles tenants that haven't connected Stripe yet.

## Control Mappings

| Evidence Type       | SOC2 Controls | PCI-DSS Controls | HIPAA Controls |
| ------------------- | ------------- | ---------------- | -------------- |
| API Key Permissions | CC6.1         | -                | -              |
| Webhook Security    | CC6.6         | -                | -              |
| Payment Events      | CC7.2         | 10.2             | -              |
| Dispute Tracking    | CC7.3         | -                | -              |
| PCI Compliance      | -             | 12.8             | -              |

## Testing

Run tests with:

```bash
npm run test src/evidence.test.ts
```

Test suite includes:

- Response shape validation
- Pass/fail/unknown status logic for each evidence type
- Missing credentials handling
- Stripe API error handling
- Empty result handling

## Future Enhancements

### Planned Evidence Types

1. **Customer Data Retention** (GDPR, SOC2-CC6.5)
   - Query customer data retention policies
   - Validate data deletion workflows

2. **3D Secure Enforcement** (PCI-DSS 8.3)
   - Check payment method configuration for 3DS
   - Validate Strong Customer Authentication (SCA) compliance

3. **Payment Method Security** (PCI-DSS 3.2)
   - Validate no raw card data stored
   - Confirm tokenization usage

4. **Fraud Detection** (SOC2-CC7.3)
   - Stripe Radar rules configured
   - Fraud detection thresholds

5. **Financial Reconciliation** (SOC2-CC7.2)
   - Balance transactions audit trail
   - Payout reconciliation status

### Multi-Account Support

Currently uses a shared `STRIPE_SECRET_KEY` env var. For multi-tenant scenarios where each tenant has their own Stripe account:

1. Store per-tenant Stripe API keys in `connector_tokens` table
2. Retrieve tenant-specific credentials before evidence collection
3. Fallback to shared key if tenant-specific key unavailable

## Integration with Compliance Scoring

Evidence items from this endpoint feed into the compliance scoring pipeline:

1. Evidence collected via scheduled cron (5-minute intervals)
2. Items mapped to control IDs via `controlRefs` array
3. Pass/fail status updates control implementation status
4. Compliance scores recalculated based on weighted evidence

**Example flow**:

- Dispute with `needs_response` status → `dispute_tracking` evidence fails
- Control SOC2-CC7.3 marked as `in_progress` (was `implemented`)
- Overall SOC2 compliance score decreases
- Alert triggered for compliance team

## Security Considerations

### API Key Security

- **Never** commit Stripe API keys to version control
- Use Cloudflare Secrets: `wrangler secret put STRIPE_SECRET_KEY`
- Rotate keys quarterly (Stripe best practice)

### Webhook Signature Verification

The Stripe adapter webhook handler (`/webhooks/stripe/events`) verifies `Stripe-Signature` headers using `STRIPE_WEBHOOK_SECRET`. This is **separate** from the internal HMAC signature used for orchestrator-to-adapter communication.

### PCI Scope Reduction

By using Stripe.js and Stripe Elements on the frontend:

- Raw card data never touches AtlasIT infrastructure
- PCI scope reduced to SAQ-A (simplest questionnaire)
- Evidence collection documents this architecture

## References

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe PCI Compliance Guide](https://stripe.com/docs/security/guide)
- [SOC2 Trust Service Criteria](https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/trustdataintegritytaskforce.html)
- [PCI-DSS Requirements](https://www.pcisecuritystandards.org/document_library)
