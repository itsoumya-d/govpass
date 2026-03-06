# GovPass API Guide

**All external APIs with pricing, setup, PII handling, code snippets, and cost projections.**

---

## API Philosophy

GovPass integrates with external APIs that handle the most sensitive personal data Americans possess: Social Security numbers, tax returns, immigration documents, and income information. Every API integration is designed with a **zero-trust PII policy**: minimize what is sent, encrypt what must be sent, and delete what has been processed. No external API should ever retain GovPass user data beyond the duration of a single request.

---

## API 1: OpenAI API (Form Guidance & Eligibility Q&A)

### Overview

| Property | Value |
|----------|-------|
| **Purpose** | AI-powered form guidance, eligibility question answering, step-by-step application help |
| **Model** | GPT-4o (for text-only interactions) |
| **Pricing** | $2.50/1M input tokens, $10.00/1M output tokens |
| **Auth** | API key (Bearer token) |
| **Docs** | https://platform.openai.com/docs/api-reference |
| **Rate Limits** | Tier 1: 500 RPM, 200K TPM; Tier 4: 10,000 RPM, 2M TPM |

### Setup

```bash
# Install the OpenAI SDK
npm install openai

# Environment variable
OPENAI_API_KEY=sk-...
```

### Code Snippet: Form Guidance

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GuidanceResponse {
  guidance: string;
  tips: string[];
  common_mistakes: string[];
  documents_needed: string[];
  estimated_time: string;
}

