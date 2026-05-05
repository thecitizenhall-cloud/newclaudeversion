-- supabase/migrations/006_increment_trust_fn.sql
--
-- Atomic trust score increment function called by vote-gate edge function.
-- Uses a plain update rather than a stored procedure to avoid race conditions.

create or replace function increment_trust(uid uuid, points integer)
returns void language plpgsql security definer as $$
begin
  update profiles
  set
    trust_score = least(10000, coalesce(trust_score, 0) + points),
    trust_tier  = case
      when least(10000, coalesce(trust_score, 0) + points) >= 500 then 'civic_leader'
      when least(10000, coalesce(trust_score, 0) + points) >= 200 then 'established'
      when least(10000, coalesce(trust_score, 0) + points) >= 50  then 'contributor'
      else 'resident'
    end,
    updated_at  = now()
  where id = uid;
end;
$$;

-- Grant edge functions access
grant execute on function increment_trust(uuid, integer) to authenticated;
grant execute on function increment_trust(uuid, integer) to service_role;
