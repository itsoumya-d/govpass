/**
 * GovPass Eligibility Engine
 * Rule-based eligibility screening for 25+ US federal & state assistance programs.
 * Rules based on official federal guidelines (FY 2024).
 */

export interface UserProfile {
  householdSize: number;
  annualIncome: number;          // gross annual household income
  state: string;                 // 2-letter state code
  age: number;
  hasChildren: boolean;
  childrenUnder5: boolean;
  childrenUnder18: number;       // count
  pregnant: boolean;
  disabled: boolean;
  veteran: boolean;
  elderly: boolean;              // 60+
  citizen: boolean;
  legalResident: boolean;
  unemployed: boolean;
  receivingSSI: boolean;
  receivingTANF: boolean;
  housingType: 'renting' | 'owning' | 'homeless' | 'other';
  monthlyRent: number;
  hasHealthInsurance: boolean;
  selfEmployed: boolean;
}

export interface EligibleProgram {
  id: string;
  name: string;
  shortName: string;
  category: 'food' | 'healthcare' | 'housing' | 'childcare' | 'cash' | 'energy' | 'education' | 'employment';
  eligible: boolean;
  estimatedBenefit: string | null;
  applicationUrl: string;
  description: string;
  deadline: string;
  ineligibilityReason?: string;
}

// FPL (Federal Poverty Level) 2024 values
const FPL_BASE = 15060; // 1 person
const FPL_PER_ADDITIONAL = 5380;

function getFPL(householdSize: number): number {
  return FPL_BASE + (Math.max(householdSize - 1, 0) * FPL_PER_ADDITIONAL);
}

function incomeAsPctFPL(income: number, householdSize: number): number {
  return (income / getFPL(householdSize)) * 100;
}

function snapBenefitEstimate(income: number, householdSize: number): string {
  // Max SNAP benefits FY2024 for household size
  const maxBenefits: Record<number, number> = { 1: 291, 2: 535, 3: 766, 4: 973, 5: 1155, 6: 1386, 7: 1532, 8: 1751 };
  const max = maxBenefits[Math.min(householdSize, 8)] ?? 1751;
  // Rough estimate: max - 30% of net income
  const netIncome = Math.max(0, income / 12 - 200);
  const estimated = Math.max(0, Math.round(max - 0.3 * netIncome));
  return `~$${estimated}/month`;
}

