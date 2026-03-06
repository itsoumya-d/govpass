# GovPass Screens

**All 8 app screens with UI elements, states, accessibility, and bilingual design.**

---

## Screen Architecture

GovPass uses a tab-based navigation for the primary screens, with modal and stack navigation for flows like onboarding, document scanning, and application completion.

```
Navigation Structure:

[Onboarding Flow] (shown once)
  |- Language Selector (EN/ES)
  |- Household Info Survey
  |- Document Scan Introduction

[Tab Navigator] (main app)
  |- Tab 1: Home Dashboard
  |- Tab 2: Document Scanner
  |- Tab 3: Application Tracker
  |- Tab 4: Notifications Center

[Stack Screens] (pushed from tabs)
  |- Eligibility Results
  |- Application Flow (multi-step)
  |- Settings
```

---

## Screen 1: Onboarding Flow

**Purpose:** Collect language preference, basic household info, and introduce document scanning. Designed to feel quick, friendly, and non-intimidating. Must complete in under 3 minutes.

### 1A: Language Selector

```
+------------------------------------------+
|                                          |
|          [US Flag + Globe Icon]          |
|                                          |
|        Welcome to GovPass               |
|        Bienvenido a GovPass             |
|                                          |
|   Choose your language                   |
|   Elija su idioma                        |
|                                          |
|   +----------------------------------+   |
|   |  [US Flag]  English              |   |
|   +----------------------------------+   |
|                                          |
|   +----------------------------------+   |
|   |  [MX Flag]  Espanol              |   |
|   +----------------------------------+   |
|                                          |
|   You can change this anytime            |
|   in Settings.                           |
|                                          |
+------------------------------------------+
```

**UI Elements:**
- App logo and welcome text in both languages
- Two large, tappable language option cards (minimum 56px height)
- Flag icons for visual language identification
- Subtitle noting language can be changed later
- No "Next" button needed -- selecting a language advances automatically

**States:**
- Default: Both options unselected
- Selected: Chosen language card highlighted with Trust Blue border and checkmark
- Transition: 300ms fade to next screen after selection

**Accessibility:**
- Both language options labeled for screen readers in their respective languages
- Minimum 44px touch target on language cards
- High contrast text on both light and dark backgrounds

---

### 1B: Household Info Quick Survey

```
+------------------------------------------+
|  [Back]              Step 1 of 4         |
|                                          |
|  Let's find your benefits                |
|  (This takes about 2 minutes)            |
|                                          |
|  How many people live in your            |
|  household?                              |
|                                          |
|  +----------------------------------+   |
|  |  [Icon] Just me                   |   |
|  +----------------------------------+   |
|  |  [Icon] 2 people                  |   |
|  +----------------------------------+   |
|  |  [Icon] 3-4 people                |   |
|  +----------------------------------+   |
|  |  [Icon] 5+ people                 |   |
|  +----------------------------------+   |
|                                          |
|  +----------------------------------+   |
|  |         [ Continue ]              |   |
|  +----------------------------------+   |
|                                          |
|  [Skip for now - I'll add this later]    |
|                                          |
+------------------------------------------+
```

**Survey Questions (4 screens, one question each):**

1. **Household size** -- "How many people live in your household?" (1 / 2 / 3-4 / 5+)
2. **Children** -- "Are there any children under 18?" (Yes, how many / No)
3. **Income range** -- "What is your household's approximate yearly income?" ($0-15K / $15-30K / $30-50K / $50-75K / $75K+)
4. **State** -- "What state do you live in?" (State picker dropdown)

**UI Elements per Question:**
- Progress indicator (Step X of 4) at top
- Large, clear question text (18px minimum, Nunito font)
- Multiple-choice cards with icons (not radio buttons -- cards are easier to tap)
- "Continue" button at bottom (disabled until selection made)
- "Skip for now" link below button (gray text, smaller font)
- Back arrow to previous question

**States:**
- Default: No option selected, Continue button disabled (gray)
- Selected: One option highlighted with Trust Blue, Continue enabled
- Loading: Brief spinner after final question while eligibility calculates
- Skipped: User advanced without answering; field marked as incomplete in profile

**Accessibility:**
- All options are large tappable cards (minimum 52px height)
- Question text at 18px minimum
- Income question includes "prefer not to say" option
- Screen reader announces question and reads all options

