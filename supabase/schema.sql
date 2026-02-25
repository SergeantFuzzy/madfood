-- MadFood schema for Supabase
-- Apply this file in Supabase SQL editor.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  phone_number text,
  text_reminders_enabled boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  notes text,
  image_url text,
  prep_time_minutes int,
  cook_time_minutes int,
  is_favorite boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  name text not null,
  quantity text,
  unit text,
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.groceries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  default_unit text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.grocery_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.grocery_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  list_id uuid not null references public.grocery_lists(id) on delete cascade,
  name text not null,
  quantity numeric(12, 2) not null default 1,
  price numeric(12, 2) not null default 0,
  already_have_in_pantry boolean not null default false,
  purchased boolean not null default false,
  purchased_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  planned_date date not null,
  slot text not null default 'main',
  meal_name text,
  recipe_id uuid references public.recipes(id) on delete set null,
  already_have_in_pantry boolean not null default false,
  purchased boolean not null default false,
  estimated_cost numeric(12, 2) not null default 0,
  is_favorite boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint weekly_plans_user_id_planned_date_slot_key unique (user_id, planned_date, slot)
);

create table if not exists public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  quantity numeric(12, 2) not null default 0,
  unit text,
  estimated_price numeric(12, 2) not null default 0,
  in_stock boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles add column if not exists phone_number text;
alter table public.profiles add column if not exists text_reminders_enabled boolean not null default false;
alter table public.grocery_list_items add column if not exists already_have_in_pantry boolean not null default false;
alter table public.grocery_list_items add column if not exists purchased boolean not null default false;
alter table public.grocery_list_items add column if not exists purchased_at timestamptz;
alter table public.recipes add column if not exists prep_time_minutes int;
alter table public.recipes add column if not exists cook_time_minutes int;
alter table public.recipes add column if not exists is_favorite boolean not null default false;
alter table public.weekly_plans add column if not exists already_have_in_pantry boolean not null default false;
alter table public.weekly_plans add column if not exists purchased boolean not null default false;
alter table public.weekly_plans add column if not exists estimated_cost numeric(12, 2) not null default 0;
alter table public.weekly_plans add column if not exists is_favorite boolean not null default false;

create index if not exists idx_recipes_user_id on public.recipes(user_id);
create index if not exists idx_recipes_is_favorite on public.recipes(user_id, is_favorite);
create index if not exists idx_recipe_ingredients_user_id on public.recipe_ingredients(user_id);
create index if not exists idx_recipe_ingredients_recipe_id on public.recipe_ingredients(recipe_id);
create index if not exists idx_groceries_user_id on public.groceries(user_id);
create index if not exists idx_grocery_lists_user_id on public.grocery_lists(user_id);
create index if not exists idx_grocery_list_items_user_id on public.grocery_list_items(user_id);
create index if not exists idx_grocery_list_items_list_id on public.grocery_list_items(list_id);
create index if not exists idx_grocery_list_items_purchased_at on public.grocery_list_items(purchased_at);
create index if not exists idx_weekly_plans_user_id_date on public.weekly_plans(user_id, planned_date);
create index if not exists idx_weekly_plans_is_favorite on public.weekly_plans(user_id, is_favorite);
create index if not exists idx_pantry_items_user_id on public.pantry_items(user_id);
create index if not exists idx_pantry_items_in_stock on public.pantry_items(user_id, in_stock);

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_recipes_set_updated_at on public.recipes;
create trigger trg_recipes_set_updated_at
before update on public.recipes
for each row execute function public.set_updated_at();

drop trigger if exists trg_grocery_lists_set_updated_at on public.grocery_lists;
create trigger trg_grocery_lists_set_updated_at
before update on public.grocery_lists
for each row execute function public.set_updated_at();

drop trigger if exists trg_grocery_list_items_set_updated_at on public.grocery_list_items;
create trigger trg_grocery_list_items_set_updated_at
before update on public.grocery_list_items
for each row execute function public.set_updated_at();

drop trigger if exists trg_weekly_plans_set_updated_at on public.weekly_plans;
create trigger trg_weekly_plans_set_updated_at
before update on public.weekly_plans
for each row execute function public.set_updated_at();

drop trigger if exists trg_pantry_items_set_updated_at on public.pantry_items;
create trigger trg_pantry_items_set_updated_at
before update on public.pantry_items
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.groceries enable row level security;
alter table public.grocery_lists enable row level security;
alter table public.grocery_list_items enable row level security;
alter table public.weekly_plans enable row level security;
alter table public.pantry_items enable row level security;

