-- My Money — initial schema
--
-- Money is stored as integer satang (1 THB = 100 satang). No floating point
-- columns are used for money anywhere in this schema.
--
-- All user data is protected by row level security. Built-in categories are
-- global rows (user_id is null); custom categories and every transaction or
-- budget belong to exactly one authenticated user.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  display_name text,
  monthly_budget_satang bigint check (monthly_budget_satang is null or monthly_budget_satang >= 0),
  locale text not null default 'th' check (locale in ('th', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[[:alnum:]._-]{3,24}$')
);

create unique index profiles_username_lower_key on public.profiles (lower(username));

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  slug text unique,
  name text not null check (length(trim(name)) between 1 and 60),
  icon text not null default '✨' check (length(icon) between 1 and 8),
  color text not null default 'slate'
    check (color in ('emerald', 'coral', 'amber', 'sky', 'violet', 'rose', 'lime', 'slate')),
  kind text not null check (kind in ('income', 'expense')),
  created_at timestamptz not null default now(),
  -- Built-in categories are global and have a slug. User categories have no slug.
  constraint categories_global_slug check ((slug is null) <> (user_id is null))
);

create index categories_user_id_idx on public.categories (user_id);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('income', 'expense')),
  amount_satang bigint not null check (amount_satang > 0),
  category_id uuid references public.categories (id) on delete set null,
  note text not null default '' check (length(note) <= 500),
  occurred_on date not null,
  created_at timestamptz not null default now()
);

create index transactions_user_date_idx
  on public.transactions (user_id, occurred_on desc, created_at desc);
create index transactions_user_category_idx
  on public.transactions (user_id, category_id);

create table public.category_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  month date not null check (month = date_trunc('month', month)::date),
  amount_satang bigint not null check (amount_satang > 0),
  created_at timestamptz not null default now(),
  unique (user_id, category_id, month)
);

create index category_budgets_user_month_idx
  on public.category_budgets (user_id, month);

/* -------------------------------------------------------------------------- */
/*                         Category ownership guards                          */
/* -------------------------------------------------------------------------- */

create or replace function public.assert_category_visible()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.category_id is not null and not exists (
    select 1
    from public.categories c
    where c.id = new.category_id
      and (c.user_id is null or c.user_id = new.user_id)
  ) then
    raise exception 'category does not belong to this user'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger transactions_category_guard
  before insert or update of category_id, user_id on public.transactions
  for each row execute function public.assert_category_visible();

create trigger category_budgets_category_guard
  before insert or update of category_id, user_id on public.category_budgets
  for each row execute function public.assert_category_visible();

/* -------------------------------------------------------------------------- */
/*                            Profile maintenance                             */
/* -------------------------------------------------------------------------- */

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_username text;
begin
  requested_username := lower(
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
      split_part(coalesce(new.email, 'user'), '@', 1)
    )
  );
  requested_username := regexp_replace(requested_username, '[^[:alnum:]._-]', '', 'g');
  if length(requested_username) < 3 then
    requested_username := 'user-' || substr(new.id::text, 1, 8);
  end if;

  insert into public.profiles (id, username, display_name, locale)
  values (
    new.id,
    requested_username,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), requested_username),
    'th'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

/* -------------------------------------------------------------------------- */
/*                              Row level security                            */
/* -------------------------------------------------------------------------- */

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.category_budgets enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "categories_select_visible"
  on public.categories for select
  to authenticated
  using (user_id is null or user_id = (select auth.uid()));

create policy "categories_insert_own"
  on public.categories for insert
  to authenticated
  with check (user_id = (select auth.uid()) and slug is null);

create policy "categories_update_own"
  on public.categories for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and slug is null);

create policy "categories_delete_own"
  on public.categories for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "transactions_select_own"
  on public.transactions for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "transactions_insert_own"
  on public.transactions for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "transactions_update_own"
  on public.transactions for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "transactions_delete_own"
  on public.transactions for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "budgets_select_own"
  on public.category_budgets for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "budgets_insert_own"
  on public.category_budgets for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "budgets_update_own"
  on public.category_budgets for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "budgets_delete_own"
  on public.category_budgets for delete
  to authenticated
  using (user_id = (select auth.uid()));

/* -------------------------------------------------------------------------- */
/*                              Built-in categories                           */
/* -------------------------------------------------------------------------- */

insert into public.categories (user_id, slug, name, icon, color, kind) values
  (null, 'food',          'Food & drinks',       '🍜', 'coral',   'expense'),
  (null, 'transport',     'Transport',           '🚇', 'sky',     'expense'),
  (null, 'home',          'Home',                '🏠', 'amber',   'expense'),
  (null, 'shopping',      'Shopping',            '🛍️', 'violet',  'expense'),
  (null, 'health',        'Health',              '💊', 'rose',    'expense'),
  (null, 'fun',           'Fun & leisure',       '🎬', 'lime',    'expense'),
  (null, 'bills',         'Bills & utilities',   '🧾', 'slate',   'expense'),
  (null, 'education',     'Education',           '📚', 'emerald', 'expense'),
  (null, 'family',        'Family',              '👨‍👩‍👧', 'rose',    'expense'),
  (null, 'other-expense', 'Other',               '✨', 'slate',   'expense'),
  (null, 'salary',        'Salary',              '💼', 'emerald', 'income'),
  (null, 'freelance',     'Freelance',           '💻', 'sky',     'income'),
  (null, 'business',      'Business',            '🏪', 'amber',   'income'),
  (null, 'investment',    'Investment',          '📈', 'lime',    'income'),
  (null, 'gift',          'Gifts',               '🎁', 'violet',  'income'),
  (null, 'other-income',  'Other',               '✨', 'slate',   'income');

/* -------------------------------------------------------------------------- */
/*                                  Grants                                    */
/* -------------------------------------------------------------------------- */

grant usage on schema public to authenticated;
grant select on public.categories to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.category_budgets to authenticated;
