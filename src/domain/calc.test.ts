import { describe, expect, it } from 'vitest';
import { analyzeDeal, dealVerdict, monthlyPayment, portfolioSummary, refiEligibleDate } from './calc';
import { DEFAULT_DEAL, type DealInputs, type Property } from './types';

const deal: DealInputs = {
  ...DEFAULT_DEAL,
  purchasePrice: 100_000,
  buyClosingCosts: 3_000,
  acqLoanAmount: 80_000,
  acqRatePct: 12,
  acqPointsPct: 2,
  rehabBudget: 40_000,
  holdingMonths: 6,
  holdingCostsMonthly: 500,
  monthlyRent: 1_800,
  vacancyPct: 5,
  maintenancePct: 5,
  capexPct: 5,
  managementPct: 8,
  propertyTaxAnnual: 2_400,
  insuranceAnnual: 1_200,
  arv: 200_000,
  refiLtvPct: 75,
  refiRatePct: 7,
  refiTermYears: 30,
  refiClosingCosts: 4_000,
};

describe('monthlyPayment', () => {
  it('matches a known amortization value', () => {
    expect(monthlyPayment(150_000, 7, 30)).toBeCloseTo(997.95, 2);
  });
  it('handles zero interest and zero principal', () => {
    expect(monthlyPayment(120_000, 0, 10)).toBe(1_000);
    expect(monthlyPayment(0, 7, 30)).toBe(0);
  });
});

describe('analyzeDeal', () => {
  const m = analyzeDeal(deal);

  it('computes acquisition costs', () => {
    expect(m.acqInterest).toBeCloseTo(4_800); // 80k * 1% * 6
    expect(m.acqPoints).toBeCloseTo(1_600);
    expect(m.holdingCosts).toBe(3_000);
    expect(m.totalProjectCost).toBeCloseTo(152_400);
    expect(m.cashInvested).toBeCloseTo(72_400);
  });

  it('computes refinance outcome', () => {
    expect(m.refiLoan).toBe(150_000);
    expect(m.cashOutAtRefi).toBe(66_000); // 150k - 4k - 80k
    expect(m.cashLeftInDeal).toBeCloseTo(6_400);
    expect(m.equityAfterRefi).toBe(50_000);
    expect(m.monthlyPI).toBeCloseTo(997.95, 2);
  });

  it('computes operations', () => {
    expect(m.effectiveMonthlyIncome).toBeCloseTo(1_710);
    expect(m.monthlyOperatingExpenses).toBeCloseTo(1_800 * 0.18 + 200 + 100);
    expect(m.monthlyCashFlow).toBeCloseTo(1_710 - 624 - 997.95, 1);
    expect(m.cashOnCash).toBeCloseTo((m.annualCashFlow / 6_400) * 100);
  });

  it('reports infinite CoC when all cash is recovered', () => {
    const m2 = analyzeDeal({ ...deal, arv: 240_000 });
    expect(m2.cashLeftInDeal).toBeLessThanOrEqual(0);
    expect(m2.cashOnCash).toBeNull();
  });

  it('evaluates the 70% rule', () => {
    expect(m.maxOffer70).toBe(100_000);
    expect(m.meets70Rule).toBe(true);
  });
});

describe('dealVerdict', () => {
  it('flags incomplete deals', () => {
    expect(dealVerdict(DEFAULT_DEAL, analyzeDeal(DEFAULT_DEAL)).verdict).toBe('incomplete');
  });
  it('rates a negative cash flow deal poorly', () => {
    const bad = { ...deal, monthlyRent: 900, arv: 130_000 };
    expect(dealVerdict(bad, analyzeDeal(bad)).verdict).toBe('poor');
  });
});

const prop = (over: Partial<Property>): Property => ({
  id: 'x',
  name: 'x',
  address: '',
  stage: 'analyzing',
  seasoningMonths: 6,
  notes: '',
  deal,
  rehabItems: [],
  createdAt: '',
  updatedAt: '',
  ...over,
});

describe('portfolioSummary', () => {
  it('ignores pipeline deals and values refinanced at ARV', () => {
    const s = portfolioSummary([prop({ stage: 'analyzing' }), prop({ stage: 'refinanced' })]);
    expect(s.ownedCount).toBe(1);
    expect(s.pipelineCount).toBe(1);
    expect(s.estimatedValue).toBe(200_000);
    expect(s.totalDebt).toBe(150_000);
    expect(s.equity).toBe(50_000);
  });
});

describe('refiEligibleDate', () => {
  it('adds seasoning months to purchase date', () => {
    const d = refiEligibleDate(prop({ purchaseDate: '2026-01-15', seasoningMonths: 6 }));
    expect(d?.toISOString().slice(0, 10)).toBe('2026-07-15');
  });
});
