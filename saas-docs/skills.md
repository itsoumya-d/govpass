# GovPass Skills

**Technical, domain, design, and business skills needed to build GovPass.**

---

## Skills Philosophy

GovPass sits at the intersection of AI technology, government policy, and serving vulnerable populations. The technical skills are important, but the domain knowledge and design sensitivity are what separate a useful product from a dangerous one. Getting a government form wrong can cost someone their benefits, their housing, or their legal status. The skills below are organized by criticality -- the domain and design skills are not "nice to have" but fundamental requirements.

---

## Technical Skills

### Core Development

| Skill | Level Required | Why It Matters | How to Build It |
|-------|---------------|----------------|-----------------|
| **React Native** | Advanced | Core mobile framework for iOS + Android; handles camera integration, push notifications, complex multi-step forms | Build 2-3 React Native apps; focus on camera APIs, form state management, and navigation patterns |
| **Expo** | Advanced | Camera APIs for document scanning, push notifications, OTA updates for form/rule changes without app store review | Ship at least one Expo app to App Store + Google Play; use EAS Build and EAS Update |
| **TypeScript** | Advanced | Type safety is critical when handling PII extraction from AI; structured AI response parsing; form field mapping | Use strict mode; practice typing AI API responses, encrypted field handlers, and complex form state |
| **Zustand** | Intermediate | Manages complex state across document scanning, form filling, and application tracking | Build a multi-step form app with save/resume; practice persistent state with MMKV |
| **React Query (TanStack)** | Intermediate | Caches eligibility results; manages polling for application status; offline support for draft applications | Practice with paginated API calls, optimistic updates, and offline persistence |
| **React Native Reanimated** | Intermediate | Smooth animations for document alignment guides, progress bars, celebration states | Build camera overlay animations and progress indicator prototypes |
| **NativeWind** | Intermediate | Rapid Civic Helper theme implementation; consistent spacing; responsive layout for bilingual text | Complete NativeWind tutorial; build themed component library |

### AI & Document Processing

| Skill | Level Required | Why It Matters | How to Build It |
|-------|---------------|----------------|-----------------|
| **OpenAI API** | Intermediate | Form guidance, eligibility Q&A, step-by-step help; manages conversation context for multi-step assistance | Build a chatbot with structured JSON responses; practice system prompts; implement token budgeting |
| **OpenAI Vision API** | Intermediate | Document data extraction from IDs, tax forms, pay stubs; confidence scoring; structured output parsing | Practice with document images; build extraction pipelines with validation; test edge cases (blurry, glare, partial) |
| **Prompt Engineering** | Intermediate-Advanced | Extraction accuracy depends entirely on prompt quality; must handle diverse document formats and quality levels | Study extraction prompt patterns; A/B test prompts; build evaluation datasets for accuracy measurement |
| **AI Response Validation** | Intermediate | Validate extracted data (SSN format, date ranges, income amounts); catch hallucinations; flag low-confidence fields | Build validation schemas for each document type; implement confidence thresholds; practice error handling |

### Backend & Security

| Skill | Level Required | Why It Matters | How to Build It |
|-------|---------------|----------------|-----------------|
| **Supabase** | Intermediate-Advanced | Database, auth, storage, edge functions; column-level encryption for PII; row-level security | Complete Supabase tutorial; practice pgcrypto encryption; implement RLS policies; build edge functions |
| **PostgreSQL** | Intermediate | Schema design with encrypted columns; efficient queries on encrypted data; pg_cron for scheduled tasks | Practice pgcrypto functions; design schemas with mixed encrypted/unencrypted columns; optimize indexes |
| **Encryption (AES-256)** | Intermediate-Advanced | All PII must be encrypted at rest and in transit; key management; secure document storage lifecycle | Study pgcrypto AES encryption; implement encryption/decryption helpers; understand key rotation |
| **Supabase Edge Functions (Deno)** | Intermediate | AI API orchestration; PII processing in secure server environment; webhook handlers | Build Edge Functions for AI pipeline; practice Deno TypeScript; implement request validation |
| **Authentication** | Intermediate | Phone auth for users without email; magic links; SSO; session management; JWT handling | Implement Supabase Auth with phone + magic link + Apple/Google SSO; practice token refresh patterns |

### Notifications & Payments