**Bilingual Considerations:**
- All questions, options, and labels translated to selected language
- Survey cards accommodate 20% text expansion for Spanish
- State picker shows full state names (not abbreviations) in both languages

---

### 1C: Document Scan Introduction

```
+------------------------------------------+
|                                          |
|        [Illustration: phone              |
|         scanning a document]             |
|                                          |
|  Scan your documents to                  |
|  unlock your benefits                    |
|                                          |
|  GovPass can read your ID, tax forms,    |
|  and pay stubs to fill out applications  |
|  for you automatically.                  |
|                                          |
|  [Shield Icon] Your documents are        |
|  encrypted and never stored without      |
|  your permission.                        |
|                                          |
|  +----------------------------------+   |
|  |      [ Scan My First Document ]   |   |
|  +----------------------------------+   |
|                                          |
|  [Maybe later - show me my benefits]     |
|                                          |
+------------------------------------------+
```

**UI Elements:**
- Friendly illustration of phone scanning a document (flat style, diverse hand)
- Clear value proposition headline
- Brief explanation of what scanning does (2 sentences max)
- Security reassurance with shield icon and encryption messaging
- Primary CTA: "Scan My First Document" (opens camera)
- Secondary CTA: "Maybe later" (skips to Home Dashboard with eligibility results from survey)

**States:**
- Default: Both CTAs visible
- Tapped "Scan": Navigates to Document Scanner screen
- Tapped "Maybe later": Navigates to Home Dashboard with survey-based eligibility only

---

## Screen 2: Home Dashboard

**Purpose:** The central hub showing eligible benefits with estimated dollar amounts, active application statuses, upcoming deadlines, and the primary CTA to scan documents.

```
+------------------------------------------+
|  GovPass            [Profile] [Settings] |
|                                          |
|  Good morning, Maria                     |
|                                          |
|  +----------------------------------+   |
|  | You may qualify for               |   |
|  | $8,400/year in benefits           |   |
|  |                                   |   |
|  | [See all 7 programs  ->]          |   |
|  +----------------------------------+   |
|                                          |
|  +----------------------------------+   |
|  | [Camera Icon]                     |   |
|  | Scan a Document                   |   |
|  | Add documents to unlock           |   |
|  | more accurate results             |   |
|  +----------------------------------+   |
|                                          |
|  Your Top Benefits                       |
|                                          |
|  +----------------------------------+   |
|  | [Food Icon] SNAP                  |   |
|  | ~$3,200/year                      |   |
|  | [Likely Eligible]   [Apply Now >] |   |
|  +----------------------------------+   |
|                                          |
|  +----------------------------------+   |
|  | [Health Icon] Medicaid            |   |
|  | ~$4,000/year                      |   |
|  | [Likely Eligible]   [Apply Now >] |   |
|  +----------------------------------+   |
|                                          |
|  +----------------------------------+   |
|  | [Dollar Icon] EITC                |   |
|  | ~$1,200/year                      |   |
|  | [Check Eligibility] [Learn More>] |   |
|  +----------------------------------+   |
|                                          |
|  Active Applications                     |
|                                          |
|  +----------------------------------+   |
|  | SNAP Application                  |   |
|  | [Submitted] Day 12 of ~30        |   |
|  | Next: Wait for interview call     |   |
|  +----------------------------------+   |
|                                          |
|  Upcoming Deadlines                      |
|                                          |
|  +----------------------------------+   |
|  | [Clock Icon] Medicaid Renewal     |   |
|  | Due: March 15, 2026               |   |
|  | [Start Renewal >]                 |   |
|  +----------------------------------+   |
|                                          |
|  [Tab: Home] [Tab: Scan] [Tab: Apps]     |
|  [Tab: Alerts]                           |
+------------------------------------------+
```

**UI Elements:**
- **Header:** App name, profile avatar, settings gear icon
- **Greeting:** Personalized with user's first name and time-of-day greeting
- **Total Benefits Card:** Large card showing total estimated annual benefits across all eligible programs; tappable to view full eligibility results
- **Scan Document CTA:** Prominent card encouraging document scanning for better results; shown when user has < 3 documents scanned
- **Top Benefits List:** Cards for the 3 highest-value eligible programs, each showing program name, category icon, estimated annual value, eligibility confidence badge, and action button
- **Active Applications Section:** List of in-progress or submitted applications with current status, days waiting, and next action
- **Upcoming Deadlines Section:** Time-sensitive items (renewals, missing docs, interview dates)
- **Bottom Tab Bar:** Home, Scanner, Applications, Notifications

