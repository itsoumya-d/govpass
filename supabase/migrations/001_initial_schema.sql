-- GovPass - Government benefits eligibility and application tracker
-- Migration: 001_initial_schema.sql
-- 14 tables: profiles (encrypted PII), household_members, scanned_documents,
-- document_vault_items, benefit_programs, eligibility_results, saved_benefits,
-- applications, application_form_data, form_field_mappings, ai_guidance_sessions,
-- notification_schedule, referral_agencies, user_activity_log

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- SHARED: updated_at trigger function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE 1: profiles
-- Encrypted PII via pgcrypto, plaintext eligibility fields for query perf
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  encrypted_full_name BYTEA,
  encrypted_ssn BYTEA,
  encrypted_dob BYTEA,
  encrypted_address BYTEA,
  encrypted_phone BYTEA,
  encrypted_email BYTEA,
  preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'es')),
  household_size INTEGER DEFAULT 1 CHECK (household_size BETWEEN 1 AND 20),
  household_income_bracket TEXT CHECK (household_income_bracket IN (
    '0_15000', '15000_30000', '30000_50000', '50000_75000', '75000_plus'
  )),
  annual_income_cents INTEGER,
  employment_status TEXT CHECK (employment_status IN (
    'employed', 'unemployed', 'self_employed', 'retired', 'disabled', 'student'
  )),
  citizenship_status TEXT CHECK (citizenship_status IN (
    'citizen', 'permanent_resident', 'visa_holder', 'undocumented', 'refugee', 'prefer_not_say'
  )),
  has_children_under_18 BOOLEAN DEFAULT false,
  number_of_dependents INTEGER DEFAULT 0,
  state_code CHAR(2),
  county TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'plus', 'family')),
  subscription_expires_at TIMESTAMPTZ,
  revenucat_id TEXT UNIQUE,
  push_token TEXT,
  sms_opted_in BOOLEAN DEFAULT false,
  push_opted_in BOOLEAN DEFAULT true,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMPTZ,
  last_eligibility_check_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_state_code ON public.profiles(state_code);
CREATE INDEX idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX idx_profiles_revenucat_id ON public.profiles(revenucat_id);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at DESC);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- ============================================================================
-- TABLE 2: household_members
-- Additional household members for family-tier eligibility
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  encrypted_name BYTEA NOT NULL,
  encrypted_dob BYTEA NOT NULL,
  encrypted_ssn BYTEA,
  relationship TEXT NOT NULL CHECK (relationship IN (
    'spouse', 'child', 'parent', 'sibling', 'grandparent', 'grandchild', 'other'
  )),
  age_bracket TEXT CHECK (age_bracket IN (
    'under_1', '1_4', '5_12', '13_17', '18_24', '25_54', '55_64', '65_plus'
  )),
  is_dependent BOOLEAN DEFAULT false,
  has_disability BOOLEAN DEFAULT false,
  is_pregnant BOOLEAN DEFAULT false,
  is_veteran BOOLEAN DEFAULT false,
  employment_status TEXT CHECK (employment_status IN (
    'employed', 'unemployed', 'self_employed', 'retired', 'disabled', 'student', 'not_applicable'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_household_members_user_id ON public.household_members(user_id);

ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "household_select_own"
  ON public.household_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "household_insert_own"
  ON public.household_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "household_update_own"
  ON public.household_members FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "household_delete_own"
  ON public.household_members FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE 3: scanned_documents
-- OCR scan metadata; images in Supabase encrypted storage
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.scanned_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'drivers_license', 'state_id', 'passport', 'ssn_card', 'w2',
    'tax_return', 'pay_stub', 'birth_certificate', 'immigration_doc',
    'utility_bill', 'bank_statement', 'lease_agreement', 'other'
  )),
  encrypted_extracted_data BYTEA NOT NULL,
  extraction_confidence FLOAT CHECK (extraction_confidence BETWEEN 0.0 AND 1.0),
  field_confidences JSONB DEFAULT '{}',
  storage_path TEXT,
  storage_bucket TEXT DEFAULT 'encrypted-documents',
  file_size_bytes INTEGER,
  mime_type TEXT DEFAULT 'image/jpeg',
  is_in_vault BOOLEAN DEFAULT false,
  is_verified_by_user BOOLEAN DEFAULT false,
  verification_notes TEXT,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scanned_documents_user_id ON public.scanned_documents(user_id);