async function getFormGuidance(
  programName: string,
  stepNumber: number,
  totalSteps: number,
  stepDescription: string,
  householdSize: number,
  state: string,
  language: 'en' | 'es'
): Promise<GuidanceResponse> {
  const languageInstruction = language === 'es'
    ? 'Respond entirely in Spanish.'
    : 'Respond in English.';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    max_tokens: 400,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are GovPass, a friendly government benefits assistant.
You are helping a user apply for ${programName}.
Household size: ${householdSize}. State: ${state}.
Current step: ${stepNumber} of ${totalSteps}.
Step: "${stepDescription}"

Use 6th-grade reading level. Be encouraging.
Never provide legal advice.
${languageInstruction}

Respond in JSON: { "guidance": string, "tips": string[], "common_mistakes": string[], "documents_needed": string[], "estimated_time": string }`
      },
      {
        role: 'user',
        content: `What do I need to do for this step?`
      }
    ],
  });

  return JSON.parse(response.choices[0].message.content!) as GuidanceResponse;
}
```

### PII Handling

- **NEVER send SSN, full name, or address to OpenAI for guidance queries.** Guidance prompts use only program name, step description, household size, and state.
- If a user asks a question that includes PII (e.g., "My SSN is 123-45-6789, is this right?"), strip PII from the message before sending to OpenAI.
- Use a PII stripping regex on all user messages before API transmission.

```typescript
function stripPII(text: string): string {
  // Strip SSN patterns
  text = text.replace(/\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g, '[SSN_REMOVED]');
  // Strip phone numbers
  text = text.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE_REMOVED]');
  // Strip email addresses
  text = text.replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '[EMAIL_REMOVED]');
  return text;
}
```

### Alternatives

| Alternative | Pros | Cons |
|-------------|------|------|
| **Anthropic Claude** | Strong safety features, good for sensitive content | Slightly different API structure |
| **Google Gemini** | Competitive pricing, good multilingual | Less mature API ecosystem |
| **Open-source (Llama)** | No data leaves your servers | Requires GPU infrastructure; lower quality |

### Error Handling

```typescript
try {
  const response = await getFormGuidance(/* params */);
  return response;
} catch (error: any) {
  if (error.status === 429) {
    // Rate limited -- retry with exponential backoff
    await sleep(Math.pow(2, retryCount) * 1000);
    return retry(/* params */);
  }
  if (error.status === 500 || error.status === 503) {
    // OpenAI service issue -- show cached guidance if available
    return getCachedGuidance(programName, stepNumber);
  }
  // Fallback: show static guidance text
  return getStaticGuidance(programName, stepNumber, language);
}
```

---

## API 2: OpenAI Vision API (Document Scanning)

### Overview

| Property | Value |
|----------|-------|
| **Purpose** | Extract structured data from scanned government documents (IDs, tax forms, pay stubs) |
| **Model** | GPT-4o (with vision/image input) |
| **Pricing** | $2.50/1M input tokens (images cost varies by resolution: ~765 tokens for low detail, ~1,105 for 512x512 tiles) |
| **Auth** | Same API key as text API |
| **Docs** | https://platform.openai.com/docs/guides/vision |

### Setup

Same SDK as OpenAI text API. No additional setup required.

### Code Snippet: Document Data Extraction

```typescript
import OpenAI from 'openai';

interface ExtractedField {
  value: string;
  confidence: number;
  location: string;
}

interface ExtractionResult {
  document_type_detected: string;
  document_type_confidence: number;
  fields: Record<string, ExtractedField>;
  issues: string[];
  recommendations: string[];
}

async function extractDocumentData(
  imageBase64: string,
  documentType: string
): Promise<ExtractionResult> {
  const expectedFields: Record<string, string[]> = {
    drivers_license: ['full_name', 'date_of_birth', 'address', 'license_number', 'expiration_date', 'state'],
    w2: ['employee_name', 'ssn', 'employer_name', 'employer_ein', 'wages', 'federal_tax_withheld', 'state_tax_withheld', 'tax_year'],
    pay_stub: ['employee_name', 'employer_name', 'pay_period', 'gross_pay', 'net_pay', 'ytd_gross', 'deductions'],
    ssn_card: ['full_name', 'ssn'],
    tax_return_1040: ['filing_status', 'full_name', 'ssn', 'agi', 'taxable_income', 'total_tax', 'refund_amount', 'tax_year'],
  };

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.1,  // Low temperature for extraction accuracy
    max_tokens: 800,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a government document data extraction system.
Document type: ${documentType}.
Expected fields: ${JSON.stringify(expectedFields[documentType] || [])}.

RULES:
1. Extract ALL visible text fields
2. Provide confidence score 0.0-1.0 per field
3. NEVER fabricate data not visible in the image
4. Format SSN as XXX-XX-XXXX, dates as YYYY-MM-DD, currency as integers (cents)
5. Separate addresses into: street, city, state, zip

Respond in JSON: {
  "document_type_detected": string,
  "document_type_confidence": number,
  "fields": { "field_name": { "value": string, "confidence": number, "location": string } },
  "issues": string[],
  "recommendations": string[]
}`
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
              detail: 'high',  // High detail for document text extraction
            },
          },
          {
            type: 'text',
            text: 'Extract all data fields from this document.',
          },
        ],
      },
    ],
  });

  return JSON.parse(response.choices[0].message.content!) as ExtractionResult;
}
```

### PII Handling (CRITICAL)

```
Document Scan PII Flow:
1. User captures image on device
2. Image encrypted with AES-256 before upload
3. Image uploaded to Supabase encrypted storage (temporary URL, 60-second expiry)
4. Edge Function downloads image, sends to OpenAI Vision API
5. OpenAI extracts data and returns structured JSON
6. Edge Function DELETES image from storage immediately
7. Extracted data encrypted with pgcrypto and stored in database
8. Original image is GONE -- only encrypted extracted text remains