**States:**
- **New User (no scans):** Total benefits card shows survey-based estimate with "Scan documents for more accurate results" note; benefits list shows eligibility based on survey only
- **Scanned User:** More accurate estimates; higher confidence badges; more programs visible
- **Active Applications:** Applications section visible with status cards
- **No Eligible Programs:** Encouraging message explaining that eligibility may change with updated info; link to re-take household survey
- **All Programs Applied:** Celebration state with confetti icon; "You've applied for all your benefits!" message
- **Loading:** Skeleton cards while eligibility recalculates
- **Error:** "Unable to check eligibility" with retry button

**Accessibility:**
- All benefit amounts announced by screen readers with full context ("SNAP food assistance, approximately three thousand two hundred dollars per year, likely eligible")
- All cards meet minimum 44px touch targets
- Color-coded elements also have text labels (not color-only indicators)
- High contrast mode supported
- Tab bar icons have text labels

**Bilingual Considerations:**
- Greeting and all section headers in selected language
- Benefit program names shown with official translations where available
- Dollar amounts formatted per locale (period vs comma for decimals)
- Card layouts accommodate longer Spanish text

---

## Screen 3: Document Scanner

**Purpose:** Camera interface with document alignment guides for scanning IDs, tax forms, and pay stubs. Includes auto-capture, AI extraction progress, and data verification.

### 3A: Camera View

```
+------------------------------------------+
|  [X Close]          Scan Document        |
|                                          |
|  +----------------------------------+   |
|  |                                   |   |
|  |                                   |   |
|  |     +------------------------+    |   |
|  |     |                        |    |   |
|  |     |   [Alignment Guide     |    |   |
|  |     |    Rectangle with      |    |   |
|  |     |    rounded corners]    |    |   |
|  |     |                        |    |   |
|  |     +------------------------+    |   |
|  |                                   |   |
|  |  Position your document inside    |   |
|  |  the frame                        |   |
|  |                                   |   |
|  +----------------------------------+   |
|                                          |
|  Document type:                          |
|  [ID] [Tax Form] [Pay Stub] [Other]     |
|                                          |
|  [Torch Icon]      [Capture Button]     |
|                                          |
+------------------------------------------+
```

**UI Elements:**
- **Close button** (X) to dismiss scanner
- **Camera viewfinder** with semi-transparent overlay outside document area
- **Document alignment rectangle** with animated corner guides (pulsing when not aligned, solid when aligned)
- **Instruction text** below viewfinder ("Position your document inside the frame")
- **Document type selector** horizontal chips (ID, Tax Form, Pay Stub, Other)
- **Torch toggle** for low-light environments
- **Manual capture button** (large circular button, though auto-capture is preferred)

**States:**
- **Searching:** Alignment guides pulsing; instruction text: "Position your document inside the frame"
- **Aligned:** Guides turn solid green; instruction text: "Hold steady..." with 1.5-second countdown
- **Auto-Capturing:** Brief flash animation; haptic feedback; instruction text: "Capturing..."
- **Poor Quality:** Alert badge: "Image is blurry. Try again with better lighting."
- **Glare Detected:** Alert badge: "Glare detected. Tilt your phone slightly."

### 3B: AI Extraction Progress

```
+------------------------------------------+
|                                          |
|  [Document thumbnail image]              |
|                                          |
|  Reading your document...                |
|                                          |
|  +----------------------------------+   |
|  | [============================  ] |   |
|  |  Extracting data... 78%          |   |
|  +----------------------------------+   |
|                                          |
|  [Shield] Your document image is         |
|  encrypted and will be deleted           |
|  after data is extracted.                |
|                                          |
+------------------------------------------+
```

**UI Elements:**
- Thumbnail of captured document (blurred for security)
- Progress bar with percentage
- Status text cycling through: "Uploading securely..." -> "Reading document..." -> "Extracting data..." -> "Verifying..."
- Security reassurance message with shield icon

### 3C: Verified Data Display