CREATE INDEX idx_scanned_documents_type ON public.scanned_documents(user_id, document_type);
CREATE INDEX idx_scanned_documents_expires ON public.scanned_documents(expires_at)
  WHERE is_in_vault = false;
CREATE INDEX idx_scanned_documents_vault ON public.scanned_documents(user_id)
  WHERE is_in_vault = true;

ALTER TABLE public.scanned_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select_own"
  ON public.scanned_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "documents_insert_own"
  ON public.scanned_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "documents_update_own"
  ON public.scanned_documents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "documents_delete_own"
  ON public.scanned_documents FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE 4: document_vault_items
-- Permanent encrypted document storage for Plus/Family subscribers
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.document_vault_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scanned_document_id UUID REFERENCES public.scanned_documents(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'drivers_license', 'state_id', 'passport', 'ssn_card', 'w2',
    'tax_return', 'pay_stub', 'birth_certificate', 'immigration_doc',
    'utility_bill', 'bank_statement', 'lease_agreement', 'other'
  )),
  display_name TEXT NOT NULL,
  display_name_es TEXT,
  encrypted_extracted_data BYTEA NOT NULL,
  storage_path TEXT NOT NULL,
  storage_bucket TEXT DEFAULT 'vault-documents',
  file_size_bytes INTEGER,
  document_date DATE,
  document_expiry_date DATE,
  is_expired BOOLEAN GENERATED ALWAYS AS (
    document_expiry_date IS NOT NULL AND document_expiry_date < CURRENT_DATE
  ) STORED,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vault_items_user_id ON public.document_vault_items(user_id);
CREATE INDEX idx_vault_items_type ON public.document_vault_items(user_id, document_type);
CREATE INDEX idx_vault_items_expiry ON public.document_vault_items(document_expiry_date)
  WHERE document_expiry_date IS NOT NULL;

ALTER TABLE public.document_vault_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vault_select_own"
  ON public.document_vault_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "vault_insert_own"
  ON public.document_vault_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vault_update_own"
  ON public.document_vault_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vault_delete_own"
  ON public.document_vault_items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE 5: benefit_programs
-- Reference table: federal/state benefit programs (bilingual)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.benefit_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_code TEXT UNIQUE NOT NULL,
  program_name TEXT NOT NULL,
  program_name_es TEXT NOT NULL,
  short_description TEXT NOT NULL,
  short_description_es TEXT NOT NULL,
  description TEXT NOT NULL,
  description_es TEXT NOT NULL,
  agency TEXT NOT NULL,
  agency_url TEXT,
  agency_phone TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'food', 'healthcare', 'housing', 'cash', 'tax_credit',
    'childcare', 'education', 'disability', 'communication',
    'energy', 'immigration', 'other'
  )),
  eligibility_rules JSONB NOT NULL DEFAULT '{}',
  income_limit_fpl_percent INTEGER,
  estimated_annual_value_min INTEGER,
  estimated_annual_value_max INTEGER,
  application_url TEXT,
  application_url_es TEXT,
  required_documents TEXT[] DEFAULT '{}',
  application_steps JSONB NOT NULL DEFAULT '[]',
  application_steps_es JSONB NOT NULL DEFAULT '[]',
  estimated_application_minutes INTEGER DEFAULT 30,
  renewal_period_months INTEGER,
  processing_time_days_min INTEGER,
  processing_time_days_max INTEGER,
  is_federal BOOLEAN DEFAULT true,
  state_codes CHAR(2)[] DEFAULT NULL,
  requires_interview BOOLEAN DEFAULT false,
  allows_online_application BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  priority_score INTEGER DEFAULT 50 CHECK (priority_score BETWEEN 1 AND 100),
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_benefit_programs_code ON public.benefit_programs(program_code);
CREATE INDEX idx_benefit_programs_category ON public.benefit_programs(category);
CREATE INDEX idx_benefit_programs_active ON public.benefit_programs(is_active) WHERE is_active = true;
CREATE INDEX idx_benefit_programs_federal ON public.benefit_programs(is_federal);
CREATE INDEX idx_benefit_programs_state ON public.benefit_programs USING GIN(state_codes);

