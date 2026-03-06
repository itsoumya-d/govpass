# GovPass Theme

**Civic Helper brand identity, color system, typography, spacing, components, and accessibility.**

---

## Brand Personality: "Civic Helper"

GovPass embodies the **Civic Helper** personality -- an approachable, trustworthy guide through government paperwork. The visual language is warm and professional without being intimidating. It evokes the feeling of a knowledgeable neighbor who happens to know how government benefits work, not a cold government website or a slick tech startup.

### Personality Traits

| Trait | Expression | What to Avoid |
|-------|-----------|---------------|
| **Trustworthy** | Government blues, shield icons, encryption messaging, calm tone | Looking like a scam; flashy gradients; crypto aesthetics |
| **Approachable** | Rounded fonts, warm illustrations, friendly language, gentle animations | Corporate stiffness; legal jargon; dense text walls |
| **Clear** | Plain language, high contrast, generous whitespace, obvious CTAs | Ambiguity; tiny text; hidden actions; complex navigation |
| **Patriotic (not political)** | Blue and red accents from US flag palette; government building motifs | Political branding; partisan colors; campaign aesthetics; flag imagery that could feel exclusionary to immigrants |
| **Empowering** | Celebration for approvals; dollar amounts front and center; progress tracking | Paternalistic tone; pity-based messaging; talking down to users |
| **Inclusive** | Diverse illustrations; bilingual default; accessible design; no assumptions about family structure | Stereotyping; single demographic representation; English-only design |

---

## Color System

### Primary Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Trust Blue** | `#1E40AF` | rgb(30, 64, 175) | Primary buttons, headers, tab bar active, links, trust-building elements |
| **Trust Blue Dark** | `#1E3A8A` | rgb(30, 58, 138) | Button pressed states, header backgrounds, dark mode primary |
| **Trust Blue Light** | `#DBEAFE` | rgb(219, 234, 254) | Auto-filled field backgrounds, info banners, eligibility badges |

### Secondary Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Warm Gray** | `#6B7280` | rgb(107, 114, 128) | Body text secondary, labels, placeholders, borders, inactive tab icons |
| **Warm Gray Light** | `#9CA3AF` | rgb(156, 163, 175) | Disabled text, subtle borders, metadata |
| **Warm Gray Dark** | `#374151` | rgb(55, 65, 81) | Body text primary (light mode), headings on light backgrounds |

### Accent Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Civic Green** | `#059669` | rgb(5, 150, 105) | Progress indicators, approval states, money saved highlights, "eligible" badges, step completion checkmarks |
| **Civic Green Light** | `#D1FAE5` | rgb(209, 250, 229) | Approved application card background, success banner background |
| **Patriot Red** | `#B91C1C` | rgb(185, 28, 28) | Accent highlights sparingly, deadline urgency indicators, American flag motif accent (used minimally) |

### Semantic Colors

| Color | Name | Hex | Usage |
|-------|------|-----|-------|
| **Success** | Approval Green | `#10B981` | Application approved, document verified, eligibility confirmed |
| **Success BG** | Approval Green Light | `#D1FAE5` | Success banner and card backgrounds |
| **Error** | Denial Red | `#EF4444` | Application denied, form validation errors, required field missing |
| **Error BG** | Denial Red Light | `#FEE2E2` | Error banner and card backgrounds |
| **Warning** | Deadline Amber | `#F59E0B` | Upcoming deadlines, low-confidence fields, renewals due soon |
| **Warning BG** | Deadline Amber Light | `#FEF3C7` | Warning banner and card backgrounds |
| **Info** | Notice Blue | `#3B82F6` | Informational messages, tips, help tooltips, auto-fill indicators |
| **Info BG** | Notice Blue Light | `#DBEAFE` | Info banner and card backgrounds |

### Background & Surface Colors

