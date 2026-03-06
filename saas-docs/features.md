# GovPass Features

**MVP features, post-MVP roadmap, user stories, and acceptance criteria.**

---

## Feature Philosophy

GovPass features are designed around one principle: **make government benefits as easy to claim as ordering food delivery.** Every feature reduces friction between an eligible person and the money, healthcare, or services they deserve. Features are prioritized by the number of dollars they unlock for users, because the more value GovPass delivers, the more users will pay for it and tell others about it.

---

## MVP Features (Months 1-6)

### Feature 1: Document Scanning & AI Data Extraction

**What it does:** Users point their phone camera at government IDs, tax forms (W-2, 1040), pay stubs, and other documents. GovPass uses GPT-4o Vision to extract all relevant data fields automatically.

**Supported document types (MVP):**
- Driver's license / State ID
- Social Security card
- W-2 tax form
- 1040 tax return (page 1)
- Pay stubs (most common formats)
- Utility bills (for address verification)

**User Stories:**

| # | As a... | I want to... | So that... |
|---|---------|-------------|-----------|
| 1.1 | User | Scan my driver's license with my phone camera | My name, address, and date of birth are auto-filled into applications |
| 1.2 | User | Scan my W-2 tax form | My income, employer, and tax withholding are extracted automatically |
| 1.3 | User | See what data was extracted from my scan | I can verify and correct any errors before it's used in applications |
| 1.4 | User | Re-scan a document if the first scan was blurry | I get accurate data extraction even in poor lighting conditions |
| 1.5 | Spanish-speaking user | See extraction results in Spanish | I can verify data in my preferred language |

**Acceptance Criteria:**
- [ ] Camera opens with document alignment guide overlay
- [ ] Auto-capture triggers when document edges are detected and aligned
- [ ] Extraction completes in under 5 seconds with progress indicator
- [ ] All extracted fields displayed for user review with confidence indicators
- [ ] Low-confidence fields (< 0.7) highlighted in amber for user attention
- [ ] User can tap any field to manually correct it
- [ ] "Re-scan" option available if extraction quality is poor
- [ ] Scanned image deleted from server within 60 seconds of extraction
- [ ] All extracted data encrypted before storage
- [ ] Works in both English and Spanish interface modes
- [ ] Minimum 90% accuracy on clear, well-lit document scans
- [ ] Graceful error handling for unsupported document formats

---

### Feature 2: Benefits Eligibility Checker

**What it does:** Based on the user's household information and scanned document data, GovPass checks eligibility across the top 25 federal benefit programs and displays estimated annual benefit amounts.

**Programs covered (MVP - Top 25 Federal):**