ALTER TABLE public.benefit_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "programs_select_authenticated"
  ON public.benefit_programs FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- TABLE 6: eligibility_results
-- Computed eligibility per user-program pair
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.eligibility_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.benefit_programs(id) ON DELETE CASCADE,
  is_eligible BOOLEAN NOT NULL,
  eligibility_status TEXT NOT NULL DEFAULT 'unknown' CHECK (eligibility_status IN (
    'likely_eligible', 'may_be_eligible', 'not_eligible', 'unknown', 'needs_more_info'
  )),
  confidence FLOAT NOT NULL CHECK (confidence BETWEEN 0.0 AND 1.0),
  estimated_annual_value INTEGER,
  estimated_monthly_value INTEGER,
  missing_documents TEXT[] DEFAULT '{}',
  missing_information TEXT[] DEFAULT '{}',
  disqualifying_factors TEXT[] DEFAULT '{}',
  qualifying_factors TEXT[] DEFAULT '{}',
  income_ratio_to_limit FLOAT,
  calculation_inputs JSONB DEFAULT '{}',
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  UNIQUE(user_id, program_id)
);

CREATE INDEX idx_eligibility_user_id ON public.eligibility_results(user_id);
CREATE INDEX idx_eligibility_user_eligible ON public.eligibility_results(user_id)
  WHERE is_eligible = true;
CREATE INDEX idx_eligibility_expires ON public.eligibility_results(expires_at);

ALTER TABLE public.eligibility_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eligibility_select_own"
  ON public.eligibility_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "eligibility_insert_own"
  ON public.eligibility_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "eligibility_update_own"
  ON public.eligibility_results FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "eligibility_delete_own"
  ON public.eligibility_results FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE 7: saved_benefits
-- Bookmarked programs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.saved_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.benefit_programs(id) ON DELETE CASCADE,
  notes TEXT,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, program_id)
);

CREATE INDEX idx_saved_benefits_user_id ON public.saved_benefits(user_id);

ALTER TABLE public.saved_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_benefits_select_own"
  ON public.saved_benefits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "saved_benefits_insert_own"
  ON public.saved_benefits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_benefits_delete_own"
  ON public.saved_benefits FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE 8: applications
-- Benefit application lifecycle tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.benefit_programs(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'in_progress', 'submitted', 'pending',
    'approved', 'denied', 'appealing', 'expired', 'withdrawn'
  )),
  encrypted_form_data BYTEA,
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER NOT NULL,
  completed_steps INTEGER[] DEFAULT '{}',
  documents_attached UUID[] DEFAULT '{}',
  submitted_at TIMESTAMPTZ,
  agency_confirmation_number TEXT,
  agency_case_number TEXT,
  next_action TEXT,
  next_action_es TEXT,
  next_deadline TIMESTAMPTZ,
  approval_date TIMESTAMPTZ,
  approval_amount_annual INTEGER,
  denial_date TIMESTAMPTZ,
  denial_reason TEXT,
  denial_reason_es TEXT,
  appeal_deadline TIMESTAMPTZ,
  renewal_date TIMESTAMPTZ,
  notes TEXT,
  is_renewal BOOLEAN DEFAULT false,
  parent_application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_applications_user_id ON public.applications(user_id);
CREATE INDEX idx_applications_user_status ON public.applications(user_id, status);
CREATE INDEX idx_applications_program ON public.applications(program_id);
CREATE INDEX idx_applications_deadline ON public.applications(next_deadline)
  WHERE next_deadline IS NOT NULL;
CREATE INDEX idx_applications_renewal ON public.applications(renewal_date)
  WHERE renewal_date IS NOT NULL;
CREATE INDEX idx_applications_status ON public.applications(status)
  WHERE status IN ('draft', 'in_progress', 'submitted', 'pending');

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "applications_select_own"
  ON public.applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "applications_insert_own"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "applications_update_own"
  ON public.applications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "applications_delete_own"
  ON public.applications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE 9: application_form_data
