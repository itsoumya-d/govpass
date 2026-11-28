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