| Category | Programs |
|----------|----------|
| **Food** | SNAP (food stamps), WIC (Women, Infants, Children), Free/Reduced School Lunch (NSLP) |
| **Healthcare** | Medicaid, CHIP (Children's Health Insurance), ACA Marketplace subsidies |
| **Cash/Tax** | EITC (Earned Income Tax Credit), CTC (Child Tax Credit), SSI (Supplemental Security Income), TANF |
| **Housing** | Section 8 Housing Choice Vouchers, Public Housing, LIHEAP (heating/cooling assistance) |
| **Childcare** | Head Start, CCDF (Child Care Development Fund) |
| **Education** | Pell Grants, Federal Student Loans (income-driven repayment) |
| **Communication** | Lifeline (phone/internet discount), ACP (Affordable Connectivity Program) |
| **Other** | SNAP Employment & Training, Weatherization Assistance, Community Health Centers, VITA (tax prep), Medicare Savings Programs, Extra Help (Medicare Part D) |

**User Stories:**

| # | As a... | I want to... | So that... |
|---|---------|-------------|-----------|
| 2.1 | User | Answer a few questions about my household | GovPass can check my eligibility across multiple programs at once |
| 2.2 | User | See which programs I'm eligible for | I know what benefits are available to me |
| 2.3 | User | See estimated dollar amounts for each program | I can prioritize which applications to complete first |
| 2.4 | User | Understand why I'm eligible or ineligible | I trust the results and can take action |
| 2.5 | Parent | See programs my children qualify for | I don't miss benefits for my family |
| 2.6 | Immigrant | Know which programs I can apply for given my status | I don't waste time on programs I'm ineligible for |

**Acceptance Criteria:**
- [ ] Household survey completes in under 3 minutes (8-12 questions max)
- [ ] Eligibility results display within 2 seconds of survey completion
- [ ] Each program shows: name, estimated annual value, eligibility status, confidence level
- [ ] Programs ranked by estimated value (highest first)
- [ ] "Why eligible" / "Why not eligible" expandable explanation for each program
- [ ] Total estimated annual value displayed prominently ("You may qualify for $X,XXX/year")
- [ ] Results update automatically when scanned document data is added
- [ ] Immigration status appropriately filters programs
- [ ] Household size and composition (ages, relationships) correctly applied to each program's rules
- [ ] All program names, descriptions, and explanations available in English and Spanish

---

### Feature 3: Form Auto-Fill

**What it does:** For supported programs (SNAP, Medicaid, EITC), GovPass pre-fills application forms with data extracted from scanned documents and household survey answers. Users review and confirm each field.

**User Stories:**

| # | As a... | I want to... | So that... |
|---|---------|-------------|-----------|
| 3.1 | User | Have my application forms pre-filled with my scanned data | I don't have to type the same information repeatedly |
| 3.2 | User | See which fields were auto-filled vs. which I need to complete | I know what's left to do |
| 3.3 | User | Correct any auto-filled field easily | I submit accurate information |
| 3.4 | User | Auto-fill multiple applications from the same scanned documents | I save hours of repetitive data entry |

**Acceptance Criteria:**
- [ ] Auto-filled fields visually distinct from empty fields (blue fill background)
- [ ] User must explicitly confirm auto-filled data before submission
- [ ] Fields map correctly from document extraction to program-specific form fields
- [ ] Common field names mapped across programs (e.g., "Annual Gross Income" vs "Yearly Income" vs "Total Income")
- [ ] Auto-fill accuracy > 95% for confirmed document extractions
- [ ] "Fill from scan" button available on any supported form field
- [ ] Previously confirmed data reusable across multiple program applications
- [ ] Auto-fill works for all three MVP programs: SNAP, Medicaid, EITC

---

### Feature 4: Step-by-Step Guided Application Flows

**What it does:** Instead of presenting a long, intimidating government form, GovPass breaks each application into clear steps with plain-language guidance, help tooltips, and progress tracking.

**User Stories:**

| # | As a... | I want to... | So that... |
|---|---------|-------------|-----------|
| 4.1 | User | See my application broken into simple steps | I'm not overwhelmed by a long form |
| 4.2 | User | Get plain-language explanations for each question | I understand what's being asked even without legal knowledge |
| 4.3 | User | See my progress through the application | I know how much is left and feel motivated to finish |
| 4.4 | User | Save my progress and resume later | I can complete the application across multiple sessions |
| 4.5 | User | Get help with confusing questions via AI chat | I don't abandon the application out of frustration |
| 4.6 | User | Attach required documents from my scanned vault | I don't need to re-scan documents for each application |
| 4.7 | Spanish-speaking user | Complete the entire application in Spanish | I can apply for benefits in my preferred language |

**Acceptance Criteria:**
- [ ] Each application broken into logical sections (Personal Info, Household, Income, Assets, etc.)
- [ ] Progress bar showing current step / total steps
- [ ] Each question has a plain-language tooltip (triggered by "?" icon)
- [ ] AI guidance available via chat bubble on any step (OpenAI API)
- [ ] "Save & Resume" persists all entered data securely
- [ ] Resume places user at exact step where they left off
- [ ] Required vs. optional fields clearly indicated
- [ ] Validation happens per-step (not at end) with clear error messages
- [ ] Document attachment from vault supported where applications require uploaded docs
- [ ] Reading level of all guidance text at 6th grade or below
- [ ] Entire flow available in English and Spanish
- [ ] Estimated time remaining displayed per step

---

### Feature 5: Application Status Tracker

**What it does:** A central dashboard where users can see the status of all their benefit applications across different agencies, with clear next actions and timeline visibility.

**Status Lifecycle:**
```
Draft -> In Progress -> Submitted -> Pending Review -> Approved / Denied
                                                            |
                                                      Appealing (if denied)
```

**User Stories:**

| # | As a... | I want to... | So that... |
|---|---------|-------------|-----------|
| 5.1 | User | See all my applications in one place | I don't lose track of what I've applied for |
| 5.2 | User | Know the current status of each application | I know if I need to take action |
| 5.3 | User | See what the next action is for each application | I know exactly what to do next |
| 5.4 | User | Update the status of an application manually | I can keep the tracker accurate when I hear back from an agency |
| 5.5 | User | See how long each application has been pending | I know if something is taking unusually long |

**Acceptance Criteria:**
- [ ] All applications listed with: program name, agency, status, date submitted, days pending
- [ ] Color-coded status badges: gray (draft), blue (in progress), amber (submitted/pending), green (approved), red (denied)
- [ ] "Next Action" displayed for each application (e.g., "Submit missing pay stub", "Wait for response", "Schedule interview")
- [ ] Tap on any application opens detailed view with full timeline
- [ ] Manual status update option (user can mark as "approved" when they receive notification from agency)
- [ ] Draft applications show "Continue" button to resume where user left off
- [ ] Denied applications show "Appeal" guidance
- [ ] Sort and filter by status, program, date
- [ ] Empty state: encouraging message if no applications yet, with link to eligibility checker

---

### Feature 6: Push Notification Reminders

**What it does:** Automated push notifications and optional SMS reminders for application deadlines, missing document alerts, renewal dates, and status updates.

**Notification Types:**
| Type | Trigger | Example Message |
|------|---------|-----------------|
| **Deadline Reminder** | 7 days, 3 days, 1 day before deadline | "Your SNAP application is due in 3 days. Tap to continue." |
| **Missing Document** | Application requires additional docs | "Your Medicaid application needs a pay stub. Scan one now." |
| **Renewal Alert** | 90, 60, 30 days before renewal | "Your SNAP benefits renew in 30 days. Start your renewal now." |
| **Status Update** | User updates status or scheduled check-in | "Have you heard back about your Section 8 application? Update your status." |
| **Approval Celebration** | User marks application as approved | "Congratulations! Your SNAP benefits have been approved!" |

**User Stories:**

| # | As a... | I want to... | So that... |
|---|---------|-------------|-----------|
| 6.1 | User | Get reminded before application deadlines | I don't miss deadlines and lose my application |
| 6.2 | User | Get alerted when my benefits are up for renewal | I don't lose benefits I already have |
| 6.3 | User | Choose between push notifications and SMS | I get reminders on my preferred channel |
| 6.4 | User | Set my notification preferences | I'm not overwhelmed with too many alerts |
| 6.5 | Spanish-speaking user | Receive notifications in Spanish | I understand my alerts immediately |

**Acceptance Criteria:**
- [ ] Push notifications enabled via Expo Notifications
- [ ] SMS notifications via Twilio (opt-in, Plus/Family tiers only)
- [ ] Notifications sent in user's preferred language (EN/ES)
- [ ] Notification preferences configurable: types, channels, frequency
- [ ] Deadline reminders at 7, 3, and 1 day intervals (configurable)
- [ ] Renewal reminders at 90, 60, and 30 day intervals
- [ ] Tapping a notification deep-links to relevant application or action
- [ ] Notification history viewable in Notifications Center screen
- [ ] Do Not Disturb hours respected (no notifications 10pm-8am by default)
- [ ] Unsubscribe option in every SMS

---

## Post-MVP Features (Months 7-12)

### Phase 2A: State Program Expansion

| Feature | Description | Priority |
|---------|-------------|----------|
| **All 50 States** | State-specific benefit programs, eligibility rules, and application forms | Critical |
| **State Variations** | SNAP, Medicaid, and TANF have different names and rules by state (e.g., CalFresh in CA, MassHealth in MA) | Critical |
| **Local Programs** | City and county-level assistance programs (utility assistance, transit passes, food banks) | High |

### Phase 2B: Document & Application Expansion

| Feature | Description | Priority |
|---------|-------------|----------|
| **Immigration Documents** | Green card, visa, work permit, EAD, naturalization certificate scanning | Critical |
| **Small Business Permits** | Business license, DBA, EIN application guidance | High |
| **Tax Filing Assistance** | EITC and CTC filing guidance beyond just eligibility checking | High |
| **All Federal Programs** | Expand from 25 to 75+ federal programs | High |

### Phase 2C: Enhanced User Experience

| Feature | Description | Priority |
|---------|-------------|----------|
| **AI Chat Assistant** | Free-form Q&A about benefits, eligibility, and application processes | High |
| **Community Forum** | Moderated peer support for benefit application questions | Medium |
| **Benefits Calculator** | Detailed calculator showing exact benefit amounts based on household data | High |
| **Document Vault** | Permanent encrypted storage for all scanned documents, organized by type | High |
| **Multi-Language** | Add Chinese (Simplified), Vietnamese, Korean, Tagalog, Arabic | Medium |
| **Accessibility** | Screen reader optimization, voice navigation, large text mode | Critical |

---

## Year 2+ Features (Months 13-24)

### Phase 3: Platform Expansion

| Feature | Description | Priority |
|---------|-------------|----------|
| **International: UK** | Universal Credit, NHS, Council Tax Reduction, Housing Benefit | High |
| **International: Canada** | Canada Child Benefit, OAS, GIS, EI, GST/HST Credit | High |
| **International: EU** | Country-specific social benefits across major EU nations | Medium |
| **Full Government Services** | DMV appointments, passport renewal, voter registration, jury duty response | Medium |
| **Tax Filing** | Full tax return filing (compete with TurboTax Free File) | High |
| **Benefits Banking** | Partner with neobank for direct deposit of benefits + debit card | Future |

### Phase 3B: Enterprise & Partnerships

| Feature | Description | Priority |
|---------|-------------|----------|
| **Nonprofit Dashboard** | Community organizations manage multiple client applications | High |
| **Government Agency Integration** | Direct API submission to state agencies (reduce manual entry) | Critical |
| **Employer Benefits Portal** | Employers help low-wage workers discover benefits | Medium |
| **Healthcare Navigator** | Medicaid/ACA enrollment assistance with plan comparison | High |

---

## Feature Priority Matrix

| Feature | User Impact | Revenue Impact | Technical Effort | Priority Score |
|---------|-------------|----------------|-----------------|---------------|
| Document Scanning | 10 | 8 | 7 | **P0 - Must Have** |
| Eligibility Checker | 10 | 9 | 5 | **P0 - Must Have** |
| Form Auto-Fill | 9 | 9 | 6 | **P0 - Must Have** |
| Guided Application Flows | 9 | 8 | 7 | **P0 - Must Have** |
| Application Tracker | 7 | 7 | 4 | **P0 - Must Have** |
| Push Notifications | 6 | 6 | 3 | **P0 - Must Have** |
| All 50 States | 8 | 9 | 8 | **P1 - Next** |
| Immigration Documents | 8 | 7 | 5 | **P1 - Next** |
| AI Chat Assistant | 7 | 6 | 4 | **P1 - Next** |
| Tax Filing Assistance | 7 | 8 | 7 | **P1 - Next** |
| Document Vault | 5 | 7 | 3 | **P1 - Next** |
| Multi-Language (beyond ES) | 6 | 5 | 5 | **P2 - Later** |
| International Expansion | 6 | 7 | 9 | **P2 - Later** |
| Nonprofit Dashboard | 5 | 6 | 6 | **P2 - Later** |

---

## Multi-Language Support

### MVP Languages

| Language | Coverage | Rationale |
|----------|----------|-----------|
| **English** | 100% of UI, guidance, notifications | Primary language |
| **Spanish** | 100% of UI, guidance, notifications | 13% of US population; 44M+ Spanish speakers; highest impact second language |

### Implementation Strategy

```
Translation file structure:
locales/
  en.json          # English (primary)
  es.json          # Spanish (MVP)
  zh.json          # Chinese Simplified (Phase 2)
  vi.json          # Vietnamese (Phase 2)
  ko.json          # Korean (Phase 2)
  tl.json          # Tagalog (Phase 2)
  ar.json          # Arabic (Phase 2)

Key considerations:
- All UI text externalized to translation files (zero hardcoded strings)
- AI guidance prompts include language parameter
- Notification templates stored in both languages in database
- Document scanning works regardless of document language (AI handles it)
- Program names shown in both languages where official translations exist
- Layout accommodates text expansion (Spanish text is ~20% longer than English)
- RTL layout support planned for Arabic (Phase 2)
```

### Culturally Sensitive Content

| Consideration | Implementation |
|---------------|---------------|
| **Immigration sensitivity** | Never ask for immigration status until user opts in; explain why it's needed; "prefer not to say" always available |
| **Income sensitivity** | Frame income questions as "household income range" not exact amounts until needed for specific applications |
| **Trust language** | Prominent "we never share your data with any government agency" messaging |
| **Plain language** | All guidance at 6th-grade reading level; avoid legal jargon; define terms inline |
| **Cultural references** | Avoid assumptions about family structure; support non-traditional households |

---

## Month-by-Month MVP Timeline

| Month | Milestone | Features Shipped |
|-------|-----------|-----------------|
| **Month 1** | Foundation | Auth (phone + magic link), onboarding flow, household survey, Supabase schema with encryption, basic eligibility engine (5 programs) |
| **Month 2** | Document Scanning | Camera integration, GPT-4o Vision pipeline, data extraction for IDs and W-2s, extraction review screen |
| **Month 3** | Eligibility Engine | Full 25-program eligibility checker, results display with amounts, program detail pages |
| **Month 4** | Application Flows | SNAP guided application, form auto-fill, save/resume, document attachment, progress tracking |
| **Month 5** | Tracking & Notifications | Application status tracker, push notifications, Twilio SMS integration, Medicaid and EITC application flows |
| **Month 6** | Polish & Launch | Spanish language support, subscription paywall (RevenueCat), App Store optimization, beta testing with community organizations, public launch |