-- Per-step form field values with encryption for PII
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.application_form_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  field_key TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_label_es TEXT,
  field_type TEXT NOT NULL CHECK (field_type IN (
    'text', 'number', 'date', 'select', 'multiselect',
    'boolean', 'ssn', 'phone', 'email', 'address', 'currency'
  )),
  encrypted_value BYTEA,
  plaintext_value TEXT,
  is_pii BOOLEAN DEFAULT false,
  is_auto_filled BOOLEAN DEFAULT false,
  auto_fill_source TEXT CHECK (auto_fill_source IN (
    'document_scan', 'profile', 'household', 'previous_application'
  )),
  auto_fill_confidence FLOAT,
  is_confirmed_by_user BOOLEAN DEFAULT false,
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN (
    'pending', 'valid', 'invalid', 'warning'
  )),
  validation_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(application_id, step_number, field_key)
);

CREATE INDEX idx_app_form_data_application ON public.application_form_data(application_id);
CREATE INDEX idx_app_form_data_user ON public.application_form_data(user_id);
CREATE INDEX idx_app_form_data_step ON public.application_form_data(application_id, step_number);

ALTER TABLE public.application_form_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "form_data_select_own"
  ON public.application_form_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "form_data_insert_own"
  ON public.application_form_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "form_data_update_own"
  ON public.application_form_data FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "form_data_delete_own"
  ON public.application_form_data FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE 10: form_field_mappings
-- Reference: maps document fields to program form fields (bilingual)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.form_field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.benefit_programs(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  field_key TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_label_es TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN (
    'text', 'number', 'date', 'select', 'multiselect',
    'boolean', 'ssn', 'phone', 'email', 'address', 'currency'
  )),
  is_required BOOLEAN DEFAULT false,
  is_pii BOOLEAN DEFAULT false,
  source_document_type TEXT CHECK (source_document_type IN (
    'drivers_license', 'state_id', 'passport', 'ssn_card', 'w2',
    'tax_return', 'pay_stub', 'birth_certificate', 'immigration_doc',
    'utility_bill', 'bank_statement', 'profile', 'household'
  )),
  source_field_path TEXT,
  help_text TEXT,
  help_text_es TEXT,
  placeholder TEXT,
  placeholder_es TEXT,
  select_options JSONB,
  select_options_es JSONB,
  validation_regex TEXT,
  validation_message TEXT,
  validation_message_es TEXT,
  display_order INTEGER DEFAULT 0,
  conditional_on JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, step_number, field_key)
);

CREATE INDEX idx_form_field_mappings_program ON public.form_field_mappings(program_id);
CREATE INDEX idx_form_field_mappings_step ON public.form_field_mappings(program_id, step_number);

ALTER TABLE public.form_field_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "field_mappings_select_authenticated"
  ON public.form_field_mappings FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- TABLE 11: ai_guidance_sessions
-- AI form guidance conversations (90-day retention)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_guidance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  program_id UUID REFERENCES public.benefit_programs(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL CHECK (session_type IN (
    'form_guidance', 'eligibility_qa', 'general_help', 'appeal_guidance'
  )),
  current_step INTEGER,
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'es')),
  messages JSONB NOT NULL DEFAULT '[]',
  message_count INTEGER DEFAULT 0,
  total_input_tokens INTEGER DEFAULT 0,
  total_output_tokens INTEGER DEFAULT 0,
  estimated_cost_cents INTEGER DEFAULT 0,
  model_used TEXT DEFAULT 'gpt-4o',
  is_active BOOLEAN DEFAULT true,
  is_anonymized BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  anonymized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_sessions_user_id ON public.ai_guidance_sessions(user_id);
CREATE INDEX idx_ai_sessions_application ON public.ai_guidance_sessions(application_id);
CREATE INDEX idx_ai_sessions_active ON public.ai_guidance_sessions(user_id)
  WHERE is_active = true;
CREATE INDEX idx_ai_sessions_anonymize ON public.ai_guidance_sessions(created_at)
  WHERE is_anonymized = false;

ALTER TABLE public.ai_guidance_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_sessions_select_own"
  ON public.ai_guidance_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ai_sessions_insert_own"
  ON public.ai_guidance_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_sessions_update_own"
  ON public.ai_guidance_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TABLE 12: notification_schedule
