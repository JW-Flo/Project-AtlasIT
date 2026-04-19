import { DEMO_USER } from "./session.js";
import { daysAgo, uuid } from "./helpers.js";

export function getPoliciesResponse() {
  return {
    data: {
      items: [
        {
          id: uuid(),
          tenantId: DEMO_USER.tenantId,
          name: "Information Security Policy",
          category: "security",
          version: "2.1",
          status: "published",
          frameworkRefs: ["SOC2", "ISO27001"],
          createdBy: DEMO_USER.userId,
          createdAt: daysAgo(180),
          updatedAt: daysAgo(30),
          publishedAt: daysAgo(30),
          ackCount: 12,
        },
        {
          id: uuid(),
          tenantId: DEMO_USER.tenantId,
          name: "Access Control Policy",
          category: "access",
          version: "1.5",
          status: "published",
          frameworkRefs: ["SOC2", "NIST_CSF"],
          createdBy: DEMO_USER.userId,
          createdAt: daysAgo(150),
          updatedAt: daysAgo(45),
          publishedAt: daysAgo(45),
          ackCount: 12,
        },
        {
          id: uuid(),
          tenantId: DEMO_USER.tenantId,
          name: "Data Protection and Privacy Policy",
          category: "privacy",
          version: "3.0",
          status: "published",
          frameworkRefs: ["GDPR", "HIPAA"],
          createdBy: DEMO_USER.userId,
          createdAt: daysAgo(200),
          updatedAt: daysAgo(15),
          publishedAt: daysAgo(15),
          ackCount: 11,
        },
        {
          id: uuid(),
          tenantId: DEMO_USER.tenantId,
          name: "Incident Response Plan",
          category: "security",
          version: "1.0",
          status: "draft",
          frameworkRefs: ["SOC2", "ISO27001"],
          createdBy: DEMO_USER.userId,
          createdAt: daysAgo(10),
          updatedAt: daysAgo(2),
          publishedAt: null,
          ackCount: 0,
        },
        {
          id: uuid(),
          tenantId: DEMO_USER.tenantId,
          name: "Acceptable Use Policy",
          category: "general",
          version: "2.0",
          status: "draft",
          frameworkRefs: [],
          createdBy: DEMO_USER.userId,
          createdAt: daysAgo(20),
          updatedAt: daysAgo(5),
          publishedAt: null,
          ackCount: 0,
        },
        {
          id: uuid(),
          tenantId: DEMO_USER.tenantId,
          name: "Password Policy (Deprecated)",
          category: "access",
          version: "1.0",
          status: "archived",
          frameworkRefs: ["SOC2"],
          createdBy: DEMO_USER.userId,
          createdAt: daysAgo(365),
          updatedAt: daysAgo(60),
          publishedAt: daysAgo(365),
          ackCount: 12,
        },
      ],
    },
  };
}

