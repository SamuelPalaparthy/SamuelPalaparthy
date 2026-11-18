export const STAGES = ['analyzing', 'acquired', 'rehab', 'rented', 'refinanced', 'stabilized'] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  analyzing: 'Analyzing',
  acquired: 'Acquired',
  rehab: 'Rehab',
  rented: 'Rented',
  refinanced: 'Refinanced',
  stabilized: 'Stabilized',
};

/** All money values are in dollars; all *Pct values are whole percentages (e.g. 8 = 8%). */
export interface DealInputs {
  // Buy
  purchasePrice: number;
  buyClosingCosts: number;
  acqLoanAmount: number; // hard money / private loan; 0 if all cash
  acqRatePct: number; // annual, interest-only
  acqPointsPct: number; // points on acquisition loan

  // Rehab
  rehabBudget: number;
  holdingMonths: number; // months from purchase to refinance
  holdingCostsMonthly: number; // utilities, taxes, insurance while vacant

  // Rent
  monthlyRent: number;
  otherMonthlyIncome: number;
  vacancyPct: number;
  maintenancePct: number;
  capexPct: number;
  managementPct: number;
  propertyTaxAnnual: number;
  insuranceAnnual: number;
  hoaMonthly: number;
  utilitiesMonthly: number;

  // Refinance
  arv: number;
  refiLtvPct: number;
  refiRatePct: number;
  refiTermYears: number;
  refiClosingCosts: number;
}

export interface RehabItem {
  id: string;
  category: string;
  description: string;
  budget: number;
  actual: number;
  done: boolean;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  stage: Stage;
  purchaseDate?: string; // ISO date (yyyy-mm-dd)
  refiDate?: string;
  seasoningMonths: number; // lender seasoning requirement before cash-out refi
  notes: string;
  deal: DealInputs;
  rehabItems: RehabItem[];
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_DEAL: DealInputs = {
  purchasePrice: 0,
  buyClosingCosts: 0,
  acqLoanAmount: 0,
  acqRatePct: 12,
  acqPointsPct: 2,
  rehabBudget: 0,
  holdingMonths: 6,
  holdingCostsMonthly: 0,
  monthlyRent: 0,
  otherMonthlyIncome: 0,
  vacancyPct: 5,
  maintenancePct: 5,
  capexPct: 5,
  managementPct: 8,
  propertyTaxAnnual: 0,
  insuranceAnnual: 0,
  hoaMonthly: 0,
  utilitiesMonthly: 0,
  arv: 0,
  refiLtvPct: 75,
  refiRatePct: 7,
  refiTermYears: 30,
  refiClosingCosts: 0,
};
