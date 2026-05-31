create table if not exists public.app_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  created_at timestamptz not null default now()
);

create index if not exists app_events_type_created_at_idx
on public.app_events (type, created_at desc);

alter table public.app_events enable row level security;

drop policy if exists "Allow authenticated app event reads" on public.app_events;
create policy "Allow authenticated app event reads"
on public.app_events
for select
using (true);
