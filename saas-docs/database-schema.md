# GovPass Database Schema

**Complete PostgreSQL schema with encryption, RLS policies, indexes, triggers, seed data, and TypeScript interfaces.**

---

## Schema Philosophy

Every table in GovPass is designed around three constraints: (1) PII fields are always stored as encrypted BYTEA using pgcrypto, never as plaintext; (2) Row Level Security enforces that users can only access their own data via `auth.uid()`; (3) bilingual content columns exist for all user-facing text. The schema supports the full lifecycle from document scanning through eligibility calculation, application submission, and deadline tracking.

---

## Extensions

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

---

## Table 1: profiles

Stores user account data. All personally identifiable fields are AES-256 encrypted via pgcrypto. Non-sensitive fields used for eligibility calculation remain plaintext for query performance.

```sql
CREATE TABLE profiles (
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

CREATE INDEX idx_profiles_state_code ON profiles(state_code);
CREATE INDEX idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX idx_profiles_revenucat_id ON profiles(revenucat_id);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);
```

---

## Table 2: household_members

Stores additional household members for family-tier eligibility calculations. Encrypted PII for each member.

```sql
CREATE TABLE household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

CREATE INDEX idx_household_members_user_id ON household_members(user_id);
```

---

## Table 3: scanned_documents

Metadata for documents scanned via the camera pipeline. Images live in Supabase encrypted storage; this table stores extracted data and references. Non-vault scans auto-expire after 24 hours.

```sql
CREATE TABLE scanned_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

CREATE INDEX idx_scanned_documents_user_id ON scanned_documents(user_id);
CREATE INDEX idx_scanned_documents_type ON scanned_documents(user_id, document_type);
CREATE INDEX idx_scanned_documents_expires ON scanned_documents(expires_at)
  WHERE is_in_vault = false;
CREATE INDEX idx_scanned_documents_vault ON scanned_documents(user_id)
  WHERE is_in_vault = true;
```

---

## Table 4: document_vault_items

Permanent encrypted document storage for Plus and Family subscribers. Separates vault metadata from scan records to support independent lifecycle management.

```sql
CREATE TABLE document_vault_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scanned_document_id UUID REFERENCES scanned_documents(id) ON DELETE SET NULL,
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

CREATE INDEX idx_vault_items_user_id ON document_vault_items(user_id);
CREATE INDEX idx_vault_items_type ON document_vault_items(user_id, document_type);
CREATE INDEX idx_vault_items_expiry ON document_vault_items(document_expiry_date)
  WHERE document_expiry_date IS NOT NULL;
```

---

## Table 5: benefit_programs

Reference table for all federal and state benefit programs. Not user-specific so no RLS user filter; authenticated users get read access. Bilingual names and descriptions.

```sql
CREATE TABLE benefit_programs (
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

CREATE INDEX idx_benefit_programs_code ON benefit_programs(program_code);
CREATE INDEX idx_benefit_programs_category ON benefit_programs(category);
CREATE INDEX idx_benefit_programs_active ON benefit_programs(is_active) WHERE is_active = true;
CREATE INDEX idx_benefit_programs_federal ON benefit_programs(is_federal);
CREATE INDEX idx_benefit_programs_state ON benefit_programs USING GIN(state_codes);
```

---

## Table 6: eligibility_results

Stores computed eligibility for each user-program pair. Recalculated when user data changes or on a monthly schedule.

```sql
CREATE TABLE eligibility_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES benefit_programs(id) ON DELETE CASCADE,
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

CREATE INDEX idx_eligibility_user_id ON eligibility_results(user_id);
CREATE INDEX idx_eligibility_user_eligible ON eligibility_results(user_id)
  WHERE is_eligible = true;
CREATE INDEX idx_eligibility_expires ON eligibility_results(expires_at);
```

---

## Table 7: saved_benefits

Programs bookmarked by the user for later application. Lightweight junction table.

```sql
CREATE TABLE saved_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES benefit_programs(id) ON DELETE CASCADE,
  notes TEXT,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, program_id)
);

CREATE INDEX idx_saved_benefits_user_id ON saved_benefits(user_id);
```

---

## Table 8: applications

Tracks each benefit application through its full lifecycle from draft to approved or denied. Encrypted form data protects PII at rest.

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES benefit_programs(id) ON DELETE RESTRICT,
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
  parent_application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_user_status ON applications(user_id, status);
CREATE INDEX idx_applications_program ON applications(program_id);
CREATE INDEX idx_applications_deadline ON applications(next_deadline)
  WHERE next_deadline IS NOT NULL;
CREATE INDEX idx_applications_renewal ON applications(renewal_date)
  WHERE renewal_date IS NOT NULL;
CREATE INDEX idx_applications_status ON applications(status)
  WHERE status IN ('draft', 'in_progress', 'submitted', 'pending');
```

---

## Table 9: application_form_data

Stores individual form field values per application step. Encrypted values for PII fields, plaintext for non-sensitive selections. Enables step-by-step save and resume.

```sql
CREATE TABLE application_form_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
    'document_scan', 'profile', 'household', 'previous_application', NULL
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

CREATE INDEX idx_app_form_data_application ON application_form_data(application_id);
CREATE INDEX idx_app_form_data_user ON application_form_data(user_id);
CREATE INDEX idx_app_form_data_step ON application_form_data(application_id, step_number);
```

---

## Table 10: form_field_mappings

Maps extracted document fields to program-specific application form fields. Enables the auto-fill pipeline. Reference data, not user-specific.

```sql
CREATE TABLE form_field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES benefit_programs(id) ON DELETE CASCADE,
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
    'utility_bill', 'bank_statement', 'profile', 'household', NULL
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

CREATE INDEX idx_form_field_mappings_program ON form_field_mappings(program_id);
CREATE INDEX idx_form_field_mappings_step ON form_field_mappings(program_id, step_number);
```

---

## Table 11: ai_guidance_sessions

Stores AI form guidance conversations. Messages are retained for 90 days for support purposes, then anonymized.

```sql
CREATE TABLE ai_guidance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  program_id UUID REFERENCES benefit_programs(id) ON DELETE SET NULL,
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

CREATE INDEX idx_ai_sessions_user_id ON ai_guidance_sessions(user_id);
CREATE INDEX idx_ai_sessions_application ON ai_guidance_sessions(application_id);
CREATE INDEX idx_ai_sessions_active ON ai_guidance_sessions(user_id)
  WHERE is_active = true;
CREATE INDEX idx_ai_sessions_anonymize ON ai_guidance_sessions(created_at)
  WHERE is_anonymized = false;
```

---

## Table 12: notification_schedule

Manages push and SMS notifications for deadlines, renewals, missing documents, and status updates. Bilingual message templates.

```sql
CREATE TABLE notification_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  program_id UUID REFERENCES benefit_programs(id) ON DELETE SET NULL,
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

CREATE INDEX idx_notifications_user_id ON notification_schedule(user_id);
CREATE INDEX idx_notifications_pending ON notification_schedule(scheduled_for)
  WHERE is_sent = false;
CREATE INDEX idx_notifications_user_unread ON notification_schedule(user_id)
  WHERE is_sent = true AND is_read = false;
CREATE INDEX idx_notifications_application ON notification_schedule(application_id);
```

---

## Table 13: referral_agencies

Directory of government agencies and community organizations users can contact for in-person help. Reference data.

```sql
CREATE TABLE referral_agencies (
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

CREATE INDEX idx_referral_agencies_state ON referral_agencies(address_state);
CREATE INDEX idx_referral_agencies_type ON referral_agencies(agency_type);
CREATE INDEX idx_referral_agencies_programs ON referral_agencies USING GIN(programs_served);
CREATE INDEX idx_referral_agencies_active ON referral_agencies(is_active)
  WHERE is_active = true;
```

---

## Table 14: user_activity_log

Audit trail for significant user actions. No PII in this table; references are by ID only. Used for analytics, support, and security monitoring.

```sql
CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
    'benefit', NULL
  )),
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX idx_activity_log_action ON user_activity_log(action);
CREATE INDEX idx_activity_log_created ON user_activity_log(created_at DESC);
CREATE INDEX idx_activity_log_user_recent ON user_activity_log(user_id, created_at DESC);
```

---

## Row Level Security Policies

### Enable RLS on All User Tables

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanned_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_form_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_guidance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Reference tables: read-only for authenticated users, writable by service role only
ALTER TABLE benefit_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_agencies ENABLE ROW LEVEL SECURITY;
```

### User-Owned Data Policies

Each user can only SELECT, INSERT, UPDATE, and DELETE their own rows. The pattern uses `auth.uid() = user_id` (or `auth.uid() = id` for profiles).

