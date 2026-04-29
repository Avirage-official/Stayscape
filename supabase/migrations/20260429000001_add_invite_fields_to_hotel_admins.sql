-- Add invite/onboarding fields to the existing hotel_admins table
alter table public.hotel_admins
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists invite_token text unique,
  add column if not exists invite_sent_at timestamptz default now(),
  add column if not exists invite_expires_at timestamptz,
  add column if not exists onboarded_at timestamptz,
  add column if not exists status text not null default 'pending';
  -- status: 'pending' | 'active'

-- Allow user_id to be null for pending invites (set after onboarding)
alter table public.hotel_admins alter column user_id drop not null;

create index if not exists hotel_admins_invite_token_idx on public.hotel_admins(invite_token);
create index if not exists hotel_admins_email_idx on public.hotel_admins(email);