| Color | Name | Hex | Usage |
|-------|------|-----|-------|
| **BG Light** | Clean White | `#F9FAFB` | Main background (light mode) |
| **BG Dark** | Night Gray | `#111827` | Main background (dark mode) |
| **Surface Light** | Card White | `#F3F4F6` | Cards, modals, input backgrounds (light mode) |
| **Surface Dark** | Card Dark | `#1F2937` | Cards, modals, input backgrounds (dark mode) |
| **Pure White** | White | `#FFFFFF` | Card foregrounds, button text on dark backgrounds |
| **Text Primary Light** | | `#111827` | Primary text (light mode) |
| **Text Primary Dark** | | `#F9FAFB` | Primary text (dark mode) |
| **Text Secondary Light** | | `#6B7280` | Secondary text (light mode) |
| **Text Secondary Dark** | | `#9CA3AF` | Secondary text (dark mode) |

### Color Application Rules

1. **Trust Blue is the dominant color.** It appears in the header, primary buttons, active tab icons, and links. It anchors the app in government trust.
2. **Civic Green is the reward color.** It appears only when something positive happens: eligibility confirmed, application approved, document verified, step completed.
3. **Patriot Red is used sparingly.** Only for urgent deadlines and as a subtle accent. Never for errors (Denial Red handles that). Never dominant -- red feels alarming for vulnerable populations.
4. **Warm Gray provides neutrality.** Most text, borders, and structural elements use the gray palette. This creates visual calm and lets the semantic colors stand out.
5. **White space is a feature.** Generous padding and margins reduce cognitive load. Government forms are dense; GovPass must not feel dense.

---

## Typography

### Font Families

| Font | Role | Why This Font |
|------|------|--------------|
| **Nunito** | Headings (H1-H4), buttons, navigation labels | Rounded, friendly, approachable. Excellent legibility at large sizes. The soft letter forms reduce the intimidation factor of government content. Performs well for low-literacy readers because letter shapes are distinct and recognizable. |
| **Inter** | Body text, form labels, input text, descriptions | Clean, neutral, highly legible at small sizes. Designed for screens with excellent number and letter differentiation. Strong multi-language support including Latin diacritics for Spanish. |

### Type Scale

| Level | Font | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|------|--------|-------------|----------------|-------|
| **Display** | Nunito | 32px | 800 (ExtraBold) | 40px (1.25) | -0.5px | Total benefits amount ("$8,400/year") |
| **H1** | Nunito | 28px | 700 (Bold) | 36px (1.29) | -0.3px | Screen titles ("Your Benefits") |
| **H2** | Nunito | 24px | 700 (Bold) | 32px (1.33) | -0.2px | Section headers ("Active Applications") |
| **H3** | Nunito | 20px | 600 (SemiBold) | 28px (1.4) | 0 | Card titles ("SNAP Application") |
| **H4** | Nunito | 18px | 600 (SemiBold) | 24px (1.33) | 0 | Sub-section headers, benefit names |
| **Body Large** | Inter | 18px | 400 (Regular) | 28px (1.56) | 0 | Primary body text, form guidance, tooltips |
| **Body** | Inter | 16px | 400 (Regular) | 24px (1.5) | 0 | Standard body text, descriptions |
| **Body Small** | Inter | 14px | 400 (Regular) | 20px (1.43) | 0.1px | Secondary text, metadata, timestamps |
| **Caption** | Inter | 12px | 500 (Medium) | 16px (1.33) | 0.3px | Labels, badges, status indicators |
| **Button** | Nunito | 16px | 700 (Bold) | 24px (1.5) | 0.5px | Button labels, CTAs |
| **Button Small** | Nunito | 14px | 600 (SemiBold) | 20px (1.43) | 0.3px | Secondary buttons, card action buttons |

### Typography Rules

