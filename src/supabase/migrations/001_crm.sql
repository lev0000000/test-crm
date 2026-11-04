begin;

create type public.app_role as enum ('manager', 'executor');
create type public.task_status as enum (
  'new', 'in_progress', 'review', 'accepted', 'revision'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null
    check (length(trim(display_name)) between 1 and 120),
  role public.app_role not null
);

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create function private.is_manager()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'manager'
  );
$$;

revoke all on function private.is_manager() from public;
grant execute on function private.is_manager() to authenticated;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 200),
  address text not null check (length(trim(address)) between 1 and 500),
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 200),
  description text not null default ''
    check (length(description) <= 10000),
  project_id uuid not null
    references public.projects(id) on delete cascade,
  assignee_id uuid not null
    references public.profiles(id) on delete restrict,
  status public.task_status not null default 'new',
  author_id uuid not null default auth.uid()
    references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index tasks_assignee_idx on public.tasks(assignee_id);
create index tasks_project_idx on public.tasks(project_id);

create table public.task_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  actor_name text not null,
  from_status public.task_status,
  to_status public.task_status not null,
  comment text check (length(comment) <= 2000),
  created_at timestamptz not null default clock_timestamp()
);

create index history_task_idx
  on public.task_history(task_id, created_at);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_history enable row level security;

-- Справочник имён и ролей доступен вошедшим пользователям.
-- Менять его через приложение нельзя.
create policy profiles_read on public.profiles
for select to authenticated using (true);

create policy projects_read on public.projects
for select to authenticated using (
  private.is_manager()
  or exists (
    select 1 from public.tasks t
    where t.project_id = projects.id
      and t.assignee_id = auth.uid()
  )
);

create policy projects_insert on public.projects
for insert to authenticated
with check (private.is_manager());

create policy projects_update on public.projects
for update to authenticated
using (private.is_manager())
with check (private.is_manager());

create policy projects_delete on public.projects
for delete to authenticated
using (private.is_manager());

create policy tasks_read on public.tasks
for select to authenticated
using (private.is_manager() or assignee_id = auth.uid());

create policy tasks_insert on public.tasks
for insert to authenticated
with check (
  private.is_manager() and author_id = auth.uid()
);

create policy tasks_update on public.tasks
for update to authenticated
using (private.is_manager() or assignee_id = auth.uid())
with check (private.is_manager() or assignee_id = auth.uid());

create policy tasks_delete on public.tasks
for delete to authenticated
using (private.is_manager());

create policy history_read on public.task_history
for select to authenticated using (
  exists (
    select 1 from public.tasks t
    where t.id = task_history.task_id
      and (private.is_manager() or t.assignee_id = auth.uid())
  )
);

revoke all on
  public.profiles, public.projects, public.tasks, public.task_history
from anon, authenticated;

grant select on public.profiles, public.task_history
to authenticated;

grant select, insert, update, delete
on public.projects, public.tasks to authenticated;

-- Проверка каждой операции с задачей на стороне базы.
create function private.guard_task()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  manager boolean := private.is_manager();
begin
  if auth.uid() is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if TG_OP = 'INSERT' then
    if not manager
       or new.status <> 'new'
       or new.author_id <> auth.uid() then
      raise exception 'Only a manager can create a new task as themselves'
        using errcode = '42501';
    end if;

    new.created_at := now();
  else
    if new.id is distinct from old.id
       or new.author_id is distinct from old.author_id
       or new.created_at is distinct from old.created_at then
      raise exception 'Task identity, author and creation time are immutable'
        using errcode = '42501';
    end if;

    if not manager and (
      old.assignee_id <> auth.uid()
      or row(
        new.title, new.description, new.project_id, new.assignee_id
      ) is distinct from row(
        old.title, old.description, old.project_id, old.assignee_id
      )
    ) then
      raise exception 'Executor may only change own task status'
        using errcode = '42501';
    end if;

    if new.status is distinct from old.status then
      if row(
        new.title, new.description, new.project_id, new.assignee_id
      ) is distinct from row(
        old.title, old.description, old.project_id, old.assignee_id
      ) then
        raise exception 'Change status separately from task details'
          using errcode = '42501';
      end if;

      if not (
        (
          not manager
          and old.assignee_id = auth.uid()
          and (
            (old.status in ('new', 'revision')
              and new.status = 'in_progress')
            or (old.status = 'in_progress'
              and new.status = 'review')
          )
        )
        or (
          manager
          and old.status = 'review'
          and new.status in ('accepted', 'revision')
        )
      ) then
        raise exception 'Forbidden status transition'
          using errcode = '42501';
      end if;

      if new.status = 'revision'
         and nullif(
           trim(current_setting('crm.transition_comment', true)), ''
         ) is null then
        raise exception 'A revision comment is required'
          using errcode = '23514';
      end if;
    end if;
  end if;

  if not exists (
    select 1 from public.profiles
    where id = new.assignee_id and role = 'executor'
  ) then
    raise exception 'Assignee must be an executor'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger guard_task
before insert or update on public.tasks
for each row execute function private.guard_task();

-- История записывается автоматически, вместе с изменением задачи.
create function private.record_history()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.task_history (
      task_id, actor_id, actor_name, from_status, to_status
    )
    select new.id, auth.uid(), p.display_name, null, new.status
    from public.profiles p where p.id = auth.uid();

  elsif new.status is distinct from old.status then
    insert into public.task_history (
      task_id, actor_id, actor_name,
      from_status, to_status, comment
    )
    select
      new.id, auth.uid(), p.display_name,
      old.status, new.status,
      nullif(trim(current_setting('crm.transition_comment', true)), '')
    from public.profiles p where p.id = auth.uid();
  end if;

  return new;
end;
$$;

create trigger record_history
after insert or update on public.tasks
for each row execute function private.record_history();

revoke all on function
  private.guard_task(), private.record_history()
from public, anon, authenticated;

-- Приложение вызывает эту функцию для смены статуса.
create function public.transition_task(
  p_task_id uuid,
  p_expected public.task_status,
  p_target public.task_status,
  p_comment text default null
)
returns void
language plpgsql security invoker
set search_path = ''
as $$
declare
  current_status public.task_status;
begin
  if length(p_comment) > 2000 then
    raise exception 'Comment exceeds 2000 characters';
  end if;

  select status into current_status
  from public.tasks
  where id = p_task_id
  for update;

  if not found then
    raise exception 'Task unavailable' using errcode = '42501';
  end if;

  if current_status is distinct from p_expected then
    raise exception 'Task changed. Refresh and try again.'
      using errcode = '40001';
  end if;

  if p_target is not distinct from current_status then
    raise exception 'Status must change' using errcode = '23514';
  end if;

  perform set_config(
    'crm.transition_comment', coalesce(p_comment, ''), true
  );

  update public.tasks
  set status = p_target
  where id = p_task_id;

  perform set_config('crm.transition_comment', '', true);
end;
$$;

revoke all on function public.transition_task(
  uuid, public.task_status, public.task_status, text
) from public, anon;

grant execute on function public.transition_task(
  uuid, public.task_status, public.task_status, text
) to authenticated;

commit;