```
+------------------------------------------+
|  [Back]          Verify Your Data        |
|                                          |
|  We found this information:              |
|                                          |
|  +----------------------------------+   |
|  | Full Name                         |   |
|  | Maria Garcia Lopez          [OK] |   |
|  +----------------------------------+   |
|  | Date of Birth                     |   |
|  | 1988-03-15                  [OK]  |   |
|  +----------------------------------+   |
|  | Address                           |   |
|  | 1234 Oak Street            [OK]   |   |
|  | Houston, TX 77001                 |   |
|  +----------------------------------+   |
|  | License Number                    |   |
|  | [!] DL1234****         [Edit]     |   |
|  +----------------------------------+   |
|                                          |
|  [!] = Low confidence. Please verify.    |
|                                          |
|  +----------------------------------+   |
|  | [ ] Save to Document Vault        |   |
|  | (Plus/Family plan)                 |   |
|  +----------------------------------+   |
|                                          |
|  +----------------------------------+   |
|  |     [ Confirm & Continue ]        |   |
|  +----------------------------------+   |
|                                          |
|  [Scan Another Document]                 |
|                                          |
+------------------------------------------+
```

**UI Elements:**
- List of extracted fields with labels and values
- Confidence indicators: green checkmark (high), amber warning (low)
- Each field tappable to edit/correct
- "Save to Document Vault" checkbox (Plus/Family subscribers only; free tier shows upgrade prompt)
- "Confirm & Continue" primary button
- "Scan Another Document" secondary link

**States:**
- **All High Confidence:** All fields show green checkmarks; "Confirm" button enabled
- **Some Low Confidence:** Amber fields highlighted; instruction text prompts review
- **Editing a Field:** Inline text input with keyboard; field highlighted with blue border
- **No Data Extracted:** Error state with "We couldn't read this document" message and tips for better scanning
- **Vault Save (Free User):** Checkbox shows upgrade prompt inline ("Upgrade to Plus to save documents")

**Accessibility:**
- Extracted field values readable by screen readers with labels ("Full Name: Maria Garcia Lopez, verified")
- Low-confidence fields announced as "needs verification"
- Edit buttons have descriptive labels ("Edit full name")
- Camera view has voice-over instructions for visually impaired users

---

## Screen 4: Eligibility Results

**Purpose:** Full list of programs the user may be eligible for, with estimated benefit amounts, eligibility status, and action buttons.

```
+------------------------------------------+
|  [Back]        Your Benefits             |
|                                          |
|  Based on your information, you may      |
|  qualify for:                            |
|                                          |
|  +----------------------------------+   |
|  |  Total Estimated Annual Value     |   |
|  |  $8,400 / year                    |   |
|  |  across 7 programs                |   |
|  +----------------------------------+   |
|                                          |
|  [Filter: All | Food | Health |         |
|   Housing | Cash | Other]                |
|                                          |
|  LIKELY ELIGIBLE (5)                     |
|                                          |
|  +----------------------------------+   |
|  | [Green Dot] SNAP (Food Stamps)    |   |
|  | ~$3,200/year ($267/month)         |   |
|  | Food assistance for your          |   |
|  | household of 3                    |   |
|  | Priority: HIGH                    |   |
|  |                                   |   |
|  | [Apply Now]         [Details >]   |   |
|  +----------------------------------+   |
|                                          |
|  +----------------------------------+   |
|  | [Green Dot] Medicaid              |   |
|  | ~$4,000/year (full coverage)      |   |
|  | Free healthcare coverage          |   |
|  | Priority: HIGH                    |   |
|  |                                   |   |
|  | [Apply Now]         [Details >]   |   |
|  +----------------------------------+   |
|                                          |
|  +----------------------------------+   |
|  | [Green Dot] EITC                  |   |
|  | ~$1,200/year (tax refund)         |   |
|  | Earned Income Tax Credit          |   |
|  | Priority: MEDIUM (file by Apr 15) |   |
|  |                                   |   |
|  | [Apply Now]         [Details >]   |   |
|  +----------------------------------+   |
|                                          |
|  MAY BE ELIGIBLE (2)                     |
|                                          |
|  +----------------------------------+   |
|  | [Amber Dot] WIC                   |   |
|  | ~$600/year                        |   |
|  | Need to verify: child under 5     |   |
|  |                                   |   |
|  | [Check Eligibility] [Details >]   |   |
|  +----------------------------------+   |
|                                          |
|  NOT ELIGIBLE (3)                        |
|                                          |
|  +----------------------------------+   |
|  | [Gray Dot] Section 8              |   |
|  | Reason: Income above threshold    |   |
|  | for Harris County                 |   |
|  |                                   |   |
|  |                     [Details >]   |   |
|  +----------------------------------+   |
|                                          |
+------------------------------------------+
```

