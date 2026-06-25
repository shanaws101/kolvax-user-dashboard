
-- ============================================================
-- ENUMS
-- ============================================================
create type public.app_role as enum ('customer_owner','customer_staff','ops_admin','ops_staff');
create type public.business_status as enum ('onboarding','live','paused');
create type public.engine_type as enum ('missed_call','after_hours','reactivation','no_show','reputation');
create type public.engine_status as enum ('live','paused','deploying');
create type public.engine_health as enum ('healthy','attention','offline');
create type public.customer_status as enum ('new','active','vip','lapsed');
create type public.activity_kind as enum ('recovered_booking','customer_returned','review_generated','appointment_confirmed','reminder_sent','opportunity_opened');
create type public.attention_severity as enum ('info','action');
create type public.report_period as enum ('weekly','monthly','quarterly');
create type public.integration_kind as enum ('crm','calendar','phone','reviews');
create type public.integration_status as enum ('connected','pending','disconnected');

-- ============================================================
-- SHARED updated_at TRIGGER
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================
-- BUSINESSES (created first so profiles can FK it)
-- ============================================================
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_name text,
  industry text,
  timezone text not null default 'America/Chicago',
  phone text,
  address text,
  status public.business_status not null default 'onboarding',
  deployed_at timestamptz,
  monthly_recovered_cents bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.businesses to authenticated;
grant all on public.businesses to service_role;
alter table public.businesses enable row level security;
create trigger trg_businesses_updated before update on public.businesses for each row execute function public.set_updated_at();

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  business_id uuid references public.businesses(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

-- ============================================================
-- USER ROLES
-- ============================================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

-- ============================================================
-- SECURITY DEFINER HELPERS
-- ============================================================
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  );
$$;

create or replace function public.is_ops(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role in ('ops_admin','ops_staff')
  );
$$;

create or replace function public.current_business_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select business_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_member_of_business(_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and business_id = _business_id
  );
$$;

-- ============================================================
-- RLS POLICIES: businesses
-- ============================================================
create policy "Members read own business" on public.businesses
  for select to authenticated
  using (public.is_member_of_business(id) or public.is_ops(auth.uid()));

create policy "Members update own business" on public.businesses
  for update to authenticated
  using (public.is_member_of_business(id) or public.is_ops(auth.uid()))
  with check (public.is_member_of_business(id) or public.is_ops(auth.uid()));

create policy "Ops insert businesses" on public.businesses
  for insert to authenticated
  with check (public.is_ops(auth.uid()));

create policy "Ops delete businesses" on public.businesses
  for delete to authenticated
  using (public.has_role(auth.uid(),'ops_admin'));

-- ============================================================
-- RLS POLICIES: profiles
-- ============================================================
create policy "Read own profile" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_ops(auth.uid()) or (business_id is not null and public.is_member_of_business(business_id)));

create policy "Update own profile" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_ops(auth.uid()))
  with check (id = auth.uid() or public.is_ops(auth.uid()));

create policy "Insert own profile" on public.profiles
  for insert to authenticated
  with check (id = auth.uid() or public.is_ops(auth.uid()));

-- ============================================================
-- RLS POLICIES: user_roles
-- ============================================================
create policy "Read own roles" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.is_ops(auth.uid()));

create policy "Ops admin manage roles" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(),'ops_admin'))
  with check (public.has_role(auth.uid(),'ops_admin'));

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  insert into public.user_roles (user_id, role)
  values (new.id, 'customer_owner');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================
-- LOCATIONS
-- ============================================================
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  address text,
  phone text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.locations to authenticated;
grant all on public.locations to service_role;
alter table public.locations enable row level security;
create trigger trg_locations_updated before update on public.locations for each row execute function public.set_updated_at();
create index idx_locations_business on public.locations(business_id);

create policy "Members read locations" on public.locations
  for select to authenticated
  using (public.is_member_of_business(business_id) or public.is_ops(auth.uid()));
create policy "Ops manage locations" on public.locations
  for all to authenticated
  using (public.is_ops(auth.uid()))
  with check (public.is_ops(auth.uid()));

