export type BenefitStatus = 'eligible' | 'possibly_eligible' | 'not_eligible' | 'unknown';

export type ApplicationStatus = 'pending' | 'approved' | 'denied' | 'in_review' | 'draft';

export interface Benefit {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: BenefitCategory;
  estimatedAmount: string;
  frequency: 'monthly' | 'annual' | 'one_time';
  status: BenefitStatus;
  agency: string;
  requirements: string[];
  icon: string;
}

export type BenefitCategory =
  | 'food'
  | 'healthcare'
  | 'housing'
  | 'income'
  | 'childcare'
  | 'education'
  | 'utilities'
  | 'disability';

export interface Application {
  id: string;
  benefitId: string;
  benefitName: string;
  status: ApplicationStatus;
  submittedAt: string;
  updatedAt: string;
  referenceNumber: string;
  agency: string;
  notes?: string;
}

export interface Document {
  id: string;
  type: DocumentType;
  name: string;
  uploadedAt: string;
  verifiedAt?: string;
  status: 'uploaded' | 'verified' | 'rejected';
}

export type DocumentType =
  | 'id'
  | 'pay_stub'
  | 'tax_return'
  | 'utility_bill'
  | 'birth_certificate'
  | 'social_security'
  | 'lease_agreement'
  | 'bank_statement';

export interface HouseholdInfo {
  size: number;
  children: number;
  state: string;
  incomeRange: string;
  language: 'en' | 'es';
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  household: HouseholdInfo;
  createdAt: string;
}