| Skill | Level Required | Why It Matters | How to Build It |
|-------|---------------|----------------|-----------------|
| **Twilio SMS API** | Basic-Intermediate | Send deadline reminders and status updates via SMS; handle opt-in/opt-out; bilingual messages | Complete Twilio quickstart; send bilingual SMS; implement opt-out handling; practice webhook responses |
| **Expo Notifications** | Intermediate | Push notification scheduling; deep linking from notifications; local notifications for drafts | Implement push notifications with Expo; practice notification scheduling and deep linking |
| **RevenueCat** | Intermediate | Subscription management across iOS + Android; paywall A/B testing; entitlement checking | Integrate RevenueCat SDK; build paywall screen; implement entitlement-gated features |
| **Stripe** | Basic | Web payment processing (future); understand payment flows | Basic Stripe integration knowledge; will become more important for web and B2B |

### DevOps & Quality

| Skill | Level Required | Why It Matters | How to Build It |
|-------|---------------|----------------|-----------------|
| **Git** | Intermediate | Version control; branching strategy; code review | Standard git workflow; practice branching and rebasing |
| **GitHub Actions** | Basic | CI/CD pipeline; automated testing; EAS build triggers | Set up lint + test + build pipeline; practice EAS integration |
| **Sentry** | Basic | Error tracking with PII scrubbing; crash reporting; performance monitoring | Integrate Sentry React Native SDK; configure PII scrubbing rules; practice alert setup |
| **PostHog** | Basic | Analytics without PII; feature flags for staged rollouts; A/B testing | Implement event tracking; practice feature flag conditional rendering |
| **Testing (Jest/Detox)** | Intermediate | Unit tests for eligibility rules; integration tests for AI pipeline; E2E tests for application flows | Write eligibility rule unit tests; build AI response mocking; practice Detox E2E testing |

---

## Domain Skills

### Federal Benefits Programs (CRITICAL)

This is the most critical skill area. Mistakes in eligibility determination or form guidance can cost users their benefits, waste their time on ineligible programs, or cause them to miss deadlines.

