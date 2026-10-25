-- Grants for the tables added by 03b_market_extension.sql.
-- 02_security.sql only granted access to tables that existed when it ran, so the per-class
-- tables created later are unreadable by app_role ("permission denied for table ...").
-- Safe to re-run. Run as the table owner, after 03b and 04_seed.sql.
SET search_path = public;

GRANT SELECT ON index_membership, mf_scheme, bond, ipo TO app_role;

-- Price-feed bookkeeping: read by admin tooling, written by the price updater.
GRANT SELECT, INSERT, UPDATE ON price_feed_state TO admin_role;
GRANT SELECT ON index_membership, mf_scheme, bond, ipo TO admin_role, worker_role;
