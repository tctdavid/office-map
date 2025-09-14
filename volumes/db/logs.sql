-- Setup for analytics/logs
create schema if not exists _analytics;
grant usage on schema _analytics to postgres, anon, authenticated, service_role;

-- Enable row level security
alter default privileges in schema _analytics grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema _analytics grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema _analytics grant all on sequences to postgres, anon, authenticated, service_role;