**UI Elements:**
- **Total value card** at top with aggregate estimated annual benefits
- **Category filter bar** horizontal scroll chips (All, Food, Health, Housing, Cash, Other)
- **Eligibility sections** grouped: Likely Eligible, May Be Eligible, Not Eligible
- **Program cards** each showing: status dot (green/amber/gray), program name, estimated annual and monthly value, one-line description, priority ranking, action button(s)
- **Action buttons per status:**
  - Likely Eligible: "Apply Now" (primary) + "Details" (secondary)
  - May Be Eligible: "Check Eligibility" (primary) + "Details" (secondary)
  - Not Eligible: "Details" only (shows reason for ineligibility)

**States:**
- **Full Results:** All sections populated with programs
- **No Eligible Programs:** Encouraging message: "Based on your current information, we didn't find matching programs. Update your household info or scan more documents to check again."
- **Loading:** Skeleton cards while recalculating
- **Filter Active:** Only programs in selected category shown; count updates in section headers
- **Program Detail Expanded:** Tapping "Details" expands card to show required documents, application time estimate, and step-by-step overview

**Accessibility:**
- Screen reader announces total value and number of programs at page load
- Each program card announced with full context
- Priority ranking communicated in accessible way ("High priority, apply soon")
- Filter bar is keyboard/switch navigable

**Bilingual Considerations:**
- Program names in selected language (SNAP = SNAP in both; Medicaid = Medicaid; EITC = Credito Tributario por Ingreso del Trabajo)
- Benefit descriptions in selected language
- Dollar amounts and date formats per locale

---

## Screen 5: Application Flow

**Purpose:** Step-by-step guided form for completing a benefit application, with AI-filled fields, progress tracking, help tooltips, save/resume, and document attachment.

```
+------------------------------------------+
|  [X Close]     SNAP Application          |
|                                          |
|  +----------------------------------+   |
|  | Step 2 of 8: Household Info       |   |
|  | [===|======                     ] |   |
|  | ~15 min remaining                 |   |
|  +----------------------------------+   |
|                                          |
|  Who lives in your household?            |
|                                          |
|  +----------------------------------+   |
|  | Full Name *                       |   |
|  | [Maria Garcia Lopez       ] [AI]  |   |
|  +----------------------------------+   |
|                                          |
|  +----------------------------------+   |
|  | Date of Birth *                   |   |
|  | [03/15/1988                ] [AI]  |   |
|  +----------------------------------+   |
|                                          |
|  +----------------------------------+   |
|  | Relationship to Applicant *       |   |
|  | [Self (Primary Applicant)   v]    |   |
|  +----------------------------------+   |
|                                          |
|  +----------------------------------+   |
|  | Social Security Number *          |   |
|  | [***-**-6789               ] [AI]  |   |
|  | [?] Why is this required?         |   |
|  +----------------------------------+   |
|                                          |
|  + Add Another Household Member          |
|                                          |
|  +----------------------------------+   |
|  | [i] Having trouble? Ask GovPass   |   |
|  |     for help with this step.      |   |
|  |                     [Get Help]    |   |
|  +----------------------------------+   |
|                                          |
|  [Save & Exit]         [Continue ->]     |
|                                          |
+------------------------------------------+
```

**UI Elements:**
- **Header:** Close button, program name
- **Progress section:** Step number and title, progress bar (segmented by steps), estimated time remaining
- **Question/section title:** Plain-language description of what this step covers
- **Form fields:**
  - Text inputs with floating labels
  - AI-filled indicator [AI] badge on auto-filled fields (blue background)
  - Required field indicator (*)
  - Help tooltip [?] icon on complex fields
  - Dropdown selectors for enumerated options
  - Date pickers for date fields
  - SSN fields masked by default with reveal toggle
- **Add member button:** For household composition steps
- **AI Help card:** Persistent help CTA that opens chat assistant for step-specific guidance
- **Footer buttons:** "Save & Exit" (secondary) and "Continue" (primary)