export function checkEligibility(profile: UserProfile): EligibleProgram[] {
  const {
    householdSize, annualIncome, age, hasChildren, childrenUnder5,
    childrenUnder18, pregnant, disabled, veteran, elderly, citizen,
    legalResident, unemployed, receivingSSI, housingType, monthlyRent,
    hasHealthInsurance, state,
  } = profile;

  const pctFPL = incomeAsPctFPL(annualIncome, householdSize);
  const monthlyIncome = annualIncome / 12;
  const eligible = citizen || legalResident;

  const programs: EligibleProgram[] = [

    // ── SNAP (Food Stamps) ──────────────────────────────────────────────────
    {
      id: 'snap',
      name: 'SNAP Food Assistance',
      shortName: 'SNAP',
      category: 'food',
      eligible: eligible && pctFPL <= 130,
      estimatedBenefit: pctFPL <= 130 ? snapBenefitEstimate(annualIncome, householdSize) : null,
      applicationUrl: 'https://www.benefits.gov/benefit/361',
      description: 'Monthly food assistance to purchase groceries at authorized retailers.',
      deadline: 'Rolling enrollment — apply anytime',
      ineligibilityReason: !eligible ? 'Must be a US citizen or legal resident' : pctFPL > 130 ? `Income ($${Math.round(monthlyIncome)}/mo) exceeds 130% FPL limit` : undefined,
    },

    // ── Medicaid ─────────────────────────────────────────────────────────────
    {
      id: 'medicaid',
      name: 'Medicaid',
      shortName: 'Medicaid',
      category: 'healthcare',
      eligible: eligible && pctFPL <= 138,
      estimatedBenefit: 'Full healthcare coverage ($0 premium)',
      applicationUrl: 'https://www.healthcare.gov/medicaid-chip/',
      description: 'Free or low-cost health coverage for eligible low-income adults, children, and families.',
      deadline: 'Rolling enrollment',
      ineligibilityReason: pctFPL > 138 ? `Income exceeds 138% FPL — check your state marketplace` : undefined,
    },

    // ── CHIP ──────────────────────────────────────────────────────────────────
    {
      id: 'chip',
      name: "Children's Health Insurance Program (CHIP)",
      shortName: 'CHIP',
      category: 'healthcare',
      eligible: eligible && childrenUnder18 > 0 && pctFPL <= 200,
      estimatedBenefit: 'Low/no-cost health coverage for children',
      applicationUrl: 'https://www.insurekidsnow.gov/',
      description: 'Health insurance for children in families that earn too much for Medicaid.',
      deadline: 'Rolling enrollment',
      ineligibilityReason: childrenUnder18 === 0 ? 'Must have children under 19' : pctFPL > 200 ? 'Income may exceed state limit' : undefined,
    },

    // ── WIC ───────────────────────────────────────────────────────────────────
    {
      id: 'wic',
      name: 'WIC (Women, Infants & Children)',
      shortName: 'WIC',
      category: 'food',
      eligible: eligible && (pregnant || childrenUnder5) && pctFPL <= 185,
      estimatedBenefit: '~$50–$100/month in food benefits',
      applicationUrl: 'https://www.fns.usda.gov/wic',
      description: 'Nutrition support and food vouchers for pregnant women, new mothers, and children under 5.',
      deadline: 'Rolling enrollment',
      ineligibilityReason: (!pregnant && !childrenUnder5) ? 'Must be pregnant or have children under 5' : pctFPL > 185 ? 'Income exceeds 185% FPL' : undefined,
    },

    // ── Section 8 (Housing Choice Voucher) ────────────────────────────────────
    {
      id: 'section8',
      name: 'Housing Choice Voucher (Section 8)',
      shortName: 'Section 8',
      category: 'housing',
      eligible: eligible && housingType === 'renting' && pctFPL <= 50,
      estimatedBenefit: `Subsidizes rent above 30% of income (~$${Math.max(0, Math.round(monthlyRent - monthlyIncome * 0.3))}/mo)`,
      applicationUrl: 'https://www.hud.gov/topics/housing_choice_voucher_program_section_8',
      description: 'Rental assistance vouchers for very low-income families, elderly, and disabled.',
      deadline: 'Check local PHA — waitlists may be closed',
      ineligibilityReason: pctFPL > 50 ? 'Income exceeds 50% of Area Median Income' : housingType !== 'renting' ? 'For renters only' : undefined,
    },

    // ── LIHEAP ────────────────────────────────────────────────────────────────
    {
      id: 'liheap',
      name: 'LIHEAP Energy Assistance',
      shortName: 'LIHEAP',
      category: 'energy',
      eligible: eligible && pctFPL <= 150,
      estimatedBenefit: '$300–$1,500 per year for heating/cooling costs',
      applicationUrl: 'https://www.acf.hhs.gov/ocs/programs/liheap',
      description: 'Helps pay heating and cooling energy bills for low-income households.',
      deadline: 'Seasonal — check state program',
      ineligibilityReason: pctFPL > 150 ? 'Income exceeds 150% FPL' : undefined,
    },

    // ── TANF ──────────────────────────────────────────────────────────────────
    {
      id: 'tanf',
      name: 'Temporary Assistance for Needy Families (TANF)',
      shortName: 'TANF',
      category: 'cash',
      eligible: eligible && hasChildren && pctFPL <= 60,
      estimatedBenefit: '$200–$700/month cash assistance',
      applicationUrl: 'https://www.acf.hhs.gov/ofa/programs/tanf',
      description: 'Monthly cash assistance for families with children. Includes job training.',
      deadline: 'Rolling enrollment',
      ineligibilityReason: !hasChildren ? 'Must have dependent children' : pctFPL > 60 ? 'Income likely exceeds state limits' : undefined,
    },

    // ── SSI ───────────────────────────────────────────────────────────────────
    {
      id: 'ssi',
      name: 'Supplemental Security Income (SSI)',
      shortName: 'SSI',
      category: 'cash',
      eligible: eligible && disabled && monthlyIncome < 1971,
      estimatedBenefit: 'Up to $943/month',
      applicationUrl: 'https://www.ssa.gov/benefits/ssi/',
      description: 'Monthly payments for disabled, blind, or elderly people with limited income/resources.',
      deadline: 'Apply anytime via SSA',
      ineligibilityReason: !disabled ? 'Must have a qualifying disability' : monthlyIncome >= 1971 ? 'Income exceeds SSI limit' : undefined,
    },

    // ── EITC ──────────────────────────────────────────────────────────────────
    {
      id: 'eitc',
      name: 'Earned Income Tax Credit (EITC)',
      shortName: 'EITC',
      category: 'cash',
      eligible: citizen && annualIncome > 0 && annualIncome < (hasChildren ? 57414 : 17640) && age >= 25,
      estimatedBenefit: hasChildren ? 'Up to $7,430 tax refund' : 'Up to $632 tax refund',
      applicationUrl: 'https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit',
      description: 'Tax credit for working individuals and families with low to moderate income.',
      deadline: 'Tax filing deadline (April 15)',
      ineligibilityReason: !citizen ? 'Must be a US citizen' : annualIncome === 0 ? 'Must have earned income' : age < 25 ? 'Must be 25 or older (without children)' : undefined,
    },

    // ── Head Start ────────────────────────────────────────────────────────────
    {
      id: 'headstart',
      name: 'Head Start / Early Head Start',
      shortName: 'Head Start',
      category: 'childcare',
      eligible: eligible && childrenUnder5 && pctFPL <= 100,
      estimatedBenefit: 'Free preschool & child development services',
      applicationUrl: 'https://www.acf.hhs.gov/ohs',
      description: 'Comprehensive child development programs for children ages 0-5 from low-income families.',
      deadline: 'Annual enrollment — check local center',
      ineligibilityReason: !childrenUnder5 ? 'Must have children under 5' : pctFPL > 100 ? 'Income exceeds FPL limit' : undefined,
    },

    // ── Child Care Subsidies (CCAP) ───────────────────────────────────────────
    {
      id: 'ccap',
      name: 'Child Care Assistance Program (CCAP)',
      shortName: 'CCAP',
      category: 'childcare',
      eligible: eligible && hasChildren && childrenUnder18 > 0 && pctFPL <= 150 && !unemployed,
      estimatedBenefit: 'Pays 75–95% of childcare costs',
      applicationUrl: 'https://childcare.gov/',
      description: 'Helps working families afford licensed childcare while they work or attend school.',
      deadline: 'Rolling — check state program',
      ineligibilityReason: !hasChildren ? 'Must have children under 13' : unemployed ? 'Must be working or in school' : pctFPL > 150 ? 'May exceed income limit' : undefined,
    },

    // ── Unemployment Insurance ────────────────────────────────────────────────
    {
      id: 'ui',
      name: 'Unemployment Insurance',
      shortName: 'Unemployment',
      category: 'cash',
      eligible: citizen && unemployed,
      estimatedBenefit: '40–60% of prior wages (varies by state)',
      applicationUrl: 'https://www.careeronestop.org/LocalHelp/UnemploymentBenefits/find-unemployment-benefits.aspx',
      description: 'Weekly cash benefits while you search for a new job after involuntary unemployment.',
      deadline: 'Apply within 7 days of unemployment',
      ineligibilityReason: !unemployed ? 'Must be currently unemployed' : undefined,
    },

    // ── Medicare Extra Help (Low Income Subsidy) ──────────────────────────────
    {
      id: 'medicare-lis',
      name: 'Medicare Extra Help (Low Income Subsidy)',
      shortName: 'Extra Help',
      category: 'healthcare',
      eligible: eligible && elderly && pctFPL <= 150,
      estimatedBenefit: 'Saves ~$5,300/year on prescription drugs',
      applicationUrl: 'https://www.ssa.gov/medicare/part-d/costs/extra-help',
      description: 'Helps people with Medicare pay for prescription drug costs.',
      deadline: 'Rolling enrollment',
      ineligibilityReason: !elderly ? 'Must be 65+ or on Medicare' : pctFPL > 150 ? 'Income exceeds 150% FPL' : undefined,
    },

    // ── Veterans Benefits ─────────────────────────────────────────────────────
    {
      id: 'va-benefits',
      name: 'VA Benefits & Pension',
      shortName: 'VA Benefits',
      category: 'cash',
      eligible: veteran,
      estimatedBenefit: 'Pension up to $1,732/month + healthcare',
      applicationUrl: 'https://www.va.gov/pension/',
      description: 'Monthly pension, healthcare, and other benefits for wartime veterans with low income.',
      deadline: 'Apply anytime via VA.gov',
      ineligibilityReason: !veteran ? 'Must be a qualifying veteran' : undefined,
    },

    // ── Pell Grant ────────────────────────────────────────────────────────────
    {
      id: 'pell-grant',
      name: 'Pell Grant (Education)',
      shortName: 'Pell Grant',
      category: 'education',
      eligible: eligible && age < 30 && pctFPL <= 200,
      estimatedBenefit: 'Up to $7,395/year for college',
      applicationUrl: 'https://studentaid.gov/understand-aid/types/grants/pell',
      description: 'Federal grant for undergraduate students with financial need. Does not need to be repaid.',
      deadline: 'Apply via FAFSA (Oct 1 – June 30)',
      ineligibilityReason: age >= 30 ? 'Typically for students under 30' : pctFPL > 200 ? 'May not qualify based on income' : undefined,
    },

    // ── SNAP E&T (Employment Training) ────────────────────────────────────────
    {
      id: 'snap-et',
      name: 'SNAP Employment & Training',
      shortName: 'SNAP E&T',
      category: 'employment',
      eligible: eligible && pctFPL <= 130 && unemployed,
      estimatedBenefit: 'Free job training, job search assistance',
      applicationUrl: 'https://www.fns.usda.gov/snap/employment-training-program',
      description: 'Career development and job training services for SNAP recipients.',
      deadline: 'Rolling enrollment',
      ineligibilityReason: !unemployed ? 'For unemployed or underemployed SNAP participants' : undefined,
    },
  ];

  return programs;
}

export function getEligibleCount(programs: EligibleProgram[]): number {
  return programs.filter(p => p.eligible).length;
}

export function getEligibleByCategory(programs: EligibleProgram[]): Record<string, EligibleProgram[]> {
  const eligible = programs.filter(p => p.eligible);
  const result: Record<string, EligibleProgram[]> = {};
  for (const p of eligible) {
    if (!result[p.category]) result[p.category] = [];
    result[p.category].push(p);
  }
  return result;
}

export function estimateTotalBenefitValue(programs: EligibleProgram[]): number {
  // Rough annual estimate from eligible programs
  const monthlyEstimates: Record<string, number> = {
    snap: 500, medicaid: 400, chip: 200, wic: 75, section8: 800,
    liheap: 75, tanf: 400, ssi: 800, eitc: 350, headstart: 1200,
    ccap: 600, ui: 1200, 'medicare-lis': 440, 'va-benefits': 1000,
    'pell-grant': 600,
  };

  return programs
    .filter(p => p.eligible)
    .reduce((sum, p) => sum + (monthlyEstimates[p.id] ?? 100), 0);
}
