/**
 * Intake Reconciliation Pipeline
 * Automated intake verification and discrepancy remediation engine for client record onboarding.
 * Reconciles declared applicant profiles against parsed document evidence with tolerance scoring.
 */

export interface DeclaredProfile {
  applicantId: string;
  householdSize: number;
  annualIncome: number;
  state: string;
  taxYear?: string;
  dependentsCount?: number;
}

export interface ExtractedEvidence {
  documentId: string;
  documentType: 'tax_return' | 'paystub' | 'id_card' | 'utility_bill';
  extractedIncome?: number;
  extractedState?: string;
  extractedTaxYear?: string;
  extractedDependents?: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface ReconciliationOptions {
  incomeTolerancePct?: number;
  maxAbsoluteIncomeVariance?: number;
  allowedTaxYears?: string[];
  strictStateMatch?: boolean;
}

export type DiscrepancySeverity = 'blocking' | 'warning' | 'info';

export interface DiscrepancyItem {
  field: string;
  severity: DiscrepancySeverity;
  declaredValue: unknown;
  evidenceValue: unknown;
  difference?: number;
  reason: string;
  remediationAction: string;
}

export type ReconciliationStatus = 'APPROVED' | 'FLAGGED' | 'REJECTED' | 'INCOMPLETE';

export interface ReconciliationResult {
  applicantId: string;
  status: ReconciliationStatus;
  eligibleForAutoSubmission: boolean;
  confidenceScore: number;
  discrepancies: DiscrepancyItem[];
  auditLog: {
    timestamp: string;
    rulesEvaluated: number;
    verdict: string;
  };
}

export class IntakeReconciliationError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'IntakeReconciliationError';
  }
}

export function validateDeclaredProfile(profile: DeclaredProfile): void {
  if (!profile || typeof profile !== 'object') {
    throw new IntakeReconciliationError('Profile cannot be empty', 'EMPTY_PROFILE');
  }
  if (!profile.applicantId || typeof profile.applicantId !== 'string' || profile.applicantId.trim() === '') {
    throw new IntakeReconciliationError('applicantId is required and must be non-empty', 'INVALID_APPLICANT_ID');
  }
  if (typeof profile.annualIncome !== 'number' || isNaN(profile.annualIncome) || profile.annualIncome < 0) {
    throw new IntakeReconciliationError('annualIncome must be a non-negative number', 'INVALID_INCOME');
  }
  if (typeof profile.householdSize !== 'number' || !Number.isInteger(profile.householdSize) || profile.householdSize < 1) {
    throw new IntakeReconciliationError('householdSize must be a positive integer (>= 1)', 'INVALID_HOUSEHOLD_SIZE');
  }
  if (!profile.state || typeof profile.state !== 'string' || !/^[A-Za-z]{2}$/.test(profile.state.trim())) {
    throw new IntakeReconciliationError('state must be a valid 2-letter postal code', 'INVALID_STATE');
  }
}

