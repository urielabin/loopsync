create table rooms (
  id bigint generated always as identity primary key,
  room_code text not null unique,
  bpm int not null default 120,
  pattern jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table rooms enable row level security;

-- Deliberately permissive: there are no accounts, so anyone who knows a
-- room code is meant to be able to read and edit it, like a shared link.
-- Not for sensitive data -- see the README.
create policy "anyone can read rooms" on rooms for select using (true);
create policy "anyone can create rooms" on rooms for insert with check (true);
create policy "anyone can update rooms" on rooms for update using (true);

grant usage on schema public to anon;
grant select, insert, update on rooms to anon;

alter publication supabase_realtime add table rooms;
