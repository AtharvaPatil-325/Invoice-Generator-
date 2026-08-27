-- Invoice Generator Supabase Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Business Profiles
create table if not exists public.business_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  email text,
  phone text,
  website text,
  tax_number text,
  logo_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint business_profiles_user_id_key unique (user_id)
);

-- Clients
create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  company_name text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  tax_number text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Invoices
create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  invoice_number text not null,
  issue_date date not null,
  due_date date not null,
  currency text not null default 'INR',
  status text not null default 'draft',
  subtotal numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  notes text,
  terms text,
  payment_instructions text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint invoices_user_id_invoice_number_key unique (user_id, invoice_number)
);

-- Invoice Items
create table if not exists public.invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  quantity numeric(12,2) not null,
  unit_price numeric(12,2) not null,
  tax_rate numeric(5,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Storage bucket for business logos
insert into storage.buckets (id, name, public) values ('business-logos', 'business-logos', false) on conflict (id) do nothing;

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.business_profiles enable row level security;
alter table public.clients enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

-- Profiles policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Business profiles policies
create policy "Users can view own business profile" on public.business_profiles for select using (auth.uid() = user_id);
create policy "Users can insert own business profile" on public.business_profiles for insert with check (auth.uid() = user_id);
create policy "Users can update own business profile" on public.business_profiles for update using (auth.uid() = user_id);
create policy "Users can delete own business profile" on public.business_profiles for delete using (auth.uid() = user_id);

-- Clients policies
create policy "Users can view own clients" on public.clients for select using (auth.uid() = user_id);
create policy "Users can insert own clients" on public.clients for insert with check (auth.uid() = user_id);
create policy "Users can update own clients" on public.clients for update using (auth.uid() = user_id);
create policy "Users can delete own clients" on public.clients for delete using (auth.uid() = user_id);

-- Invoices policies
create policy "Users can view own invoices" on public.invoices for select using (auth.uid() = user_id);
create policy "Users can insert own invoices" on public.invoices for insert with check (auth.uid() = user_id);
create policy "Users can update own invoices" on public.invoices for update using (auth.uid() = user_id);
create policy "Users can delete own invoices" on public.invoices for delete using (auth.uid() = user_id);

-- Invoice items policies
create policy "Users can view own invoice items" on public.invoice_items for select using (auth.uid() = user_id);
create policy "Users can insert own invoice items" on public.invoice_items for insert with check (auth.uid() = user_id);
create policy "Users can update own invoice items" on public.invoice_items for update using (auth.uid() = user_id);
create policy "Users can delete own invoice items" on public.invoice_items for delete using (auth.uid() = user_id);

-- Storage policies for business logos
create policy "Users can upload own logos" on storage.objects for insert with check (
  bucket_id = 'business-logos' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "Users can view own logos" on storage.objects for select using (
  bucket_id = 'business-logos' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "Users can update own logos" on storage.objects for update using (
  bucket_id = 'business-logos' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "Users can delete own logos" on storage.objects for delete using (
  bucket_id = 'business-logos' and auth.uid()::text = (storage.foldername(name))[1]
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger handle_profiles_updated_at before update on public.profiles for each row execute procedure public.handle_updated_at();
create trigger handle_business_profiles_updated_at before update on public.business_profiles for each row execute procedure public.handle_updated_at();
create trigger handle_clients_updated_at before update on public.clients for each row execute procedure public.handle_updated_at();
create trigger handle_invoices_updated_at before update on public.invoices for each row execute procedure public.handle_updated_at();
create trigger handle_invoice_items_updated_at before update on public.invoice_items for each row execute procedure public.handle_updated_at();