export function reconcileIntakeRecord(
  profile: DeclaredProfile,
  evidenceList: ExtractedEvidence[],
  options: ReconciliationOptions = {}
): ReconciliationResult {
  validateDeclaredProfile(profile);

  const incomeTolerancePct = options.incomeTolerancePct ?? 5;
  const maxAbsoluteIncomeVariance = options.maxAbsoluteIncomeVariance ?? 600;
  const allowedTaxYears = options.allowedTaxYears ?? ['2023', '2024', '2025'];
  const strictStateMatch = options.strictStateMatch ?? true;

  if (!Array.isArray(evidenceList) || evidenceList.length === 0) {
    return {
      applicantId: profile.applicantId,
      status: 'INCOMPLETE',
      eligibleForAutoSubmission: false,
      confidenceScore: 0.0,
      discrepancies: [
        {
          field: 'evidenceList',
          severity: 'blocking',
          declaredValue: null,
          evidenceValue: null,
          reason: 'No verification documents provided',
          remediationAction: 'Upload at least one verification document (tax return, paystub, or ID card)',
        },
      ],
      auditLog: {
        timestamp: new Date().toISOString(),
        rulesEvaluated: 1,
        verdict: 'Missing required evidence documents',
      },
    };
  }

  const discrepancies: DiscrepancyItem[] = [];
  let totalRules = 0;
  let passedRules = 0;

  for (const doc of evidenceList) {
    totalRules++;
    if (doc.confidence === 'low') {
      discrepancies.push({
        field: `document_${doc.documentId}`,
        severity: 'warning',
        declaredValue: null,
        evidenceValue: doc.confidence,
        reason: `Document ${doc.documentId} has low extraction confidence`,
        remediationAction: 'Request clearer photo or manual scan re-upload',
      });
    } else {
      passedRules++;
    }
  }

  const idOrUtilityDoc = evidenceList.find((d) => d.extractedState !== undefined);
  if (idOrUtilityDoc && idOrUtilityDoc.extractedState) {
    totalRules++;
    const stateMatch = idOrUtilityDoc.extractedState.toUpperCase() === profile.state.toUpperCase();
    if (!stateMatch) {
      discrepancies.push({
        field: 'state',
        severity: strictStateMatch ? 'blocking' : 'warning',
        declaredValue: profile.state.toUpperCase(),
        evidenceValue: idOrUtilityDoc.extractedState.toUpperCase(),
        reason: `Declared state (${profile.state.toUpperCase()}) does not match document state (${idOrUtilityDoc.extractedState.toUpperCase()})`,
        remediationAction: 'Provide proof of state residency or update applicant profile address',
      });
    } else {
      passedRules++;
    }
  }

  const taxDoc = evidenceList.find((d) => d.documentType === 'tax_return' && d.extractedTaxYear);
  if (taxDoc && taxDoc.extractedTaxYear) {
    totalRules++;
    if (!allowedTaxYears.includes(taxDoc.extractedTaxYear)) {
      discrepancies.push({
        field: 'taxYear',
        severity: 'blocking',
        declaredValue: profile.taxYear ?? 'current',
        evidenceValue: taxDoc.extractedTaxYear,
        reason: `Tax return year ${taxDoc.extractedTaxYear} is outside eligible window (${allowedTaxYears.join(', ')})`,
        remediationAction: `Upload tax return for ${allowedTaxYears[allowedTaxYears.length - 1]} or ${allowedTaxYears[allowedTaxYears.length - 2]}`,
      });
    } else {
      passedRules++;
    }
  }

  const incomeDoc = evidenceList.find((d) => typeof d.extractedIncome === 'number');
  if (incomeDoc && typeof incomeDoc.extractedIncome === 'number') {
    totalRules++;
    const declared = profile.annualIncome;
    const docIncome = incomeDoc.extractedIncome;
    const absDiff = Math.abs(declared - docIncome);
    const pctDiff = declared > 0 ? (absDiff / declared) * 100 : docIncome === 0 ? 0 : 100;

    if (absDiff > maxAbsoluteIncomeVariance && pctDiff > incomeTolerancePct) {
      const isExtreme = pctDiff > 25 || absDiff > 5000;
      discrepancies.push({
        field: 'annualIncome',
        severity: isExtreme ? 'blocking' : 'warning',
        declaredValue: declared,
        evidenceValue: docIncome,
        difference: absDiff,
        reason: `Income variance of $${absDiff.toFixed(2)} (${pctDiff.toFixed(1)}%) exceeds allowable tolerance`,
        remediationAction: isExtreme
          ? 'Requires supervisor review or supplemental proof of income affidavit'
          : 'Confirm recent income changes with applicant before submission',
      });
    } else {
      passedRules++;
    }
  }

  const hasBlocking = discrepancies.some((d) => d.severity === 'blocking');
  const hasWarning = discrepancies.some((d) => d.severity === 'warning');

  let status: ReconciliationStatus = 'APPROVED';
  if (hasBlocking) {
    status = 'REJECTED';
  } else if (hasWarning) {
    status = 'FLAGGED';
  }

  const rawConfidence = totalRules > 0 ? passedRules / totalRules : 0;
  const confidenceScore = Math.max(0, Math.min(1, Math.round(rawConfidence * 100) / 100));

  return {
    applicantId: profile.applicantId,
    status,
    eligibleForAutoSubmission: status === 'APPROVED',
    confidenceScore,
    discrepancies,
    auditLog: {
      timestamp: new Date().toISOString(),
      rulesEvaluated: totalRules,
      verdict: status === 'APPROVED' ? 'Passed all reconciliation checks' : `Identified ${discrepancies.length} discrepancy items`,
    },
  };
}
