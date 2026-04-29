create table if not exists public.hotel_admins (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  invite_token text unique not null,
  invite_sent_at timestamptz default now(),
  onboarded_at timestamptz,
  status text not null default 'pending', -- pending | active
  created_at timestamptz default now()
);
create index on public.hotel_admins(property_id);
create index on public.hotel_admins(invite_token);
create index on public.hotel_admins(email);