1. **18px minimum for any guidance text.** Users may have low literacy or vision impairments; guidance text that explains what to do must never be smaller than 18px.
2. **16px minimum for all interactive labels.** Form field labels, button text, and navigation labels must be at least 16px.
3. **Support dynamic type.** Respect iOS and Android system font size preferences. Test at 1x, 1.5x, and 2x system font scaling.
4. **No ALL CAPS for body text.** ALL CAPS reduces readability by 10-15% for low-literacy readers. Use for short labels and badges only (e.g., "SNAP", "APPROVED").
5. **Bold for scannability.** Use bold weight (700) for any text that users need to find quickly: benefit amounts, program names, status labels, deadlines.

---

## Spacing System

### Base Unit: 8px

All spacing uses multiples of 8px for visual consistency.

| Token | Value | Usage |
|-------|-------|-------|
| `space-xs` | 4px | Icon-to-text gap, tight inline elements |
| `space-sm` | 8px | Within components (padding between label and value) |
| `space-md` | 16px | Between related elements (form field to form field) |
| `space-lg` | 24px | Between sections (section header to first card) |
| `space-xl` | 32px | Between major sections (benefits list to applications list) |
| `space-2xl` | 48px | Screen top/bottom padding |

### Component Spacing

| Element | Horizontal Padding | Vertical Padding | Margin Bottom |
|---------|-------------------|------------------|---------------|
| **Screen** | 16px | 48px top, 24px bottom | N/A |
| **Card** | 16px | 16px | 16px |
| **Button (Large)** | 24px | 16px | N/A |
| **Button (Small)** | 16px | 12px | N/A |
| **Form Field** | 16px | 14px | 16px |
| **Section Header** | 0 | 0 | 12px |
| **List Item** | 16px | 14px | 0 (border separates) |
| **Tab Bar** | 0 | 12px top, safe area bottom | N/A |

### Border Radius

| Element | Radius | Rationale |
|---------|--------|-----------|
| **Cards** | 12px | Rounded enough to feel friendly; not so round it looks childish |
| **Buttons** | 10px | Slightly less rounded than cards; clearly interactive |
| **Inputs** | 8px | Consistent with cards but slightly sharper; indicates editability |
| **Badges/Chips** | Full (pill) | Status badges, filter chips, eligibility indicators |
| **Avatar** | Full (circle) | Profile photos |
| **Modals/Sheets** | 16px top | Bottom sheets have rounded top corners |

---

## Iconography

### Primary Icon Set: Heroicons (Outline)

**Why Heroicons:** Clear, simple line icons that feel government-appropriate without being sterile. The outline style keeps the UI light and airy. Consistent 24px grid with 1.5px stroke weight.

### Custom Icons

| Icon | Purpose | Design Notes |
|------|---------|-------------|
| **Shield with checkmark** | Security/encryption messaging | Conveys safety and verification; used near PII-related messaging |
| **Document with scan lines** | Document scanning CTA | Camera-scan visual metaphor; animated scan line in scanner screen |
| **Dollar in circle** | Benefit amount | Clear monetary association; used on benefit cards next to amounts |
| **Government building** | Program/agency reference | Simple columned building silhouette; used in application tracker |
| **Family group** | Household/family plan | Diverse silhouette group; used for household member sections |
| **Flag elements** | Subtle patriotic motifs | Abstract flag-inspired shapes (not actual flags); used sparingly in onboarding and about page |

### Icon Sizing

| Context | Size | Stroke |
|---------|------|--------|
| Tab bar | 24px | 1.5px |
| Card icons | 20px | 1.5px |
| Inline with text | 16px | 1.5px |
| Feature illustrations | 48px | 2px |
| Empty states | 64px | 2px |

---

## Illustrations

### Style: Simple Flat People Illustrations

**Style guide:**
- Flat illustration style (no gradients, no 3D)
- Simple geometric body shapes
- Diverse skin tones (light, medium, brown, dark -- minimum 4 tones represented)
- Varied ages (young adults, middle-aged, elderly)
- Accessible representation (wheelchair user, person with cane in some illustrations)
- Government building motifs in backgrounds (simplified columned buildings, flag shapes)
- Warm, muted color palette matching the Civic Helper theme