-- ============================================================
-- REVENUE ENGINES
-- ============================================================
create table public.revenue_engines (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  engine_type public.engine_type not null,
  status public.engine_status not null default 'deploying',
  health public.engine_health not null default 'healthy',
  recovered_cents_mtd bigint not null default 0,
  opportunities_in_motion int not null default 0,
  last_outcome_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, engine_type)
);
grant select, insert, update, delete on public.revenue_engines to authenticated;
grant all on public.revenue_engines to service_role;
alter table public.revenue_engines enable row level security;
create trigger trg_engines_updated before update on public.revenue_engines for each row execute function public.set_updated_at();
create index idx_engines_business on public.revenue_engines(business_id);

create policy "Members read engines" on public.revenue_engines
  for select to authenticated
  using (public.is_member_of_business(business_id) or public.is_ops(auth.uid()));
create policy "Ops manage engines" on public.revenue_engines
  for all to authenticated
  using (public.is_ops(auth.uid()))
  with check (public.is_ops(auth.uid()));

-- ============================================================
-- CUSTOMERS
-- ============================================================
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  last_visit_at timestamptz,
  lifetime_value_cents bigint not null default 0,
  status public.customer_status not null default 'new',
  last_interaction_summary text,
  revenue_opportunity_cents bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.customers to authenticated;
grant all on public.customers to service_role;
alter table public.customers enable row level security;
create trigger trg_customers_updated before update on public.customers for each row execute function public.set_updated_at();
create index idx_customers_business on public.customers(business_id);
create index idx_customers_status on public.customers(business_id, status);

create policy "Members read customers" on public.customers
  for select to authenticated
  using (public.is_member_of_business(business_id) or public.is_ops(auth.uid()));
create policy "Members write customers" on public.customers
  for all to authenticated
  using (public.is_member_of_business(business_id) or public.is_ops(auth.uid()))
  with check (public.is_member_of_business(business_id) or public.is_ops(auth.uid()));

-- ============================================================
-- ACTIVITIES
-- ============================================================
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  engine_type public.engine_type,
  kind public.activity_kind not null,
  customer_id uuid references public.customers(id) on delete set null,
  headline text not null,
  detail text,
  amount_cents bigint,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.activities to authenticated;
grant all on public.activities to service_role;
alter table public.activities enable row level security;
create index idx_activities_business_time on public.activities(business_id, occurred_at desc);

create policy "Members read activities" on public.activities
  for select to authenticated
  using (public.is_member_of_business(business_id) or public.is_ops(auth.uid()));
create policy "Ops write activities" on public.activities
  for all to authenticated
  using (public.is_ops(auth.uid()))
  with check (public.is_ops(auth.uid()));

-- ============================================================
-- ATTENTION ITEMS
-- ============================================================
create table public.attention_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null,
  description text,
  severity public.attention_severity not null default 'info',
  cta_label text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.attention_items to authenticated;
grant all on public.attention_items to service_role;
alter table public.attention_items enable row level security;
create trigger trg_attention_updated before update on public.attention_items for each row execute function public.set_updated_at();
create index idx_attention_business on public.attention_items(business_id) where resolved_at is null;

create policy "Members read attention" on public.attention_items
  for select to authenticated
  using (public.is_member_of_business(business_id) or public.is_ops(auth.uid()));
create policy "Members resolve attention" on public.attention_items
  for update to authenticated
  using (public.is_member_of_business(business_id) or public.is_ops(auth.uid()))
  with check (public.is_member_of_business(business_id) or public.is_ops(auth.uid()));
create policy "Ops create attention" on public.attention_items
  for insert to authenticated
  with check (public.is_ops(auth.uid()));

-- ============================================================
-- REPORTS
-- ============================================================
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  period_type public.report_period not null,
  period_start date not null,
  period_end date not null,
  recovered_cents bigint not null default 0,
  bookings_recovered int not null default 0,
  customers_returned int not null default 0,
  reviews_generated int not null default 0,
  summary_markdown text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create index idx_reports_business on public.reports(business_id, period_end desc);

create policy "Members read reports" on public.reports
  for select to authenticated
  using (public.is_member_of_business(business_id) or public.is_ops(auth.uid()));
create policy "Ops write reports" on public.reports
  for all to authenticated
  using (public.is_ops(auth.uid()))
  with check (public.is_ops(auth.uid()));

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create index idx_notifications_user on public.notifications(user_id, created_at desc);

