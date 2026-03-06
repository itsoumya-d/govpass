# GovPass

**Your guide through government paperwork.**

`B2C` | `Mobile-First` | `AI for Government`

---

## Elevator Pitch

GovPass is an AI-powered mobile app that guides Americans through government forms, auto-fills applications from scanned documents, and tracks benefits applications across agencies. Point your camera at an ID, tax form, or pay stub, and GovPass extracts your information, checks your eligibility for federal and state programs, and walks you through every application step by step. It turns the maze of government bureaucracy into a simple, guided experience. For the 35 million Americans eligible for unclaimed benefits and 44 million immigrants navigating complex documentation, GovPass replaces confusion with clarity and puts billions in unclaimed benefits into the hands of people who need them.

---

## YC Alignment

### RFS #5: AI for Government (Spring 2026)

GovPass maps directly to Y Combinator's Request for Startups #5, "AI for Government." While most GovTech startups sell to agencies (the supply side), GovPass is the citizen-side complement -- an AI agent that helps individuals navigate the bureaucracy that agencies have failed to simplify. YC has explicitly called for startups that use AI to make government services more accessible, and GovPass does exactly that from the demand side.

### Similar YC Companies

| Company | YC Batch | Relevance to GovPass |
|---------|----------|---------------------|
| **Ambrook** | W22 | Helps farmers navigate USDA grants and government programs; validates that AI-guided government benefits is a fundable category |
| **Clerk** | W21 | Identity and authentication infrastructure; GovPass handles identity documents similarly but for government form completion |
| **Balsa** | S21 | Legal document automation; GovPass applies the same AI-driven document intelligence to government forms |
| **SimpleCitizen** | W16 | Immigration form assistance; validates the market for guided government applications, though limited to immigration |

### Why YC Would Fund This

1. **Massive underserved market** -- 35M Americans leave $60B+ in benefits unclaimed annually
2. **AI-native product** -- GPT-4o Vision for document scanning and form guidance is only possible now
3. **Strong social mission** -- aligns with YC's stated interest in companies that help underserved populations
4. **Clear revenue model** -- people will pay to access thousands of dollars in annual benefits
5. **Network effects** -- every successful application generates word-of-mouth in tight-knit communities

---

## Market Opportunity

### The Unclaimed Benefits Crisis

- **$60 billion+ in federal benefits go unclaimed annually** (Center on Budget and Policy Priorities)
- **48% of eligible Americans do not apply for SNAP** (food stamps), leaving ~$23B on the table
- **35 million Americans** are eligible for benefits they never claim due to confusing applications
- **44 million immigrants** in the US face additional documentation complexity
- **The average SNAP application takes 3-5 hours** and requires 7+ documents across multiple agencies
- **22% of applications are denied due to paperwork errors**, not ineligibility (Urban Institute)

### Why Now

1. **GPT-4o Vision** can now extract structured data from government IDs, tax forms, and pay stubs with high accuracy
2. **Government digitization is accelerating** -- more agencies accept online applications, creating API integration opportunities
3. **Post-pandemic awareness** -- millions discovered government benefits for the first time during COVID and now seek ongoing assistance
4. **Smartphone penetration** among low-income Americans exceeds 85%, making mobile-first the right channel
5. **Political tailwinds** -- both parties support benefit access (reducing fraud for the right, reducing poverty for the left)

---

## Unicorn Trajectory

| Metric | Value |
|--------|-------|
| **TAM** (Total Addressable Market) | $2.3T benefits disbursed annually by US government |
| **SAM** (Serviceable Available Market) | $500B GovTech market (citizen-facing services) |
| **SOM** (Serviceable Obtainable Market) | $5B AI-assisted benefits navigation (5-year horizon) |

### Comparable Companies

| Company | Valuation | Relevance to GovPass |
|---------|-----------|---------------------|
| **TurboTax / Intuit** | $180B | Proved Americans will pay for guided government form completion; GovPass is TurboTax for everything beyond taxes |
| **ID.me** | $4.5B | Government identity verification; validates massive GovTech valuations; GovPass uses identity docs as input, not output |
| **Navan (TripActions)** | $9.2B | Proved AI-guided workflows for complex processes command premium valuations |
| **Duolingo** | $8.5B | Proved mobile-first, freemium education apps for underserved populations can reach unicorn scale |

### Path to $1B Valuation

- **$1M MRR** (Month 18): 100,000 paying subscribers at $10 ARPU
- **$5M MRR** (Month 30): 500,000 paying subscribers across all 50 states
- **$10M MRR** (Month 36): 1M subscribers + government partnerships
- At 25x revenue multiple (standard for high-growth B2C AI): **$10M MRR = $3B valuation**

---

## Competition

| Competitor | AI-Powered | Document Scanning | Multi-Program | Application Tracking | Mobile-First | Bilingual | Cost |
|-----------|-----------|-------------------|---------------|---------------------|-------------|-----------|------|
| **Benefits.gov** | No | No | Yes (directory only) | No | Poor UX | Limited | Free |
| **Single Stop** | No | No | Partial | No | No (kiosk-based) | Limited | Free (nonprofit) |
| **TurboTax** | Partial | Yes (tax only) | Tax only | Tax only | Yes | Yes | $0-$169 |
| **BenefitKitchen** | No | No | Partial | No | Yes | No | Free |
| **GetCalFresh** | No | No | SNAP only | Partial | Yes | Yes | Free (CA only) |
| **GovPass** | **Yes (GPT-4o)** | **Yes (all docs)** | **Yes (25+ programs)** | **Yes (all agencies)** | **Yes** | **Yes (EN/ES)** | **Free/$7.99/$14.99** |

**Key insight:** No existing solution combines AI-powered document scanning, multi-program eligibility checking, guided application flows, and cross-agency tracking. Benefits.gov is a directory with no guidance. Single Stop requires in-person visits. TurboTax only handles taxes. GovPass is the first AI agent that handles the full lifecycle of government benefits from eligibility to approval.

---

## Project Documentation

| Document | Description |
|----------|-------------|
| [Tech Stack](./tech-stack.md) | Architecture, frameworks, AI pipeline, encryption, and scalability plan |
| [Features](./features.md) | MVP features, post-MVP roadmap, user stories, and acceptance criteria |
| [Screens](./screens.md) | All 8 app screens with UI elements, states, accessibility, and bilingual design |
| [Skills](./skills.md) | Technical, domain, design, and business skills needed to build GovPass |
| [Theme](./theme.md) | Civic Helper brand identity, color system, typography, and component specs |
| [API Guide](./api-guide.md) | All external APIs with pricing, setup, PII handling, and cost projections |
| [Revenue Model](./revenue-model.md) | Pricing tiers, unit economics, growth timeline, and acquisition channels |

---

## One-Liner

> GovPass is TurboTax for all government benefits -- an AI agent that scans your documents, finds what you qualify for, and walks you through every application.