### Illustration Usage

| Context | Description | Key Elements |
|---------|-------------|-------------|
| **Onboarding: Welcome** | Person holding phone with document in other hand | Friendly smile, diverse skin tone, GovPass logo on phone screen |
| **Onboarding: Scan** | Phone scanning a document with light rays | Document alignment visual, extraction visualization |
| **Empty state: No benefits** | Person sitting with thought bubble | Encouraging pose, question marks in bubble, link to "try again" |
| **Empty state: No applications** | Person at starting line | Motivational, "ready to start" energy |
| **Approval celebration** | Person with arms raised, confetti | Green check, dollar signs, celebration |
| **Denial compassion** | Person with supportive hand on shoulder | Gentle, "we'll figure this out" energy; never dejected |
| **Family plan** | Multi-generational family group | 3-4 people of different ages, diverse, warm |

---

## Design Principles

### 1. Plain Language (No Jargon)

| Government Term | GovPass Term |
|----------------|--------------|
| "Supplemental Nutrition Assistance Program" | "SNAP (Food Stamps)" |
| "Determine your eligibility" | "Check if you qualify" |
| "Submit your application" | "Send your application" |
| "Household composition" | "Who lives with you" |
| "Adjusted Gross Income" | "Your yearly income" |
| "Categorical eligibility" | "You automatically qualify because..." |
| "Recertification" | "Renewal" |
| "Adverse action" | "Denial" |
| "Fair hearing" | "Appeal" |

### 2. Large Text Default

- All guidance text: 18px minimum
- All interactive labels: 16px minimum
- Benefit amounts: 24px+ (Display or H2)
- Support system font scaling up to 2x
- Never rely on text smaller than 12px for critical information

### 3. High Contrast

- Light mode: `#111827` text on `#F9FAFB` background (contrast ratio 15.4:1)
- Dark mode: `#F9FAFB` text on `#111827` background (contrast ratio 15.4:1)
- All interactive elements meet WCAG AAA (7:1 minimum contrast ratio)
- Status colors paired with text labels (never color-only indicators)
- Focus indicators visible in both light and dark mode

### 4. Clear Progress Indicators

- **Multi-step forms:** Segmented progress bar at top of every application flow; "Step X of Y" text; estimated time remaining
- **Application tracker:** Status badges with both color and text; timeline visualization; "Day X of ~Y" for pending applications
- **Eligibility:** "Checking X of 25 programs..." progress during calculation
- **Document scan:** Upload progress bar with percentage and status text

### 5. Celebration for Approvals

When a user marks an application as approved:
- Confetti animation (3 seconds, subtle)
- Green background flash on the card
- Celebratory message: "Congratulations! Your [program] benefits have been approved!"
- Dollar amount highlighted: "You'll receive approximately $X/month"
- Next steps: "Here's what happens next..."
- Haptic feedback (success pattern)

### 6. Gentle for Denials

When a user marks an application as denied:
- No dramatic colors or animations
- Calm, empathetic message: "We're sorry to hear that. Here are your options."
- Next steps clearly displayed: appeal process, reapply timeline, alternative programs
- "Similar programs you might qualify for" suggestion
- No dead ends -- always provide a path forward
- Support link prominent

### 7. Bilingual-Ready Layout

- All layouts tested at 120% text width (Spanish expansion)
- No fixed-width text containers that could overflow
- Button labels accommodate longer Spanish translations
- Date and currency formatting adapts to locale
- Program names shown with both English official name and translated label where applicable
- RTL layout support architected for future Arabic support

---

## Component Specifications

### Benefit Card

