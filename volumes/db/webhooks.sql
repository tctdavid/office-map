-- Webhooks support
create schema if not exists webhooks;

create or replace function webhooks.http_request()
  returns trigger
  language plpgsql
as $$
  declare
    request_id bigint;
    payload jsonb;
    url text := TG_ARGV[0]::text;
    method text := TG_ARGV[1]::text;
    headers jsonb DEFAULT '{}'::jsonb;
    params jsonb DEFAULT '{}'::jsonb;
    timeout_ms integer DEFAULT 1000;
  begin

    if url is null or url = 'null' then
      raise exception 'url argument is missing';
    end if;

    if method is null or method = 'null' then
      raise exception 'method argument is missing';
    end if;

    if TG_ARGV[2] is null or TG_ARGV[2] = 'null' then
      headers = '{}'::jsonb;
    else
      headers = TG_ARGV[2]::jsonb;
    end if;

    if TG_ARGV[3] is null or TG_ARGV[3] = 'null' then
      params = '{}'::jsonb;
    else
      params = TG_ARGV[3]::jsonb;
    end if;

    if TG_ARGV[4] is null or TG_ARGV[4] = 'null' then
      timeout_ms = 1000;
    else
      timeout_ms = TG_ARGV[4]::integer;
    end if;

    case
      when method = 'GET' then
        select http_get into request_id from net.http_get(
          url,
          params,
          headers,
          timeout_ms
        );
      when method = 'POST' then
        payload = jsonb_build_object(
          'old_record', OLD,
          'record', NEW,
          'type', TG_OP,
          'table', TG_TABLE_NAME,
          'schema', TG_TABLE_SCHEMA
        );

        select http_post into request_id from net.http_post(
          url,
          payload,
          params,
          headers,
          timeout_ms
        );
      else
        raise exception 'method argument % is invalid', method;
    end case;

    insert into webhooks.http_request_queue
      (request_id, method, url, headers, params, timeout_ms)
    values
      (request_id, method, url, headers, params, timeout_ms);

    return coalesce(NEW, OLD);
  end
$$;