export function getPolicyDetailResponse(id: string) {
  const policies: Record<string, string> = {
    "demo-000001": `# Information Security Policy

## Purpose
This Information Security Policy establishes the framework for protecting Acme Corp's information assets from all threats, whether internal or external, deliberate or accidental.

## Scope
This policy applies to all employees, contractors, consultants, temporary workers, and other personnel who have access to Acme Corp information systems and data.

## Policy Statements

### 1. Asset Classification
All information assets must be classified according to their sensitivity and criticality to business operations.

### 2. Access Control
- Access to information systems and data shall be granted based on the principle of least privilege
- All user access must be authorized by the asset owner
- User access rights must be reviewed quarterly

### 3. Physical Security
- Server rooms and data centers must maintain appropriate physical access controls
- Visitor access must be logged and supervised
- Equipment must be protected from environmental threats

### 4. Encryption
- Data in transit must be encrypted using TLS 1.2 or higher
- Sensitive data at rest must be encrypted using AES-256 or equivalent
- Encryption keys must be managed according to the Key Management Standard

### 5. Monitoring and Logging
- Security events must be logged and retained for a minimum of 12 months
- Logs must be reviewed regularly for suspicious activity
- Automated alerting must be configured for critical security events

## Compliance
Violations of this policy may result in disciplinary action up to and including termination of employment.

## Review
This policy shall be reviewed annually and updated as necessary.

---
*Last updated: ${daysAgo(30)}*`,

    "demo-000002": `# Access Control Policy

## Purpose
This policy defines the requirements for managing access to Acme Corp's information systems and data resources.

## Scope
This policy applies to all systems, applications, and data repositories maintained by or on behalf of Acme Corp.

## Policy Statements

### 1. User Registration
- All user accounts must be tied to a verified identity
- User provisioning must follow the documented onboarding process
- Accounts must be disabled within 24 hours of employment termination

### 2. Authentication
- Multi-factor authentication (MFA) is required for all user accounts
- Passwords must meet complexity requirements (12+ characters, mixed case, numbers, symbols)
- Password reuse is prohibited for the last 12 passwords
- Failed login attempts must be limited (5 attempts, 15-minute lockout)

### 3. Authorization
- Role-based access control (RBAC) must be used wherever possible
- Privileged access must be justified, approved, and time-limited
- Access reviews must be conducted quarterly by resource owners

### 4. Remote Access
- Remote access to corporate resources requires VPN connection
- Split-tunneling is prohibited for VPN connections
- Remote desktop access requires additional authentication

### 5. Service Accounts
- Service accounts must be inventoried and reviewed quarterly
- Service account credentials must be stored in a secure vault
- Interactive login must be disabled for service accounts

## Responsibilities
- IT Department: Implement and maintain access control systems
- Security Team: Monitor compliance and conduct access reviews
- Managers: Approve access requests and review team access quarterly
- Employees: Protect credentials and report suspicious activity

## Compliance
Access control violations must be reported to the Security team within 24 hours.

---
*Last updated: ${daysAgo(45)}*`,

    "demo-000003": `# Data Protection and Privacy Policy

## Purpose
This policy establishes requirements for the collection, processing, storage, and disposal of personal data in compliance with GDPR, HIPAA, and other applicable privacy regulations.

## Scope
This policy applies to all personal data processed by Acme Corp, including customer data, employee data, and data processed on behalf of clients.

## Definitions
- **Personal Data**: Any information relating to an identified or identifiable natural person
- **Processing**: Any operation performed on personal data
- **Data Subject**: An identified or identifiable natural person

## Policy Statements

### 1. Lawful Basis
Personal data shall only be processed where we have a lawful basis:
- Consent
- Contract performance
- Legal obligation
- Legitimate interests
- Vital interests
- Public task

### 2. Data Minimization
Only collect and process personal data that is necessary for specified purposes.

### 3. Transparency
- Privacy notices must be provided at the point of data collection
- Data subjects must be informed of their rights
- Processing activities must be documented in the data inventory

### 4. Security Measures
- Personal data must be encrypted in transit and at rest
- Access to personal data must be logged and monitored
- Data breach response procedures must be followed

### 5. Data Subject Rights
Processes must be in place to handle:
- Right of access
- Right to rectification
- Right to erasure
- Right to restrict processing
- Right to data portability
- Right to object

### 6. Data Retention
- Personal data must be retained only as long as necessary
- Retention schedules must be documented and followed
- Secure deletion procedures must be used

### 7. Third-Party Processing
- Data processing agreements must be in place with all processors
- Processors must provide adequate security guarantees
- International transfers must comply with transfer mechanisms

## Data Breach Response
In the event of a data breach:
1. Contain the breach
2. Assess the risk to data subjects
3. Notify the Data Protection Officer
4. Document the breach
5. Notify supervisory authority within 72 hours (if required)
6. Notify affected data subjects (if high risk)

## Compliance
The Data Protection Officer shall conduct annual audits of compliance with this policy.

---
*Last updated: ${daysAgo(15)}*`,
  };

  return {
    data: {
      content:
        policies[id] || "# Policy Not Found\n\nThe requested policy document could not be found.",
    },
  };
}