OpenAI Data Retention:
- OpenAI API does NOT retain data from API requests (as of their data usage policy)
- Request: "Opt out of data training" via organization settings
- Set: organization-level data retention to zero days
```

### Image Optimization for Cost

```typescript
async function optimizeDocumentImage(uri: string): Promise<string> {
  // Resize to max 2048px on longest side (high detail for text)
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 2048 } }],
    {
      compress: 0.8,      // 80% quality JPEG
      format: SaveFormat.JPEG,
    }
  );

  // Convert to base64
  const base64 = await FileSystem.readAsStringAsync(
    manipulated.uri,
    { encoding: FileSystem.EncodingType.Base64 }
  );

  return base64;  // Typically 200-500KB for a document image
}
```

### Cost per Scan

| Document Type | Avg Image Tokens | Input Tokens (prompt) | Output Tokens | Total Cost |
|---------------|-----------------|----------------------|---------------|------------|
| Driver's License | ~1,100 | ~300 | ~400 | ~$0.008 |
| W-2 Tax Form | ~2,200 (high detail) | ~400 | ~600 | ~$0.013 |
| Pay Stub | ~1,800 | ~350 | ~500 | ~$0.011 |
| 1040 Tax Return | ~3,000 (high detail) | ~400 | ~700 | ~$0.016 |
| Average | ~2,000 | ~360 | ~550 | **~$0.012** |

---

## API 3: Twilio (SMS Notifications)

### Overview

| Property | Value |
|----------|-------|
| **Purpose** | SMS deadline reminders, status update notifications, renewal alerts |
| **Pricing** | $0.0079/outbound SMS (US), $1.15/mo per phone number, $0.0075/inbound SMS |
| **Auth** | Account SID + Auth Token |
| **Docs** | https://www.twilio.com/docs/sms |
| **Free Trial** | $15 trial credit (no credit card) |

### Setup

```bash
# Install Twilio SDK
npm install twilio

# Environment variables
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

### Code Snippet: Send Bilingual Notification

```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

interface NotificationContent {
  en: string;
  es: string;
}

const NOTIFICATION_TEMPLATES: Record<string, NotificationContent> = {
  deadline_reminder_3day: {
    en: 'GovPass: Your {program} application is due in 3 days. Open the app to finish: {link}',
    es: 'GovPass: Su solicitud de {program} vence en 3 dias. Abra la app para terminar: {link}',
  },
  renewal_alert_30day: {
    en: 'GovPass: Your {program} benefits renew in 30 days. Start your renewal now: {link}',
    es: 'GovPass: Sus beneficios de {program} se renuevan en 30 dias. Comience su renovacion: {link}',
  },
  approval: {
    en: 'GovPass: Great news! Your {program} application has been approved. Details: {link}',
    es: 'GovPass: Buenas noticias! Su solicitud de {program} ha sido aprobada. Detalles: {link}',
  },
  missing_document: {
    en: 'GovPass: Your {program} application needs a {document}. Scan it now: {link}',
    es: 'GovPass: Su solicitud de {program} necesita un/a {document}. Escanee ahora: {link}',
  },
};

async function sendNotificationSMS(
  to: string,
  templateKey: string,
  language: 'en' | 'es',
  variables: Record<string, string>
): Promise<void> {
  const template = NOTIFICATION_TEMPLATES[templateKey];
  if (!template) throw new Error(`Unknown template: ${templateKey}`);

  let message = template[language];
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(`{${key}}`, value);
  }

  // Append opt-out instruction
  const optOut = language === 'es'
    ? '\nResponda STOP para cancelar.'
    : '\nReply STOP to unsubscribe.';

  await client.messages.create({
    body: message + optOut,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: to,
  });
}
```

### PII Handling

- **NEVER include SSN, income, or detailed personal data in SMS messages.** SMS is not encrypted end-to-end.
- Messages contain only: program name, deadline date, and a deep link to the app.
- Deep links use one-time tokens that expire after 24 hours.
- Phone numbers stored encrypted in Supabase; decrypted only when sending SMS.

### Opt-In/Opt-Out Compliance