drop policy if exists "Profiles select own" on public.profiles;
create policy "Profiles select own"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Profiles insert own" on public.profiles;
create policy "Profiles insert own"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Profiles update own" on public.profiles;
create policy "Profiles update own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Profiles delete own" on public.profiles;
create policy "Profiles delete own"
on public.profiles for delete
to authenticated
using (auth.uid() = id);

drop policy if exists "Recipes select own" on public.recipes;
create policy "Recipes select own"
on public.recipes for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Recipes insert own" on public.recipes;
create policy "Recipes insert own"
on public.recipes for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Recipes update own" on public.recipes;
create policy "Recipes update own"
on public.recipes for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Recipes delete own" on public.recipes;
create policy "Recipes delete own"
on public.recipes for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Recipe ingredients select own" on public.recipe_ingredients;
create policy "Recipe ingredients select own"
on public.recipe_ingredients for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Recipe ingredients insert own" on public.recipe_ingredients;
create policy "Recipe ingredients insert own"
on public.recipe_ingredients for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Recipe ingredients update own" on public.recipe_ingredients;
create policy "Recipe ingredients update own"
on public.recipe_ingredients for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Recipe ingredients delete own" on public.recipe_ingredients;
create policy "Recipe ingredients delete own"
on public.recipe_ingredients for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Groceries select own" on public.groceries;
create policy "Groceries select own"
on public.groceries for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Groceries insert own" on public.groceries;
create policy "Groceries insert own"
on public.groceries for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Groceries update own" on public.groceries;
create policy "Groceries update own"
on public.groceries for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Groceries delete own" on public.groceries;
create policy "Groceries delete own"
on public.groceries for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Grocery lists select own" on public.grocery_lists;
create policy "Grocery lists select own"
on public.grocery_lists for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Grocery lists insert own" on public.grocery_lists;
create policy "Grocery lists insert own"
on public.grocery_lists for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Grocery lists update own" on public.grocery_lists;
create policy "Grocery lists update own"
on public.grocery_lists for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Grocery lists delete own" on public.grocery_lists;
create policy "Grocery lists delete own"
on public.grocery_lists for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Grocery list items select own" on public.grocery_list_items;
create policy "Grocery list items select own"
on public.grocery_list_items for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Grocery list items insert own" on public.grocery_list_items;
create policy "Grocery list items insert own"
on public.grocery_list_items for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Grocery list items update own" on public.grocery_list_items;
create policy "Grocery list items update own"
on public.grocery_list_items for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Grocery list items delete own" on public.grocery_list_items;
create policy "Grocery list items delete own"
on public.grocery_list_items for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Weekly plans select own" on public.weekly_plans;
create policy "Weekly plans select own"
on public.weekly_plans for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Weekly plans insert own" on public.weekly_plans;
create policy "Weekly plans insert own"
on public.weekly_plans for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Weekly plans update own" on public.weekly_plans;
create policy "Weekly plans update own"
on public.weekly_plans for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Weekly plans delete own" on public.weekly_plans;
create policy "Weekly plans delete own"
on public.weekly_plans for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Pantry items select own" on public.pantry_items;
create policy "Pantry items select own"
on public.pantry_items for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Pantry items insert own" on public.pantry_items;
create policy "Pantry items insert own"
on public.pantry_items for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Pantry items update own" on public.pantry_items;
create policy "Pantry items update own"
on public.pantry_items for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Pantry items delete own" on public.pantry_items;
create policy "Pantry items delete own"
on public.pantry_items for delete
to authenticated
using (auth.uid() = user_id);

-- Optional storage bucket scaffold for recipe images
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

drop policy if exists "Recipe images public read" on storage.objects;
create policy "Recipe images public read"
on storage.objects for select
to public
using (bucket_id = 'recipe-images');

drop policy if exists "Recipe images upload own" on storage.objects;
create policy "Recipe images upload own"
on storage.objects for insert
to authenticated
with check (bucket_id = 'recipe-images' and owner = auth.uid());

drop policy if exists "Recipe images update own" on storage.objects;
create policy "Recipe images update own"
on storage.objects for update
to authenticated
using (bucket_id = 'recipe-images' and owner = auth.uid())
with check (bucket_id = 'recipe-images' and owner = auth.uid());

drop policy if exists "Recipe images delete own" on storage.objects;
create policy "Recipe images delete own"
on storage.objects for delete
to authenticated
using (bucket_id = 'recipe-images' and owner = auth.uid());