```sql
-- profiles: user owns their own row
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- household_members
CREATE POLICY "household_select_own"
  ON household_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "household_insert_own"
  ON household_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "household_update_own"
  ON household_members FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "household_delete_own"
  ON household_members FOR DELETE
  USING (auth.uid() = user_id);

-- scanned_documents
CREATE POLICY "documents_select_own"
  ON scanned_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "documents_insert_own"
  ON scanned_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "documents_update_own"
  ON scanned_documents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "documents_delete_own"
  ON scanned_documents FOR DELETE
  USING (auth.uid() = user_id);

-- document_vault_items
CREATE POLICY "vault_select_own"
  ON document_vault_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "vault_insert_own"
  ON document_vault_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vault_update_own"
  ON document_vault_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vault_delete_own"
  ON document_vault_items FOR DELETE
  USING (auth.uid() = user_id);

-- eligibility_results
CREATE POLICY "eligibility_select_own"
  ON eligibility_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "eligibility_insert_own"
  ON eligibility_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "eligibility_update_own"
  ON eligibility_results FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "eligibility_delete_own"
  ON eligibility_results FOR DELETE
  USING (auth.uid() = user_id);

-- saved_benefits
CREATE POLICY "saved_benefits_select_own"
  ON saved_benefits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "saved_benefits_insert_own"
  ON saved_benefits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_benefits_delete_own"
  ON saved_benefits FOR DELETE
  USING (auth.uid() = user_id);

-- applications
CREATE POLICY "applications_select_own"
  ON applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "applications_insert_own"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "applications_update_own"
  ON applications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "applications_delete_own"
  ON applications FOR DELETE
  USING (auth.uid() = user_id);

-- application_form_data
CREATE POLICY "form_data_select_own"
  ON application_form_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "form_data_insert_own"
  ON application_form_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "form_data_update_own"
  ON application_form_data FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "form_data_delete_own"
  ON application_form_data FOR DELETE
  USING (auth.uid() = user_id);

-- ai_guidance_sessions
CREATE POLICY "ai_sessions_select_own"
  ON ai_guidance_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ai_sessions_insert_own"
  ON ai_guidance_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_sessions_update_own"
  ON ai_guidance_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- notification_schedule
CREATE POLICY "notifications_select_own"
  ON notification_schedule FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own"
  ON notification_schedule FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- user_activity_log (read-only for users; inserts via service role)
CREATE POLICY "activity_log_select_own"
  ON user_activity_log FOR SELECT
  USING (auth.uid() = user_id);
```

### Reference Table Policies

Benefit programs, form mappings, and referral agencies are readable by all authenticated users. Only the service role can write.

```sql
-- benefit_programs: any authenticated user can read
CREATE POLICY "programs_select_authenticated"
  ON benefit_programs FOR SELECT
  TO authenticated
  USING (true);

-- form_field_mappings: any authenticated user can read
CREATE POLICY "field_mappings_select_authenticated"
  ON form_field_mappings FOR SELECT
  TO authenticated
  USING (true);

-- referral_agencies: any authenticated user can read
CREATE POLICY "agencies_select_authenticated"
  ON referral_agencies FOR SELECT
  TO authenticated
  USING (true);
```

---

## Triggers

### Auto-Update updated_at Timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_household_members_updated
  BEFORE UPDATE ON household_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_scanned_documents_updated
  BEFORE UPDATE ON scanned_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_document_vault_items_updated
  BEFORE UPDATE ON document_vault_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_applications_updated
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_application_form_data_updated
  BEFORE UPDATE ON application_form_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_benefit_programs_updated
  BEFORE UPDATE ON benefit_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_form_field_mappings_updated
  BEFORE UPDATE ON form_field_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_referral_agencies_updated
  BEFORE UPDATE ON referral_agencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Profile Creation on Auth Signup

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Invalidate Eligibility on Profile Change

```sql
CREATE OR REPLACE FUNCTION invalidate_eligibility_on_profile_change()
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
    UPDATE eligibility_results
    SET expires_at = NOW()
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_invalidate_eligibility
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION invalidate_eligibility_on_profile_change();
```

### Auto-Schedule Renewal Notifications on Application Approval

```sql
CREATE OR REPLACE FUNCTION schedule_renewal_notifications()
RETURNS TRIGGER AS $$
DECLARE
  v_program benefit_programs;
  v_renewal_date TIMESTAMPTZ;
BEGIN
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
    SELECT * INTO v_program FROM benefit_programs WHERE id = NEW.program_id;

    IF v_program.renewal_period_months IS NOT NULL THEN
      v_renewal_date := NOW() + (v_program.renewal_period_months || ' months')::INTERVAL;

      UPDATE applications
      SET renewal_date = v_renewal_date
      WHERE id = NEW.id;

      -- 90-day reminder
      INSERT INTO notification_schedule
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
      INSERT INTO notification_schedule
        (user_id, application_id, program_id, notification_type, scheduled_for,
         channel, message_en, message_es, title_en, title_es, priority, deep_link)
      VALUES
        (NEW.user_id, NEW.id, NEW.program_id, 'renewal_alert',
         v_renewal_date - INTERVAL '60 days', 'both',
         'Your ' || v_program.program_name || ' benefits renew in 60 days. Don''t lose your coverage.',
         'Sus beneficios de ' || v_program.program_name_es || ' se renuevan en 60 dias. No pierda su cobertura.',
         v_program.program_name || ' Renewal in 60 Days',
         'Renovacion de ' || v_program.program_name_es || ' en 60 Dias',
         'high', '/applications/' || NEW.id);

      -- 30-day reminder
      INSERT INTO notification_schedule
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
  AFTER UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION schedule_renewal_notifications();
```

---

## Scheduled Jobs (pg_cron)

```sql
-- Delete expired non-vault scans every hour
SELECT cron.schedule(
  'delete-expired-scans',
  '0 * * * *',
  $$DELETE FROM scanned_documents
    WHERE expires_at < NOW()
    AND is_in_vault = false$$
);

-- Anonymize AI guidance sessions older than 90 days (daily at 2 AM UTC)
SELECT cron.schedule(
  'anonymize-ai-sessions',
  '0 2 * * *',
  $$UPDATE ai_guidance_sessions
    SET messages = '[]'::JSONB,
        is_anonymized = true,
        anonymized_at = NOW()
    WHERE is_anonymized = false
    AND created_at < NOW() - INTERVAL '90 days'$$
);

-- Purge old activity logs beyond 1 year (daily at 3 AM UTC)
SELECT cron.schedule(
  'purge-old-activity-logs',
  '0 3 * * *',
  $$DELETE FROM user_activity_log
    WHERE created_at < NOW() - INTERVAL '365 days'$$
);

-- Mark expired eligibility results for recalculation (daily at 4 AM UTC)
SELECT cron.schedule(
  'flag-expired-eligibility',
  '0 4 * * *',
  $$DELETE FROM eligibility_results
    WHERE expires_at < NOW()$$
);

-- Send pending notifications (every minute)
-- Note: actual sending is done by an Edge Function; this flags overdue ones
SELECT cron.schedule(
  'flag-overdue-notifications',
  '* * * * *',
  $$UPDATE notification_schedule
    SET retry_count = retry_count + 1
    WHERE is_sent = false
    AND scheduled_for < NOW()
    AND retry_count < max_retries$$
);
```

---

## Database Functions

### Encrypted Profile Upsert