create policy "Read own notifications" on public.notifications
  for select to authenticated
  using (user_id = auth.uid() or public.is_ops(auth.uid()));
create policy "Update own notifications" on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  weekly_summary boolean not null default true,
  attention_alerts boolean not null default true,
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notification_preferences to authenticated;
grant all on public.notification_preferences to service_role;
alter table public.notification_preferences enable row level security;
create trigger trg_notif_prefs_updated before update on public.notification_preferences for each row execute function public.set_updated_at();

create policy "Manage own prefs" on public.notification_preferences
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- INTEGRATIONS (customers see status, never config)
-- ============================================================
create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  kind public.integration_kind not null,
  provider text not null,
  status public.integration_status not null default 'pending',
  connected_at timestamptz,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, kind)
);
grant select, insert, update, delete on public.integrations to authenticated;
grant all on public.integrations to service_role;
alter table public.integrations enable row level security;
create trigger trg_integrations_updated before update on public.integrations for each row execute function public.set_updated_at();
create index idx_integrations_business on public.integrations(business_id);

-- Customers can read status (we'll project columns server-side; RLS still permits row read)
create policy "Members read integrations" on public.integrations
  for select to authenticated
  using (public.is_member_of_business(business_id) or public.is_ops(auth.uid()));
create policy "Ops manage integrations" on public.integrations
  for all to authenticated
  using (public.is_ops(auth.uid()))
  with check (public.is_ops(auth.uid()));

-- ============================================================
-- ENGINE DEPLOYMENTS (ops only, hidden from customers)
-- ============================================================
create table public.engine_deployments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  engine_type public.engine_type not null,
  phone_number text,
  status text not null default 'pending',
  internal_config jsonb not null default '{}'::jsonb,
  deployed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.engine_deployments to authenticated;
grant all on public.engine_deployments to service_role;
alter table public.engine_deployments enable row level security;
create trigger trg_deployments_updated before update on public.engine_deployments for each row execute function public.set_updated_at();
create index idx_deployments_business on public.engine_deployments(business_id);

create policy "Ops read deployments" on public.engine_deployments
  for select to authenticated
  using (public.is_ops(auth.uid()));
create policy "Ops manage deployments" on public.engine_deployments
  for all to authenticated
  using (public.is_ops(auth.uid()))
  with check (public.is_ops(auth.uid()));

-- ============================================================
-- DEMO SEED: Bella Beauty Studio
-- Deterministic ID so ops can attach the demo owner on first login.
-- ============================================================
insert into public.businesses
  (id, name, slug, owner_name, industry, timezone, phone, address, status, deployed_at, monthly_recovered_cents)
values
  ('00000000-0000-4000-a000-000000000001'::uuid,
   'Bella Beauty Studio', 'bella-beauty-studio', 'Maria Alvarez',
   'Beauty & Wellness', 'America/Chicago', '+1 (512) 555-0142',
   '1200 S Lamar Blvd, Austin, TX 78704',
   'live', now() - interval '18 days', 482000);

insert into public.locations (business_id, name, address, phone, is_primary) values
  ('00000000-0000-4000-a000-000000000001','South Lamar Studio','1200 S Lamar Blvd, Austin, TX 78704','+1 (512) 555-0142', true),
  ('00000000-0000-4000-a000-000000000001','East 6th Studio','2300 E 6th St, Austin, TX 78702','+1 (512) 555-0188', false);

insert into public.revenue_engines (business_id, engine_type, status, health, recovered_cents_mtd, opportunities_in_motion, last_outcome_at, notes) values
  ('00000000-0000-4000-a000-000000000001','missed_call','live','healthy',  186000, 8, now() - interval '34 minutes','Recovering missed calls in under 60 seconds.'),
  ('00000000-0000-4000-a000-000000000001','after_hours','live','healthy',  124000, 5, now() - interval '2 hours','Booking inquiries received after closing.'),
  ('00000000-0000-4000-a000-000000000001','reactivation','live','attention', 72000, 6, now() - interval '1 day','Some lapsed customers haven''t responded; reviewing outreach cadence.'),
  ('00000000-0000-4000-a000-000000000001','no_show','live','healthy',        58000, 3, now() - interval '5 hours','Confirming appointments 24h and 2h before.'),
  ('00000000-0000-4000-a000-000000000001','reputation','live','healthy',     42000, 1, now() - interval '11 hours','Inviting recent visitors to leave a review.');

-- Customers (40)
insert into public.customers (id, business_id, full_name, phone, email, last_visit_at, lifetime_value_cents, status, last_interaction_summary, revenue_opportunity_cents) values
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Sophia Martinez','+1 (512) 555-0201','sophia.m@example.com', now() - interval '3 days', 184000, 'vip','Booked balayage for next Friday.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Olivia Chen','+1 (512) 555-0202','olivia.c@example.com',     now() - interval '12 days', 96000, 'active','Confirmed haircut Thursday 4pm.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Emma Johnson','+1 (512) 555-0203','emma.j@example.com',       now() - interval '47 days', 64000, 'lapsed','We reached out; no response yet.', 12000),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Ava Rodriguez','+1 (512) 555-0204','ava.r@example.com',       now() - interval '2 days', 220000, 'vip','Tipped 25% on last visit.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Isabella Kim','+1 (512) 555-0205','isabella.k@example.com',   now() - interval '21 days', 78000, 'active','Asked about lash lift pricing.', 9500),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Mia Thompson','+1 (512) 555-0206','mia.t@example.com',         now() - interval '58 days', 42000, 'lapsed','Reactivation outreach in progress.', 8500),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Charlotte Davis','+1 (512) 555-0207','charlotte.d@example.com', now() - interval '5 days', 134000, 'active','Rebooked color refresh.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Amelia Wilson','+1 (512) 555-0208','amelia.w@example.com',    now() - interval '14 days', 88000, 'active','New client from after-hours booking.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Harper Garcia','+1 (512) 555-0209','harper.g@example.com',     now() - interval '34 days', 56000, 'lapsed','Sent return offer last week.', 7000),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Evelyn Anderson','+1 (512) 555-0210','evelyn.a@example.com',  now() - interval '8 days', 110000, 'active','Left 5-star review.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Abigail Lee','+1 (512) 555-0211','abigail.l@example.com',     now() - interval '4 days', 168000, 'vip','Booked monthly maintenance.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Ella Brown','+1 (512) 555-0212','ella.b@example.com',         now() - interval '67 days', 38000, 'lapsed','Did not respond to last outreach.', 6500),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Scarlett Taylor','+1 (512) 555-0213','scarlett.t@example.com', now() - interval '1 day',  74000, 'active','Brow lamination booked.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Grace Moore','+1 (512) 555-0214','grace.m@example.com',       now() - interval '17 days', 92000, 'active','Asked for Saturday slot.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Chloe Martin','+1 (512) 555-0215','chloe.m@example.com',       now() - interval '2 days', 156000, 'vip','Referral program member.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Lily Jackson','+1 (512) 555-0216','lily.j@example.com',       now() - interval '90 days', 28000, 'lapsed','Final outreach scheduled.', 5500),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Aria White','+1 (512) 555-0217','aria.w@example.com',         null, 0, 'new','Booked first appointment via after-hours.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Zoey Harris','+1 (512) 555-0218','zoey.h@example.com',        now() - interval '22 days', 64000, 'active','Confirmed via reminder.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Penelope Clark','+1 (512) 555-0219','penelope.c@example.com', now() - interval '6 days',  102000, 'active','Asked about color pricing.', 4500),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Riley Lewis','+1 (512) 555-0220','riley.l@example.com',        now() - interval '40 days', 48000, 'lapsed','Reactivation in progress.', 7800),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Layla Walker','+1 (512) 555-0221','layla.w@example.com',      now() - interval '11 days', 86000, 'active','Booked manicure.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Lillian Hall','+1 (512) 555-0222','lillian.h@example.com',     now() - interval '3 days', 118000, 'active','Wrote a 5-star review.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Nora Allen','+1 (512) 555-0223','nora.a@example.com',         now() - interval '120 days', 22000, 'lapsed','Marked unresponsive.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Hazel Young','+1 (512) 555-0224','hazel.y@example.com',        now() - interval '7 days',  72000, 'active','Booked highlights.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Aurora King','+1 (512) 555-0225','aurora.k@example.com',       null, 0, 'new','First-time inquiry from missed call.', 8000),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Violet Wright','+1 (512) 555-0226','violet.w@example.com',    now() - interval '16 days', 94000, 'active','Asked about gift cards.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Stella Lopez','+1 (512) 555-0227','stella.l@example.com',     now() - interval '4 days',  142000, 'vip','Booked spa day package.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Hannah Hill','+1 (512) 555-0228','hannah.h@example.com',      now() - interval '52 days',  42000, 'lapsed','Outreach scheduled tomorrow.', 6800),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Bella Scott','+1 (512) 555-0229','bella.s@example.com',       now() - interval '9 days',   88000, 'active','Confirmed appointment.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Maya Green','+1 (512) 555-0230','maya.g@example.com',         now() - interval '1 day',    66000, 'active','Walk-in from referral.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Skylar Adams','+1 (512) 555-0231','skylar.a@example.com',     now() - interval '28 days',  58000, 'active','Asked about subscription pricing.', 4200),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Aubrey Baker','+1 (512) 555-0232','aubrey.b@example.com',     now() - interval '74 days',  36000, 'lapsed','Not responsive to outreach.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Lucy Nelson','+1 (512) 555-0233','lucy.n@example.com',         now() - interval '6 days',   102000, 'active','Booked color + cut.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Anna Carter','+1 (512) 555-0234','anna.c@example.com',         now() - interval '38 days',   48000, 'lapsed','Reactivation outreach this week.', 6200),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Samantha Mitchell','+1 (512) 555-0235','samantha.m@example.com', now() - interval '2 days', 178000, 'vip','Referred two new clients.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Caroline Perez','+1 (512) 555-0236','caroline.p@example.com', now() - interval '12 days',   78000, 'active','Confirmed lash lift.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Genesis Roberts','+1 (512) 555-0237','genesis.r@example.com', now() - interval '5 days',    62000, 'active','First visit was a no-show, rebooked.', 0),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Naomi Turner','+1 (512) 555-0238','naomi.t@example.com',     now() - interval '19 days',   84000, 'active','Asked about a wedding package.', 22000),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Eliana Phillips','+1 (512) 555-0239','eliana.p@example.com', now() - interval '44 days',   38000, 'lapsed','Outreach pending.', 5400),
  (gen_random_uuid(),'00000000-0000-4000-a000-000000000001','Ariana Campbell','+1 (512) 555-0240','ariana.c@example.com',  null, 0, 'new','New inquiry from website form.', 0);

