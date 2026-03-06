# GovPass Tech Stack

**Architecture, frameworks, AI pipeline, encryption, and scalability plan.**

---

## Stack Philosophy

GovPass is built on the principle of **security-first simplicity**. Every technology choice optimizes for three things: protecting sensitive PII (Social Security numbers, tax data, immigration documents), delivering accurate AI-powered document parsing, and enabling a solo developer or small team (2-3 engineers) to ship a production-quality government benefits app within 4-6 months. Because GovPass handles the most sensitive personal data imaginable, encryption and data handling are not afterthoughts -- they are foundational architectural decisions.

---

## Architecture Overview

```
+------------------------------------------------------------------+
|                        CLIENT (Mobile)                           |
|  +------------------------------------------------------------+ |
|  |  React Native + Expo (iOS & Android)                        | |
|  |  +-----------+  +-------------+  +------------------------+| |
|  |  | Camera    |  | Secure      |  | Eligibility            || |
|  |  | Scanner   |  | Document    |  | Engine                 || |
|  |  | (Expo     |  | Vault       |  | (Local rule            || |
|  |  |  Camera)  |  | (Encrypted) |  |  evaluation)           || |
|  |  +-----------+  +-------------+  +------------------------+| |
|  +------------------------------------------------------------+ |
+------------------------------------------------------------------+
              |                    |                    |
              v                    v                    v
+------------------------------------------------------------------+
|                     EDGE / API LAYER                             |
|  +------------------------------------------------------------+ |
|  |  Supabase Edge Functions (Deno)                             | |
|  |  +------------------+  +------------------+                 | |
|  |  | Document         |  | Form             |                 | |
|  |  | Processing       |  | Guidance         |                 | |
|  |  | Pipeline         |  | Engine           |                 | |
|  |  | (GPT-4o Vision)  |  | (OpenAI API)     |                 | |
|  |  +------------------+  +------------------+                 | |
|  |  +------------------+  +------------------+                 | |
|  |  | Eligibility      |  | Notification     |                 | |
|  |  | Calculator       |  | Dispatcher       |                 | |
|  |  | (Federal+State   |  | (Twilio SMS +    |                 | |
|  |  |  rules engine)   |  |  Push)           |                 | |
|  |  +------------------+  +------------------+                 | |
|  +------------------------------------------------------------+ |
+------------------------------------------------------------------+
              |                    |                    |
              v                    v                    v
+------------------------------------------------------------------+
|                     DATA / SERVICES LAYER                        |
|  +---------------+  +----------------+  +--------------------+  |
|  | Supabase      |  | Supabase       |  | Supabase           |  |
|  | PostgreSQL    |  | Storage        |  | Auth               |  |
|  | (Encrypted    |  | (Encrypted     |  | (Magic link,       |  |
|  |  PII, apps,   |  |  doc vault,    |  |  Apple/Google SSO, |  |
|  |  eligibility) |  |  temp scans)   |  |  phone auth)       |  |
|  +---------------+  +----------------+  +--------------------+  |
|  +---------------+  +----------------+  +--------------------+  |
|  | RevenueCat    |  | Stripe         |  | Twilio             |  |
|  | (Subscription |  | (Payment       |  | (SMS deadline      |  |
|  |  management)  |  |  processing)   |  |  reminders)        |  |
|  +---------------+  +----------------+  +--------------------+  |
|  +---------------+  +----------------+                          |
|  | USAGov APIs   |  | PostHog        |                          |
|  | (Benefits     |  | (Analytics,    |                          |
|  |  data, free)  |  |  feature flags)|                          |
|  +---------------+  +----------------+                          |
+------------------------------------------------------------------+
```

### Data Flow: Document Scan to Application Submission

```
User Scans Document (ID / Tax Form / Pay Stub)
        |
        v
[1] Camera Capture + Image Optimization
    - Auto-alignment guides for document edges
    - Compress and encrypt image locally before transmission
    - Generate temporary encrypted upload URL
        |
        v
[2] GPT-4o Vision Extraction (Edge Function)
    - Extract structured data: name, DOB, SSN, income, address
    - Confidence scores per field
    - Image deleted from processing pipeline immediately after extraction
    - Extracted data encrypted at rest in Supabase
        |
        v
[3] Eligibility Engine (Edge Function)
    - Cross-reference extracted data against 25+ federal program rules
    - Apply state-specific variations
    - Calculate estimated benefit amounts
    - Rank programs by value and approval likelihood
        |
        v
[4] Form Auto-Fill
    - Map extracted fields to program application forms
    - Pre-fill all matching fields
    - Flag fields requiring user confirmation or additional info
    - Display in step-by-step guided flow
        |
        v
[5] Application Tracking
    - Store application status per program per agency
    - Set reminder schedules for deadlines and renewals
    - Track: draft -> submitted -> pending -> approved/denied
        |
        v
[6] Notification System (Twilio + Push)
    - SMS reminders for upcoming deadlines
    - Push notifications for status changes
    - Renewal alerts 30/60/90 days before expiration
```

---

## Frontend

