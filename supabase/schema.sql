-- PrestamosPro - Supabase schema
-- Run this in the Supabase SQL Editor to create tables

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Clients table
create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text,
  document text,
  address text,
  notes text,
  created_at timestamptz default now()
);

-- Loans table
create table if not exists public.loans (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  amount decimal(12, 2) not null,
  interest_rate decimal(5, 2) not null,
  total_amount decimal(12, 2) not null,
  remaining_balance decimal(12, 2) not null,
  start_date date not null,
  due_date date not null,
  status text not null default 'active' check (status in ('active', 'paid', 'overdue')),
  created_at timestamptz default now()
);

-- Payments table
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  amount decimal(12, 2) not null,
  payment_date timestamptz not null,
  notes text
);

-- Indexes for common queries
create index if not exists idx_loans_client_id on public.loans(client_id);
create index if not exists idx_loans_status on public.loans(status);
create index if not exists idx_loans_due_date on public.loans(due_date);
create index if not exists idx_payments_loan_id on public.payments(loan_id);
create index if not exists idx_payments_payment_date on public.payments(payment_date);

-- Row Level Security (optional - enable if using Supabase Auth)
-- alter table public.clients enable row level security;
-- alter table public.loans enable row level security;
-- alter table public.payments enable row level security;

-- Policy examples (adjust to your auth rules):
-- create policy "Allow all for anon" on public.clients for all using (true);
-- create policy "Allow all for anon" on public.loans for all using (true);
-- create policy "Allow all for anon" on public.payments for all using (true);
