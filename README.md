# BRRRR Manager

A web app for real estate investors using the **BRRRR** strategy (Buy, Rehab, Rent, Refinance, Repeat).

## What it does (MVP)

- **Deal Analyzer**: enter purchase, rehab, rent, expense and refinance assumptions to get cash left in the deal,
  cash-out at refi, post-refi cash flow, cash-on-cash, DSCR, cap rate, equity, the 70% rule, rent-to-cost, and an overall verdict.
- **Portfolio dashboard**: properties owned, estimated value, debt, equity, monthly cash flow, capital still tied up,
  pipeline by stage, and when each property clears lender seasoning for a refi.
- **Property tracking**: each property moves through Analyzing → Acquired → Rehab → Rented → Refinanced → Stabilized,
  with its own deal analysis, a line-item rehab budget vs. actual tracker, dates and notes.
- **Data**: export/import JSON backups and load a sample portfolio.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests for the BRRRR math
npm run build      # production build in dist/
```

## Structure

```
src/
  domain/      # Types and pure BRRRR calculations (unit-tested, no UI)
  data/        # PropertyRepository interface + localStorage implementation, React store
  components/  # Shared UI: deal form, results panel, fields, layout
  pages/       # Dashboard, Properties, Property detail, Analyzer, Data
```

## Roadmap toward multi-user

Data currently lives in the browser (single user). The UI talks only to the `PropertyRepository`
interface in `src/data/repository.ts`, so the planned path is:

1. Add a backend (auth + database) and an `ApiRepository` implementing the same interface.
2. Add accounts and per-user data, then import existing localStorage data on first sign-in.
3. Add roles for **property owners** and **investors** (shared deals, investor capital and returns, reporting).