-- Push/SMS notifications with bilingual message templates
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notification_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.benefit_programs(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'deadline_reminder', 'renewal_alert', 'missing_document',
    'status_check', 'approval', 'denial', 'appeal_deadline',
    'document_expiry', 'eligibility_update', 'welcome', 'general'
  )),
  scheduled_for TIMESTAMPTZ NOT NULL,
  channel TEXT DEFAULT 'push' CHECK (channel IN ('push', 'sms', 'both')),
  message_en TEXT NOT NULL,
  message_es TEXT NOT NULL,
  title_en TEXT,
  title_es TEXT,
  deep_link TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_sent BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notification_schedule(user_id);
CREATE INDEX idx_notifications_pending ON public.notification_schedule(scheduled_for)
  WHERE is_sent = false;
CREATE INDEX idx_notifications_user_unread ON public.notification_schedule(user_id)
  WHERE is_sent = true AND is_read = false;
CREATE INDEX idx_notifications_application ON public.notification_schedule(application_id);

ALTER TABLE public.notification_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON public.notification_schedule FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own"
  ON public.notification_schedule FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TABLE 13: referral_agencies
-- Reference: government agencies and community organizations (bilingual)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.referral_agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_name TEXT NOT NULL,
  agency_name_es TEXT NOT NULL,
  agency_type TEXT NOT NULL CHECK (agency_type IN (
    'federal', 'state', 'county', 'city', 'nonprofit',
    'legal_aid', 'community_health', 'library', 'other'
  )),
  description TEXT,
  description_es TEXT,
  programs_served TEXT[] DEFAULT '{}',
  phone TEXT,
  email TEXT,
  website TEXT,
  address_street TEXT,
  address_city TEXT,
  address_state CHAR(2),
  address_zip TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  hours_of_operation JSONB,
  languages_spoken TEXT[] DEFAULT ARRAY['en'],
  accepts_walk_ins BOOLEAN DEFAULT false,
  appointment_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referral_agencies_state ON public.referral_agencies(address_state);
CREATE INDEX idx_referral_agencies_type ON public.referral_agencies(agency_type);
CREATE INDEX idx_referral_agencies_programs ON public.referral_agencies USING GIN(programs_served);
CREATE INDEX idx_referral_agencies_active ON public.referral_agencies(is_active)
  WHERE is_active = true;

ALTER TABLE public.referral_agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agencies_select_authenticated"
  ON public.referral_agencies FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- TABLE 14: user_activity_log
-- Audit trail (no PII, references by ID only)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'login', 'logout', 'onboarding_started', 'onboarding_completed',
    'document_scanned', 'document_verified', 'document_vault_saved',
    'eligibility_checked', 'application_started', 'application_step_completed',
    'application_submitted', 'application_status_updated',
    'subscription_upgraded', 'subscription_downgraded', 'subscription_cancelled',
    'profile_updated', 'household_member_added', 'household_member_removed',
    'notification_sent', 'notification_read', 'ai_guidance_started',
    'data_exported', 'data_deleted', 'language_changed',
    'benefit_saved', 'benefit_unsaved'
  )),
  resource_type TEXT CHECK (resource_type IN (
    'profile', 'document', 'application', 'eligibility',
    'notification', 'ai_session', 'subscription', 'household_member',
    'benefit'
  )),
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX idx_activity_log_action ON public.user_activity_log(action);
CREATE INDEX idx_activity_log_created ON public.user_activity_log(created_at DESC);
CREATE INDEX idx_activity_log_user_recent ON public.user_activity_log(user_id, created_at DESC);

ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_log_select_own"
  ON public.user_activity_log FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS: updated_at
-- ============================================================================
CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_household_members_updated
  BEFORE UPDATE ON public.household_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_scanned_documents_updated
  BEFORE UPDATE ON public.scanned_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_document_vault_items_updated
  BEFORE UPDATE ON public.document_vault_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_applications_updated
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_application_form_data_updated
  BEFORE UPDATE ON public.application_form_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_benefit_programs_updated
  BEFORE UPDATE ON public.benefit_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_form_field_mappings_updated
  BEFORE UPDATE ON public.form_field_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_referral_agencies_updated
  BEFORE UPDATE ON public.referral_agencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- TRIGGER: handle_new_user (auto-create profile on auth signup)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- TRIGGER: invalidate eligibility when profile eligibility fields change