```typescript
// Handle inbound SMS for STOP/START
// Configured via Twilio webhook -> Supabase Edge Function
async function handleInboundSMS(from: string, body: string): Promise<string> {
  const normalized = body.trim().toUpperCase();

  if (['STOP', 'PARAR', 'CANCELAR', 'UNSUBSCRIBE'].includes(normalized)) {
    await updateSMSPreference(from, false);
    return 'You have been unsubscribed from GovPass SMS notifications. Reply START to re-subscribe.';
  }

  if (['START', 'INICIAR', 'SUBSCRIBE'].includes(normalized)) {
    await updateSMSPreference(from, true);
    return 'You have been re-subscribed to GovPass SMS notifications. Reply STOP to unsubscribe.';
  }

  return 'GovPass: Reply STOP to unsubscribe or open the app for assistance.';
}
```

### Alternatives

| Alternative | Pricing | Pros | Cons |
|-------------|---------|------|------|
| **AWS SNS** | $0.00645/SMS (US) | Cheaper per message; AWS ecosystem | Less developer-friendly; no conversation management |
| **Vonage (Nexmo)** | $0.0068/SMS (US) | Competitive pricing; WhatsApp support | Smaller community; less documentation |
| **MessageBird** | $0.007/SMS (US) | Good international support | Less US-focused |

---

## API 4: Supabase (Encrypted PII Storage)

### Overview

| Property | Value |
|----------|-------|
| **Purpose** | Database (encrypted PII), authentication, file storage, edge functions, real-time subscriptions |
| **Pricing** | Free: 500MB DB, 1GB storage, 500K edge function invocations; Pro: $25/mo (8GB DB, 100GB storage) |
| **Auth** | Supabase URL + anon key (client); service role key (server) |
| **Docs** | https://supabase.com/docs |

### Setup

```bash
# Install Supabase client
npm install @supabase/supabase-js

# Environment variables
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-side only, NEVER in client code
```

### Code Snippet: Encrypted PII Storage

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Edge Function: Store encrypted PII
// Uses pgcrypto for column-level encryption
async function storeEncryptedProfile(
  userId: string,
  fullName: string,
  ssn: string,
  dob: string,
  address: string,
  encryptionKey: string
): Promise<void> {
  const { error } = await supabase.rpc('upsert_encrypted_profile', {
    p_user_id: userId,
    p_full_name: fullName,
    p_ssn: ssn,
    p_dob: dob,
    p_address: address,
    p_encryption_key: encryptionKey,
  });

  if (error) throw new Error(`Failed to store profile: ${error.message}`);
}

// Corresponding PostgreSQL function:
// CREATE OR REPLACE FUNCTION upsert_encrypted_profile(
//   p_user_id UUID,
//   p_full_name TEXT,
//   p_ssn TEXT,
//   p_dob TEXT,
//   p_address TEXT,
//   p_encryption_key TEXT
// ) RETURNS VOID AS $$
// BEGIN
//   INSERT INTO profiles (id, encrypted_full_name, encrypted_ssn, encrypted_dob, encrypted_address)
//   VALUES (
//     p_user_id,
//     pgp_sym_encrypt(p_full_name, p_encryption_key),
//     pgp_sym_encrypt(p_ssn, p_encryption_key),
//     pgp_sym_encrypt(p_dob, p_encryption_key),
//     pgp_sym_encrypt(p_address, p_encryption_key)
//   )
//   ON CONFLICT (id) DO UPDATE SET
//     encrypted_full_name = pgp_sym_encrypt(p_full_name, p_encryption_key),
//     encrypted_ssn = pgp_sym_encrypt(p_ssn, p_encryption_key),
//     encrypted_dob = pgp_sym_encrypt(p_dob, p_encryption_key),
//     encrypted_address = pgp_sym_encrypt(p_address, p_encryption_key),
//     updated_at = NOW();
// END;
// $$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Code Snippet: Temporary Document Storage

