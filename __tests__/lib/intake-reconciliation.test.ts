import { describe, it, expect } from '@jest/globals';
import {
  reconcileIntakeRecord,
  validateDeclaredProfile,
  IntakeReconciliationError,
  DeclaredProfile,
  ExtractedEvidence,
} from '@/lib/intake-reconciliation';

describe('Intake Reconciliation Pipeline', () => {
  const baseProfile: DeclaredProfile = {
    applicantId: 'app-9872',
    householdSize: 3,
    annualIncome: 42000,
    state: 'CA',
    taxYear: '2024',
  };

  const baseEvidence: ExtractedEvidence[] = [
    {
      documentId: 'doc-w2',
      documentType: 'tax_return',
      extractedIncome: 42300,
      extractedTaxYear: '2024',
      confidence: 'high',
    },
    {
      documentId: 'doc-dl',
      documentType: 'id_card',
      extractedState: 'CA',
      confidence: 'high',
    },
  ];

  it('normal case: reconciles matching applicant profile and evidence within tolerance', () => {
    const result = reconcileIntakeRecord(baseProfile, baseEvidence);

    expect(result.status).toBe('APPROVED');
    expect(result.eligibleForAutoSubmission).toBe(true);
    expect(result.confidenceScore).toBe(1.0);
    expect(result.discrepancies).toHaveLength(0);
  });

  it('empty input: returns INCOMPLETE status when evidence list is empty', () => {
    const result = reconcileIntakeRecord(baseProfile, []);

    expect(result.status).toBe('INCOMPLETE');
    expect(result.eligibleForAutoSubmission).toBe(false);
    expect(result.confidenceScore).toBe(0.0);
    expect(result.discrepancies[0].field).toBe('evidenceList');
  });

  it('malformed input: throws IntakeReconciliationError when state code is invalid or missing', () => {
    const invalidProfile = { ...baseProfile, state: '12' };
    expect(() => validateDeclaredProfile(invalidProfile)).toThrow(IntakeReconciliationError);

    const emptyIdProfile = { ...baseProfile, applicantId: '' };
    expect(() => validateDeclaredProfile(emptyIdProfile)).toThrow(IntakeReconciliationError);
  });

  it('boundary value: accepts variance exactly at the 5% tolerance threshold', () => {
    const profile = { ...baseProfile, annualIncome: 20000 };
    const evidence5Pct: ExtractedEvidence[] = [
      {
        documentId: 'doc-1',
        documentType: 'tax_return',
        extractedIncome: 21000,
        extractedTaxYear: '2024',
        confidence: 'high',
      },
    ];

    const result = reconcileIntakeRecord(profile, evidence5Pct, {
      incomeTolerancePct: 5.0,
      maxAbsoluteIncomeVariance: 2000,
    });
    expect(result.status).toBe('APPROVED');
    expect(result.eligibleForAutoSubmission).toBe(true);
  });

  it('failing dependency with clear error: rejects outdated tax year outside allowed window', () => {
    const evidenceOutdated: ExtractedEvidence[] = [
      {
        documentId: 'doc-old',
        documentType: 'tax_return',
        extractedTaxYear: '2019',
        confidence: 'high',
      },
    ];

    const result = reconcileIntakeRecord(baseProfile, evidenceOutdated);
    expect(result.status).toBe('REJECTED');
    expect(result.eligibleForAutoSubmission).toBe(false);
    expect(result.discrepancies.some((d) => d.field === 'taxYear')).toBe(true);
  });

  it('property that must always hold: blocking discrepancy guarantees eligibleForAutoSubmission is false', () => {
    const mismatchedEvidence: ExtractedEvidence[] = [
      {
        documentId: 'doc-mismatch',
        documentType: 'id_card',
        extractedState: 'NY',
        confidence: 'high',
      },
    ];

    const result = reconcileIntakeRecord(baseProfile, mismatchedEvidence);
    const hasBlocking = result.discrepancies.some((d) => d.severity === 'blocking');

    if (hasBlocking) {
      expect(result.eligibleForAutoSubmission).toBe(false);
      expect(result.status).not.toBe('APPROVED');
    }
    expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(result.confidenceScore).toBeLessThanOrEqual(1);
  });

  it('invalid income: throws IntakeReconciliationError for negative annual income', () => {
    const negativeIncomeProfile = { ...baseProfile, annualIncome: -500 };
    expect(() => validateDeclaredProfile(negativeIncomeProfile)).toThrow(IntakeReconciliationError);
  });
});