```sql
CREATE OR REPLACE FUNCTION upsert_encrypted_profile(
  p_user_id UUID,
  p_full_name TEXT,
  p_ssn TEXT,
  p_dob TEXT,
  p_address TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_encryption_key TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO profiles (
    id, encrypted_full_name, encrypted_ssn, encrypted_dob,
    encrypted_address, encrypted_phone, encrypted_email
  ) VALUES (
    p_user_id,
    pgp_sym_encrypt(p_full_name, p_encryption_key),
    pgp_sym_encrypt(p_ssn, p_encryption_key),
    pgp_sym_encrypt(p_dob, p_encryption_key),
    pgp_sym_encrypt(p_address, p_encryption_key),
    pgp_sym_encrypt(p_phone, p_encryption_key),
    pgp_sym_encrypt(p_email, p_encryption_key)
  )
  ON CONFLICT (id) DO UPDATE SET
    encrypted_full_name = pgp_sym_encrypt(p_full_name, p_encryption_key),
    encrypted_ssn = pgp_sym_encrypt(p_ssn, p_encryption_key),
    encrypted_dob = pgp_sym_encrypt(p_dob, p_encryption_key),
    encrypted_address = pgp_sym_encrypt(p_address, p_encryption_key),
    encrypted_phone = pgp_sym_encrypt(p_phone, p_encryption_key),
    encrypted_email = pgp_sym_encrypt(p_email, p_encryption_key),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Decrypt Profile Fields

```sql
CREATE OR REPLACE FUNCTION decrypt_profile(
  p_user_id UUID,
  p_encryption_key TEXT
) RETURNS TABLE (
  full_name TEXT,
  ssn TEXT,
  dob TEXT,
  address TEXT,
  phone TEXT,
  email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pgp_sym_decrypt(encrypted_full_name, p_encryption_key)::TEXT,
    pgp_sym_decrypt(encrypted_ssn, p_encryption_key)::TEXT,
    pgp_sym_decrypt(encrypted_dob, p_encryption_key)::TEXT,
    pgp_sym_decrypt(encrypted_address, p_encryption_key)::TEXT,
    pgp_sym_decrypt(encrypted_phone, p_encryption_key)::TEXT,
    pgp_sym_decrypt(encrypted_email, p_encryption_key)::TEXT
  FROM profiles
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Get User Eligibility Summary

```sql
CREATE OR REPLACE FUNCTION get_eligibility_summary(p_user_id UUID)
RETURNS TABLE (
  total_eligible_programs INTEGER,
  total_estimated_annual_value INTEGER,
  top_program_name TEXT,
  top_program_value INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_eligible_programs,
    COALESCE(SUM(er.estimated_annual_value), 0)::INTEGER AS total_estimated_annual_value,
    (SELECT bp.program_name FROM benefit_programs bp
     WHERE bp.id = (
       SELECT er2.program_id FROM eligibility_results er2
       WHERE er2.user_id = p_user_id AND er2.is_eligible = true
       ORDER BY er2.estimated_annual_value DESC NULLS LAST LIMIT 1
     )) AS top_program_name,
    (SELECT MAX(er3.estimated_annual_value) FROM eligibility_results er3
     WHERE er3.user_id = p_user_id AND er3.is_eligible = true)::INTEGER AS top_program_value
  FROM eligibility_results er
  WHERE er.user_id = p_user_id AND er.is_eligible = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Delete All User Data (GDPR / Account Deletion)

```sql
CREATE OR REPLACE FUNCTION delete_all_user_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Order matters: delete dependent rows first
  DELETE FROM notification_schedule WHERE user_id = p_user_id;
  DELETE FROM application_form_data WHERE user_id = p_user_id;
  DELETE FROM ai_guidance_sessions WHERE user_id = p_user_id;
  DELETE FROM user_activity_log WHERE user_id = p_user_id;
  DELETE FROM saved_benefits WHERE user_id = p_user_id;
  DELETE FROM applications WHERE user_id = p_user_id;
  DELETE FROM eligibility_results WHERE user_id = p_user_id;
  DELETE FROM document_vault_items WHERE user_id = p_user_id;
  DELETE FROM scanned_documents WHERE user_id = p_user_id;
  DELETE FROM household_members WHERE user_id = p_user_id;
  DELETE FROM profiles WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Seed Data: 25 Federal Benefit Programs

```sql
INSERT INTO benefit_programs (
  program_code, program_name, program_name_es,
  short_description, short_description_es,
  description, description_es,
  agency, agency_url, category,
  eligibility_rules, income_limit_fpl_percent,
  estimated_annual_value_min, estimated_annual_value_max,
  application_url, required_documents, application_steps, application_steps_es,
  estimated_application_minutes, renewal_period_months,
  processing_time_days_min, processing_time_days_max,
  is_federal, requires_interview, allows_online_application, priority_score
) VALUES

-- 1. SNAP
(
  'SNAP',
  'SNAP (Food Stamps)',
  'SNAP (Cupones de Alimentos)',
  'Monthly food assistance for low-income households.',
  'Asistencia alimentaria mensual para hogares de bajos ingresos.',
  'The Supplemental Nutrition Assistance Program provides monthly benefits on an EBT card to purchase groceries. Benefit amounts depend on household size, income, and expenses.',
  'El Programa de Asistencia Nutricional Suplementaria proporciona beneficios mensuales en una tarjeta EBT para comprar alimentos. Los montos dependen del tamano del hogar, ingresos y gastos.',
  'USDA', 'https://www.fns.usda.gov/snap', 'food',
  '{"max_income_fpl_percent": 130, "asset_limit": 2750, "asset_limit_elderly_disabled": 4250, "work_requirement_18_49": true}',
  130, 1800, 7200,
  'https://www.fns.usda.gov/snap/state-directory',
  ARRAY['state_id', 'ssn_card', 'pay_stub', 'utility_bill'],
  '[{"step": 1, "title": "Personal Information", "fields": ["name", "dob", "ssn", "address", "phone"]}, {"step": 2, "title": "Household Members", "fields": ["member_name", "member_dob", "relationship"]}, {"step": 3, "title": "Income", "fields": ["employment_status", "gross_income", "other_income"]}, {"step": 4, "title": "Expenses", "fields": ["rent", "utilities", "childcare", "medical"]}, {"step": 5, "title": "Assets", "fields": ["bank_balance", "vehicles"]}, {"step": 6, "title": "Documents", "fields": ["id_upload", "income_proof", "address_proof"]}, {"step": 7, "title": "Review & Sign", "fields": ["review", "signature", "date"]}]'::JSONB,
  '[{"step": 1, "title": "Informacion Personal"}, {"step": 2, "title": "Miembros del Hogar"}, {"step": 3, "title": "Ingresos"}, {"step": 4, "title": "Gastos"}, {"step": 5, "title": "Bienes"}, {"step": 6, "title": "Documentos"}, {"step": 7, "title": "Revisar y Firmar"}]'::JSONB,
  45, 12, 7, 30,
  true, true, true, 95
),

-- 2. Medicaid
(
  'MEDICAID',
  'Medicaid',
  'Medicaid',
  'Free or low-cost health coverage for low-income individuals and families.',
  'Cobertura de salud gratuita o de bajo costo para personas y familias de bajos ingresos.',
  'Medicaid provides comprehensive health coverage including doctor visits, hospital stays, prescriptions, preventive care, and more. Eligibility and benefits vary by state.',
  'Medicaid proporciona cobertura de salud integral incluyendo visitas medicas, hospitalizaciones, recetas, cuidado preventivo y mas. La elegibilidad y los beneficios varian por estado.',
  'HHS/CMS', 'https://www.medicaid.gov', 'healthcare',
  '{"max_income_fpl_percent": 138, "expansion_states_only": false, "pregnant_women_fpl": 200, "children_fpl": 200}',
  138, 3000, 8000,
  'https://www.healthcare.gov/medicaid-chip/',
  ARRAY['state_id', 'ssn_card', 'pay_stub'],
  '[{"step": 1, "title": "Personal Information"}, {"step": 2, "title": "Household"}, {"step": 3, "title": "Income"}, {"step": 4, "title": "Current Coverage"}, {"step": 5, "title": "Documents"}, {"step": 6, "title": "Review & Submit"}]'::JSONB,
  '[{"step": 1, "title": "Informacion Personal"}, {"step": 2, "title": "Hogar"}, {"step": 3, "title": "Ingresos"}, {"step": 4, "title": "Cobertura Actual"}, {"step": 5, "title": "Documentos"}, {"step": 6, "title": "Revisar y Enviar"}]'::JSONB,
  40, 12, 7, 45,
  true, false, true, 95
),

-- 3. CHIP
(
  'CHIP',
  'CHIP (Children''s Health Insurance)',
  'CHIP (Seguro de Salud Infantil)',
  'Health coverage for uninsured children in families with moderate incomes.',
  'Cobertura de salud para ninos sin seguro en familias con ingresos moderados.',
  'The Children''s Health Insurance Program provides low-cost health coverage to children in families that earn too much to qualify for Medicaid but cannot afford private insurance.',
  'El Programa de Seguro de Salud Infantil proporciona cobertura de salud de bajo costo a ninos en familias que ganan demasiado para calificar para Medicaid pero no pueden pagar seguro privado.',
  'HHS/CMS', 'https://www.medicaid.gov/chip', 'healthcare',
  '{"max_income_fpl_percent": 250, "children_only": true, "max_age": 19}',
  250, 2000, 5000,
  'https://www.healthcare.gov/medicaid-chip/',
  ARRAY['state_id', 'birth_certificate', 'pay_stub'],
  '[{"step": 1, "title": "Parent Information"}, {"step": 2, "title": "Child Information"}, {"step": 3, "title": "Household Income"}, {"step": 4, "title": "Documents"}, {"step": 5, "title": "Review & Submit"}]'::JSONB,
  '[{"step": 1, "title": "Informacion del Padre"}, {"step": 2, "title": "Informacion del Nino"}, {"step": 3, "title": "Ingresos del Hogar"}, {"step": 4, "title": "Documentos"}, {"step": 5, "title": "Revisar y Enviar"}]'::JSONB,
  35, 12, 7, 30,
  true, false, true, 85
),

-- 4. EITC
(
  'EITC',
  'Earned Income Tax Credit (EITC)',
  'Credito Tributario por Ingreso del Trabajo (EITC)',
  'Tax credit for low-to-moderate income workers, especially those with children.',
  'Credito tributario para trabajadores de ingresos bajos a moderados, especialmente con hijos.',
  'The EITC reduces the amount of tax owed and may result in a refund. The credit amount depends on income, filing status, and number of qualifying children.',
  'El EITC reduce la cantidad de impuestos adeudados y puede resultar en un reembolso. El monto del credito depende del ingreso, estado civil y numero de hijos calificados.',
  'IRS', 'https://www.irs.gov/eitc', 'tax_credit',
  '{"must_have_earned_income": true, "max_investment_income": 11000, "max_income_no_children": 17640, "max_income_1_child": 46560, "max_income_2_children": 52918, "max_income_3_plus": 56838}',
  NULL, 600, 7430,
  'https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free',
  ARRAY['w2', 'ssn_card', 'birth_certificate'],
  '[{"step": 1, "title": "Filing Status"}, {"step": 2, "title": "Income Information"}, {"step": 3, "title": "Qualifying Children"}, {"step": 4, "title": "Documents"}, {"step": 5, "title": "Review & Submit"}]'::JSONB,
  '[{"step": 1, "title": "Estado Civil Tributario"}, {"step": 2, "title": "Informacion de Ingresos"}, {"step": 3, "title": "Hijos Calificados"}, {"step": 4, "title": "Documentos"}, {"step": 5, "title": "Revisar y Enviar"}]'::JSONB,
  30, NULL, 14, 42,
  true, false, true, 90
),

-- 5. CTC
(
  'CTC',
  'Child Tax Credit (CTC)',
  'Credito Tributario por Hijos (CTC)',
  'Tax credit of up to $2,000 per qualifying child under 17.',
  'Credito tributario de hasta $2,000 por hijo calificado menor de 17 anos.',
  'The Child Tax Credit provides up to $2,000 per qualifying child under age 17. Up to $1,700 is refundable as the Additional Child Tax Credit.',
  'El Credito Tributario por Hijos proporciona hasta $2,000 por hijo calificado menor de 17 anos. Hasta $1,700 es reembolsable como Credito Tributario Adicional por Hijos.',
  'IRS', 'https://www.irs.gov/credits-deductions/individuals/child-tax-credit', 'tax_credit',
  '{"requires_children_under_17": true, "max_income_single": 200000, "max_income_joint": 400000, "child_must_have_ssn": true}',
  NULL, 2000, 4000,
  'https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free',
  ARRAY['w2', 'ssn_card', 'birth_certificate'],
  '[{"step": 1, "title": "Parent Information"}, {"step": 2, "title": "Child Information"}, {"step": 3, "title": "Income"}, {"step": 4, "title": "Review"}]'::JSONB,
  '[{"step": 1, "title": "Informacion del Padre"}, {"step": 2, "title": "Informacion del Hijo"}, {"step": 3, "title": "Ingresos"}, {"step": 4, "title": "Revisar"}]'::JSONB,
  25, NULL, 14, 42,
  true, false, true, 88
),

-- 6. WIC
(
  'WIC',
  'WIC (Women, Infants, and Children)',
  'WIC (Mujeres, Infantes y Ninos)',
  'Nutrition assistance for pregnant women, new mothers, and young children.',
  'Asistencia nutricional para mujeres embarazadas, madres nuevas y ninos pequenos.',
  'WIC provides supplemental foods, nutrition education, and healthcare referrals for low-income pregnant, breastfeeding, and postpartum women, infants, and children up to age 5.',
  'WIC proporciona alimentos suplementarios, educacion nutricional y referencias de salud para mujeres embarazadas, lactantes y posparto de bajos ingresos, infantes y ninos hasta los 5 anos.',
  'USDA', 'https://www.fns.usda.gov/wic', 'food',
  '{"max_income_fpl_percent": 185, "requires_pregnant_or_child_under_5": true, "nutritional_risk_required": true}',
  185, 500, 1200,
  'https://www.fns.usda.gov/wic/wic-how-apply',
  ARRAY['state_id', 'birth_certificate', 'pay_stub'],
  '[{"step": 1, "title": "Applicant Information"}, {"step": 2, "title": "Pregnancy/Child Info"}, {"step": 3, "title": "Income"}, {"step": 4, "title": "Documents"}, {"step": 5, "title": "Review"}]'::JSONB,
  '[{"step": 1, "title": "Informacion del Solicitante"}, {"step": 2, "title": "Embarazo/Info del Nino"}, {"step": 3, "title": "Ingresos"}, {"step": 4, "title": "Documentos"}, {"step": 5, "title": "Revisar"}]'::JSONB,
  30, 6, 1, 14,
  true, true, true, 80
),

-- 7. SSI
(
  'SSI',
  'Supplemental Security Income (SSI)',
  'Seguridad de Ingreso Suplementario (SSI)',
  'Monthly cash assistance for aged, blind, or disabled individuals with limited income.',
  'Asistencia en efectivo mensual para personas mayores, ciegas o discapacitadas con ingresos limitados.',
  'SSI provides monthly payments to adults and children who have limited income and resources and are aged 65 or older, blind, or disabled.',
  'SSI proporciona pagos mensuales a adultos y ninos con ingresos y recursos limitados que tienen 65 anos o mas, son ciegos o discapacitados.',
  'SSA', 'https://www.ssa.gov/ssi', 'cash',
  '{"age_65_plus_or_disabled_or_blind": true, "max_resources_individual": 2000, "max_resources_couple": 3000, "max_income_individual": 1971}',
  NULL, 6000, 10800,
  'https://www.ssa.gov/benefits/ssi/',
  ARRAY['state_id', 'ssn_card', 'birth_certificate', 'bank_statement'],
  '[{"step": 1, "title": "Personal Information"}, {"step": 2, "title": "Disability/Age"}, {"step": 3, "title": "Income & Resources"}, {"step": 4, "title": "Living Arrangements"}, {"step": 5, "title": "Documents"}, {"step": 6, "title": "Review & Submit"}]'::JSONB,
  '[{"step": 1, "title": "Informacion Personal"}, {"step": 2, "title": "Discapacidad/Edad"}, {"step": 3, "title": "Ingresos y Recursos"}, {"step": 4, "title": "Arreglos de Vivienda"}, {"step": 5, "title": "Documentos"}, {"step": 6, "title": "Revisar y Enviar"}]'::JSONB,
  60, 12, 30, 180,
  true, true, true, 85
),

-- 8. TANF
(
  'TANF',
  'TANF (Temporary Assistance for Needy Families)',
  'TANF (Asistencia Temporal para Familias Necesitadas)',
  'Cash assistance and work support for families with children.',
  'Asistencia en efectivo y apoyo laboral para familias con hijos.',
  'TANF provides temporary financial assistance and work opportunities to low-income families with children. Benefits and rules vary significantly by state.',
  'TANF proporciona asistencia financiera temporal y oportunidades de trabajo a familias de bajos ingresos con hijos. Los beneficios y reglas varian significativamente por estado.',
  'HHS/ACF', 'https://www.acf.hhs.gov/ofa/programs/tanf', 'cash',
  '{"requires_children": true, "work_requirement": true, "time_limit_months": 60, "varies_by_state": true}',
  100, 2400, 6000,
  NULL,
  ARRAY['state_id', 'ssn_card', 'pay_stub', 'birth_certificate'],
  '[{"step": 1, "title": "Personal Info"}, {"step": 2, "title": "Children"}, {"step": 3, "title": "Income"}, {"step": 4, "title": "Employment"}, {"step": 5, "title": "Documents"}, {"step": 6, "title": "Review"}]'::JSONB,
  '[{"step": 1, "title": "Info Personal"}, {"step": 2, "title": "Hijos"}, {"step": 3, "title": "Ingresos"}, {"step": 4, "title": "Empleo"}, {"step": 5, "title": "Documentos"}, {"step": 6, "title": "Revisar"}]'::JSONB,
  45, 6, 7, 30,
  true, true, true, 75
),

-- 9. Section 8
(
  'SECTION8',
  'Section 8 Housing Choice Voucher',
  'Voucher de Eleccion de Vivienda Seccion 8',
  'Rental assistance vouchers for low-income families.',
  'Vales de asistencia de alquiler para familias de bajos ingresos.',
  'The Housing Choice Voucher Program helps very low-income families, the elderly, and the disabled afford decent housing in the private market. Participants choose their own housing.',
  'El Programa de Vales de Eleccion de Vivienda ayuda a familias de muy bajos ingresos, ancianos y discapacitados a pagar vivienda decente en el mercado privado.',
  'HUD', 'https://www.hud.gov/topics/housing_choice_voucher_program_section_8', 'housing',
  '{"max_income_ami_percent": 50, "priority_30_percent_ami": true, "waitlist_common": true}',
  NULL, 6000, 18000,
  NULL,
  ARRAY['state_id', 'ssn_card', 'pay_stub', 'birth_certificate', 'bank_statement'],
  '[{"step": 1, "title": "Applicant Info"}, {"step": 2, "title": "Household"}, {"step": 3, "title": "Income & Assets"}, {"step": 4, "title": "Current Housing"}, {"step": 5, "title": "Documents"}, {"step": 6, "title": "Review"}]'::JSONB,
  '[{"step": 1, "title": "Info del Solicitante"}, {"step": 2, "title": "Hogar"}, {"step": 3, "title": "Ingresos y Bienes"}, {"step": 4, "title": "Vivienda Actual"}, {"step": 5, "title": "Documentos"}, {"step": 6, "title": "Revisar"}]'::JSONB,
  60, 12, 30, 365,
  true, true, false, 80
),

-- 10. Public Housing
(
  'PUBLIC_HOUSING',
  'Public Housing',
  'Vivienda Publica',
  'Affordable rental housing for eligible low-income families and individuals.',
  'Vivienda de alquiler asequible para familias e individuos de bajos ingresos.',
  'Public housing provides decent and safe rental housing for eligible low-income families, the elderly, and persons with disabilities at reduced rents.',
  'La vivienda publica proporciona vivienda de alquiler decente y segura para familias de bajos ingresos, ancianos y personas con discapacidades a alquileres reducidos.',
  'HUD', 'https://www.hud.gov/topics/rental_assistance/phprog', 'housing',
  '{"max_income_ami_percent": 80, "priority_extremely_low_income": true}',
  NULL, 4800, 14400,
  NULL,
  ARRAY['state_id', 'ssn_card', 'pay_stub', 'birth_certificate'],
  '[{"step": 1, "title": "Personal Info"}, {"step": 2, "title": "Household"}, {"step": 3, "title": "Income"}, {"step": 4, "title": "Documents"}, {"step": 5, "title": "Review"}]'::JSONB,
  '[{"step": 1, "title": "Info Personal"}, {"step": 2, "title": "Hogar"}, {"step": 3, "title": "Ingresos"}, {"step": 4, "title": "Documentos"}, {"step": 5, "title": "Revisar"}]'::JSONB,
  45, 12, 30, 365,
  true, true, false, 70
),

-- 11. LIHEAP
(
  'LIHEAP',
  'LIHEAP (Low Income Home Energy Assistance)',
  'LIHEAP (Asistencia de Energia para el Hogar)',
  'Help paying heating and cooling bills for low-income households.',
  'Ayuda para pagar facturas de calefaccion y refrigeracion para hogares de bajos ingresos.',
  'LIHEAP helps keep families safe and healthy through initiatives that assist with energy costs including bill payment assistance, energy crisis assistance, and weatherization.',
  'LIHEAP ayuda a mantener a las familias seguras y saludables a traves de iniciativas que asisten con costos de energia incluyendo asistencia de pago de facturas y asistencia de crisis energetica.',
  'HHS/ACF', 'https://www.acf.hhs.gov/ocs/programs/liheap', 'energy',
  '{"max_income_fpl_percent": 150, "or_max_income_smi_percent": 60}',
  150, 200, 1500,
  NULL,
  ARRAY['state_id', 'utility_bill', 'pay_stub'],
  '[{"step": 1, "title": "Personal Info"}, {"step": 2, "title": "Household"}, {"step": 3, "title": "Income"}, {"step": 4, "title": "Energy Bills"}, {"step": 5, "title": "Review"}]'::JSONB,
  '[{"step": 1, "title": "Info Personal"}, {"step": 2, "title": "Hogar"}, {"step": 3, "title": "Ingresos"}, {"step": 4, "title": "Facturas de Energia"}, {"step": 5, "title": "Revisar"}]'::JSONB,
  30, 12, 7, 30,
  true, false, true, 70
),

-- 12. Head Start
(
  'HEAD_START',
  'Head Start / Early Head Start',
  'Head Start / Early Head Start',
  'Free early childhood education for children from low-income families.',
  'Educacion temprana gratuita para ninos de familias de bajos ingresos.',
  'Head Start programs promote school readiness of children ages birth to 5 from low-income families by supporting their development in a comprehensive way.',
  'Los programas Head Start promueven la preparacion escolar de ninos desde el nacimiento hasta los 5 anos de familias de bajos ingresos apoyando su desarrollo de manera integral.',
  'HHS/ACF', 'https://www.acf.hhs.gov/ohs', 'childcare',
  '{"max_income_fpl_percent": 100, "child_age_0_to_5": true, "priority_homeless_foster": true}',
  100, 8000, 12000,
  'https://www.acf.hhs.gov/ohs/about/head-start',
  ARRAY['birth_certificate', 'pay_stub', 'state_id'],
  '[{"step": 1, "title": "Parent Info"}, {"step": 2, "title": "Child Info"}, {"step": 3, "title": "Income"}, {"step": 4, "title": "Documents"}, {"step": 5, "title": "Review"}]'::JSONB,
  '[{"step": 1, "title": "Info del Padre"}, {"step": 2, "title": "Info del Nino"}, {"step": 3, "title": "Ingresos"}, {"step": 4, "title": "Documentos"}, {"step": 5, "title": "Revisar"}]'::JSONB,
  40, 12, 14, 60,
  true, true, true, 75
),

-- 13. CCDF
(
  'CCDF',
  'Child Care Subsidies (CCDF)',
  'Subsidios de Cuidado Infantil (CCDF)',
  'Financial assistance for childcare for low-income working families.',
  'Asistencia financiera para cuidado infantil para familias trabajadoras de bajos ingresos.',
  'The Child Care and Development Fund helps low-income families obtain child care so they can work or attend training and education. Subsidies are paid to providers.',
  'El Fondo de Cuidado y Desarrollo Infantil ayuda a familias de bajos ingresos a obtener cuidado infantil para que puedan trabajar o asistir a capacitacion y educacion.',
  'HHS/ACF', 'https://www.acf.hhs.gov/occ', 'childcare',
  '{"max_income_smi_percent": 85, "must_be_working_or_in_training": true, "child_under_13": true}',
  NULL, 3000, 12000,
  NULL,
  ARRAY['state_id', 'pay_stub', 'birth_certificate'],
  '[{"step": 1, "title": "Parent Info"}, {"step": 2, "title": "Child Info"}, {"step": 3, "title": "Employment"}, {"step": 4, "title": "Childcare Provider"}, {"step": 5, "title": "Review"}]'::JSONB,
  '[{"step": 1, "title": "Info del Padre"}, {"step": 2, "title": "Info del Nino"}, {"step": 3, "title": "Empleo"}, {"step": 4, "title": "Proveedor de Cuidado"}, {"step": 5, "title": "Revisar"}]'::JSONB,
  35, 12, 7, 30,
  true, false, true, 75
),

-- 14. NSLP (Free/Reduced School Lunch)
(
  'NSLP',
  'Free/Reduced School Lunch (NSLP)',
  'Almuerzo Escolar Gratuito/Reducido (NSLP)',
  'Free or reduced-price meals for school children from low-income families.',
  'Comidas gratuitas o a precio reducido para ninos escolares de familias de bajos ingresos.',
  'The National School Lunch Program provides free or reduced-price lunches to eligible children. Free meals for families at or below 130% FPL; reduced-price for 131-185% FPL.',
  'El Programa Nacional de Almuerzo Escolar proporciona almuerzos gratuitos o a precio reducido a ninos elegibles.',
  'USDA', 'https://www.fns.usda.gov/nslp', 'food',
  '{"free_meal_fpl_percent": 130, "reduced_meal_fpl_percent": 185, "child_in_school": true}',
  185, 500, 1500,
  NULL,
  ARRAY['pay_stub'],
  '[{"step": 1, "title": "Student Info"}, {"step": 2, "title": "Household Income"}, {"step": 3, "title": "Review & Sign"}]'::JSONB,
  '[{"step": 1, "title": "Info del Estudiante"}, {"step": 2, "title": "Ingresos del Hogar"}, {"step": 3, "title": "Revisar y Firmar"}]'::JSONB,
  15, 12, 1, 14,
  true, false, true, 70
),

-- 15. Pell Grant
(
  'PELL_GRANT',
  'Federal Pell Grant',
  'Beca Federal Pell',
  'Need-based federal grant for undergraduate students.',
  'Beca federal basada en necesidad para estudiantes universitarios.',
  'Pell Grants provide need-based financial aid to low-income undergraduate students. The maximum award is $7,395 for the 2024-2025 award year. Does not need to be repaid.',
  'Las Becas Pell proporcionan ayuda financiera basada en necesidad a estudiantes universitarios de bajos ingresos. No necesita ser reembolsada.',
  'ED', 'https://studentaid.gov/understand-aid/types/grants/pell', 'education',
  '{"must_be_undergraduate": true, "must_demonstrate_financial_need": true, "must_be_citizen_or_eligible_noncitizen": true}',
  NULL, 1000, 7395,
  'https://studentaid.gov/h/apply-for-aid/fafsa',
  ARRAY['ssn_card', 'tax_return', 'w2'],
  '[{"step": 1, "title": "Student Info"}, {"step": 2, "title": "Financial Info"}, {"step": 3, "title": "School Selection"}, {"step": 4, "title": "Review & Sign"}]'::JSONB,
  '[{"step": 1, "title": "Info del Estudiante"}, {"step": 2, "title": "Info Financiera"}, {"step": 3, "title": "Seleccion de Escuela"}, {"step": 4, "title": "Revisar y Firmar"}]'::JSONB,
  45, 12, 14, 60,
  true, false, true, 75
),

-- 16. ACA Marketplace Subsidies
(
  'ACA_SUBSIDY',
  'ACA Marketplace Health Insurance Subsidies',
  'Subsidios de Seguro de Salud del Mercado ACA',
  'Premium tax credits to reduce the cost of health insurance purchased on the Marketplace.',
  'Creditos tributarios de prima para reducir el costo del seguro de salud comprado en el Mercado.',
  'Premium tax credits help lower your monthly insurance premium when you enroll in a plan through the Health Insurance Marketplace. The amount depends on income and household size.',
  'Los creditos tributarios de prima ayudan a reducir su prima mensual de seguro cuando se inscribe en un plan a traves del Mercado de Seguros de Salud.',
  'HHS/CMS', 'https://www.healthcare.gov', 'healthcare',
  '{"min_income_fpl_percent": 100, "max_income_fpl_percent": 400, "not_eligible_for_medicaid": true, "not_eligible_for_employer_coverage": true}',
  400, 1200, 12000,
  'https://www.healthcare.gov/apply-and-enroll/',
  ARRAY['ssn_card', 'pay_stub', 'tax_return'],
  '[{"step": 1, "title": "Personal Info"}, {"step": 2, "title": "Household"}, {"step": 3, "title": "Income"}, {"step": 4, "title": "Current Coverage"}, {"step": 5, "title": "Plan Selection"}, {"step": 6, "title": "Review"}]'::JSONB,
  '[{"step": 1, "title": "Info Personal"}, {"step": 2, "title": "Hogar"}, {"step": 3, "title": "Ingresos"}, {"step": 4, "title": "Cobertura Actual"}, {"step": 5, "title": "Seleccion de Plan"}, {"step": 6, "title": "Revisar"}]'::JSONB,
  45, 12, 1, 30,
  true, false, true, 85
),

-- 17. Lifeline
(
  'LIFELINE',
  'Lifeline (Phone/Internet Discount)',
  'Lifeline (Descuento de Telefono/Internet)',
  'Monthly discount on phone or internet service for low-income households.',
  'Descuento mensual en servicio de telefono o internet para hogares de bajos ingresos.',
  'Lifeline provides a monthly discount of up to $9.25 on phone or internet service. Eligible consumers must have an income at or below 135% of the Federal Poverty Guidelines.',
  'Lifeline proporciona un descuento mensual de hasta $9.25 en servicio de telefono o internet.',
  'FCC', 'https://www.fcc.gov/lifeline-consumers', 'communication',
  '{"max_income_fpl_percent": 135, "or_participates_in": ["SNAP", "MEDICAID", "SSI", "TANF", "PUBLIC_HOUSING"]}',
  135, 111, 111,
  'https://www.lifelinesupport.org/',
  ARRAY['state_id'],
  '[{"step": 1, "title": "Personal Info"}, {"step": 2, "title": "Qualifying Program"}, {"step": 3, "title": "Service Provider"}, {"step": 4, "title": "Review"}]'::JSONB,
  '[{"step": 1, "title": "Info Personal"}, {"step": 2, "title": "Programa Calificador"}, {"step": 3, "title": "Proveedor de Servicio"}, {"step": 4, "title": "Revisar"}]'::JSONB,
  20, 12, 1, 14,
  true, false, true, 55
),

-- 18. ACP (Affordable Connectivity Program)
(
  'ACP',
  'Affordable Connectivity Program (ACP)',
  'Programa de Conectividad Asequible (ACP)',
  'Monthly internet discount of up to $30 for eligible households.',
  'Descuento mensual de internet de hasta $30 para hogares elegibles.',
  'The ACP provides a discount of up to $30 per month toward internet service and a one-time discount of up to $100 toward a laptop, desktop, or tablet.',
  'El ACP proporciona un descuento de hasta $30 por mes para servicio de internet y un descuento unico de hasta $100 para una computadora o tableta.',
  'FCC', 'https://www.fcc.gov/acp', 'communication',
  '{"max_income_fpl_percent": 200, "or_participates_in": ["SNAP", "MEDICAID", "WIC", "SSI", "PELL_GRANT", "NSLP"]}',
  200, 360, 360,
  'https://www.affordableconnectivity.gov/',
  ARRAY['state_id'],
  '[{"step": 1, "title": "Personal Info"}, {"step": 2, "title": "Qualifying Program or Income"}, {"step": 3, "title": "Internet Provider"}, {"step": 4, "title": "Review"}]'::JSONB,
  '[{"step": 1, "title": "Info Personal"}, {"step": 2, "title": "Programa o Ingreso Calificador"}, {"step": 3, "title": "Proveedor de Internet"}, {"step": 4, "title": "Revisar"}]'::JSONB,
  20, 12, 1, 14,
  true, false, true, 55
),

-- 19. Federal Student Loans (IDR)
(
  'IDR',
  'Income-Driven Repayment Plans',
  'Planes de Pago Basados en Ingresos',
  'Reduce federal student loan payments based on income and family size.',
  'Reduzca los pagos de prestamos estudiantiles federales basados en ingresos y tamano de familia.',
  'Income-driven repayment plans cap your monthly federal student loan payments at an amount based on your discretionary income. After 20-25 years of payments, the remaining balance is forgiven.',
  'Los planes de pago basados en ingresos limitan sus pagos mensuales de prestamos estudiantiles federales a un monto basado en su ingreso discrecional.',
  'ED', 'https://studentaid.gov/manage-loans/repayment/plans/income-driven', 'education',
  '{"must_have_federal_student_loans": true, "partial_financial_hardship": true}',
  NULL, 1200, 6000,
  'https://studentaid.gov/idr/',
  ARRAY['tax_return', 'pay_stub'],
  '[{"step": 1, "title": "Borrower Info"}, {"step": 2, "title": "Loan Info"}, {"step": 3, "title": "Income & Family Size"}, {"step": 4, "title": "Plan Selection"}, {"step": 5, "title": "Review"}]'::JSONB,
  '[{"step": 1, "title": "Info del Prestatario"}, {"step": 2, "title": "Info del Prestamo"}, {"step": 3, "title": "Ingresos y Familia"}, {"step": 4, "title": "Seleccion de Plan"}, {"step": 5, "title": "Revisar"}]'::JSONB,
  30, 12, 14, 60,
  true, false, true, 65
),

-- 20. Weatherization Assistance
(
  'WAP',
  'Weatherization Assistance Program',
  'Programa de Asistencia de Climatizacion',
  'Free home energy improvements to reduce energy costs for low-income families.',
  'Mejoras energeticas gratuitas para el hogar para reducir costos de energia para familias de bajos ingresos.',
  'WAP reduces energy costs for low-income households by increasing the energy efficiency of their homes. Services include insulation, air sealing, and heating system repairs.',
  'WAP reduce los costos de energia para hogares de bajos ingresos aumentando la eficiencia energetica de sus hogares.',
  'DOE', 'https://www.energy.gov/scep/wap/weatherization-assistance-program', 'energy',
  '{"max_income_fpl_percent": 200, "or_receives_ssi_tanf": true, "priority_elderly_disabled": true}',
  200, 2000, 7000,
  NULL,
  ARRAY['state_id', 'utility_bill', 'pay_stub'],
  '[{"step": 1, "title": "Homeowner Info"}, {"step": 2, "title": "Home Details"}, {"step": 3, "title": "Income"}, {"step": 4, "title": "Energy Bills"}, {"step": 5, "title": "Review"}]'::JSONB,
  '[{"step": 1, "title": "Info del Propietario"}, {"step": 2, "title": "Detalles del Hogar"}, {"step": 3, "title": "Ingresos"}, {"step": 4, "title": "Facturas de Energia"}, {"step": 5, "title": "Revisar"}]'::JSONB,
  30, NULL, 30, 180,
  true, false, false, 55
),

-- 21. Community Health Centers
(
  'CHC',
  'Community Health Centers',
  'Centros de Salud Comunitarios',
  'Affordable primary care on a sliding fee scale based on income.',
  'Atencion primaria asequible en una escala de tarifas deslizante basada en ingresos.',
  'Federally Qualified Health Centers provide primary care services on a sliding fee scale. No one is turned away based on ability to pay.',
  'Los Centros de Salud Calificados Federalmente proporcionan servicios de atencion primaria en una escala de tarifas deslizante. Nadie es rechazado por incapacidad de pago.',
  'HHS/HRSA', 'https://findahealthcenter.hrsa.gov/', 'healthcare',
  '{"open_to_all": true, "sliding_scale_below_200_fpl": true}',
  200, 500, 3000,
  'https://findahealthcenter.hrsa.gov/',
  ARRAY['state_id', 'pay_stub'],
  '[{"step": 1, "title": "Find a Center"}, {"step": 2, "title": "Personal Info"}, {"step": 3, "title": "Income"}, {"step": 4, "title": "Schedule Visit"}]'::JSONB,
  '[{"step": 1, "title": "Encontrar un Centro"}, {"step": 2, "title": "Info Personal"}, {"step": 3, "title": "Ingresos"}, {"step": 4, "title": "Programar Visita"}]'::JSONB,
  15, NULL, 1, 7,
  true, false, true, 60
),

-- 22. VITA (Volunteer Income Tax Assistance)
(
  'VITA',
  'VITA (Free Tax Preparation)',
  'VITA (Preparacion de Impuestos Gratis)',
  'Free tax return preparation for qualifying individuals.',
  'Preparacion gratuita de declaracion de impuestos para personas que califican.',
  'The VITA program offers free tax help to people who generally make $64,000 or less, persons with disabilities, and limited English-speaking taxpayers.',
  'El programa VITA ofrece ayuda tributaria gratuita a personas que generalmente ganan $64,000 o menos, personas con discapacidades y contribuyentes con ingles limitado.',
  'IRS', 'https://www.irs.gov/individuals/free-tax-return-preparation-for-qualifying-taxpayers', 'tax_credit',
  '{"max_income": 64000, "or_disabled": true, "or_limited_english": true}',
  NULL, 200, 500,
  'https://irs.treasury.gov/freetaxprep/',
  ARRAY['w2', 'ssn_card', 'state_id'],
  '[{"step": 1, "title": "Find a VITA Site"}, {"step": 2, "title": "Gather Documents"}, {"step": 3, "title": "Schedule Appointment"}]'::JSONB,
  '[{"step": 1, "title": "Encontrar un Sitio VITA"}, {"step": 2, "title": "Reunir Documentos"}, {"step": 3, "title": "Programar Cita"}]'::JSONB,
  10, NULL, 1, 7,
  true, false, false, 50
),

-- 23. Medicare Savings Programs
(
  'MSP',
  'Medicare Savings Programs',
  'Programas de Ahorro de Medicare',
  'Help paying Medicare premiums, deductibles, and coinsurance.',
  'Ayuda para pagar primas, deducibles y coseguros de Medicare.',
  'Medicare Savings Programs help pay for Medicare costs like premiums, deductibles, coinsurance, and copayments for people with limited income and resources.',
  'Los Programas de Ahorro de Medicare ayudan a pagar costos de Medicare como primas, deducibles, coseguros y copagos para personas con ingresos y recursos limitados.',
  'HHS/CMS', 'https://www.medicare.gov/basics/costs/help/medicare-savings-programs', 'healthcare',
  '{"must_have_medicare": true, "max_income_fpl_percent": 135, "max_resources_individual": 9090, "max_resources_couple": 13630}',
  135, 1800, 5000,
  NULL,
  ARRAY['state_id', 'ssn_card', 'bank_statement'],
  '[{"step": 1, "title": "Personal Info"}, {"step": 2, "title": "Medicare Info"}, {"step": 3, "title": "Income & Resources"}, {"step": 4, "title": "Review"}]'::JSONB,
  '[{"step": 1, "title": "Info Personal"}, {"step": 2, "title": "Info de Medicare"}, {"step": 3, "title": "Ingresos y Recursos"}, {"step": 4, "title": "Revisar"}]'::JSONB,
  25, 12, 7, 45,
  true, false, true, 70
),

-- 24. Extra Help (Medicare Part D)
(
  'EXTRA_HELP',
  'Extra Help (Medicare Part D Low-Income Subsidy)',
  'Ayuda Extra (Subsidio de Bajos Ingresos Medicare Parte D)',
  'Help paying for prescription drug costs under Medicare Part D.',
  'Ayuda para pagar costos de medicamentos recetados bajo Medicare Parte D.',
  'Extra Help (Low-Income Subsidy) helps people with limited income and resources pay for Medicare prescription drug coverage premiums, deductibles, and copayments.',
  'Ayuda Extra (Subsidio de Bajos Ingresos) ayuda a personas con ingresos y recursos limitados a pagar primas, deducibles y copagos de cobertura de medicamentos recetados de Medicare.',
  'SSA', 'https://www.ssa.gov/medicare/part-d-extra-help', 'healthcare',
  '{"must_have_medicare": true, "max_income_fpl_percent": 150, "max_resources_individual": 16660, "max_resources_couple": 33240}',
  150, 1000, 5000,
  'https://www.ssa.gov/medicare/part-d-extra-help',
  ARRAY['ssn_card', 'bank_statement'],
  '[{"step": 1, "title": "Personal Info"}, {"step": 2, "title": "Medicare & Drug Plan"}, {"step": 3, "title": "Income & Resources"}, {"step": 4, "title": "Review"}]'::JSONB,
  '[{"step": 1, "title": "Info Personal"}, {"step": 2, "title": "Medicare y Plan de Medicamentos"}, {"step": 3, "title": "Ingresos y Recursos"}, {"step": 4, "title": "Revisar"}]'::JSONB,
  25, 12, 14, 60,
  true, false, true, 65
),

-- 25. SNAP E&T (Employment & Training)
(
  'SNAP_ET',
  'SNAP Employment & Training',
  'SNAP Empleo y Capacitacion',
  'Job training and education services for SNAP recipients.',
  'Servicios de capacitacion laboral y educacion para beneficiarios de SNAP.',
  'SNAP E&T helps SNAP participants gain skills, training, or work experience to improve employment prospects and reduce reliance on SNAP benefits.',
  'SNAP E&T ayuda a participantes de SNAP a obtener habilidades, capacitacion o experiencia laboral para mejorar prospectos de empleo.',
  'USDA', 'https://www.fns.usda.gov/snap/et', 'education',
  '{"must_be_snap_recipient": true, "work_requirement_18_49": true}',
  NULL, 0, 2000,
  NULL,
  ARRAY['state_id'],
  '[{"step": 1, "title": "Personal Info"}, {"step": 2, "title": "SNAP Verification"}, {"step": 3, "title": "Employment Goals"}, {"step": 4, "title": "Review"}]'::JSONB,
  '[{"step": 1, "title": "Info Personal"}, {"step": 2, "title": "Verificacion SNAP"}, {"step": 3, "title": "Metas de Empleo"}, {"step": 4, "title": "Revisar"}]'::JSONB,
  20, NULL, 7, 30,
  true, false, true, 45
);
```

---

## TypeScript Interfaces

These interfaces mirror the database schema for use in the React Native client and Supabase Edge Functions.

```typescript
// ──────────────────────────────────────────────
// Core Types
// ──────────────────────────────────────────────

type UUID = string;
type SubscriptionTier = 'free' | 'plus' | 'family';
type Language = 'en' | 'es';
type EmploymentStatus = 'employed' | 'unemployed' | 'self_employed' | 'retired' | 'disabled' | 'student';
type CitizenshipStatus = 'citizen' | 'permanent_resident' | 'visa_holder' | 'undocumented' | 'refugee' | 'prefer_not_say';
type IncomeBracket = '0_15000' | '15000_30000' | '30000_50000' | '50000_75000' | '75000_plus';

type DocumentType =
  | 'drivers_license' | 'state_id' | 'passport' | 'ssn_card'
  | 'w2' | 'tax_return' | 'pay_stub' | 'birth_certificate'
  | 'immigration_doc' | 'utility_bill' | 'bank_statement'
  | 'lease_agreement' | 'other';

type BenefitCategory =
  | 'food' | 'healthcare' | 'housing' | 'cash' | 'tax_credit'
  | 'childcare' | 'education' | 'disability' | 'communication'
  | 'energy' | 'immigration' | 'other';

type ApplicationStatus =
  | 'draft' | 'in_progress' | 'submitted' | 'pending'
  | 'approved' | 'denied' | 'appealing' | 'expired' | 'withdrawn';

type EligibilityStatus =
  | 'likely_eligible' | 'may_be_eligible' | 'not_eligible'
  | 'unknown' | 'needs_more_info';

type NotificationType =
  | 'deadline_reminder' | 'renewal_alert' | 'missing_document'
  | 'status_check' | 'approval' | 'denial' | 'appeal_deadline'
  | 'document_expiry' | 'eligibility_update' | 'welcome' | 'general';

type NotificationChannel = 'push' | 'sms' | 'both';
type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

type FormFieldType =
  | 'text' | 'number' | 'date' | 'select' | 'multiselect'
  | 'boolean' | 'ssn' | 'phone' | 'email' | 'address' | 'currency';

type ValidationStatus = 'pending' | 'valid' | 'invalid' | 'warning';

type AutoFillSource =
  | 'document_scan' | 'profile' | 'household' | 'previous_application';

type Relationship =
  | 'spouse' | 'child' | 'parent' | 'sibling'
  | 'grandparent' | 'grandchild' | 'other';

type AgeBracket =
  | 'under_1' | '1_4' | '5_12' | '13_17'
  | '18_24' | '25_54' | '55_64' | '65_plus';

type AISessionType =
  | 'form_guidance' | 'eligibility_qa' | 'general_help' | 'appeal_guidance';

type AgencyType =
  | 'federal' | 'state' | 'county' | 'city'
  | 'nonprofit' | 'legal_aid' | 'community_health' | 'library' | 'other';

type UserAction =
  | 'login' | 'logout' | 'onboarding_started' | 'onboarding_completed'
  | 'document_scanned' | 'document_verified' | 'document_vault_saved'
  | 'eligibility_checked' | 'application_started' | 'application_step_completed'
  | 'application_submitted' | 'application_status_updated'
  | 'subscription_upgraded' | 'subscription_downgraded' | 'subscription_cancelled'
  | 'profile_updated' | 'household_member_added' | 'household_member_removed'
  | 'notification_sent' | 'notification_read' | 'ai_guidance_started'
  | 'data_exported' | 'data_deleted' | 'language_changed'
  | 'benefit_saved' | 'benefit_unsaved';


// ──────────────────────────────────────────────
// Table Interfaces
// ──────────────────────────────────────────────

interface Profile {
  id: UUID;
  encrypted_full_name: Uint8Array | null;
  encrypted_ssn: Uint8Array | null;
  encrypted_dob: Uint8Array | null;
  encrypted_address: Uint8Array | null;
  encrypted_phone: Uint8Array | null;
  encrypted_email: Uint8Array | null;
  preferred_language: Language;
  household_size: number;
  household_income_bracket: IncomeBracket | null;
  annual_income_cents: number | null;
  employment_status: EmploymentStatus | null;
  citizenship_status: CitizenshipStatus | null;
  has_children_under_18: boolean;
  number_of_dependents: number;
  state_code: string | null;
  county: string | null;
  subscription_tier: SubscriptionTier;
  subscription_expires_at: string | null;
  revenucat_id: string | null;
  push_token: string | null;
  sms_opted_in: boolean;
  push_opted_in: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  last_eligibility_check_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Decrypted profile fields returned by decrypt_profile() */
interface DecryptedProfile {
  full_name: string | null;
  ssn: string | null;
  dob: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

interface HouseholdMember {
  id: UUID;
  user_id: UUID;
  encrypted_name: Uint8Array;
  encrypted_dob: Uint8Array;
  encrypted_ssn: Uint8Array | null;
  relationship: Relationship;
  age_bracket: AgeBracket | null;
  is_dependent: boolean;
  has_disability: boolean;
  is_pregnant: boolean;
  is_veteran: boolean;
  employment_status: EmploymentStatus | null;
  created_at: string;
  updated_at: string;
}

interface ScannedDocument {
  id: UUID;
  user_id: UUID;
  document_type: DocumentType;
  encrypted_extracted_data: Uint8Array;
  extraction_confidence: number | null;
  field_confidences: Record<string, number>;
  storage_path: string | null;
  storage_bucket: string;
  file_size_bytes: number | null;
  mime_type: string;
  is_in_vault: boolean;
  is_verified_by_user: boolean;
  verification_notes: string | null;
  expires_at: string;
  scanned_at: string;
  updated_at: string;
}

interface DocumentVaultItem {
  id: UUID;
  user_id: UUID;
  scanned_document_id: UUID | null;
  document_type: DocumentType;
  display_name: string;
  display_name_es: string | null;
  encrypted_extracted_data: Uint8Array;
  storage_path: string;
  storage_bucket: string;
  file_size_bytes: number | null;
  document_date: string | null;
  document_expiry_date: string | null;
  is_expired: boolean;
  tags: string[];
  notes: string | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

interface BenefitProgram {
  id: UUID;
  program_code: string;
  program_name: string;
  program_name_es: string;
  short_description: string;
  short_description_es: string;
  description: string;
  description_es: string;
  agency: string;
  agency_url: string | null;
  agency_phone: string | null;
  category: BenefitCategory;
  eligibility_rules: Record<string, unknown>;
  income_limit_fpl_percent: number | null;
  estimated_annual_value_min: number | null;
  estimated_annual_value_max: number | null;
  application_url: string | null;
  application_url_es: string | null;
  required_documents: DocumentType[];
  application_steps: ApplicationStep[];
  application_steps_es: ApplicationStep[];
  estimated_application_minutes: number;
  renewal_period_months: number | null;
  processing_time_days_min: number | null;
  processing_time_days_max: number | null;
  is_federal: boolean;
  state_codes: string[] | null;
  requires_interview: boolean;
  allows_online_application: boolean;
  is_active: boolean;
  priority_score: number;
  last_verified_at: string;
  last_updated: string;
  created_at: string;
}

interface ApplicationStep {
  step: number;
  title: string;
  fields?: string[];
}

interface EligibilityResult {
  id: UUID;
  user_id: UUID;
  program_id: UUID;
  is_eligible: boolean;
  eligibility_status: EligibilityStatus;
  confidence: number;
  estimated_annual_value: number | null;
  estimated_monthly_value: number | null;
  missing_documents: string[];
  missing_information: string[];
  disqualifying_factors: string[];
  qualifying_factors: string[];
  income_ratio_to_limit: number | null;
  calculation_inputs: Record<string, unknown>;
  calculated_at: string;
  expires_at: string;
}

interface SavedBenefit {
  id: UUID;
  user_id: UUID;
  program_id: UUID;
  notes: string | null;
  saved_at: string;
}

interface Application {
  id: UUID;
  user_id: UUID;
  program_id: UUID;
  status: ApplicationStatus;
  encrypted_form_data: Uint8Array | null;
  current_step: number;
  total_steps: number;
  completed_steps: number[];
  documents_attached: UUID[];
  submitted_at: string | null;
  agency_confirmation_number: string | null;
  agency_case_number: string | null;
  next_action: string | null;
  next_action_es: string | null;
  next_deadline: string | null;
  approval_date: string | null;
  approval_amount_annual: number | null;
  denial_date: string | null;
  denial_reason: string | null;
  denial_reason_es: string | null;
  appeal_deadline: string | null;
  renewal_date: string | null;
  notes: string | null;
  is_renewal: boolean;
  parent_application_id: UUID | null;
  created_at: string;
  updated_at: string;
}

interface ApplicationFormData {
  id: UUID;
  application_id: UUID;
  user_id: UUID;
  step_number: number;
  field_key: string;
  field_label: string;
  field_label_es: string | null;
  field_type: FormFieldType;
  encrypted_value: Uint8Array | null;
  plaintext_value: string | null;
  is_pii: boolean;
  is_auto_filled: boolean;
  auto_fill_source: AutoFillSource | null;
  auto_fill_confidence: number | null;
  is_confirmed_by_user: boolean;
  validation_status: ValidationStatus;
  validation_message: string | null;
  created_at: string;
  updated_at: string;
}

interface FormFieldMapping {
  id: UUID;
  program_id: UUID;
  step_number: number;
  field_key: string;
  field_label: string;
  field_label_es: string;
  field_type: FormFieldType;
  is_required: boolean;
  is_pii: boolean;
  source_document_type: DocumentType | 'profile' | 'household' | null;
  source_field_path: string | null;
  help_text: string | null;
  help_text_es: string | null;
  placeholder: string | null;
  placeholder_es: string | null;
  select_options: Record<string, string> | null;
  select_options_es: Record<string, string> | null;
  validation_regex: string | null;
  validation_message: string | null;
  validation_message_es: string | null;
  display_order: number;
  conditional_on: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface AIGuidanceSession {
  id: UUID;
  user_id: UUID;
  application_id: UUID | null;
  program_id: UUID | null;
  session_type: AISessionType;
  current_step: number | null;
  language: Language;
  messages: AIMessage[];
  message_count: number;
  total_input_tokens: number;
  total_output_tokens: number;
  estimated_cost_cents: number;
  model_used: string;
  is_active: boolean;
  is_anonymized: boolean;
  started_at: string;
  last_message_at: string;
  ended_at: string | null;
  anonymized_at: string | null;
  created_at: string;
}

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface NotificationScheduleItem {
  id: UUID;
  user_id: UUID;
  application_id: UUID | null;
  program_id: UUID | null;
  notification_type: NotificationType;
  scheduled_for: string;
  channel: NotificationChannel;
  message_en: string;
  message_es: string;
  title_en: string | null;
  title_es: string | null;
  deep_link: string | null;
  priority: NotificationPriority;
  is_sent: boolean;
  is_read: boolean;
  is_dismissed: boolean;
  sent_at: string | null;
  read_at: string | null;
  retry_count: number;
  max_retries: number;
  error_message: string | null;
  created_at: string;
}

interface ReferralAgency {
  id: UUID;
  agency_name: string;
  agency_name_es: string;
  agency_type: AgencyType;
  description: string | null;
  description_es: string | null;
  programs_served: string[];
  phone: string | null;
  email: string | null;
  website: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  latitude: number | null;
  longitude: number | null;
  hours_of_operation: Record<string, string> | null;
  languages_spoken: string[];
  accepts_walk_ins: boolean;
  appointment_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserActivityLogEntry {
  id: UUID;
  user_id: UUID;
  action: UserAction;
  resource_type: string | null;
  resource_id: UUID | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/** Return type for get_eligibility_summary() */
interface EligibilitySummary {
  total_eligible_programs: number;
  total_estimated_annual_value: number;
  top_program_name: string | null;
  top_program_value: number | null;
}
```

---

## Entity Relationship Summary

```
auth.users (Supabase Auth)
  |
  | 1:1
  v
profiles ─────────────────────────────────────────────────────────┐
  |                                                                |
  | 1:N                                                            |
  ├── household_members                                            |
  |                                                                |
  | 1:N                                                            |
  ├── scanned_documents                                            |
  |     |                                                          |
  |     | 1:0..1                                                   |
  |     └── document_vault_items                                   |
  |                                                                |
  | 1:N                                                            |
  ├── eligibility_results ──────── N:1 ── benefit_programs         |
  |                                         |                      |
  | 1:N                                     | 1:N                  |
  ├── saved_benefits ───────────── N:1 ─────┘                      |
  |                                         |                      |
  | 1:N                                     | 1:N                  |
  ├── applications ─────────────── N:1 ─────┘                      |
  |     |                                                          |
  |     | 1:N                                                      |
  |     ├── application_form_data                                  |
  |     |                                                          |
  |     | 1:N                                                      |
  |     ├── notification_schedule                                  |
  |     |                                                          |
  |     | 0..1:N (self-referential for renewals)                   |
  |     └── applications (parent_application_id)                   |
  |                                                                |
  | 1:N                                                            |
  ├── ai_guidance_sessions ─────── N:0..1 ── applications          |
  |                                                                |
  | 1:N                                                            |
  ├── notification_schedule                                        |
  |                                                                |
  | 1:N                                                            |
  └── user_activity_log                                            |
                                                                   |
benefit_programs (reference data, no user FK) ─────────────────────┘
  |
  | 1:N
  └── form_field_mappings

referral_agencies (standalone reference data, no FK to other tables)
```

### Key Relationships

| Parent | Child | Cardinality | ON DELETE |
|--------|-------|-------------|----------|
| `auth.users` | `profiles` | 1:1 | CASCADE |
| `profiles` | `household_members` | 1:N | CASCADE |
| `profiles` | `scanned_documents` | 1:N | CASCADE |
| `profiles` | `document_vault_items` | 1:N | CASCADE |
| `profiles` | `eligibility_results` | 1:N | CASCADE |
| `profiles` | `saved_benefits` | 1:N | CASCADE |
| `profiles` | `applications` | 1:N | CASCADE |
| `profiles` | `application_form_data` | 1:N | CASCADE |
| `profiles` | `ai_guidance_sessions` | 1:N | CASCADE |
| `profiles` | `notification_schedule` | 1:N | CASCADE |
| `profiles` | `user_activity_log` | 1:N | CASCADE |
| `benefit_programs` | `eligibility_results` | 1:N | CASCADE |
| `benefit_programs` | `saved_benefits` | 1:N | CASCADE |
| `benefit_programs` | `applications` | 1:N | RESTRICT |
| `benefit_programs` | `form_field_mappings` | 1:N | CASCADE |
| `applications` | `application_form_data` | 1:N | CASCADE |
| `applications` | `notification_schedule` | 1:N | CASCADE |
| `applications` | `ai_guidance_sessions` | N:0..1 | SET NULL |
| `applications` | `applications` (renewal) | 1:N | SET NULL |
| `scanned_documents` | `document_vault_items` | 1:0..1 | SET NULL |

### Design Decisions

1. **`applications` -> `benefit_programs` uses ON DELETE RESTRICT** because deleting a benefit program while users have active applications would orphan critical tracking data. Programs should be deactivated (`is_active = false`), not deleted.

2. **`document_vault_items` -> `scanned_documents` uses ON DELETE SET NULL** because a vault item should survive even if the original scan record is cleaned up. The vault item has its own copy of the encrypted extracted data.

3. **`ai_guidance_sessions` -> `applications` uses ON DELETE SET NULL** because guidance history has independent value for support and analytics even if the associated application is deleted.

4. **`applications` self-reference uses ON DELETE SET NULL** so that renewal applications survive if the parent application is deleted.

5. **All user-owned tables cascade from `profiles`** which itself cascades from `auth.users`, ensuring complete data cleanup when a user deletes their account.

---

## Storage Buckets

```sql
-- Supabase Storage bucket configuration (managed via dashboard or API)

-- Temporary scan images: auto-delete after 24 hours via pg_cron
-- Bucket: encrypted-documents
--   Access: private (signed URLs only)
--   Encryption: AES-256 at rest
--   Max file size: 5MB
--   Allowed MIME types: image/jpeg, image/png

-- Permanent vault storage: retained until user deletes
-- Bucket: vault-documents
--   Access: private (signed URLs only)
--   Encryption: AES-256 at rest
--   Max file size: 10MB
--   Allowed MIME types: image/jpeg, image/png, application/pdf
```