```typescript
// Upload scanned document to encrypted temporary storage
async function uploadTemporaryScan(
  userId: string,
  imageBase64: string,
  documentType: string
): Promise<string> {
  const fileName = `scans/${userId}/${Date.now()}_${documentType}.jpg`;

  // Decode base64 to buffer
  const buffer = Buffer.from(imageBase64, 'base64');

  // Upload to encrypted bucket
  const { data, error } = await supabase.storage
    .from('encrypted-documents')
    .upload(fileName, buffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  // Create signed URL that expires in 60 seconds
  const { data: urlData } = await supabase.storage
    .from('encrypted-documents')
    .createSignedUrl(fileName, 60);

  // Schedule deletion (failsafe -- pg_cron also cleans up)
  setTimeout(async () => {
    await supabase.storage.from('encrypted-documents').remove([fileName]);
  }, 60_000);

  return urlData!.signedUrl;
}
```

### Data Retention Policy Implementation

```sql
-- Auto-delete expired scans every hour via pg_cron
SELECT cron.schedule(
  'delete-expired-scans',
  '0 * * * *',
  $$DELETE FROM scanned_documents WHERE expires_at < NOW() AND is_in_vault = false$$
);

-- Anonymize AI logs after 90 days
SELECT cron.schedule(
  'anonymize-ai-logs',
  '0 2 * * *',
  $$UPDATE applications
    SET encrypted_form_data = NULL
    WHERE status IN ('approved', 'denied')
    AND updated_at < NOW() - INTERVAL '3 years'$$
);
```

---

## API 5: USAGov APIs (Benefits Data)

### Overview

| Property | Value |
|----------|-------|
| **Purpose** | Federal benefits program data, eligibility criteria, agency contact information |
| **Pricing** | FREE (government public data) |
| **Auth** | API key (free registration) |
| **Docs** | https://www.usa.gov/developer |
| **Rate Limits** | Generally generous; varies by endpoint |

### Available Endpoints

| Endpoint | Data | Usage in GovPass |
|----------|------|-----------------|
| **Benefits.gov API** | Federal benefit program listings, descriptions, eligibility criteria | Seed and update the benefit_programs table; validate eligibility rules |
| **USAGov Content API** | Government agency information, contact details, office locations | Agency contact info for application tracker; office addresses |
| **Federal Register API** | Regulatory changes, proposed rules | Monitor for eligibility rule changes that affect GovPass calculations |

### Code Snippet: Fetch Benefits Data

```typescript
interface BenefitProgram {
  id: string;
  title: string;
  description: string;
  agency: string;
  eligibility: string;
  applicationUrl: string;
  category: string;
}

async function fetchFederalBenefits(): Promise<BenefitProgram[]> {
  const response = await fetch(
    'https://api.usa.gov/benefits/search.json?api_key=' +
    process.env.USAGOV_API_KEY +
    '&keyword=assistance'
  );

  if (!response.ok) {
    throw new Error(`USAGov API error: ${response.status}`);
  }

  const data = await response.json();
  return data.results.map((result: any) => ({
    id: result.id,
    title: result.title,
    description: result.body,
    agency: result.agency,
    eligibility: result.eligibility,
    applicationUrl: result.application_url,
    category: result.category,
  }));
}

// Schedule weekly sync to catch program updates
// Run via pg_cron or scheduled Edge Function
async function syncBenefitPrograms(): Promise<void> {
  const programs = await fetchFederalBenefits();

  for (const program of programs) {
    await supabase
      .from('benefit_programs')
      .upsert({
        program_code: program.id,
        program_name: program.title,
        description: program.description,
        agency: program.agency,
        application_url: program.applicationUrl,
        last_updated: new Date().toISOString(),
      }, { onConflict: 'program_code' });
  }
}
```

### PII Handling

- USAGov APIs contain only public program data. No PII is ever sent to these endpoints.
- These APIs are read-only references; no user data transmitted.

---

## API 6: Bureau of Labor Statistics API (Employment Data)

### Overview