-- ============================================================================
CREATE OR REPLACE FUNCTION public.invalidate_eligibility_on_profile_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    OLD.household_size IS DISTINCT FROM NEW.household_size OR
    OLD.household_income_bracket IS DISTINCT FROM NEW.household_income_bracket OR
    OLD.annual_income_cents IS DISTINCT FROM NEW.annual_income_cents OR
    OLD.employment_status IS DISTINCT FROM NEW.employment_status OR
    OLD.citizenship_status IS DISTINCT FROM NEW.citizenship_status OR
    OLD.state_code IS DISTINCT FROM NEW.state_code OR
    OLD.has_children_under_18 IS DISTINCT FROM NEW.has_children_under_18 OR
    OLD.number_of_dependents IS DISTINCT FROM NEW.number_of_dependents
  ) THEN
    UPDATE public.eligibility_results
    SET expires_at = NOW()
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_invalidate_eligibility
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.invalidate_eligibility_on_profile_change();

-- ============================================================================
-- TRIGGER: auto-schedule renewal notifications on application approval
-- ============================================================================
CREATE OR REPLACE FUNCTION public.schedule_renewal_notifications()
RETURNS TRIGGER AS $$
DECLARE
  v_program public.benefit_programs;
  v_renewal_date TIMESTAMPTZ;
BEGIN
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
    SELECT * INTO v_program FROM public.benefit_programs WHERE id = NEW.program_id;

    IF v_program.renewal_period_months IS NOT NULL THEN
      v_renewal_date := NOW() + (v_program.renewal_period_months || ' months')::INTERVAL;

      UPDATE public.applications
      SET renewal_date = v_renewal_date
      WHERE id = NEW.id;

      -- 90-day reminder
      INSERT INTO public.notification_schedule
        (user_id, application_id, program_id, notification_type, scheduled_for,
         channel, message_en, message_es, title_en, title_es, priority, deep_link)
      VALUES
        (NEW.user_id, NEW.id, NEW.program_id, 'renewal_alert',
         v_renewal_date - INTERVAL '90 days', 'push',
         'Your ' || v_program.program_name || ' benefits renew in 90 days. Start your renewal early.',
         'Sus beneficios de ' || v_program.program_name_es || ' se renuevan en 90 dias. Comience su renovacion.',
         v_program.program_name || ' Renewal Coming Up',
         'Renovacion de ' || v_program.program_name_es || ' Proxima',
         'normal', '/applications/' || NEW.id);

      -- 60-day reminder
      INSERT INTO public.notification_schedule
        (user_id, application_id, program_id, notification_type, scheduled_for,
         channel, message_en, message_es, title_en, title_es, priority, deep_link)
      VALUES
        (NEW.user_id, NEW.id, NEW.program_id, 'renewal_alert',
         v_renewal_date - INTERVAL '60 days', 'both',
         'Your ' || v_program.program_name || ' benefits renew in 60 days. Do not lose your coverage.',
         'Sus beneficios de ' || v_program.program_name_es || ' se renuevan en 60 dias. No pierda su cobertura.',
         v_program.program_name || ' Renewal in 60 Days',
         'Renovacion de ' || v_program.program_name_es || ' en 60 Dias',
         'high', '/applications/' || NEW.id);

      -- 30-day reminder
      INSERT INTO public.notification_schedule
        (user_id, application_id, program_id, notification_type, scheduled_for,
         channel, message_en, message_es, title_en, title_es, priority, deep_link)
      VALUES
        (NEW.user_id, NEW.id, NEW.program_id, 'renewal_alert',
         v_renewal_date - INTERVAL '30 days', 'both',
         'URGENT: Your ' || v_program.program_name || ' benefits renew in 30 days. Renew now to avoid a gap.',
         'URGENTE: Sus beneficios de ' || v_program.program_name_es || ' se renuevan en 30 dias. Renueve ahora.',
         'Urgent: ' || v_program.program_name || ' Renewal in 30 Days',
         'Urgente: Renovacion de ' || v_program.program_name_es || ' en 30 Dias',
         'urgent', '/applications/' || NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_schedule_renewal
  AFTER UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.schedule_renewal_notifications();