| Technology | Version | Purpose | Why This Choice |
|------------|---------|---------|-----------------|
| **React Native** | 0.76+ | Cross-platform mobile framework | Single codebase for iOS + Android; target demographic uses both platforms; strong camera/notification support |
| **Expo** | SDK 52+ | Development platform & build service | Managed camera APIs for document scanning; push notification infrastructure; OTA updates for policy/form changes |
| **TypeScript** | 5.5+ | Type-safe JavaScript | Critical for parsing structured AI responses from document scans; enforces PII field handling contracts |
| **Expo Router** | v4 | File-based navigation | Deep linking for specific application flows; type-safe routes; supports complex multi-step form navigation |
| **Zustand** | 5.x | State management | Lightweight; manages complex multi-form state, document vault, and application tracking across screens |
| **React Query (TanStack)** | 5.x | Server state management | Caches eligibility results; manages application status polling; offline support for draft applications |
| **Expo Camera** | Latest | Camera access for document scanning | Native performance; auto-focus for document capture; torch for low-light scanning |
| **React Native Reanimated** | 3.x | Animations | Smooth document alignment guides; progress bar animations; celebration animations for approvals |
| **NativeWind** | 4.x | Tailwind CSS for React Native | Rapid UI development; consistent Civic Helper theme application; RTL support for future languages |
| **React Native MMKV** | 3.x | Encrypted local storage | AES-256 encryption for locally cached PII; 30x faster than AsyncStorage; secure document vault |
| **expo-notifications** | Latest | Push notifications | Deadline reminders; application status updates; renewal alerts |
| **expo-localization** | Latest | i18n support | English/Spanish bilingual interface; number/date formatting per locale |
| **i18next** | Latest | Translation management | Structured translation files for EN/ES; interpolation for dynamic benefit amounts |

### Frontend Architecture Pattern

```
src/
  app/                          # Expo Router screens
    (tabs)/                     # Tab navigator
      index.tsx                 # Home Dashboard (eligible benefits, active apps)
      scanner.tsx               # Document Scanner
      applications.tsx          # Application Tracker
      notifications.tsx         # Notifications Center
    onboarding/                 # Onboarding flow
      language.tsx              # Language selection (EN/ES)
      household.tsx             # Household info survey
      scan-intro.tsx            # Document scanning introduction
    eligibility/
      results.tsx               # Eligibility results list
      [program].tsx             # Individual program detail
    apply/
      [program]/
        index.tsx               # Application flow entry
        step/[step].tsx         # Step-by-step guided form
        review.tsx              # Review before submission
        submitted.tsx           # Confirmation screen
    settings.tsx                # Profile, language, subscription, vault
  components/
    scanner/                    # Document alignment guide, capture UI
    forms/                      # Auto-filled form fields, progress stepper
    benefits/                   # Benefit cards, eligibility badges
    ui/                         # Buttons, cards, inputs (Civic Helper themed)
  hooks/
    useDocumentScan.ts          # Camera capture + Vision API pipeline
    useEligibility.ts           # Eligibility calculation + caching
    useApplicationFlow.ts       # Multi-step form state management
    useNotifications.ts         # Push + SMS notification management
    useSubscription.ts          # RevenueCat subscription state
    useSecureStorage.ts         # Encrypted PII read/write
  services/
    ai.ts                       # OpenAI API wrapper (chat + vision)
    documents.ts                # Document processing pipeline
    eligibility.ts              # Eligibility rule engine client
    notifications.ts            # Twilio + push notification service
    supabase.ts                 # Supabase client with encryption helpers
    usagov.ts                   # USAGov API integration
  stores/
    user.ts                     # Zustand user/household state
    documents.ts                # Zustand scanned document state
    applications.ts             # Zustand application tracking state
  utils/
    encryption.ts               # AES-256 encryption/decryption helpers
    pii.ts                      # PII masking and validation
    forms.ts                    # Form field mapping utilities
    eligibility-rules.ts        # Federal/state eligibility rule definitions
    i18n.ts                     # Translation setup and helpers
  constants/
    programs.ts                 # Federal benefit program definitions
    states.ts                   # State-specific program variations
    forms.ts                    # Form field mappings per program
    theme.ts                    # Civic Helper design tokens
  locales/
    en.json                     # English translations
    es.json                     # Spanish translations
```

---

## Backend

| Technology | Version | Purpose | Why This Choice |
|------------|---------|---------|-----------------|
| **Supabase** | Latest | Backend-as-a-Service | PostgreSQL + Auth + Storage + Edge Functions + Realtime in one platform; column-level encryption for PII; row-level security enforces data isolation |
| **Supabase Auth** | Latest | Authentication | Phone auth (SMS verification for users without email); Magic link; Apple/Google SSO; JWT tokens |
| **Supabase PostgreSQL** | 15+ | Primary database with encryption | pgcrypto for column-level PII encryption; JSONB for flexible benefit program schemas; pg_cron for deadline reminder scheduling |
| **Supabase Storage** | Latest | Encrypted document storage | S3-compatible with bucket-level encryption; temporary scan storage with auto-deletion; permanent document vault for subscribers |
| **Supabase Edge Functions** | Latest | Serverless compute (Deno) | Handles AI API orchestration; PII never leaves Supabase infrastructure during processing; sub-50ms cold starts |

