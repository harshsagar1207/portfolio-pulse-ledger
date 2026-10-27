-- Watchlist + portfolio value history. Safe to re-run. Run as table owner, after 06_market_grants.sql.
SET search_path = public;

CREATE TABLE IF NOT EXISTS watchlist (
  user_id       bigint NOT NULL REFERENCES app_user,
  instrument_id bigint NOT NULL REFERENCES instrument,
  added_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, instrument_id)
);
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS owner_only ON watchlist;
CREATE POLICY owner_only ON watchlist USING (user_id = app_uid()) WITH CHECK (user_id = app_uid());
GRANT SELECT, INSERT, DELETE ON watchlist TO app_role;

-- Written every minute by price_simulator.py (owner connection). Single-currency demo: values are summed as-is.
CREATE TABLE IF NOT EXISTS portfolio_value_history (
  portfolio_id bigint NOT NULL REFERENCES portfolio,
  ts           timestamptz NOT NULL,
  cash         numeric(18,4) NOT NULL,
  holdings     numeric(18,4) NOT NULL,
  total        numeric(18,4) NOT NULL,
  PRIMARY KEY (portfolio_id, ts)
);
ALTER TABLE portfolio_value_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS owner_only ON portfolio_value_history;
CREATE POLICY owner_only ON portfolio_value_history
  USING (portfolio_id IN (SELECT portfolio_id FROM portfolio));
GRANT SELECT ON portfolio_value_history TO app_role;
