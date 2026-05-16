import { supabase } from './supabase';

export interface DocumentAnalysis {
  documentType: string;
  extractedData: {
    fullName?: string;
    dateOfBirth?: string;
    address?: string;
    income?: number;
    taxYear?: string;
    ssn?: string;
    documentNumber?: string;
  };
  confidence: 'high' | 'medium' | 'low';
  eligibilityHints: string[];
  summary: string;
}

export async function analyzeDocument(userId: string, imageBase64: string, documentType: string): Promise<DocumentAnalysis> {
  const prompt = `You are a government benefits intake specialist. Analyze this ${documentType} document image.
Extract relevant information for government benefits eligibility. Do NOT extract full SSN — only last 4 digits if visible.
Respond ONLY with this JSON:
{
  "documentType": "${documentType}",
  "extractedData": {
    "fullName": "extracted name or null",
    "dateOfBirth": "MM/DD/YYYY or null",
    "address": "extracted address or null",
    "income": annual income as number or null,
    "taxYear": "year or null",
    "documentNumber": "ID/document number or null"
  },
  "confidence": "high" or "medium" or "low",
  "eligibilityHints": ["potential benefit 1", "potential benefit 2"],
  "summary": "What was found in this document"
}`;

  const { data, error } = await supabase.functions.invoke('analyze-image', {
    body: { imageBase64, prompt, userId, context: `govpass-${documentType}` },
  });

  if (error) throw error;
  return data as DocumentAnalysis;
}

export async function getEligiblePrograms() {
  return supabase.from('programs').select('*').eq('is_active', true).order('name').limit(50);
}

export async function getUserApplications(userId: string, from = 0, to = 19) {
  return supabase.from('applications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).range(from, to);
}

export async function getNotifications(userId: string) {
  return supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
}

// ── AI Benefits Maximizer ──────────────────────────────────────

export interface BenefitsMaximizerResult {
  priorityActions: string[];
  hiddenOpportunities: string[];
  nearMissStrategy: string;
  applicationTip: string;
  estimatedUnclaimedValue: number;
  urgentDeadline: string | null;
}

export async function getBenefitsMaximizer(params: {
  profile: Record<string, unknown>;
  eligiblePrograms: Array<{ name: string }>;
  nearMissPrograms?: Array<{ name: string }>;
}): Promise<BenefitsMaximizerResult | null> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return null;
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/benefits-maximizer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(params),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