### Database Schema (Core Tables)

```sql
-- Enable encryption extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- User profiles with encrypted PII
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  -- Encrypted PII fields (AES-256 via pgcrypto)
  encrypted_full_name BYTEA,
  encrypted_ssn BYTEA,
  encrypted_dob BYTEA,
  encrypted_address BYTEA,
  encrypted_phone BYTEA,
  -- Non-sensitive fields
  preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'es')),
  household_size INTEGER DEFAULT 1,
  household_income_bracket TEXT,
  employment_status TEXT CHECK (employment_status IN ('employed', 'unemployed', 'self_employed', 'retired', 'disabled', 'student')),
  citizenship_status TEXT CHECK (citizenship_status IN ('citizen', 'permanent_resident', 'visa_holder', 'undocumented', 'refugee', 'prefer_not_say')),
  state_code CHAR(2),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'plus', 'family')),
  revenucat_id TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scanned documents (metadata only, images in encrypted storage)
CREATE TABLE scanned_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('drivers_license', 'state_id', 'passport', 'ssn_card', 'w2', 'tax_return', 'pay_stub', 'birth_certificate', 'immigration_doc', 'utility_bill', 'other')),
  -- Encrypted extracted data
  encrypted_extracted_data BYTEA NOT NULL,  -- JSON with all extracted fields
  extraction_confidence FLOAT,              -- Overall confidence score
  field_confidences JSONB,                  -- Per-field confidence scores
  storage_path TEXT,                        -- Path in encrypted storage bucket
  is_in_vault BOOLEAN DEFAULT false,        -- Saved to permanent document vault
  -- Auto-delete non-vault scans after 24 hours
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Benefit programs reference data
CREATE TABLE benefit_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_code TEXT UNIQUE NOT NULL,        -- e.g., 'SNAP', 'MEDICAID', 'EITC'
  program_name TEXT NOT NULL,
  program_name_es TEXT NOT NULL,            -- Spanish name
  description TEXT NOT NULL,
  description_es TEXT NOT NULL,
  agency TEXT NOT NULL,                     -- e.g., 'USDA', 'HHS', 'IRS'
  category TEXT NOT NULL CHECK (category IN ('food', 'healthcare', 'housing', 'cash', 'tax_credit', 'childcare', 'education', 'disability', 'immigration', 'other')),
  eligibility_rules JSONB NOT NULL,         -- Structured eligibility criteria
  estimated_annual_value_min INTEGER,       -- Minimum annual benefit in dollars
  estimated_annual_value_max INTEGER,       -- Maximum annual benefit in dollars
  application_url TEXT,
  required_documents TEXT[],                -- Document types needed
  application_steps JSONB NOT NULL,         -- Step-by-step form structure
  renewal_period_months INTEGER,
  is_federal BOOLEAN DEFAULT true,
  state_codes CHAR(2)[],                    -- NULL = all states, array = specific states
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- User eligibility results
CREATE TABLE eligibility_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES benefit_programs(id),
  is_eligible BOOLEAN NOT NULL,
  confidence FLOAT NOT NULL,                -- Eligibility confidence
  estimated_annual_value INTEGER,           -- Estimated benefit amount
  missing_documents TEXT[],                 -- Documents still needed
  disqualifying_factors TEXT[],             -- Why ineligible (if applicable)
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, program_id)
);

-- Applications (user's benefit applications)
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES benefit_programs(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'submitted', 'pending', 'approved', 'denied', 'appealing')),
  -- Encrypted application data
  encrypted_form_data BYTEA,                -- All form field values, encrypted
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER NOT NULL,
  documents_attached UUID[],                -- References to scanned_documents
  submitted_at TIMESTAMPTZ,
  agency_confirmation_number TEXT,
  next_action TEXT,                          -- What user needs to do next
  next_deadline TIMESTAMPTZ,
  denial_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Household members (for family plan)
CREATE TABLE household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  encrypted_name BYTEA NOT NULL,
  encrypted_dob BYTEA NOT NULL,
  encrypted_ssn BYTEA,
  relationship TEXT NOT NULL CHECK (relationship IN ('spouse', 'child', 'parent', 'sibling', 'other')),
  is_dependent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification schedule
CREATE TABLE notification_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('deadline_reminder', 'renewal_alert', 'missing_document', 'status_check', 'approval', 'denial')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  channel TEXT DEFAULT 'push' CHECK (channel IN ('push', 'sms', 'both')),
  message_en TEXT NOT NULL,
  message_es TEXT NOT NULL,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanned_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_schedule ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users access own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users access own documents" ON scanned_documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own eligibility" ON eligibility_results FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own applications" ON applications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own household" ON household_members FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own notifications" ON notification_schedule FOR ALL USING (auth.uid() = user_id);

-- Auto-delete expired scans (pg_cron job)
-- SELECT cron.schedule('delete-expired-scans', '0 * * * *', $$
--   DELETE FROM scanned_documents WHERE expires_at < NOW() AND is_in_vault = false;
-- $$);
```