**Application Steps (SNAP example):**
1. Personal Information (name, DOB, SSN, contact)
2. Household Members (name, DOB, relationship for each)
3. Address & Residency (current address, how long, state residency)
4. Income (employment status, employer, wages, other income)
5. Assets (bank accounts, vehicles -- only if required by state)
6. Expenses (rent, utilities, childcare, medical)
7. Document Upload (attach scanned pay stubs, ID, utility bill)
8. Review & Submit (review all answers, certify, submit)

**States:**
- **Auto-Filled Field:** Blue background tint with [AI] badge; user can tap to edit
- **Manual Field:** White background; user enters data
- **Validated Field:** Green checkmark after passing validation
- **Error Field:** Red border with inline error message ("SSN must be 9 digits")
- **Help Tooltip Open:** Modal or bottom sheet with plain-language explanation
- **AI Chat Open:** Bottom sheet with chat interface for step-specific questions
- **Save & Exit:** All data saved; returns to Application Tracker with "Draft" status
- **Resume:** Opens at exact step and field where user left off
- **Review Step:** All answers displayed in read-only format with "Edit" links per section
- **Submission Confirmation:** Success screen with confetti animation and next steps

**Accessibility:**
- All form fields properly labeled with `accessibilityLabel`
- Error messages announced immediately by screen reader
- Tab order follows visual order
- AI-filled fields announced as "auto-filled from your scanned documents, tap to edit"
- Progress bar announces current step and total steps
- Help tooltip content accessible via screen reader

**Bilingual Considerations:**
- All form labels, tooltips, and error messages in selected language
- AI help responses in selected language
- Government form field names may be in English (official form) with translated labels above
- Document attachment prompts in selected language

---

## Screen 6: Application Tracker

**Purpose:** Central view of all applications across all agencies and programs, showing current status, timeline, and next actions.

```
+------------------------------------------+
|  Applications              [+ New App]   |
|                                          |
|  [Filter: All | Active | Completed |    |
|   Denied]                                |
|                                          |
|  ACTIVE (2)                              |
|                                          |
|  +----------------------------------+   |
|  | SNAP (Food Stamps)                |   |
|  | Agency: TX Health & Human Svcs    |   |
|  | Status: [Submitted - Pending]     |   |
|  |                                   |   |
|  | Submitted: Jan 15, 2026           |   |
|  | Day 23 of ~30 day wait            |   |
|  | [===================|         ]   |   |
|  |                                   |   |
|  | Next: Wait for phone interview    |   |
|  |       (usually within 30 days)    |   |
|  |                                   |   |
|  | [Update Status]    [View App >]   |   |
|  +----------------------------------+   |
|                                          |
|  +----------------------------------+   |
|  | Medicaid                          |   |
|  | Agency: TX Health & Human Svcs    |   |
|  | Status: [Draft - In Progress]     |   |
|  |                                   |   |
|  | Started: Jan 28, 2026             |   |
|  | Step 3 of 6 completed             |   |
|  | [========|                    ]   |   |
|  |                                   |   |
|  | Next: Complete income section      |   |
|  |                                   |   |
|  | [Continue Application]            |   |
|  +----------------------------------+   |
|                                          |
|  COMPLETED (1)                           |
|                                          |
|  +----------------------------------+   |
|  | EITC (Tax Credit)                 |   |
|  | Agency: IRS                        |   |
|  | Status: [Approved!]               |   |
|  |                                   |   |
|  | Approved: Feb 1, 2026             |   |
|  | Amount: $1,247 tax refund         |   |
|  |                                   |   |
|  | [Checkmark] Refund expected        |   |
|  | within 21 days                     |   |
|  +----------------------------------+   |
|                                          |
|  DENIED (1)                              |
|                                          |
|  +----------------------------------+   |
|  | Section 8 Housing Voucher         |   |
|  | Agency: Harris County Housing     |   |
|  | Status: [Denied]                  |   |
|  |                                   |   |
|  | Denied: Dec 15, 2025              |   |
|  | Reason: Income above threshold    |   |
|  |                                   |   |
|  | [Appeal Guidance]  [Reapply Info] |   |
|  +----------------------------------+   |
|                                          |
+------------------------------------------+
```

**UI Elements:**
- **Header:** "Applications" title with "+ New App" button (links to Eligibility Results)
- **Filter bar:** All, Active, Completed, Denied
- **Application cards:**
  - Program name and agency
  - Color-coded status badge: gray (draft), blue (in progress), amber (submitted/pending), green (approved), red (denied)
  - Timeline: date submitted/started, days waiting or steps completed
  - Progress bar (visual timeline for pending; step progress for drafts)
  - Next action text (clear, actionable instruction)
  - Action buttons vary by status