-- Activities (~60)
do $$
declare b uuid := '00000000-0000-4000-a000-000000000001'::uuid;
begin
  insert into public.activities (business_id, engine_type, kind, headline, detail, amount_cents, occurred_at) values
    (b,'missed_call','recovered_booking','Recovered booking from missed call','Sophia Martinez called outside hours; we booked a balayage for Friday.', 22000, now() - interval '34 minutes'),
    (b,'after_hours','recovered_booking','Booked new client after hours','Aria White inquired at 11:42pm — booked for next Tuesday.', 18000, now() - interval '2 hours'),
    (b,'no_show','appointment_confirmed','Confirmed tomorrow''s appointment','Olivia Chen confirmed her Thursday 4pm cut.', null, now() - interval '5 hours'),
    (b,'reputation','review_generated','Generated 5-star review','Lillian Hall left a glowing review on Google.', null, now() - interval '11 hours'),
    (b,'reactivation','customer_returned','Reactivated lapsed customer','Charlotte Davis returned after 47 days; rebooked color.', 16000, now() - interval '1 day'),
    (b,'missed_call','recovered_booking','Recovered booking from missed call','Hazel Young — booked highlights for Saturday.', 24000, now() - interval '1 day 3 hours'),
    (b,'after_hours','recovered_booking','Booked new client after hours','Aurora King first-time client.', 12000, now() - interval '1 day 6 hours'),
    (b,'no_show','reminder_sent','Sent appointment reminders','12 reminders sent for tomorrow''s bookings.', null, now() - interval '1 day 8 hours'),
    (b,'reputation','review_generated','Generated 5-star review','Evelyn Anderson left a 5-star review.', null, now() - interval '2 days'),
    (b,'reactivation','opportunity_opened','Opened reactivation opportunity','3 lapsed customers entered the reactivation queue.', null, now() - interval '2 days 1 hour'),
    (b,'missed_call','recovered_booking','Recovered booking from missed call','Caroline Perez — lash lift booked.', 14000, now() - interval '2 days 4 hours'),
    (b,'reactivation','customer_returned','Reactivated lapsed customer','Mia Thompson returned after 58 days.', 9500, now() - interval '2 days 9 hours'),
    (b,'after_hours','recovered_booking','Booked new client after hours','Naomi Turner — wedding package inquiry, consult booked.', 28000, now() - interval '3 days'),
    (b,'reputation','review_generated','Generated 5-star review','Stella Lopez 5-star review on Google.', null, now() - interval '3 days 5 hours'),
    (b,'missed_call','recovered_booking','Recovered booking from missed call','Lucy Nelson — color + cut.', 19000, now() - interval '3 days 8 hours'),
    (b,'no_show','appointment_confirmed','Confirmed today''s appointments','9 appointments confirmed for today.', null, now() - interval '4 days'),
    (b,'reactivation','customer_returned','Reactivated lapsed customer','Harper Garcia rebooked after 34 days.', 7000, now() - interval '4 days 2 hours'),
    (b,'after_hours','recovered_booking','Booked new client after hours','Late-night inquiry — booked weekend slot.', 16000, now() - interval '4 days 7 hours'),
    (b,'missed_call','recovered_booking','Recovered booking from missed call','Riley Lewis — manicure booked.', 6500, now() - interval '5 days'),
    (b,'reputation','review_generated','Generated 5-star review','Samantha Mitchell 5-star review.', null, now() - interval '5 days 3 hours'),
    (b,'no_show','reminder_sent','Sent appointment reminders','15 reminders sent for tomorrow.', null, now() - interval '5 days 8 hours'),
    (b,'missed_call','recovered_booking','Recovered booking from missed call','Genesis Roberts rebooked after no-show.', 12000, now() - interval '6 days'),
    (b,'reactivation','opportunity_opened','Opened reactivation opportunity','5 lapsed customers entered the queue.', null, now() - interval '6 days 4 hours'),
    (b,'after_hours','recovered_booking','Booked new client after hours','Inquiry at 10:14pm — booked Friday.', 14000, now() - interval '7 days'),
    (b,'no_show','appointment_confirmed','Confirmed today''s appointments','11 appointments confirmed.', null, now() - interval '7 days 6 hours'),
    (b,'reputation','review_generated','Generated 5-star review','Abigail Lee 5-star review.', null, now() - interval '8 days'),
    (b,'reactivation','customer_returned','Reactivated lapsed customer','Ella Brown returned after 67 days.', 6500, now() - interval '8 days 2 hours'),
    (b,'missed_call','recovered_booking','Recovered booking from missed call','Returned 4 missed calls — 2 became bookings.', 18000, now() - interval '9 days'),
    (b,'after_hours','recovered_booking','Booked new client after hours','Booked highlights for new client.', 22000, now() - interval '9 days 4 hours'),
    (b,'no_show','reminder_sent','Sent appointment reminders','18 reminders sent.', null, now() - interval '9 days 8 hours'),
    (b,'reactivation','customer_returned','Reactivated lapsed customer','Anna Carter rebooked.', 6200, now() - interval '10 days'),
    (b,'reputation','review_generated','Generated 5-star review','Chloe Martin 5-star review.', null, now() - interval '10 days 5 hours'),
    (b,'missed_call','recovered_booking','Recovered booking from missed call','Booked color refresh.', 14000, now() - interval '11 days'),
    (b,'after_hours','recovered_booking','Booked new client after hours','Late-night booking — manicure.', 6500, now() - interval '11 days 6 hours'),
    (b,'no_show','appointment_confirmed','Confirmed today''s appointments','13 appointments confirmed.', null, now() - interval '12 days'),
    (b,'reputation','review_generated','Generated 5-star review','5-star review from new client.', null, now() - interval '12 days 4 hours'),
    (b,'reactivation','opportunity_opened','Opened reactivation opportunity','6 customers in reactivation queue.', null, now() - interval '12 days 8 hours'),
    (b,'missed_call','recovered_booking','Recovered booking from missed call','Booked balayage.', 22000, now() - interval '13 days'),
    (b,'after_hours','recovered_booking','Booked new client after hours','Inquiry at 11:30pm — booked.', 16000, now() - interval '13 days 6 hours'),
    (b,'no_show','reminder_sent','Sent appointment reminders','21 reminders sent for the weekend.', null, now() - interval '14 days');