---

## AI Pipeline

| Technology | Purpose | Latency Target | Cost per Request |
|------------|---------|----------------|-----------------|
| **OpenAI GPT-4o Vision** | Document data extraction (IDs, tax forms, pay stubs) | < 5 seconds | ~$0.02-0.05 per scan (high-res document image) |
| **OpenAI GPT-4o** | Form guidance, eligibility Q&A, step-by-step help | < 3 seconds | ~$0.005-0.015 per interaction |
| **On-device processing** | Document edge detection, image quality check, auto-crop | < 500ms | Free (on-device) |

### Document Scanning Pipeline

```
User Points Camera at Document
        |
        v
[1] On-Device Pre-Processing (< 500ms)
    - Document edge detection and alignment guide overlay
    - Auto-capture when document is properly aligned
    - Image quality check (blur, lighting, glare detection)
    - Auto-crop to document boundaries
    - If poor quality -> prompt user to re-scan
        |
        v
[2] Image Optimization + Encryption
    - Compress to optimal resolution for text extraction
    - Encrypt image with user's key before transmission
    - Generate temporary signed upload URL
    - Upload to Supabase encrypted storage
    - Target: < 500KB per document image
        |
        v
[3] GPT-4o Vision Extraction (< 5 seconds)
    - System prompt: document-type-specific extraction template
    - Extract all relevant fields with confidence scores
    - Structured JSON response with field-level validation
    - PII fields: name, DOB, SSN, address, income, employer
    - Tax fields: AGI, filing status, dependents, W-2 wages
    - DELETE image from processing pipeline immediately after extraction
        |
        v
[4] Data Validation + User Confirmation
    - Display extracted fields to user for review
    - Highlight low-confidence fields for manual correction
    - User confirms or corrects each field
    - Confirmed data encrypted and stored in Supabase
        |
        v
[5] Eligibility Calculation (< 2 seconds)
    - Feed confirmed data to eligibility engine
    - Cross-reference against 25+ federal program rules
    - Apply state-specific variations
    - Calculate estimated benefit amounts
    - Return ranked list of eligible programs
```

### Prompt Engineering: Document Extraction

```
SYSTEM PROMPT TEMPLATE (for GPT-4o Vision - Document Extraction):

You are GovPass, a government document data extraction system.
You are analyzing a {document_type} document.

EXTRACTION RULES:
1. Extract ALL visible text fields from the document
2. For each field, provide a confidence score (0.0-1.0)
3. If a field is partially obscured or unclear, extract what you can
   and set confidence below 0.5
4. NEVER fabricate or guess data that is not visible in the image
5. Format SSN as XXX-XX-XXXX, dates as YYYY-MM-DD, currency as integers
6. For addresses, separate into street, city, state, zip components

DOCUMENT TYPE: {document_type}
EXPECTED FIELDS: {expected_fields_for_document_type}

Respond in JSON format:
{
  "document_type_detected": "string",
  "document_type_confidence": 0.0-1.0,
  "fields": {
    "field_name": {
      "value": "extracted value",
      "confidence": 0.0-1.0,
      "location": "description of where on document"
    }
  },
  "issues": ["list of any problems with the scan"],
  "recommendations": ["suggestions for better extraction"]
}
```

### Prompt Engineering: Form Guidance

```
SYSTEM PROMPT TEMPLATE (for GPT-4o - Form Guidance):

You are GovPass, a friendly government benefits assistant helping a
{language} speaker apply for {program_name}.

USER CONTEXT:
- Household size: {household_size}
- State: {state}
- Current step: {current_step} of {total_steps}
- Step description: {step_description}

INSTRUCTIONS:
1. Explain what this step requires in plain, simple language
2. Use 6th-grade reading level maximum
3. If the user asks a question, answer specifically about their situation
4. Reference the user's pre-filled data when relevant
5. Never provide legal advice -- recommend consulting a benefits counselor
   for complex situations
6. Be encouraging -- many users are intimidated by government forms
7. If in Spanish mode, respond entirely in Spanish

Respond in JSON format:
{
  "guidance": "plain language explanation of this step",
  "tips": ["helpful tips for completing this step"],
  "common_mistakes": ["mistakes to avoid"],
  "documents_needed": ["documents needed for this step"],
  "estimated_time": "time to complete this step"
}
```

---

## Security Architecture

### Encryption Strategy

| Layer | Method | Details |
|-------|--------|---------|
| **Data in Transit** | TLS 1.3 | All API calls over HTTPS; certificate pinning on mobile |
| **Data at Rest (Database)** | AES-256 via pgcrypto | All PII columns encrypted; non-PII columns unencrypted for query performance |
| **Data at Rest (Storage)** | AES-256 (Supabase Storage) | All document images encrypted at bucket level |
| **Data at Rest (Device)** | AES-256 via MMKV | Locally cached PII encrypted with device keychain key |
| **Document Scans** | Ephemeral processing | Scan images deleted within seconds of extraction; never stored unencrypted |

