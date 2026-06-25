create schema if not exists private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.has_role(_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = _role
  );
$$;

create or replace function private.is_ops()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role in ('ops_admin','ops_staff')
  );
$$;

create or replace function private.current_business_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select business_id
  from public.profiles
  where id = auth.uid();
$$;

create or replace function private.is_member_of_business(_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and business_id = _business_id
  );
$$;

revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated, service_role;

-- Keep the old public helpers unavailable as direct public RPC calls.
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.current_business_id() from public, anon, authenticated;
revoke execute on function public.is_member_of_business(uuid) from public, anon, authenticated;
revoke execute on function public.is_ops(uuid) from public, anon, authenticated;

-- Repoint access rules to private helper functions so app queries work again without exposing public RPC helpers.
drop policy if exists "Members read own business" on public.businesses;
create policy "Members read own business" on public.businesses
  for select to authenticated
  using (private.is_member_of_business(id) or private.is_ops());

drop policy if exists "Members update own business" on public.businesses;
create policy "Members update own business" on public.businesses
  for update to authenticated
  using (private.is_member_of_business(id) or private.is_ops())
  with check (private.is_member_of_business(id) or private.is_ops());

drop policy if exists "Ops insert businesses" on public.businesses;
create policy "Ops insert businesses" on public.businesses
  for insert to authenticated
  with check (private.is_ops());

drop policy if exists "Ops delete businesses" on public.businesses;
create policy "Ops delete businesses" on public.businesses
  for delete to authenticated
  using (private.has_role('ops_admin'));

drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile" on public.profiles
  for select to authenticated
  using (id = auth.uid() or private.is_ops() or (business_id is not null and private.is_member_of_business(business_id)));

drop policy if exists "Update own profile" on public.profiles;
create policy "Update own profile" on public.profiles
  for update to authenticated
  using (id = auth.uid() or private.is_ops())
  with check (id = auth.uid() or private.is_ops());

drop policy if exists "Insert own profile" on public.profiles;
create policy "Insert own profile" on public.profiles
  for insert to authenticated
  with check (id = auth.uid() or private.is_ops());

drop policy if exists "Read own roles" on public.user_roles;
create policy "Read own roles" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or private.is_ops());

drop policy if exists "Ops admin manage roles" on public.user_roles;
create policy "Ops admin manage roles" on public.user_roles
  for all to authenticated
  using (private.has_role('ops_admin'))
  with check (private.has_role('ops_admin'));

drop policy if exists "Members read locations" on public.locations;
create policy "Members read locations" on public.locations
  for select to authenticated
  using (private.is_member_of_business(business_id) or private.is_ops());

drop policy if exists "Ops manage locations" on public.locations;
create policy "Ops manage locations" on public.locations
  for all to authenticated
  using (private.is_ops())
  with check (private.is_ops());

drop policy if exists "Members read engines" on public.revenue_engines;
create policy "Members read engines" on public.revenue_engines
  for select to authenticated
  using (private.is_member_of_business(business_id) or private.is_ops());

drop policy if exists "Ops manage engines" on public.revenue_engines;
create policy "Ops manage engines" on public.revenue_engines
  for all to authenticated
  using (private.is_ops())
  with check (private.is_ops());

drop policy if exists "Members read customers" on public.customers;
create policy "Members read customers" on public.customers
  for select to authenticated
  using (private.is_member_of_business(business_id) or private.is_ops());

drop policy if exists "Members write customers" on public.customers;
create policy "Members write customers" on public.customers
  for all to authenticated
  using (private.is_member_of_business(business_id) or private.is_ops())
  with check (private.is_member_of_business(business_id) or private.is_ops());

drop policy if exists "Members read activities" on public.activities;
create policy "Members read activities" on public.activities
  for select to authenticated
  using (private.is_member_of_business(business_id) or private.is_ops());

drop policy if exists "Ops write activities" on public.activities;
create policy "Ops write activities" on public.activities
  for insert to authenticated
  with check (private.is_ops());

drop policy if exists "Members read attention" on public.attention_items;
create policy "Members read attention" on public.attention_items
  for select to authenticated
  using (private.is_member_of_business(business_id) or private.is_ops());

drop policy if exists "Members resolve attention" on public.attention_items;
create policy "Members resolve attention" on public.attention_items
  for update to authenticated
  using (private.is_member_of_business(business_id) or private.is_ops())
  with check (private.is_member_of_business(business_id) or private.is_ops());

drop policy if exists "Ops create attention" on public.attention_items;
create policy "Ops create attention" on public.attention_items
  for insert to authenticated
  with check (private.is_ops());

drop policy if exists "Members read reports" on public.reports;
create policy "Members read reports" on public.reports
  for select to authenticated
  using (private.is_member_of_business(business_id) or private.is_ops());

drop policy if exists "Ops write reports" on public.reports;
create policy "Ops write reports" on public.reports
  for all to authenticated
  using (private.is_ops())
  with check (private.is_ops());

drop policy if exists "Read own notifications" on public.notifications;
create policy "Read own notifications" on public.notifications
  for select to authenticated
  using (user_id = auth.uid() or private.is_ops());

drop policy if exists "Update own notifications" on public.notifications;
create policy "Update own notifications" on public.notifications
  for update to authenticated
  using (user_id = auth.uid() or private.is_ops())
  with check (user_id = auth.uid() or private.is_ops());

drop policy if exists "Manage own prefs" on public.notification_preferences;
create policy "Manage own prefs" on public.notification_preferences
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Members read integrations" on public.integrations;
create policy "Members read integrations" on public.integrations
  for select to authenticated
  using (private.is_member_of_business(business_id) or private.is_ops());

drop policy if exists "Ops manage integrations" on public.integrations;
create policy "Ops manage integrations" on public.integrations
  for all to authenticated
  using (private.is_ops())
  with check (private.is_ops());

drop policy if exists "Ops read deployments" on public.engine_deployments;
create policy "Ops read deployments" on public.engine_deployments
  for select to authenticated
  using (private.is_ops());

drop policy if exists "Ops manage deployments" on public.engine_deployments;
create policy "Ops manage deployments" on public.engine_deployments
  for all to authenticated
  using (private.is_ops())
  with check (private.is_ops());

-- Make the current MVP immediately useful: attach unassigned customer users to the seeded demo workspace.
update public.profiles
set business_id = '00000000-0000-4000-a000-000000000001'
where business_id is null
  and exists (
    select 1 from public.businesses
    where id = '00000000-0000-4000-a000-000000000001'
  )
  and exists (
    select 1 from public.user_roles
    where user_id = profiles.id
      and role in ('customer_owner','customer_staff')
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  demo_business_id uuid := '00000000-0000-4000-a000-000000000001';
begin
  insert into public.profiles (id, full_name, business_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    case when exists (select 1 from public.businesses where id = demo_business_id) then demo_business_id else null end
  );

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer_owner')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;