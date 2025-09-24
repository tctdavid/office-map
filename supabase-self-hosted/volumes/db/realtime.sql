-- Realtime tables and functions
create schema if not exists _realtime;
-- create a publication for realtime
drop publication if exists supabase_realtime;
create publication supabase_realtime for all tables;
-- Realtime API
create or replace function _realtime.apply_rls(wal jsonb, max_record_bytes int = 1048576)
    returns setof record
    language plpgsql
as $$
declare
  -- Regclass of the table e.g. public.notes
  entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

  -- I, U, D, T: insert, update, delete, truncate
  action realtime.action = (
    case wal ->> 'action'
      when 'I' then 'INSERT'
      when 'U' then 'UPDATE'
      when 'D' then 'DELETE'
      else 'ERROR'
    end
  );

  -- Is row level security enabled for the table
  is_rls_enabled bool = (
    select relrowsecurity from pg_class where oid = entity_
  );

  subscriptions realtime.subscription[] = array[]::realtime.subscription[];
  subscription realtime.subscription;
  subscription_has_access bool;
  subscription_missing_claim bool;
  visible_to_subscription_ids uuid[] = array[]::uuid[];

  claims jsonb;
  walking_msg record;
begin
  -- May be null in case of truncate
  if entity_ is null then
    return;
  end if;

  -- Fetch subscriptions from the table
  subscriptions = array(
    select s
    from realtime.subscription s
    where s.entity = entity_
  );

  if array_length(subscriptions, 1) is null then
    perform set_config('pgrst.db_pre_request', '', true);
    return;
  end if;

  -- Build a record to return
  for walking_msg in (
    select
      subscription.subscription_id,
      (
        jsonb_build_object(
          'schema', wal ->> 'schema',
          'table', wal ->> 'table',
          'type', action,
          'commit_timestamp', (wal ->> 'timestamp')::text,
          'columns', (
            select
              jsonb_agg(
                jsonb_build_object(
                  'name', pa.attname,
                  'type', pt.typname
                )
                order by pa.attnum asc
              )
            from
              pg_attribute pa
              join pg_type pt
                on pa.atttypid = pt.oid
            where
              attrelid = entity_
              and attnum > 0
              and pg_catalog.has_column_privilege(
                (split_part(subscription.claims ->> 'role', ',', 1))::text,
                entity_,
                pa.attname,
                'SELECT'
              )
          ),
          'record', (
            case
              when action = 'INSERT' then wal -> 'columns'
              when action = 'UPDATE' then wal -> 'columns'
              when action = 'DELETE' then wal -> 'old_record'
            end
          ),
          'old_record', (
            case
              when action = 'UPDATE' then wal -> 'old_record'
              else null
            end
          )
        )
      ) as "record"
    from
      unnest(subscriptions) as subscription
    where
      not is_rls_enabled
      or (
        -- Check if RLS allows the role to see the record
        select set_config('role', split_part(subscription.claims ->> 'role', ',', 1), true)
      ) is not null
      and (
        select set_config('request.jwt.claims', subscription.claims::text, true)
      ) is not null
      and visible_to_subscription_ids @> array[subscription.subscription_id]
  ) loop

    perform set_config('pgrst.db_pre_request', '', true);

    return next walking_msg;
  end loop;

  perform set_config('pgrst.db_pre_request', '', true);
  return;
end
$$;