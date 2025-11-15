# Autonomy Diagrams

## System Architecture

```mermaid
graph TD
    A[GitHub PR] --> B[Agent Events Workflow]
    B --> C[Router Worker]
    C --> D{Severity?}
    D -->|Low| E[Auto-Label]
    D -->|Medium| F[Require Approval]
    D -->|High| G[Multiple Approvals]
    E --> H[Merge Orchestrator]
    F --> H
    G --> H
    H --> I{Validations Pass?}
    I -->|Yes| J[Merge]
    I -->|No| K[Block]
    C --> L[Evidence Emission]
    L --> M[.evidence/ Storage]
```

## PR Routing Flow

```mermaid
sequenceDiagram
    participant Dev as Developer/Agent
    participant GH as GitHub
    participant AE as Agent Events
    participant RW as Router Worker
    participant MO as Merge Orchestrator
    participant EV as Evidence Store

    Dev->>GH: Create PR
    GH->>AE: Trigger on PR open
    AE->>RW: POST /route {pr_metadata}
    RW->>RW: Load rules.json
    RW->>RW: Compute severity
    RW->>RW: Assign agents
    RW->>RW: Check prohibited patterns
    RW->>EV: Emit routing evidence
    RW-->>AE: Return {decision}
    AE->>GH: Apply labels
    AE->>GH: Post comment with decision
    
    Note over GH,MO: PR ready for review
    
    GH->>MO: Trigger on label/review
    MO->>MO: Validate drift PRs closed
    MO->>MO: Verify evidence hashes
    MO->>MO: Check approval requirements
    MO->>EV: Emit validation evidence
    MO->>GH: Set merge status
```

## Drift Detection Flow

```mermaid
flowchart TD
    A[Scheduled Trigger] --> B[Drift Detection Workflow]
    B --> C[Load Required Structure]
    B --> D[Scan Repository]
    C --> E{Compare}
    D --> E
    E --> F{Drift Found?}
    F -->|No| G[Emit Pass Evidence]
    F -->|Yes| H[Categorize Drift]
    H --> I{Category?}
    I -->|Structure| J[Create drift/structure-fix PR]
    I -->|Security| K[Create drift/security-fix PR]
    I -->|Roadmap| L[Create drift/roadmap-fix PR]
    J --> M[Emit Drift Evidence]
    K --> M
    L --> M
    M --> N[Update Drift Status]
    G --> O[Complete]
    N --> O
```

## Evidence Chain

```mermaid
graph LR
    A[Agent Action] --> B[Generate Evidence]
    B --> C{Valid Schema?}
    C -->|No| D[Fail Fast]
    C -->|Yes| E[Write to .evidence/]
    E --> F[Commit to Git]
    F --> G[CI Validation]
    G --> H{Evidence Complete?}
    H -->|No| I[Block Merge]
    H -->|Yes| J[Evidence Hash]
    J --> K[Merge Orchestrator]
    K --> L[Compliance Report]
```

## Multi-Agent Coordination

```mermaid
graph TD
    subgraph "Planning Layer"
        A[Copilot Agent]
    end
    
    subgraph "Execution Layer"
        B[CodeGen Agent]
        C[Drift Agent]
    end
    
    subgraph "Validation Layer"
        D[Router Worker]
        E[OPA Validator]
        F[NIST Verifier]
    end
    
    subgraph "Evidence Layer"
        G[Evidence Store]
        H[Compliance Reporter]
    end
    
    A --> B
    A --> C
    B --> D
    C --> D
    D --> E
    D --> F
    E --> G
    F --> G
    G --> H
    
    B -.->|Feedback| A
    C -.->|Feedback| A
    D -.->|Routing| B
    E -.->|Block| B
    F -.->|Block| C
```

## Severity-Based Routing