### Data Retention Policy

| Data Type | Retention | Justification |
|-----------|-----------|---------------|
| Scanned document images (non-vault) | 24 hours | Only needed for extraction; auto-deleted by pg_cron |
| Scanned document images (vault) | Until user deletes | Paying subscribers can save for renewals |
| Extracted PII data | Until user deletes account | Needed for ongoing eligibility and renewals |
| Application form data | 3 years after completion | Needed for renewals and appeals |
| Eligibility calculations | Recalculated monthly | Rules change; data must stay fresh |
| AI conversation logs | 90 days | Needed for support; anonymized after 90 days |
| Analytics events | Anonymized after 30 days | No PII in analytics; PostHog retention policy |

### Security Roadmap

| Timeline | Milestone |
|----------|-----------|
| **MVP** | Column-level encryption, RLS, HTTPS, no scan retention |
| **Month 6** | SOC 2 Type I readiness assessment |
| **Month 12** | SOC 2 Type I certification |
| **Month 18** | SOC 2 Type II certification |
| **Month 24** | FedRAMP exploration (for government partnerships) |

---

## Payments

| Technology | Purpose | Pricing | Why This Choice |
|------------|---------|---------|-----------------|
| **RevenueCat** | Subscription management | Free up to $2,500 MRR; 1% over $2,500 MRR | Handles Apple/Google IAP; paywall A/B testing; subscription analytics |
| **Stripe** | Payment processing (web, future) | 2.9% + $0.30 per transaction | Industry standard; future B2B government partnerships |

### Subscription Tiers (RevenueCat Products)

| Product ID | Platform | Price | Entitlements |
|-----------|----------|-------|-------------|
| `govpass_free` | Both | $0 | `eligibility_check`, `one_application_per_year`, `basic_guidance` |
| `govpass_plus_monthly` | Both | $7.99/mo | `unlimited_applications`, `auto_fill`, `status_tracking`, `deadline_reminders`, `document_vault` |
| `govpass_plus_annual` | Both | $71.99/yr | Same as Plus monthly (25% savings) |
| `govpass_family_monthly` | Both | $14.99/mo | `five_household_members`, `shared_document_vault`, `renewal_automation`, `priority_support` |
| `govpass_family_annual` | Both | $134.99/yr | Same as Family monthly (25% savings) |

---

## Infrastructure

| Technology | Purpose | Cost (Starting) | Why This Choice |
|------------|---------|-----------------|-----------------|
| **Expo EAS** | Build & submit to app stores | $0 (free tier: 30 builds/mo) | Managed builds; OTA updates for form/rule changes without app store review |
| **Sentry** | Error tracking & performance | $0 (free: 5K errors/mo) -> $26/mo | React Native SDK; crash reporting; PII scrubbing in error reports |
| **PostHog** | Product analytics + feature flags | $0 (free: 1M events/mo) | No PII in events; feature flags for staged state rollouts; A/B testing |
| **GitHub Actions** | CI/CD pipeline | $0 (2,000 min/mo free) | Lint + test on PR; trigger EAS builds; automated deployments |
| **Cloudflare** | CDN + DNS (for landing page) | $0 (free tier) | DDoS protection; SSL; fast global delivery |

---

## Future-Proofing Strategy

### Technology Migration Paths

| Current | Future Trigger | Migration Target | Effort |
|---------|---------------|-----------------|--------|
| Supabase Edge Functions | > 50M invocations/mo | AWS Lambda + API Gateway | Medium (2-3 weeks) |
| Supabase PostgreSQL | > 500GB or need compliance partitioning | AWS RDS with encryption at rest | Medium (pgcrypto migration) |
| OpenAI GPT-4o Vision | Cost optimization or accuracy needs | Claude Vision, Gemini, or fine-tuned model | Low (swap API layer) |
| Twilio SMS | Cost at scale or need WhatsApp | AWS SNS or Vonage | Low (swap notification layer) |
| RevenueCat | > $100K MRR (1% fee significant) | Custom subscription with Stripe Billing | High (3-4 weeks) |

### Government API Integration Roadmap

Government API availability is improving rapidly. GovPass is architectured to add new integrations incrementally:

| Timeline | Integration | Status |
|----------|-------------|--------|
| **MVP** | USAGov benefits directory API | Available (free) |
| **Month 3** | BLS employment/income data API | Available (free) |
| **Month 6** | State-specific SNAP online applications (5 states) | Varies by state |
| **Month 9** | Medicaid online applications (10 states) | Varies by state |
| **Month 12** | IRS e-file API for EITC | Available (limited) |
| **Month 18** | Social Security Administration APIs | In development |
| **Year 2** | USCIS immigration status APIs | In development |

### State Program Expansion Strategy

```
Phase 1 (MVP):      CA, TX, NY, FL, IL          (5 states, 37% of US population)
Phase 2 (Month 6):  + PA, OH, GA, NC, MI        (10 states, 53% of US population)
Phase 3 (Month 12): + All top 25 by population   (25 states, 83% of US population)
Phase 4 (Month 18): All 50 states + DC + territories
```