| Program | Knowledge Depth | Key Complexity | Learning Resources |
|---------|----------------|----------------|-------------------|
| **SNAP (Food Stamps)** | Deep | Income limits vary by state and household size; categorical eligibility; work requirements; immigration status restrictions | USDA SNAP policy manual; state-specific SNAP handbooks; Benefits.gov |
| **Medicaid** | Deep | 50 different state programs; expansion vs. non-expansion states; income thresholds; pregnancy and disability categories | CMS Medicaid.gov; Kaiser Family Foundation state guides |
| **EITC (Earned Income Tax Credit)** | Deep | Income curves (benefit increases then decreases); qualifying children rules; filing status requirements; investment income limits | IRS Publication 596; Tax Policy Center resources |
| **SSI (Supplemental Security Income)** | Intermediate | Disability determination; income and asset limits; living arrangement rules; concurrent benefits | SSA Red Book; SSI policy manual |
| **WIC** | Intermediate | Nutritional risk criteria; income at 185% FPL; pregnant/postpartum/child under 5; state agency variations | USDA WIC policy manual |
| **Section 8 / Housing Choice Vouchers** | Intermediate | Waitlists (often years long); income at 50% area median; local housing authority variations; voucher portability | HUD Section 8 handbook |
| **CHIP (Children's Health Insurance)** | Intermediate | Income thresholds above Medicaid but below 200-300% FPL; state-specific names and rules | Medicaid.gov CHIP resources |
| **LIHEAP (Heating/Cooling Assistance)** | Basic-Intermediate | Seasonal programs; income at 150% FPL or 60% state median; block grant allocation varies by state | HHS LIHEAP clearinghouse |
| **Head Start** | Basic | Income at 100% FPL; priority groups; local program availability; Early Head Start for under 3 | ACF Head Start resources |
| **Pell Grants** | Basic | Expected Family Contribution; enrollment status; cost of attendance; satisfactory academic progress | Federal Student Aid handbook |

### State-Level Program Variations

| Skill | Level Required | Why It Matters |
|-------|---------------|----------------|
| **State Medicaid names and rules** | Intermediate | Medicaid is called MassHealth in MA, Medi-Cal in CA, BadgerCare in WI; each has different income limits, covered services, and enrollment processes |
| **State SNAP variations** | Intermediate | Called CalFresh in CA; broad-based categorical eligibility in some states eliminates asset tests; work requirement exemptions vary |
| **State TANF programs** | Intermediate | Called CalWORKs in CA, TAFDC in MA; time limits, work requirements, and benefit amounts vary enormously |
| **State-only programs** | Basic-Intermediate | Many states have programs with no federal equivalent (state EITC, renter's credits, prescription assistance) |

### Immigration Documentation Requirements

| Skill | Level Required | Why It Matters |
|-------|---------------|----------------|
| **Immigration status categories** | Intermediate | Citizens, LPRs, refugees, asylees, visa holders, DACA, TPS, undocumented -- each has different benefit eligibility |
| **Public charge rule** | Intermediate-Advanced | Understanding which benefits affect immigration applications; changes with administrations; major source of fear among immigrants |
| **Document types** | Intermediate | Green cards, EADs, I-94s, visa stamps, naturalization certificates, travel documents -- must scan and extract correctly |
| **Qualifying quarters** | Basic | Some programs require 40 qualifying quarters of work history for non-citizen eligibility |
| **Mixed-status families** | Intermediate | Households where some members are citizens and others are not; benefits calculated differently |

### Government Form Structures

| Skill | Level Required | Why It Matters |
|-------|---------------|----------------|
| **Federal form standards** | Intermediate | OMB form numbers, PRA burden estimates, form versioning; forms change and app must stay current |
| **State form variations** | Intermediate | Same program, 50 different application forms; must map common fields across formats |
| **Form update monitoring** | Basic-Intermediate | Government forms change without notice; need monitoring system and rapid update process |
| **Online vs. paper applications** | Basic | Not all programs accept online applications in all states; must know which do and provide alternatives |

### Benefits Eligibility Rules

| Skill | Level Required | Why It Matters |
|-------|---------------|----------------|
| **Federal Poverty Level (FPL)** | Deep | Foundation for most eligibility calculations; updated annually; varies by household size and state (Alaska, Hawaii different) |
| **Income counting methods** | Deep | Gross vs. net vs. modified adjusted gross income; different programs count income differently; self-employment complexity |
| **Asset tests** | Intermediate | Some programs count savings, vehicles, property; others don't; threshold amounts vary |
| **Categorical eligibility** | Intermediate | Receiving one benefit can automatically qualify for others (SNAP -> free school lunch; SSI -> Medicaid in most states) |
| **Household composition rules** | Intermediate | Who counts as a household member differs by program; separate purchase and preparation (SNAP); tax household (EITC) |

---

## Design Skills

### Accessible UX for Low-Literacy Users

| Skill | Level Required | Why It Matters |
|-------|---------------|----------------|
| **Plain language writing** | Advanced | 54% of US adults read below 6th-grade level; all guidance must be understandable without legal or bureaucratic knowledge |
| **Progressive disclosure** | Advanced | Show only one question at a time; don't overwhelm with long forms; reveal complexity gradually |
| **Visual hierarchy** | Intermediate-Advanced | Users must instantly see: what they qualify for, how much it's worth, and what to do next |
| **Error prevention** | Advanced | Prevent errors rather than correct them; smart defaults; inline validation; confirmation for irreversible actions |
| **Large touch targets** | Intermediate | Minimum 44px; many users are older or have motor impairments; generous spacing between interactive elements |

### Bilingual Interface Design

| Skill | Level Required | Why It Matters |
|-------|---------------|----------------|
| **Text expansion planning** | Intermediate | Spanish text is ~20% longer than English; layouts must accommodate without breaking |
| **Dynamic text sizing** | Intermediate | Support system font size preferences; many users increase default text size |
| **Translation management** | Intermediate | All strings externalized; translation file structure; interpolation for dynamic values |
| **Cultural UI patterns** | Intermediate | Date formats, currency formatting, name order (Spanish two-surname convention) |

### Trust-Building for Vulnerable Populations

| Skill | Level Required | Why It Matters |
|-------|---------------|----------------|
| **Security communication** | Advanced | Users handling PII (SSN, immigration docs) need constant reassurance about data safety; shield icons, encryption messaging |
| **Government association without intimidation** | Advanced | Look trustworthy and official without looking like a government surveillance tool; warm but professional |
| **Progressive trust building** | Intermediate | Don't ask for SSN on screen one; build trust through quick wins (eligibility check) before requesting sensitive data |
| **Failure-state compassion** | Intermediate | Denials and ineligibility must be communicated gently with next steps, not as dead ends |

### Navigation for Non-Tech-Savvy Users

| Skill | Level Required | Why It Matters |
|-------|---------------|----------------|
| **Minimal navigation depth** | Intermediate | No feature should be more than 2 taps from home; avoid nested menus |
| **Persistent progress visibility** | Intermediate | Always show where users are in a flow and how to get back; breadcrumbs, progress bars, back buttons |
| **Forgiving interactions** | Intermediate | Undo support; save/resume everywhere; no data loss from accidental back navigation |
| **Onboarding simplicity** | Intermediate | 3 screens maximum; defer complexity; let users discover features naturally |

---

## Business Skills

### Community Organization Partnerships

| Skill | Level Required | Why It Matters |
|-------|---------------|----------------|
| **Nonprofit relationship building** | Intermediate-Advanced | Community organizations (United Way, Catholic Charities, local food banks) are the primary distribution channel; they already serve the target population |
| **Benefits counselor outreach** | Intermediate | Certified benefits counselors at nonprofits can validate the product, provide feedback, and recommend it to clients |
| **Church and faith community engagement** | Intermediate | Churches (especially Hispanic and Black churches) are trusted institutions in target communities; word-of-mouth through faith leaders is highly effective |
| **Library system partnerships** | Basic-Intermediate | Public libraries are where many low-income Americans access technology; library staff can recommend the app |
| **Partnership pitch development** | Intermediate | Clear value proposition for organizations: "help your clients access more benefits with less staff time" |

### Government Affairs & Advocacy

| Skill | Level Required | Why It Matters |
|-------|---------------|----------------|
| **Government benefits policy understanding** | Intermediate | Must understand policy changes that affect eligibility rules; ACA enrollment periods; SNAP recertification cycles |
| **Agency relationship building** | Basic-Intermediate | State agencies may eventually partner for direct application submission; start relationship early |
| **Regulatory awareness** | Intermediate | Understanding what GovPass can and cannot do legally; not providing legal advice; PII handling regulations |
| **Bipartisan positioning** | Intermediate | Frame the product as reducing waste (conservative appeal) AND reducing poverty (progressive appeal); avoid partisan positioning |

### Spanish-Language Content Marketing

| Skill | Level Required | Why It Matters |
|-------|---------------|----------------|
| **Spanish-language content creation** | Intermediate-Advanced | 44M Spanish speakers in the US; content in Spanish has dramatically less competition than English |
| **Hispanic media outreach** | Intermediate | Univision, Telemundo, local Spanish-language radio stations reach the target audience directly |
| **WhatsApp community building** | Intermediate | WhatsApp is the primary communication platform for Hispanic communities; groups and broadcast lists for organic growth |
| **Culturally relevant storytelling** | Intermediate | Success stories that resonate with the Hispanic experience; family-centered messaging; community impact framing |

### Social Impact Storytelling for PR

| Skill | Level Required | Why It Matters |
|-------|---------------|----------------|
| **Impact metric framing** | Intermediate | "We helped 10,000 families claim $15M in benefits" is a press-worthy story; track and communicate impact |
| **Media pitch development** | Intermediate | Local news outlets love "app helps residents claim thousands in unclaimed benefits" stories; national outlets cover social impact tech |
| **Social proof collection** | Basic-Intermediate | User testimonials (with consent) are the most powerful marketing tool; "I found $5,000/year I didn't know about" |
| **Grant writing** | Basic | Social impact grants (Google.org, Schmidt Futures, Knight Foundation) can fund early development |

### Nonprofit Collaboration

| Skill | Level Required | Why It Matters |
|-------|---------------|----------------|
| **Nonprofit tech partnership models** | Intermediate | Understand how to offer free or discounted access to nonprofits who distribute to their clients |
| **Volunteer management** | Basic | Community volunteers can help with user testing, translation, and community outreach |
| **Impact measurement** | Intermediate | Track benefits claimed, applications completed, dollars accessed; report to partners and funders |
| **211 system integration** | Basic | United Way 211 referral system is a potential distribution channel; understand how it works |

---

## Unique & Differentiating Skills

### Government Form Dynamic Parsing

| Skill | Why It's Unique | Difficulty |
|-------|-----------------|-----------|
| **Form version tracking** | Government forms change without notice or versioning; must detect and adapt to changes automatically | High |
| **Cross-form field mapping** | Same data (income, household size) appears on dozens of forms with different labels; must maintain a master mapping | High |
| **Form rule engine** | Conditional logic in government forms (skip section if not applicable; show additional questions based on answers) | High |
| **Multi-state form support** | Same program, 50 different forms; abstract common structure while handling state-specific variations | Very High |

### Multi-Agency Application Tracking

| Skill | Why It's Unique | Difficulty |
|-------|-----------------|-----------|
| **Cross-agency status normalization** | Different agencies use different status labels, timelines, and communication methods; must normalize into consistent tracking | High |
| **Expected timeline estimation** | "SNAP applications typically take 7-30 days" varies by state, time of year, and backlog; provide useful estimates | Medium |
| **Agency contact information** | Maintain current phone numbers, addresses, and hours for agencies across all states | Medium |
| **Appeal process guidance** | Each program has different appeal procedures, deadlines, and requirements | Medium-High |

### Eligibility Rule Engine Across Federal + State

| Skill | Why It's Unique | Difficulty |
|-------|-----------------|-----------|
| **Federal-state rule composition** | Federal rules set floors; states add additional requirements or expand eligibility; must compose correctly | Very High |
| **Categorical eligibility chaining** | Receiving one benefit can auto-qualify for others; must model benefit interdependencies | High |
| **Real-time rule updates** | Eligibility rules change with legislation, policy memos, and court decisions; must update quickly | High |
| **Household modeling** | Different programs define "household" differently; must apply correct definition per program | High |

### Culturally Sensitive AI for Diverse Populations

| Skill | Why It's Unique | Difficulty |
|-------|-----------------|-----------|
| **Immigration-sensitive language** | AI must never use language that could intimidate undocumented users or conflate benefits with immigration enforcement | High |
| **Multi-cultural name handling** | Hispanic two-surname convention; Asian name order; accent marks and diacritics; transliteration from non-Latin scripts | Medium |
| **Tone calibration by context** | Celebratory for approvals, gentle for denials, urgent for deadlines, reassuring for sensitive questions | Medium |
| **Public charge awareness** | AI must understand which benefits may affect immigration cases and flag them appropriately without providing legal advice | High |

### Accessibility for Older and Less-Tech-Savvy Users

| Skill | Why It's Unique | Difficulty |
|-------|-----------------|-----------|
| **Progressive complexity** | Start with absolute minimum interaction; add complexity only as user demonstrates comfort | Medium |
| **Error recovery** | Users who are not tech-savvy panic when they think they've made a mistake; every action must be undoable | Medium |
| **Jargon elimination** | Not just "plain language" but zero assumed knowledge of technology terms (no "upload", "cloud", "sync") | Medium-High |
| **Offline resilience** | Many target users have unreliable internet; app must save progress locally and sync when connected | Medium |

---

## Skill Acquisition Priority

### Month 1: Foundation (Before Writing Code)

| Priority | Skill | Action |
|----------|-------|--------|
| 1 | Federal benefits programs (SNAP, Medicaid, EITC) | Study eligibility rules for top 3 programs; interview benefits counselors; complete applications yourself |
| 2 | OpenAI Vision API | Practice document extraction with sample IDs and tax forms; build accuracy benchmarks |
| 3 | Supabase encryption | Implement pgcrypto column encryption; practice RLS policies; test data isolation |
| 4 | Plain language writing | Study plainlanguage.gov; rewrite 10 government form instructions at 6th-grade level |

### Month 2-3: Core Product

| Priority | Skill | Action |
|----------|-------|--------|
| 5 | React Native + Expo camera | Build document scanning prototype with alignment guides |
| 6 | Prompt engineering for extraction | A/B test extraction prompts; build evaluation dataset; measure accuracy |
| 7 | Eligibility rule engine | Code eligibility rules for 25 programs; validate against known cases |
| 8 | Bilingual UI | Set up i18next; translate all MVP strings; test Spanish layouts |

### Month 4-6: Ship & Scale

| Priority | Skill | Action |
|----------|-------|--------|
| 9 | RevenueCat + paywall | Integrate subscriptions; build paywall screen; test purchase flows |
| 10 | Twilio SMS | Implement notification system; test bilingual message delivery |
| 11 | Community partnerships | Pitch to 5 community organizations; get 100 beta testers from their clients |
| 12 | PR and social impact storytelling | Write launch press release; collect 10 user testimonials; pitch to local news |