```
+------------------------------------------+
| [Category Icon - Food]     [Eligible Badge]|
|                                            |
| SNAP (Food Stamps)                         |
| Programa de Asistencia Nutricional         |
|                                            |
| ~$3,200/year                               |
| (~$267/month)                              |
|                                            |
| Food assistance for households             |
| with limited income                        |
|                                            |
| [Apply Now]              [Learn More >]    |
+------------------------------------------+

Specs:
- Background: #FFFFFF (light) / #1F2937 (dark)
- Border: 1px solid #E5E7EB (light) / #374151 (dark)
- Border Radius: 12px
- Padding: 16px all sides
- Category Icon: 20px, colored by category (Food=Green, Health=Blue, Housing=Amber, Cash=Green)
- Eligible Badge: Pill shape, #D1FAE5 bg, #059669 text, "Likely Eligible"
- Program Name: H3 (Nunito 20px SemiBold, #111827)
- Spanish Name: Body Small (Inter 14px, #6B7280) - shown in Spanish mode only
- Amount: Display (Nunito 32px ExtraBold, #059669)
- Monthly: Body (Inter 16px, #6B7280)
- Description: Body (Inter 16px, #374151)
- Apply Button: Trust Blue bg, White text, 10px radius, 16px vertical padding
- Learn More: Text button, Trust Blue text, no background
- Shadow: 0 1px 3px rgba(0,0,0,0.1) (light mode)
- Margin Bottom: 16px
```

### Application Progress Stepper

```
+------------------------------------------+
| Step 2 of 8: Household Info              |
|                                          |
| [1]---[2]---[ 3 ]---[ 4 ]---[ 5 ]---   |
|  OK    OK   Current  Next   Next         |
|                                          |
| ~15 min remaining                        |
+------------------------------------------+

Specs:
- Step circles: 32px diameter
  - Completed: #059669 fill, white checkmark
  - Current: #1E40AF fill, white number
  - Upcoming: #E5E7EB fill, #6B7280 number
- Connecting lines: 2px height
  - Completed: #059669
  - Upcoming: #E5E7EB
- Step Label: Caption (Inter 12px, #6B7280)
- Current Step Title: H4 (Nunito 18px SemiBold, #111827)
- Time Remaining: Body Small (Inter 14px, #6B7280)
- Container Padding: 16px
- Background: #F3F4F6 (light) / #1F2937 (dark)
- Border Radius: 12px
```

### Document Scan Frame

```
+------------------------------------------+
|                                          |
|   +------+                   +------+    |
|   |                                 |    |
|   |                                 |    |
|   |      [ Document Area ]         |    |
|   |                                 |    |
|   |                                 |    |
|   +------+                   +------+    |
|                                          |
|   Position your document inside          |
|   the frame                              |
|                                          |
+------------------------------------------+

Specs:
- Outer overlay: rgba(0,0,0,0.6) semi-transparent black
- Document area: transparent cutout, aspect ratio 1.586:1 (standard ID/card ratio)
- Corner guides: 3px stroke, 32px length on each side
  - Searching: #F59E0B (amber), pulsing animation (0.8s cycle)
  - Aligned: #10B981 (green), solid, scale animation (1.05x, 0.3s)
  - Capturing: #FFFFFF (white), flash animation
- Instruction text: Body Large (Inter 18px, #FFFFFF), centered below cutout
- Capture button: 72px circle, #FFFFFF, centered at bottom
  - Inner circle: 60px, #1E40AF
  - Active: scale down to 0.9x on press
```

### Eligibility Checklist

```
+------------------------------------------+
| LIKELY ELIGIBLE                          |
|                                          |
| [Green Dot] SNAP          ~$3,200/yr  >  |
| [Green Dot] Medicaid      ~$4,000/yr  >  |
| [Green Dot] EITC          ~$1,200/yr  >  |
|                                          |
| MAY BE ELIGIBLE                          |
|                                          |
| [Amber Dot] WIC           ~$600/yr   >  |
| [Amber Dot] LIHEAP        ~$400/yr   >  |
|                                          |
| NOT ELIGIBLE                             |
|                                          |
| [Gray Dot] Section 8      --------   >  |
+------------------------------------------+

Specs:
- Section Headers: H4 (Nunito 18px SemiBold)
  - Likely Eligible: #059669
  - May Be Eligible: #F59E0B
  - Not Eligible: #6B7280
- Status Dots: 12px circle
  - Eligible: #10B981 (solid fill)
  - Maybe: #F59E0B (solid fill)
  - Ineligible: #D1D5DB (solid fill)
- Program Name: Body (Inter 16px, #111827)
- Estimated Value: Body (Inter 16px, #059669 for eligible, #6B7280 for ineligible)
- Chevron: 16px, #9CA3AF
- Row Height: 52px minimum
- Row Padding: 16px horizontal, 14px vertical
- Divider: 1px, #E5E7EB, indented 44px left
```

