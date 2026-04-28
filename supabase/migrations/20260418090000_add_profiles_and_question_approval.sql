create type public.profile_role as enum ('user', 'approver', 'admin');
create type public.question_approval_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.profile_role not null default 'user',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.has_approval_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and role in ('approver', 'admin')
  );
$$;

create policy "Users can view their own profile"
on public.profiles
for select
using (auth.uid() = user_id);

create policy "Users can insert their own profile"
on public.profiles
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Approvers can view all profiles"
on public.profiles
for select
using (public.has_approval_role());

create trigger update_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();

alter table public.questions
add column approval_status public.question_approval_status not null default 'pending',
add column approved_by uuid references auth.users(id) on delete set null,
add column approved_at timestamp with time zone;

update public.questions
set approval_status = 'approved',
    approved_at = coalesce(approved_at, now())
where approval_status = 'pending';

drop policy if exists "Questions are publicly readable" on public.questions;
drop policy if exists "Users can create their own questions" on public.questions;
drop policy if exists "Users can update their own questions" on public.questions;
drop policy if exists "Users can delete their own questions" on public.questions;

create policy "Approved questions are publicly readable"
on public.questions
for select
using (
  approval_status = 'approved'
  or auth.uid() = user_id
  or public.has_approval_role()
);

create policy "Users can create pending questions"
on public.questions
for insert
with check (
  auth.uid() = user_id
  and approval_status = 'pending'
);

create policy "Users can update their own pending questions"
on public.questions
for update
using (auth.uid() = user_id and approval_status = 'pending')
with check (auth.uid() = user_id and approval_status = 'pending');

create policy "Approvers can moderate questions"
on public.questions
for update
using (public.has_approval_role())
with check (public.has_approval_role());

create policy "Users can delete their own pending questions"
on public.questions
for delete
using ((auth.uid() = user_id and approval_status = 'pending') or public.has_approval_role());

create index idx_questions_approval_status on public.questions(approval_status);