- **Empty state:** Encouraging message with link to eligibility checker

**Status-Specific Card Actions:**
| Status | Primary Action | Secondary Action |
|--------|---------------|-----------------|
| Draft | "Continue Application" | "Delete Draft" |
| In Progress | "Continue Application" | "Save & Exit" |
| Submitted | "Update Status" | "View Application" |
| Pending | "Update Status" | "Contact Agency Info" |
| Approved | "View Details" | "Set Renewal Reminder" |
| Denied | "Appeal Guidance" | "Reapply Info" |

**States:**
- **Empty (no applications):** Illustration with "Start your first application" CTA and link to eligibility checker
- **All Active:** Active section expanded; Completed/Denied sections collapsed
- **Update Status Modal:** Options: "Still waiting", "I had my interview", "I received a letter", "I was approved", "I was denied"
- **Celebration (Approved):** Confetti animation, green card, encouraging message

---

## Screen 7: Notifications Center

**Purpose:** Chronological feed of all notifications including deadline reminders, missing document alerts, status updates, and approval/denial notifications.

```
+------------------------------------------+
|  Notifications           [Mark All Read] |
|                                          |
|  TODAY                                    |
|                                          |
|  +----------------------------------+   |
|  | [Clock - Red]                     |   |
|  | SNAP Application Deadline         |   |
|  | Your SNAP application is due in   |   |
|  | 3 days. Don't lose your progress! |   |
|  | 2 hours ago                        |   |
|  |                                   |   |
|  | [Continue Application]            |   |
|  +----------------------------------+   |
|                                          |
|  +----------------------------------+   |
|  | [Document - Amber]                |   |
|  | Missing Document                  |   |
|  | Your Medicaid application needs   |   |
|  | a recent pay stub. Scan one now.  |   |
|  | 5 hours ago                        |   |
|  |                                   |   |
|  | [Scan Pay Stub]                   |   |
|  +----------------------------------+   |
|                                          |
|  THIS WEEK                               |
|                                          |
|  +----------------------------------+   |
|  | [Party - Green]                   |   |
|  | EITC Approved!                    |   |
|  | Congratulations! Your EITC claim  |   |
|  | of $1,247 has been approved.      |   |
|  | Your refund is on the way!        |   |
|  | 2 days ago                         |   |
|  |                                   |   |
|  | [View Details]                    |   |
|  +----------------------------------+   |
|                                          |
|  EARLIER                                 |
|                                          |
|  +----------------------------------+   |
|  | [Calendar - Blue]                 |   |
|  | Medicaid Renewal Coming Up        |   |
|  | Your Medicaid benefits renew in   |   |
|  | 60 days. Start your renewal       |   |
|  | early to avoid any gap.           |   |
|  | 5 days ago                         |   |
|  |                                   |   |
|  | [Start Renewal]                   |   |
|  +----------------------------------+   |
|                                          |
+------------------------------------------+
```

**UI Elements:**
- **Header:** "Notifications" title with "Mark All Read" link
- **Date group headers:** Today, This Week, Earlier, or specific dates
- **Notification cards:**
  - Color-coded icon by type: red clock (deadline), amber document (missing doc), green party (approval), red X (denial), blue calendar (renewal), blue info (status update)
  - Title (bold)
  - Message body (2-3 lines max)
  - Timestamp (relative: "2 hours ago", "3 days ago")
  - Action button (deep-links to relevant screen)
- **Unread indicator:** Blue dot on unread notifications; card background slightly darker
- **Empty state:** "No notifications yet. We'll let you know about deadlines, updates, and approvals."

**Notification Types & Visual Treatment:**

| Type | Icon Color | Icon | Example CTA |
|------|-----------|------|-------------|
| Deadline Reminder | Red #EF4444 | Clock | "Continue Application" |
| Missing Document | Amber #F59E0B | Document | "Scan [Document Type]" |
| Approval | Green #10B981 | Party/Checkmark | "View Details" |
| Denial | Red #EF4444 | X Circle | "Appeal Guidance" |
| Renewal Alert | Blue #3B82F6 | Calendar | "Start Renewal" |
| Status Update | Blue #3B82F6 | Info | "Update Status" |