---

## Dark Mode

GovPass supports automatic dark mode based on system preferences, with manual override in Settings.

### Dark Mode Color Mapping

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Background | `#F9FAFB` | `#111827` |
| Surface/Cards | `#FFFFFF` / `#F3F4F6` | `#1F2937` |
| Primary Text | `#111827` | `#F9FAFB` |
| Secondary Text | `#6B7280` | `#9CA3AF` |
| Border | `#E5E7EB` | `#374151` |
| Trust Blue | `#1E40AF` | `#3B82F6` (lightened for dark bg contrast) |
| Civic Green | `#059669` | `#10B981` (lightened) |
| Input Background | `#FFFFFF` | `#374151` |
| Tab Bar | `#FFFFFF` | `#1F2937` |

### Dark Mode Rules

1. All semantic colors (success, error, warning, info) use the same hue but lightened for dark backgrounds
2. Shadows are removed in dark mode; replaced with lighter borders
3. Illustrations adapt with darker backgrounds (or are placed on card surfaces)
4. Document scanner overlay uses the same dark treatment in both modes
5. Status badges maintain their colors with adjusted backgrounds for readability

---

## Animation Specifications

| Animation | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Screen transition | 300ms | ease-in-out | Navigation between screens |
| Card press | 150ms | ease-out | Touch down on card (scale 0.98) |
| Progress bar fill | 600ms | ease-out | Step completion in application flow |
| Confetti celebration | 3000ms | linear | Application marked as approved |
| Document alignment pulse | 800ms | ease-in-out (loop) | Scanner searching for document edges |
| Auto-capture flash | 200ms | ease-out | Document captured successfully |
| Skeleton loading | 1500ms | ease-in-out (loop) | Content loading shimmer |
| Badge appear | 200ms | spring (damping 15) | Eligibility badge entering view |
| Notification badge bounce | 400ms | spring (damping 10) | New notification received |
| Save confirmation | 300ms | ease-out | Data saved successfully (checkmark draw) |

---

## Accessibility Specifications

### WCAG 2.1 AA Compliance (Minimum)

| Requirement | Implementation |
|-------------|---------------|
| **Color contrast** | All text meets 4.5:1 minimum; large text meets 3:1; interactive elements meet 3:1 against background |
| **Touch targets** | Minimum 44px x 44px for all interactive elements; 48px recommended |
| **Screen reader** | All images have alt text; all buttons have accessible labels; form fields have associated labels |
| **Focus management** | Visible focus indicators; logical tab order; focus trapped in modals |
| **Motion** | Respect "reduce motion" system setting; disable confetti and pulsing animations; replace with static alternatives |
| **Text scaling** | Support up to 200% system font scaling without layout breaking |
| **Error identification** | Errors identified by text (not color alone); error messages adjacent to relevant fields |

### WCAG 2.1 AAA Goals (Target)

| Requirement | Implementation |
|-------------|---------------|
| **Enhanced contrast** | 7:1 for normal text; 4.5:1 for large text (already met by default palette) |
| **No timing** | No time-limited interactions; auto-capture has manual fallback |
| **Clear language** | All text at 6th-grade reading level; terms defined inline |
| **Consistent navigation** | Same tab bar on every screen; consistent back button placement |