---

## Scalability Plan

### 10x Scale (10K -> 100K users)

| Component | Current | Scaled | Action Required |
|-----------|---------|--------|-----------------|
| Supabase DB | Pro ($25/mo) | Team ($599/mo) | Add read replicas; optimize PII encryption queries |
| OpenAI API | Tier 2 | Tier 4 | Request limit increase; implement response caching for eligibility Q&A |
| Twilio | Pay-as-you-go | Volume pricing | Negotiate SMS rates; batch notification sending |
| Storage | Supabase included | Supabase + Cloudflare | CDN for static program info; optimize scan image lifecycle |

**Estimated monthly infrastructure cost at 100K users: $8,000-15,000**

### 100x Scale (10K -> 1M users)

| Component | Action Required |
|-----------|-----------------|
| Database | Managed PostgreSQL with read replicas; partition by state; optimize encryption |
| Compute | Dedicated serverless instances; AI request queuing |
| AI | Fine-tune extraction models on accumulated document data; reduce per-scan cost by 60% |
| Notifications | Dedicated Twilio infrastructure; SMS cost optimization |
| Compliance | SOC 2 Type II; state-specific data residency requirements |

**Estimated monthly infrastructure cost at 1M users: $50,000-100,000**

---

## Why This Is the Most Profitable Stack

### 1. Near-Zero Infrastructure Cost at Launch
- Supabase free tier: $0
- Expo free tier: $0
- PostHog free tier: $0
- RevenueCat free tier: $0
- **Total fixed infrastructure cost at launch: $0/month**
- Variable cost: Only AI API calls + Twilio SMS (pay-per-use)

### 2. Extremely Low Customer Acquisition Cost
- **$8 CAC** via community organization partnerships (churches, libraries, community centers)
- Social impact story generates free PR coverage
- Viral "I found $X,000 in benefits" social sharing
- SEO for "how to apply for [benefit name]" captures high-intent organic traffic
- **Zero paid advertising needed in first 6 months**

### 3. Revenue Before Cost
- Users pay $7.99-14.99/month
- Average AI cost per user per month: $1-3 (most users scan documents once, then track)
- SMS notification cost: $0.10-0.30/user/month
- **Gross margin: 80-88%** from day one

### 4. Single Developer Velocity
- React Native + Expo: Ship to both platforms from one codebase
- Supabase: No backend code for auth, database, storage, or encryption
- TypeScript end-to-end: Same language, same types, client to server
- **One developer can ship MVP in 4-5 months**

### 5. Social Impact = Free Marketing
- Every user who discovers $3,000+/year in unclaimed benefits tells their community
- Church leaders, social workers, and community organizations become organic distribution channels
- Local news coverage for "app helps residents claim thousands in benefits"
- **The product markets itself through the value it delivers**

---

## Architecture Decision Records

### ADR-001: Mobile Framework — React Native + Expo
- **Context:** Need cross-platform mobile app for iOS and Android targeting an underserved demographic (low-income households, immigrants, elderly) with document scanning, push notifications for deadline reminders, and bilingual (EN/ES) support
- **Decision:** React Native with Expo managed workflow (SDK 52+)
- **Consequences:** 95%+ code sharing; native camera APIs for document scanning with auto-alignment guides; expo-notifications for deadline/renewal reminders; expo-localization + i18next for full EN/ES bilingual support; OTA updates enable rapid form/rule changes without app store review; single codebase for a solo developer
- **Alternatives Considered:** Flutter (weaker i18n ecosystem, smaller community for government-adjacent apps), Native iOS + Android (2x development cost prohibitive for a social impact app), PWA (no camera auto-capture, no reliable push notifications, no biometric auth)

### ADR-002: Database & Backend — Supabase + pgcrypto
- **Context:** GovPass handles the most sensitive personal data imaginable (SSN, tax returns, immigration documents). Need column-level encryption for PII, Row Level Security, ephemeral document scan processing, and auto-deletion policies
- **Decision:** Supabase (PostgreSQL + pgcrypto extension + Auth + Encrypted Storage + Edge Functions) with column-level AES-256 encryption for all PII fields
- **Consequences:** pgcrypto encrypts PII columns (SSN, name, DOB, address) at the database level; Row Level Security enforces per-user data isolation; document scan images auto-deleted within 24 hours via pg_cron; Edge Functions ensure PII never leaves Supabase infrastructure during AI processing; clear SOC 2 certification pathway; open-source PostgreSQL avoids vendor lock-in
- **Alternatives Considered:** Firebase (no column-level encryption, no RLS, Google has data access), AWS Amplify + RDS (high DevOps burden for compliance), custom backend (6+ months for encryption infrastructure alone)