| Property | Value |
|----------|-------|
| **Purpose** | Employment data, area median income, cost of living data for eligibility calculations |
| **Pricing** | FREE (government public data) |
| **Auth** | API key (free registration, optional but increases rate limits) |
| **Docs** | https://www.bls.gov/developers/ |
| **Rate Limits** | 25 queries/second without key; 500 queries/second with key |

### Code Snippet: Fetch Area Median Income

```typescript
async function fetchAreaMedianIncome(
  stateCode: string,
  year: number
): Promise<number> {
  // BLS series for median household income by state
  const seriesId = `LAUST${stateCode}0000000000006`;

  const response = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      seriesid: [seriesId],
      startyear: year.toString(),
      endyear: year.toString(),
      registrationkey: process.env.BLS_API_KEY,
    }),
  });

  const data = await response.json();
  const latestValue = data.Results?.series?.[0]?.data?.[0]?.value;

  return latestValue ? parseInt(latestValue) : 0;
}
```

### Usage in GovPass

- Calculate area median income for Section 8 eligibility (50% AMI threshold)
- Verify employment data for state-specific work requirements
- Determine cost of living adjustments for benefit calculations

---

## API 7: Stripe + RevenueCat (Payments)

### RevenueCat Overview

| Property | Value |
|----------|-------|
| **Purpose** | Mobile subscription management (iOS + Android) |
| **Pricing** | Free up to $2,500 MRR; 1% of MRR above $2,500; enterprise pricing available |
| **Auth** | Public SDK key (client), secret API key (server) |
| **Docs** | https://www.revenuecat.com/docs |

### Stripe Overview

| Property | Value |
|----------|-------|
| **Purpose** | Payment processing (web signups, future B2B) |
| **Pricing** | 2.9% + $0.30 per transaction |
| **Auth** | Publishable key (client), secret key (server) |
| **Docs** | https://stripe.com/docs |

### Setup

```bash
# Install SDKs
npm install react-native-purchases   # RevenueCat
npm install @stripe/stripe-react-native  # Stripe (future web)

# Environment variables
REVENUECAT_API_KEY=appl_...          # iOS
REVENUECAT_API_KEY_ANDROID=goog_...  # Android
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
```

### Code Snippet: RevenueCat Subscription Check

```typescript
import Purchases, {
  PurchasesOffering,
  CustomerInfo,
} from 'react-native-purchases';

// Initialize RevenueCat
async function initializePurchases(): Promise<void> {
  await Purchases.configure({
    apiKey: Platform.OS === 'ios'
      ? process.env.REVENUECAT_API_KEY!
      : process.env.REVENUECAT_API_KEY_ANDROID!,
  });
}

// Check subscription tier
async function getSubscriptionTier(): Promise<'free' | 'plus' | 'family'> {
  const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();

  if (customerInfo.entitlements.active['family']) {
    return 'family';
  }
  if (customerInfo.entitlements.active['plus']) {
    return 'plus';
  }
  return 'free';
}

// Fetch available offerings (for paywall)
async function getOfferings(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

// Purchase subscription
async function purchaseSubscription(
  packageToPurchase: any
): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    return customerInfo.entitlements.active['plus'] !== undefined
        || customerInfo.entitlements.active['family'] !== undefined;
  } catch (error: any) {
    if (error.userCancelled) {
      return false;  // User cancelled -- not an error
    }
    throw error;
  }
}
```

### Paywall Conversion Strategy

```typescript
// Show paywall at high-value moments
function shouldShowPaywall(
  trigger: string,
  currentTier: string,
  eligibleBenefitsValue: number
): boolean {
  if (currentTier !== 'free') return false;

  const highValueTriggers = [
    'second_application_attempt',    // After free application used
    'auto_fill_blocked',             // When user tries auto-fill on free tier
    'deadline_approaching',          // When deadline reminder shows value
  ];

  // Show paywall when user's eligible benefits exceed $1,000/year
  // "Pay $7.99/month to unlock $3,200/year in benefits"
  if (eligibleBenefitsValue > 1000 && highValueTriggers.includes(trigger)) {
    return true;
  }

  return false;
}
```