**States:**
- **Unread notifications:** Blue dot + slightly darker background
- **Read notifications:** Normal background, no dot
- **Empty state:** Illustration with encouraging message
- **Swipe to dismiss:** Swipe right to mark as read; swipe left to delete

---

## Screen 8: Settings

**Purpose:** Profile management, household information, language settings, subscription management, document vault, and privacy controls.

```
+------------------------------------------+
|  [Back]             Settings             |
|                                          |
|  +----------------------------------+   |
|  | [Avatar]                          |   |
|  | Maria Garcia Lopez               |   |
|  | maria.garcia@email.com            |   |
|  | [Edit Profile >]                  |   |
|  +----------------------------------+   |
|                                          |
|  ACCOUNT                                 |
|                                          |
|  +----------------------------------+   |
|  | [People] Household Info        >  |   |
|  +----------------------------------+   |
|  | [Globe] Language: English      >  |   |
|  +----------------------------------+   |
|  | [Bell] Notification Prefs      >  |   |
|  +----------------------------------+   |
|                                          |
|  SUBSCRIPTION                            |
|                                          |
|  +----------------------------------+   |
|  | [Star] Current Plan: Free      >  |   |
|  | Upgrade to Plus for unlimited     |   |
|  | applications and auto-fill        |   |
|  +----------------------------------+   |
|                                          |
|  DOCUMENTS                               |
|                                          |
|  +----------------------------------+   |
|  | [Vault] Document Vault         >  |   |
|  | 3 documents saved                 |   |
|  +----------------------------------+   |
|  | [Scan] Scan New Document       >  |   |
|  +----------------------------------+   |
|                                          |
|  PRIVACY & SECURITY                      |
|                                          |
|  +----------------------------------+   |
|  | [Shield] Privacy Policy        >  |   |
|  +----------------------------------+   |
|  | [Lock] Data & Encryption       >  |   |
|  +----------------------------------+   |
|  | [Trash] Delete All My Data     >  |   |
|  +----------------------------------+   |
|                                          |
|  SUPPORT                                 |
|                                          |
|  +----------------------------------+   |
|  | [Help] Help Center             >  |   |
|  +----------------------------------+   |
|  | [Chat] Contact Support         >  |   |
|  +----------------------------------+   |
|  | [Info] About GovPass           >  |   |
|  +----------------------------------+   |
|                                          |
|  [Sign Out]                              |
|                                          |
|  Version 1.0.0                           |
|                                          |
+------------------------------------------+
```

**Settings Sections:**

**Profile:**
- Edit name, email, phone number
- Profile photo (optional)

**Household Info:**
- View/edit household members
- Update income, employment status
- Update state of residence
- Changes trigger eligibility recalculation

**Language:**
- Toggle between English and Spanish
- Affects all UI text, notifications, and AI guidance
- Change takes effect immediately (no restart)

**Notification Preferences:**
- Toggle push notifications on/off
- Toggle SMS notifications on/off (Plus/Family only)
- Set Do Not Disturb hours
- Choose notification types (deadlines, renewals, status updates)

**Subscription:**
- Current plan display
- Upgrade/downgrade options
- Billing history
- Managed via RevenueCat native paywall

**Document Vault (Plus/Family):**
- List of saved scanned documents with type and date
- Tap to view extracted data
- Delete individual documents
- Document count and storage used

**Privacy & Security:**
- Privacy policy (in-app webview)
- Data encryption explanation page
- "Delete All My Data" with confirmation (irreversible; deletes all PII, documents, applications)
- Data export option (download your data as JSON)

**States:**
- **Free User:** Subscription section shows upgrade CTA; Document Vault shows "Upgrade to access" on vault items
- **Plus/Family User:** Full access to all settings; subscription shows plan details and renewal date
- **Delete Data Confirmation:** Two-step confirmation modal ("Are you sure? This will permanently delete all your data including applications, documents, and profile information. This cannot be undone.")

**Accessibility:**
- All settings rows are tappable with minimum 48px height
- Screen reader announces row label and current value
- Destructive actions (delete data, sign out) have confirmation dialogs
- High contrast supported throughout

**Bilingual Considerations:**
- All setting labels and descriptions in selected language
- Language toggle is the one setting shown in both languages ("Language / Idioma")
- Privacy policy available in both English and Spanish
