# Frontend completion
- [x] Finish dashboard and disconnected page presentation.
- [x] Refine navigation, tables, portfolio and order controls.
- [x] Complete page metadata and check tests and browser flows.

## API frontend update
- [ ] Connect live prices and instrument chart.
- [ ] Connect order history and cancellation; correct order payload and increment validation.
- [ ] Connect trades, cash ledger and realized P&L with portfolio selection.
- [ ] Run rule tests and verify available browser flows.

Live account verification requires the Portfolio API connection; no financial data or successful API responses are simulated in the app.

## Order portfolio selection
- [ ] Replace typed IDs with authenticated portfolio selection and first-result default.
- [ ] Create and select portfolios, including empty-list and backend error states.
- [ ] Add funds with explicit instrument currency and fresh idempotency keys; refresh portfolio data.
- [ ] Run focused tests and verify available order-window flows.