```mermaid
stateDiagram-v2
    [*] --> Analyze
    Analyze --> ComputeSeverity
    
    ComputeSeverity --> Low: docs only
    ComputeSeverity --> Medium: schema changes
    ComputeSeverity --> High: security files
    ComputeSeverity --> Critical: prohibited patterns
    
    Low --> AutoLabel
    AutoLabel --> AutoMerge: approvals not required
    
    Medium --> RequireApproval
    RequireApproval --> CodexReview: assign Codex
    CodexReview --> ManualMerge: approved
    
    High --> MultipleApprovals
    MultipleApprovals --> MaintainerReview: assign 2+ maintainers
    MaintainerReview --> ManualMerge: approved
    
    Critical --> Block
    Block --> [*]: merge prevented
    
    AutoMerge --> [*]
    ManualMerge --> [*]
```

## Deployment Pipeline

```mermaid
flowchart LR
    A[Code Commit] --> B[CI Workflow]
    B --> C{Tests Pass?}
    C -->|No| D[Fail Build]
    C -->|Yes| E[Build Artifacts]
    E --> F[SBOM Generation]
    F --> G[Security Scan]
    G --> H{Vulnerabilities?}
    H -->|Yes| I[Block Deploy]
    H -->|No| J[Stage to Workers]
    J --> K[Health Check]
    K --> L{Healthy?}
    L -->|No| M[Rollback]
    L -->|Yes| N[Promote to Prod]
    N --> O[Emit Evidence]
    O --> P[Update Status]
```

## Evidence Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Generated: Agent action
    Generated --> Validated: Schema check
    Validated --> Stored: Write to .evidence/
    Stored --> Committed: Git commit
    Committed --> Indexed: CI indexing
    Indexed --> Queried: Compliance report
    Queried --> Archived: Retention policy
    Archived --> [*]
    
    Validated --> Rejected: Invalid schema
    Rejected --> [*]
```

## Autonomous Decision Tree

```mermaid
graph TD
    A[PR Created] --> B{Files Changed?}
    B -->|Only docs| C[Low Severity]
    B -->|Schema files| D[Medium Severity]
    B -->|Workflows/Security| E[High Severity]
    
    C --> F{Prohibited Patterns?}
    D --> F
    E --> F
    
    F -->|Yes| G[Block Immediately]
    F -->|No| H{Drift PRs Open?}
    
    H -->|Yes High Drift| I[Block Until Resolved]
    H -->|No| J{Evidence Valid?}
    
    J -->|No| K[Block Until Complete]
    J -->|Yes| L{Severity Level?}
    
    L -->|Low| M[Auto-Merge Path]
    L -->|Medium| N[Codex Approval Path]
    L -->|High| O[Maintainer Approval Path]
    
    M --> P[Merge]
    N --> Q{Approved?}
    O --> Q
    Q -->|Yes| P
    Q -->|No| R[Wait for Approval]
```

## Worker Architecture

```mermaid
graph TD
    subgraph "Cloudflare Edge"
        A[Router Worker]
        B[Compliance Worker]
        C[Documentation Worker]
    end
    
    subgraph "Durable Objects"
        D[Routing State]
        E[Evidence State]
    end
    
    subgraph "Storage"
        F[KV: Rules]
        G[KV: Config]
        H[R2: Artifacts]
        I[D1: Audit Log]
    end
    
    A --> D
    A --> F
    B --> E
    B --> I
    C --> G
    C --> H
    
    D --> I
    E --> I
```

## Compliance Automation

```mermaid
graph LR
    A[Agent Action] --> B[Evidence Generation]
    B --> C[NIST Mapping]
    C --> D{Control Coverage?}
    D -->|Complete| E[Mark Compliant]
    D -->|Gaps| F[Flag Non-Compliant]
    E --> G[Update Dashboard]
    F --> G
    G --> H[Audit Report]
    H --> I[Review Cycle]
    I -->|Monthly| J[Certification]
```

## Notes

- All diagrams represent the target architecture after Phase 1 completion
- Mermaid syntax used for version control and automated rendering
- Diagrams updated as implementation evolves
- Reference implementation details in respective spec files