---

## Cost Projections

### Per-User Monthly Cost

| Component | Free User | Plus User ($7.99/mo) | Family User ($14.99/mo) |
|-----------|----------|---------------------|------------------------|
| **OpenAI Vision (scans)** | 1 scan = $0.012 | 3 scans/mo = $0.036 | 8 scans/mo = $0.096 |
| **OpenAI Text (guidance)** | 5 queries = $0.05 | 20 queries/mo = $0.20 | 40 queries/mo = $0.40 |
| **Twilio SMS** | $0 (push only) | 4 SMS/mo = $0.032 | 8 SMS/mo = $0.063 |
| **Supabase (allocated)** | $0.01 | $0.03 | $0.05 |
| **RevenueCat fee** | $0 | $0.08 (1% of $7.99) | $0.15 (1% of $14.99) |
| **Total variable cost** | **$0.07** | **$0.38** | **$0.76** |
| **Gross margin** | N/A | **95.2%** | **94.9%** |

### Monthly Infrastructure Cost by Scale

| Users | Free (70%) | Plus (20%) | Family (10%) | OpenAI Cost | Twilio Cost | Supabase | RevenueCat | Total Infra | MRR | Gross Margin |
|-------|-----------|-----------|-------------|------------|------------|---------|-----------|------------|-----|-------------|
| **1,000** | 700 | 200 | 100 | $135 | $10 | $25 | $31 | **$201** | $3,097 | **93.5%** |
| **10,000** | 7,000 | 2,000 | 1,000 | $1,350 | $99 | $25 | $310 | **$1,784** | $30,970 | **94.2%** |
| **50,000** | 35,000 | 10,000 | 5,000 | $6,750 | $495 | $599 | $1,549 | **$9,393** | $154,850 | **93.9%** |
| **100,000** | 70,000 | 20,000 | 10,000 | $13,500 | $989 | $599 | $3,097 | **$18,185** | $309,700 | **94.1%** |

### Cost Optimization Strategies

| Strategy | Savings | When to Implement |
|----------|---------|-------------------|
| **Cache eligibility Q&A** | 30-40% reduction in OpenAI text calls | Month 3 (after identifying common questions) |
| **Batch notification sending** | 15% reduction in Twilio costs | Month 6 (after notification volume increases) |
| **Fine-tune extraction model** | 40-50% reduction in Vision API costs (smaller model, fewer tokens) | Month 12 (after accumulating training data) |
| **Negotiate Twilio volume pricing** | 20-30% reduction in SMS costs | Month 6 (at 10K+ messages/month) |
| **RevenueCat enterprise pricing** | Cap at negotiated rate instead of 1% | Month 12 (at $100K+ MRR) |
| **On-device pre-processing** | 20% reduction in Vision API calls (reject poor quality locally) | Month 3 |

---

## API Security Checklist

| Requirement | Implementation | Status |
|-------------|---------------|--------|
| All API keys stored in environment variables, never in client code | Supabase Edge Functions hold all API keys | Required |
| PII stripped from OpenAI text guidance requests | Regex PII stripping before API call | Required |
| Document images deleted within 60 seconds of extraction | Supabase storage auto-delete + pg_cron failsafe | Required |
| OpenAI data training opted out | Organization settings: data not used for training | Required |
| Twilio SMS never contains SSN, income, or detailed PII | Template system with approved message formats only | Required |
| USAGov and BLS APIs never receive user data | Read-only reference data; no user data transmitted | Required |
| All API calls via HTTPS/TLS 1.3 | Default for all listed APIs | Required |
| API key rotation schedule | Quarterly rotation for all API keys | Required |
| Rate limiting on Edge Functions | Supabase built-in + custom per-user limits | Required |
| Error responses never expose PII | Custom error handler strips PII from error messages and logs | Required |