end$$;

-- Attention items
insert into public.attention_items (business_id, title, description, severity, cta_label) values
  ('00000000-0000-4000-a000-000000000001','Approve weekend hours change','Customers are inquiring about Sunday hours. Want us to expand booking windows?','action','Review request'),
  ('00000000-0000-4000-a000-000000000001','Reactivation engine needs attention','Some lapsed customers haven''t responded. We''re reviewing the outreach cadence.','info','See details'),
  ('00000000-0000-4000-a000-000000000001','New review opportunity','3 recent visitors haven''t been invited to leave a review yet.','info','See visitors');

-- Reports
insert into public.reports (business_id, period_type, period_start, period_end, recovered_cents, bookings_recovered, customers_returned, reviews_generated, summary_markdown) values
  ('00000000-0000-4000-a000-000000000001','weekly', (now() - interval '7 days')::date, now()::date, 142000, 14, 5, 6,
   E'## This week\n\nKOLVAX recovered **$1,420** for Bella Beauty Studio this week. We handled **14 missed calls**, reactivated **5 lapsed customers**, and generated **6 new 5-star reviews**.'),
  ('00000000-0000-4000-a000-000000000001','weekly', (now() - interval '14 days')::date, (now() - interval '7 days')::date, 118000, 11, 4, 5, E'## Last week\n\nRecovered **$1,180** — strong week for after-hours bookings.'),
  ('00000000-0000-4000-a000-000000000001','weekly', (now() - interval '21 days')::date, (now() - interval '14 days')::date, 96000, 9, 3, 4, E'## Two weeks ago\n\nSolid baseline week.'),
  ('00000000-0000-4000-a000-000000000001','weekly', (now() - interval '28 days')::date, (now() - interval '21 days')::date, 126000, 12, 6, 5, E'## Three weeks ago\n\nReactivation engine drove the gains.'),
  ('00000000-0000-4000-a000-000000000001','monthly', date_trunc('month', now())::date, now()::date, 482000, 46, 18, 20,
   E'## This month\n\nKOLVAX recovered **$4,820** across all five engines. Missed Call Recovery led the way at $1,860, followed by After-Hours Booking at $1,240.\n\n### Highlights\n- 46 bookings recovered\n- 18 lapsed customers returned\n- 20 new 5-star reviews\n- 3 attention items handled');

