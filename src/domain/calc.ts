import type { DealInputs, Property, Stage } from './types';

export interface DealMetrics {
  // Acquisition & rehab
  acqInterest: number;
  acqPoints: number;
  holdingCosts: number;
  totalProjectCost: number; // everything spent to get the property rent-ready
  cashInvested: number; // out-of-pocket cash before refi

  // Refinance
  refiLoan: number;
  cashOutAtRefi: number; // cash returned to investor after paying off acq loan & refi costs
  cashLeftInDeal: number; // negative => pulled out more than invested
  capitalRecoveredPct: number; // share of invested cash returned at refi
  equityAfterRefi: number;
  monthlyPI: number;

  // Operations
  grossMonthlyIncome: number;
  effectiveMonthlyIncome: number;
  monthlyOperatingExpenses: number;
  noiAnnual: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  cashOnCash: number | null; // null => infinite (no cash left in deal)
  dscr: number | null;
  capRate: number | null;

  // Rules of thumb
  maxOffer70: number; // 70% rule: ARV * 0.7 - rehab
  meets70Rule: boolean;
  onePercentRatio: number | null; // monthly rent / (purchase + rehab)
}

/** Standard amortized monthly payment. */
export function monthlyPayment(principal: number, annualRatePct: number, termYears: number): number {
  if (principal <= 0 || termYears <= 0) return 0;
  const n = termYears * 12;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

const safeDiv = (a: number, b: number): number | null => (b > 0 ? a / b : null);

export function analyzeDeal(d: DealInputs): DealMetrics {
  const acqInterest = d.acqLoanAmount * (d.acqRatePct / 100 / 12) * d.holdingMonths;
  const acqPoints = d.acqLoanAmount * (d.acqPointsPct / 100);
  const holdingCosts = d.holdingCostsMonthly * d.holdingMonths;

  const totalProjectCost =
    d.purchasePrice + d.buyClosingCosts + d.rehabBudget + holdingCosts + acqInterest + acqPoints;
  const cashInvested = totalProjectCost - d.acqLoanAmount;

  const refiLoan = d.arv * (d.refiLtvPct / 100);
  const cashOutAtRefi = refiLoan - d.refiClosingCosts - d.acqLoanAmount;
  const cashLeftInDeal = cashInvested - cashOutAtRefi;
  const capitalRecoveredPct = cashInvested > 0 ? (cashOutAtRefi / cashInvested) * 100 : 0;
  const equityAfterRefi = d.arv - refiLoan;
  const monthlyPI = monthlyPayment(refiLoan, d.refiRatePct, d.refiTermYears);

  const grossMonthlyIncome = d.monthlyRent + d.otherMonthlyIncome;
  const effectiveMonthlyIncome = grossMonthlyIncome * (1 - d.vacancyPct / 100);
  const pctExpenses =
    d.monthlyRent * ((d.maintenancePct + d.capexPct + d.managementPct) / 100);
  const monthlyOperatingExpenses =
    pctExpenses +
    d.propertyTaxAnnual / 12 +
    d.insuranceAnnual / 12 +
    d.hoaMonthly +
    d.utilitiesMonthly;

  const noiAnnual = (effectiveMonthlyIncome - monthlyOperatingExpenses) * 12;
  const monthlyCashFlow = effectiveMonthlyIncome - monthlyOperatingExpenses - monthlyPI;
  const annualCashFlow = monthlyCashFlow * 12;
  const cashOnCash = cashLeftInDeal > 0 ? (annualCashFlow / cashLeftInDeal) * 100 : null;
  const dscr = safeDiv(noiAnnual, monthlyPI * 12);
  const capRateRaw = safeDiv(noiAnnual, d.arv);

  const maxOffer70 = d.arv * 0.7 - d.rehabBudget;
  const onePct = safeDiv(d.monthlyRent, d.purchasePrice + d.rehabBudget);

  return {
    acqInterest,
    acqPoints,
    holdingCosts,
    totalProjectCost,
    cashInvested,
    refiLoan,
    cashOutAtRefi,
    cashLeftInDeal,
    capitalRecoveredPct,
    equityAfterRefi,
    monthlyPI,
    grossMonthlyIncome,
    effectiveMonthlyIncome,
    monthlyOperatingExpenses,
    noiAnnual,
    monthlyCashFlow,
    annualCashFlow,
    cashOnCash,
    dscr,
    capRate: capRateRaw === null ? null : capRateRaw * 100,
    maxOffer70,
    meets70Rule: d.arv > 0 && d.purchasePrice <= maxOffer70,
    onePercentRatio: onePct === null ? null : onePct * 100,
  };
}

export type Verdict = 'great' | 'good' | 'marginal' | 'poor' | 'incomplete';

/** A simple, opinionated read of a deal. Thresholds are deliberately conservative. */
export function dealVerdict(d: DealInputs, m: DealMetrics): { verdict: Verdict; reasons: string[] } {
  if (d.purchasePrice <= 0 || d.arv <= 0 || d.monthlyRent <= 0) {
    return { verdict: 'incomplete', reasons: ['Enter purchase price, ARV and rent to evaluate.'] };
  }
  const reasons: string[] = [];
  let score = 0;

  if (m.capitalRecoveredPct >= 100) {
    score += 2;
    reasons.push('Refi returns all of your invested capital.');
  } else if (m.capitalRecoveredPct >= 80) {
    score += 1;
    reasons.push(`Refi returns ${m.capitalRecoveredPct.toFixed(0)}% of invested capital.`);
  } else {
    reasons.push(`Only ${Math.max(0, m.capitalRecoveredPct).toFixed(0)}% of capital comes back at refi.`);
  }

  if (m.monthlyCashFlow >= 200) {
    score += 2;
    reasons.push('Cash flow is at least $200/mo after refi.');
  } else if (m.monthlyCashFlow > 0) {
    score += 1;
    reasons.push('Cash flow is positive but thin.');
  } else {
    score -= 2;
    reasons.push('Negative cash flow after refi.');
  }

  if (m.dscr !== null) {
    if (m.dscr >= 1.25) score += 1;
    else if (m.dscr < 1.0) {
      score -= 1;
      reasons.push(`DSCR of ${m.dscr.toFixed(2)} may not qualify for a DSCR loan.`);
    }
  }

  if (m.meets70Rule) {
    score += 1;
    reasons.push('Purchase price meets the 70% rule.');
  }

  const verdict: Verdict = score >= 5 ? 'great' : score >= 3 ? 'good' : score >= 1 ? 'marginal' : 'poor';
  return { verdict, reasons };
}

const POST_REFI: Stage[] = ['refinanced', 'stabilized'];
const RENTING: Stage[] = ['rented', 'refinanced', 'stabilized'];
const OWNED: Stage[] = ['acquired', 'rehab', 'rented', 'refinanced', 'stabilized'];

export function rehabTotals(p: Property) {
  const budget = p.rehabItems.reduce((s, i) => s + i.budget, 0);
  const actual = p.rehabItems.reduce((s, i) => s + i.actual, 0);
  const done = p.rehabItems.filter((i) => i.done).length;
  return { budget, actual, done, count: p.rehabItems.length, variance: actual - budget };
}

/** Date the property becomes eligible for a cash-out refinance, if purchase date is known. */
export function refiEligibleDate(p: Property): Date | null {
  if (!p.purchaseDate) return null;
  const d = new Date(p.purchaseDate + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + p.seasoningMonths);
  return d;
}

export interface PortfolioSummary {
  ownedCount: number;
  pipelineCount: number;
  byStage: Record<Stage, number>;
  estimatedValue: number;
  totalDebt: number;
  equity: number;
  monthlyCashFlow: number;
  cashLeftInDeals: number;
}

export function portfolioSummary(properties: Property[]): PortfolioSummary {
  const byStage = {} as Record<Stage, number>;
  let estimatedValue = 0;
  let totalDebt = 0;
  let monthlyCashFlow = 0;
  let cashLeftInDeals = 0;

  for (const p of properties) {
    byStage[p.stage] = (byStage[p.stage] ?? 0) + 1;
    if (!OWNED.includes(p.stage)) continue;
    const m = analyzeDeal(p.deal);
    const refinanced = POST_REFI.includes(p.stage);
    // Before refi, value is conservatively the purchase price; after, the appraised ARV.
    estimatedValue += refinanced ? p.deal.arv : p.deal.purchasePrice;
    totalDebt += refinanced ? m.refiLoan : p.deal.acqLoanAmount;
    if (RENTING.includes(p.stage)) {
      monthlyCashFlow += refinanced
        ? m.monthlyCashFlow
        : m.effectiveMonthlyIncome -
          m.monthlyOperatingExpenses -
          (p.deal.acqLoanAmount * p.deal.acqRatePct) / 100 / 12;
    }
    cashLeftInDeals += refinanced ? m.cashLeftInDeal : m.cashInvested;
  }

  return {
    ownedCount: properties.filter((p) => OWNED.includes(p.stage)).length,
    pipelineCount: byStage.analyzing ?? 0,
    byStage,
    estimatedValue,
    totalDebt,
    equity: estimatedValue - totalDebt,
    monthlyCashFlow,
    cashLeftInDeals,
  };
}
