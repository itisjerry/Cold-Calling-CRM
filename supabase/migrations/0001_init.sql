-- ============================================================================
-- Helio CRM — Initial Schema + RLS
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------- ENUMS --------------------------------------------------------
create type user_role     as enum ('admin', 'manager', 'caller');
create type lead_status   as enum ('New','Attempting','Connected','In Discussion','Follow-up','Qualified','Not Interested','Dead');
create type lead_temp     as enum ('Hot','Warm','Cold');
create type history_type  as enum ('call','note','status','stage','import');
create type pipeline_stage as enum ('New','Contacted','Qualified','Proposal','Won','Lost');
create type project_stage as enum ('Discovery','Proposal','Contract','Kickoff','Active','Delivered','On Hold');
create type task_priority as enum ('low','medium','high','urgent');

-- ---------- ORGS ---------------------------------------------------------
create table orgs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  plan text default 'free',
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- ---------- PROFILES ----------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references orgs(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  role user_role default 'caller',
  created_at timestamptz default now()
);

-- ---------- LEADS --------------------------------------------------------
create table leads (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  owner_id uuid references profiles(id) on delete set null,

  name text not null,
  company text,
  title text,
  email text,
  phone text,
  phone_normalized text,

  city text,
  state text,
  country text,
  timezone text,

  industry text,
  service_interest text,
  source text,
  tags text[] default '{}',

  status lead_status default 'New',
  temperature lead_temp default 'Warm',
  pipeline pipeline_stage default 'New',

  score numeric default 0,
  attempts int default 0,

  budget numeric,
  decision_maker boolean default false,
  next_callback_at timestamptz,
  last_contact_at timestamptz,

  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index leads_org_score_idx      on leads (org_id, score desc);
create index leads_org_callback_idx   on leads (org_id, next_callback_at);
create index leads_org_phone_idx      on leads (org_id, phone_normalized);
create index leads_org_status_idx     on leads (org_id, status);
create index leads_org_pipeline_idx   on leads (org_id, pipeline);

-- ---------- LEAD HISTORY ------------------------------------------------
create table lead_history (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references leads(id) on delete cascade,
  org_id uuid not null references orgs(id) on delete cascade,
  by_user uuid references profiles(id) on delete set null,
  type history_type not null,
  disposition text,
  note text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index lead_history_lead_idx on lead_history (lead_id, created_at desc);
create index lead_history_org_idx  on lead_history (org_id, created_at desc);

-- ---------- PROJECTS ----------------------------------------------------
create table projects (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  owner_id uuid references profiles(id) on delete set null,
  name text not null,
  stage project_stage default 'Discovery',
  value numeric,
  start_date date,
  due_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index projects_org_stage_idx on projects (org_id, stage);

-- ---------- TASKS -------------------------------------------------------
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz,
  priority task_priority default 'medium',
  lead_id uuid references leads(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  done boolean default false,
  created_at timestamptz default now()
);
create index tasks_org_due_idx on tasks (org_id, due_at);

-- ---------- REMINDERS ---------------------------------------------------
create table reminders (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references orgs(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  fires_at timestamptz not null,
  message text not null,
  lead_id uuid references leads(id) on delete set null,
  done boolean default false,
  created_at timestamptz default now()
);

-- ---------- SETTINGS ----------------------------------------------------
create table org_settings (
  org_id uuid primary key references orgs(id) on delete cascade,
  call_window_start int default 9,
  call_window_end   int default 18,
  boost_tue_thu boolean default true,
  revival_attempts int default 6,
  old_days int default 30,
  scoring jsonb default '{
    "hot": 100, "warm": 60, "cold": 30,
    "recencyMax": 30, "recencyDecayDays": 30,
    "callbackToday": 80, "callbackOverdue": 60,
    "tueThuBoost": 25, "inWindowBoost": 20,
    "attemptPenalty": 5, "staleAgePenalty": 20
  }'::jsonb,
  updated_at timestamptz default now()
);

-- ---------- AUTH HELPERS ------------------------------------------------
create or replace function public.current_org_id() returns uuid
language sql stable security definer set search_path=public as $$
  select org_id from profiles where id = auth.uid();
$$;

create or replace function public.current_user_role() returns user_role
language sql stable security definer set search_path=public as $$
  select role from profiles where id = auth.uid();
$$;

-- ---------- TRIGGERS: updated_at ----------------------------------------
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger leads_updated_at    before update on leads    for each row execute procedure set_updated_at();
create trigger projects_updated_at before update on projects for each row execute procedure set_updated_at();
create trigger settings_updated_at before update on org_settings for each row execute procedure set_updated_at();

-- ---------- TRIGGER: phone normalize ------------------------------------
create or replace function normalize_phone() returns trigger language plpgsql as $$
begin
  if new.phone is not null then
    new.phone_normalized := right(regexp_replace(new.phone, '\D','','g'), 10);
  end if;
  return new;
end $$;
create trigger leads_phone_norm before insert or update of phone on leads
for each row execute procedure normalize_phone();

-- ---------- TRIGGER: history → attempts + last_contact ------------------
create or replace function on_lead_history_insert() returns trigger language plpgsql as $$
begin
  if new.type = 'call' then
    update leads set
      attempts = attempts + 1,
      last_contact_at = new.created_at
    where id = new.lead_id;
  end if;
  return new;
end $$;
create trigger lead_history_after_insert after insert on lead_history
for each row execute procedure on_lead_history_insert();

-- ---------- RLS ----------------------------------------------------------
alter table orgs          enable row level security;
alter table profiles      enable row level security;
alter table leads         enable row level security;
alter table lead_history  enable row level security;
alter table projects      enable row level security;
alter table tasks         enable row level security;
alter table reminders     enable row level security;
alter table org_settings  enable row level security;

-- Profiles: each user can read profiles in their org; can update self.
create policy profiles_select on profiles for select using (org_id = current_org_id());
create policy profiles_self_update on profiles for update using (id = auth.uid());
create policy profiles_self_insert on profiles for insert with check (id = auth.uid());

-- Orgs: members can read; only admins can update.
create policy orgs_select on orgs for select using (id = current_org_id());
create policy orgs_update on orgs for update using (id = current_org_id() and current_user_role() = 'admin');

-- Leads/etc.: members of the org full CRUD on their org rows.
create policy leads_all on leads using (org_id = current_org_id()) with check (org_id = current_org_id());
create policy hist_all  on lead_history using (org_id = current_org_id()) with check (org_id = current_org_id());
create policy proj_all  on projects using (org_id = current_org_id()) with check (org_id = current_org_id());
create policy task_all  on tasks using (org_id = current_org_id()) with check (org_id = current_org_id());
create policy rem_all   on reminders using (org_id = current_org_id()) with check (org_id = current_org_id());
create policy set_select on org_settings for select using (org_id = current_org_id());
create policy set_update on org_settings for update using (org_id = current_org_id() and current_user_role() in ('admin','manager'));
create policy set_insert on org_settings for insert with check (org_id = current_org_id());
