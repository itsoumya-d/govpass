# GovPass

**AI-powered benefits eligibility and document reconciliation engine.**

GovPass automates eligibility verification for assistance programs and provides forward-deployed customer reconciliation pipelines between applicant declarations and verified document evidence.

---

## Intake Reconciliation Pipeline

The `Intake Reconciliation Pipeline` (`lib/intake-reconciliation.ts`) provides automated discrepancy detection, tolerance-based income reconciliation, and structured remediation plans for forward-deployed enterprise and government client integrations.

### Capabilities

- **Multi-Source Reconciliation**: Compares applicant self-declarations (annual income, household size, state jurisdiction) with OCR-extracted document records (W-2, 1040, paystubs, state IDs).
- **Tolerance & Variance Scoring**: Applies configurable percentage and absolute dollar variance thresholds (default: 5% or \$600) to account for withholding variances.
- **Audit Logging & Remediation**: Emits typed discrepancy items with severity (`blocking`, `warning`, `info`) and deterministic remediation actions.
- **Auto-Submission Gate**: Evaluates `eligibleForAutoSubmission` to safeguard submission workflows against fraudulent or invalid records.

### Runnable Example

```typescript
import {
  reconcileIntakeRecord,
  DeclaredProfile,
  ExtractedEvidence,
} from '@/lib/intake-reconciliation';

const applicant: DeclaredProfile = {
  applicantId: 'app-9872',
  householdSize: 3,
  annualIncome: 42000,
  state: 'CA',
  taxYear: '2024',
};

const documents: ExtractedEvidence[] = [
  {
    documentId: 'doc-w2-2024',
    documentType: 'tax_return',
    extractedIncome: 42450,
    extractedTaxYear: '2024',
    confidence: 'high',
  },
  {
    documentId: 'doc-ca-dl',
    documentType: 'id_card',
    extractedState: 'CA',
    confidence: 'high',
  },
];

const result = reconcileIntakeRecord(applicant, documents, {
  incomeTolerancePct: 5,
  maxAbsoluteIncomeVariance: 600,
});

console.log(result.status); // 'APPROVED'
console.log(result.eligibleForAutoSubmission); // true
console.log(result.confidenceScore); // 1.0
```

### Limits and Not Covered Yet

- Complex multi-state apportionment for remote workers filing non-resident state returns is not yet modeled.
- Biometric facial matching between ID photos and applicant selfies is delegated to external identity verification providers.

---

## Cross-Language Request Trace Evaluation Engine

The `Cross-Language Request Trace Evaluation Engine` (`lib/request-trace-evaluator.ts`) traces, measures, and audits distributed requests across client browsers, API gateways, microservices, and databases running on TypeScript, Go, Python, and Node runtimes.

### Capabilities

- **Cross-Language Trace Auditing**: Tracks request spans across frontend browsers and backend microservices, recording cross-language execution hops.
- **Latency & Bottleneck Detection**: Identifies services exceeding SLA latency thresholds or consuming disproportionate processing budgets.
- **Error Propagation Tracking**: Extracts downstream error states and timeout failures with span IDs and service names.
- **Compliance & Health Status**: Assigns deterministic audit ratings (`PASS`, `WARN`, `FAIL`) to incoming distributed transactions.

### Runnable Example

```typescript
import {
  evaluateRequestTrace,
  TracePipeline,
} from '@/lib/request-trace-evaluator';

const pipeline: TracePipeline = {
  traceId: 'trace-8841',
  spans: [
    {
      spanId: 'span-client-1',
      serviceName: 'browser_client',
      runtime: 'typescript',
      durationMs: 45,
      status: 'ok',
    },
    {
      spanId: 'span-gw-1',
      parentSpanId: 'span-client-1',
      serviceName: 'api_gateway',
      runtime: 'go',
      durationMs: 25,
      status: 'ok',
    },
    {
      spanId: 'span-recon-1',
      parentSpanId: 'span-gw-1',
      serviceName: 'reconciliation_service',
      runtime: 'python',
      durationMs: 180,
      status: 'ok',
    },
    {
      spanId: 'span-db-1',
      parentSpanId: 'span-recon-1',
      serviceName: 'database_store',
      runtime: 'node',
      durationMs: 60,
      status: 'ok',
    },
  ],
  startTimeMs: 1000,
  endTimeMs: 1350,
};

const result = evaluateRequestTrace(pipeline, { slaThresholdMs: 2000 });
console.log(result.isValid); // true
console.log(result.crossLanguageHops); // 3
console.log(result.complianceAuditStatus); // 'PASS'
```

### Limits and Not Covered Yet

- Kernel-level eBPF network packet tracing is not supported; spans must be instrumented at the application or gateway layer.
- Trace sampling policies across extremely high-volume streams (>100k requests/sec) require external OpenTelemetry collector aggregation.