### ADR-003: AI Model — OpenAI GPT-4o Vision
- **Context:** Need multimodal AI that can extract structured data from diverse government documents (driver's licenses, tax returns, pay stubs, immigration papers) with high accuracy, plus a conversational assistant that explains complex government forms in plain language at a 6th-grade reading level
- **Decision:** GPT-4o Vision for document data extraction, GPT-4o for form guidance and eligibility Q&A
- **Consequences:** Vision mode extracts fields from 10+ document types with confidence scores per field; structured JSON output enables programmatic form auto-fill; form guidance responds in user's preferred language (EN/ES); 6th-grade reading level prompting makes government processes accessible; ~$0.02-0.05 per document scan, ~$0.005-0.015 per guidance interaction; images deleted from pipeline immediately after extraction
- **Alternatives Considered:** Google Document AI (good OCR but no conversational guidance), Tesseract + GPT-4o text-only (lower accuracy on complex government forms), Claude Vision (comparable quality, less mature structured extraction)

### ADR-004: Notifications — Twilio SMS
- **Context:** Target users may not have reliable internet or may ignore push notifications. Government benefit deadlines and renewal dates are time-critical and cannot be missed
- **Decision:** Twilio SMS for deadline reminders and emergency notifications, with push notifications as secondary channel
- **Consequences:** SMS reaches users even without app open or internet (critical for low-income users with limited data plans); delivery receipts confirm message received; bilingual messages (EN/ES); voice call fallback for critical deadlines; $0.0079 per SMS segment; pg_cron schedules reminders at 30/60/90 days before deadlines
- **Alternatives Considered:** Push notifications only (unreliable, can be silenced), AWS SNS (more complex setup, less developer-friendly), email only (many target users don't check email regularly)

### ADR-005: Payments — RevenueCat
- **Context:** Need subscription management with a generous free tier (the core audience cannot always afford subscriptions) and premium tiers for power users and families
- **Decision:** RevenueCat for iOS and Android subscription management with Stripe for future web/B2B payments
- **Consequences:** Handles Apple/Google IAP complexity; paywall A/B testing for conversion optimization; free tier provides eligibility check + one application/year (ensures social impact mission); Plus and Family tiers unlock unlimited applications, document vault, and renewal automation; free up to $2,500 MRR
- **Alternatives Considered:** Stripe-only (cannot handle iOS/Android IAP), custom IAP implementation (months of receipt validation development), free-only model (not sustainable without revenue)

### ADR-006: State Management — Zustand + MMKV
- **Context:** Need to manage complex multi-step application form state, encrypted document vault, eligibility results, and application tracking across screens, with encrypted local persistence for PII cached on device
- **Decision:** Zustand for client state with React Native MMKV for encrypted local storage
- **Consequences:** Zustand manages multi-form state (complex government applications spanning 10+ steps), document vault navigation, and eligibility result display; MMKV provides AES-256 encrypted local storage (30x faster than AsyncStorage) for caching PII fields, draft applications, and offline eligibility results; React Query handles server state with offline persistence for draft applications
- **Alternatives Considered:** Redux Toolkit + Redux Persist (heavy boilerplate for multi-form state), AsyncStorage (no encryption, 30x slower), Zustand without MMKV (no encrypted persistence for PII)

### ADR-007: Styling/UI — NativeWind + i18next
- **Context:** Need a civic, trustworthy visual language that works in both English and Spanish; must support RTL-ready layout for potential future languages; accessibility is critical for elderly and disabled users
- **Decision:** NativeWind 4.x for styling with i18next for full internationalization, expo-localization for locale detection
- **Consequences:** Utility-first Tailwind styling enables rapid iteration; RTL support built into NativeWind for future language expansion; i18next handles structured translation files with interpolation for dynamic benefit amounts and dates; locale-aware number/date formatting; large touch targets and high-contrast text for accessibility; Civic Helper design theme communicates trust and government credibility
- **Alternatives Considered:** Styled Components (no RTL support, runtime overhead), Tamagui (steeper learning curve), React Native Paper (Material Design aesthetic doesn't convey civic trust)

---

## Performance Budgets

| Metric | Target | Tool |
|--------|--------|------|
| Time to Interactive (TTI) | < 3s on 4G | Flashlight |
| App Bundle Size (iOS) | < 45MB | EAS Build |
| App Bundle Size (Android) | < 28MB | EAS Build |
| JS Bundle Size | < 12MB (includes EN/ES translation bundles) | Metro bundler |
| Frame Rate | 60fps (no drops below 45fps during document scanning) | React Native Perf Monitor |
| Cold Start | < 2s | Native profiler |
| Document Scan to Extraction | < 6s total (capture + upload + Vision API + extraction) | Custom timing |
| GPT-4o Vision Document Extraction | < 5s per document image | Custom timing |
| Eligibility Calculation | < 2s (25+ federal programs) | Custom timing |
| Form Auto-Fill | < 1s per step (field mapping from extracted data) | Custom timing |
| API Response (p95) | < 500ms (Edge Functions, non-AI) | Supabase Dashboard |
| Image Upload (encrypted) | < 3s on 4G for 500KB compressed document | Custom timing |
| PII Encryption/Decryption | < 100ms per field (pgcrypto) | Custom timing |
| MMKV Local Read/Write | < 5ms per encrypted key-value pair | Custom timing |
| SMS Delivery | < 30s for deadline reminders | Twilio Dashboard |
| Offline Form Access | < 1s to load cached draft application | Custom timing |
| Language Switch (EN/ES) | < 500ms full UI re-render | Custom timing |
| Memory Usage | < 250MB peak | Xcode Instruments / Android Profiler |

---

## Environment Variables

| Variable | Description | Required | Example | Where to Get |
|----------|-------------|----------|---------|--------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes | `https://xxx.supabase.co` | Supabase Dashboard > Settings > API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes | `eyJhbG...` | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (Edge Functions only) | Yes (server) | `eyJhbG...` | Supabase Dashboard > Settings > API |
| `SUPABASE_PII_ENCRYPTION_KEY` | AES-256 key for pgcrypto column-level PII encryption | Yes (server) | `base64-encoded-32-byte-key` | Generate with `openssl rand -base64 32` |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o Vision + form guidance | Yes | `sk-...` | OpenAI Platform > API Keys |
| `TWILIO_ACCOUNT_SID` | Twilio account SID for SMS reminders | Yes | `AC...` | Twilio Console > Account Info |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | Yes | `token...` | Twilio Console > Account Info |
| `TWILIO_PHONE_NUMBER` | Twilio phone number for sending SMS | Yes | `+1234567890` | Twilio Console > Phone Numbers |
| `EXPO_PUBLIC_REVENUCAT_API_KEY_IOS` | RevenueCat iOS public API key | Yes | `appl_...` | RevenueCat Dashboard > Project > API Keys |
| `EXPO_PUBLIC_REVENUCAT_API_KEY_ANDROID` | RevenueCat Android public API key | Yes | `goog_...` | RevenueCat Dashboard > Project > API Keys |
| `SENTRY_DSN` | Sentry error tracking DSN | Yes | `https://...@sentry.io/...` | Sentry Dashboard > Project Settings > DSN |
| `EXPO_PUBLIC_POSTHOG_KEY` | PostHog analytics project key (no PII in events) | No | `phc_...` | PostHog Dashboard > Project Settings |
| `USAGOV_API_KEY` | USAGov benefits directory API key | No | `api-key` | USAGov Developer Portal (free) |
| `EAS_PROJECT_ID` | Expo EAS project identifier | Yes | `uuid-string` | Expo Dashboard > Project Settings |

---

## Local Development Setup

### Prerequisites
- Node.js 20+ (LTS)
- pnpm 9+ or npm 10+
- Expo CLI (`npx expo`)
- iOS Simulator (Xcode 16+) or Android Emulator (Android Studio Ladybug+)
- Supabase CLI (`brew install supabase/tap/supabase`)
- OpenAI API key (for document extraction and form guidance testing)
- Twilio test credentials (for SMS reminder testing)

### Steps
1. Clone repository: `git clone https://github.com/govpass/govpass-app.git`
2. Install dependencies: `pnpm install`
3. Copy environment file: `cp .env.example .env.local`
4. Fill in environment variables (see Environment Variables table above)
5. Generate PII encryption key: `openssl rand -base64 32` (add to `.env.local` as `SUPABASE_PII_ENCRYPTION_KEY`)
6. Start Supabase locally: `npx supabase start`
7. Run database migrations (includes pgcrypto extension): `npx supabase db push`
8. Seed benefit program data and eligibility rules: `npx supabase db seed`
9. Load translation files: translations are bundled in `src/locales/` (en.json, es.json)
10. Start development server: `npx expo start`
11. Run on iOS simulator: `npx expo run:ios`
12. Run on Android emulator: `npx expo run:android`

### Local Supabase Services
After `npx supabase start`, the following local services are available:
| Service | URL |
|---------|-----|
| Supabase Studio | `http://localhost:54323` |
| API Gateway | `http://localhost:54321` |
| Database (PostgreSQL + pgcrypto) | `postgresql://postgres:postgres@localhost:54322/postgres` |
| Edge Functions | `http://localhost:54321/functions/v1/` |
| Storage (encrypted buckets) | `http://localhost:54321/storage/v1/` |
| Inbucket (email testing) | `http://localhost:54324` |

### Testing Notes
- **Document scanning:** Sample government document images provided in `test/fixtures/documents/` (driver's license, W-2, pay stub, etc.) for Vision API testing
- **Twilio SMS:** Use Twilio test credentials to avoid charges during development; test number `+15005550006` simulates successful delivery
- **pgcrypto encryption:** Local Supabase automatically enables pgcrypto; use Supabase Studio to verify encrypted columns contain BYTEA data
- **Bilingual testing:** Switch language via Settings screen or set device locale to `es` to test Spanish translations
- **Eligibility engine:** Test with various household sizes, income levels, and state codes using seed data profiles

### Running Tests
```bash
pnpm test                   # Unit tests (eligibility rules, encryption, form mapping, i18n)
pnpm test:e2e               # Detox E2E tests (iOS simulator)
pnpm lint                   # ESLint + TypeScript check
pnpm typecheck              # TypeScript strict mode check
```