-- Integrations
insert into public.integrations (business_id, kind, provider, status, connected_at, config) values
  ('00000000-0000-4000-a000-000000000001','crm','Booksy','connected', now() - interval '18 days','{"account":"bella-beauty"}'::jsonb),
  ('00000000-0000-4000-a000-000000000001','calendar','Google Calendar','connected', now() - interval '18 days','{"calendar_id":"primary"}'::jsonb),
  ('00000000-0000-4000-a000-000000000001','phone','Twilio','connected', now() - interval '18 days','{"number":"+15125550142"}'::jsonb),
  ('00000000-0000-4000-a000-000000000001','reviews','Google Business Profile','connected', now() - interval '18 days','{"place_id":"ChIJ..."}'::jsonb);

-- Engine deployments (ops-only)
insert into public.engine_deployments (business_id, engine_type, phone_number, status, deployed_at, internal_config, notes) values
  ('00000000-0000-4000-a000-000000000001','missed_call','+15125550142','live', now() - interval '18 days','{"forwarding":"enabled","greeting":"warm-1"}'::jsonb,'Initial deployment'),
  ('00000000-0000-4000-a000-000000000001','after_hours','+15125550142','live', now() - interval '18 days','{"schedule":"after-8pm-and-weekends"}'::jsonb,null),
  ('00000000-0000-4000-a000-000000000001','reactivation',null,'live', now() - interval '17 days','{"cadence":"30-60-90"}'::jsonb,'Reviewing cadence'),
  ('00000000-0000-4000-a000-000000000001','no_show',null,'live', now() - interval '17 days','{"reminders":["24h","2h"]}'::jsonb,null),
  ('00000000-0000-4000-a000-000000000001','reputation',null,'live', now() - interval '16 days','{"invite_delay_hours":24}'::jsonb,null);
