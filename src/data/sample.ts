import { DEFAULT_DEAL, type Property } from '../domain/types';
import { normalizeProperty } from './repository';

/** Demo portfolio so a new user can see the app populated. */
export function samplePortfolio(): Property[] {
  return [
    normalizeProperty({
      name: 'Maple Duplex',
      address: '412 Maple Ave',
      stage: 'stabilized',
      purchaseDate: '2025-03-10',
      refiDate: '2025-10-02',
      deal: {
        ...DEFAULT_DEAL,
        purchasePrice: 110_000,
        buyClosingCosts: 3_500,
        acqLoanAmount: 88_000,
        rehabBudget: 45_000,
        holdingCostsMonthly: 450,
        monthlyRent: 2_300,
        propertyTaxAnnual: 2_800,
        insuranceAnnual: 1_400,
        arv: 225_000,
        refiClosingCosts: 4_500,
      },
    }),
    normalizeProperty({
      name: 'Oak St Bungalow',
      address: '87 Oak St',
      stage: 'rehab',
      purchaseDate: '2026-08-01',
      deal: {
        ...DEFAULT_DEAL,
        purchasePrice: 85_000,
        buyClosingCosts: 2_800,
        acqLoanAmount: 68_000,
        rehabBudget: 38_000,
        holdingCostsMonthly: 350,
        monthlyRent: 1_550,
        propertyTaxAnnual: 1_900,
        insuranceAnnual: 1_100,
        arv: 170_000,
        refiClosingCosts: 4_000,
      },
      rehabItems: [
        { id: crypto.randomUUID(), category: 'Kitchen', description: 'Cabinets, counters, appliances', budget: 14_000, actual: 15_200, done: true },
        { id: crypto.randomUUID(), category: 'Bathroom', description: 'Full gut', budget: 8_000, actual: 7_400, done: true },
        { id: crypto.randomUUID(), category: 'Flooring', description: 'LVP throughout', budget: 6_000, actual: 0, done: false },
        { id: crypto.randomUUID(), category: 'Paint', description: 'Interior + exterior', budget: 5_000, actual: 0, done: false },
        { id: crypto.randomUUID(), category: 'Roof', description: 'Patch & inspect', budget: 5_000, actual: 2_100, done: false },
      ],
    }),
    normalizeProperty({
      name: 'Elm Ct Lead',
      address: '1903 Elm Ct',
      stage: 'analyzing',
      deal: {
        ...DEFAULT_DEAL,
        purchasePrice: 95_000,
        buyClosingCosts: 3_000,
        acqLoanAmount: 76_000,
        rehabBudget: 30_000,
        holdingCostsMonthly: 400,
        monthlyRent: 1_450,
        propertyTaxAnnual: 2_200,
        insuranceAnnual: 1_200,
        arv: 165_000,
        refiClosingCosts: 4_000,
      },
    }),
  ];
}
