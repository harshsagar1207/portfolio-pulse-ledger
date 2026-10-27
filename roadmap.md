# Frontend completion
- [x] Finish dashboard and disconnected page presentation.
- [x] Refine navigation, tables, portfolio and order controls.
- [x] Complete page metadata and check tests and browser flows.

## API frontend update
- [x] Connect live prices and instrument chart.
- [x] Connect order history and cancellation; correct order payload and increment validation.
- [x] Connect trades, cash ledger and realized P&L with portfolio selection.
- [x] Run rule tests and verify available browser flows.

Live account verification requires the Portfolio API connection; no financial data or successful API responses are simulated in the app.

## Order portfolio selection
- [x] Replace typed IDs with authenticated portfolio selection and first-result default.
- [x] Create and select portfolios, including empty-list and backend error states.
- [x] Add funds with explicit instrument currency and fresh idempotency keys; refresh portfolio data.
- [x] Run focused tests and check live connection availability.
- [ ] Verify creation, deposit, and order submission against a live account (blocked: Portfolio API is not configured in the preview).
