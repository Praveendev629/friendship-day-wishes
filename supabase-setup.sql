-- Run this in Supabase SQL Editor to create the friend_names table

create table if not exists friend_names (
  id bigint generated always as identity primary key,
  name text not null,
  createdAt timestamptz not null default now()
);

-- Optional: allow public selects if you are using anon key for reads
-- alter table friend_names enable row level security;
-- create policy "Public read access" on friend_names for select using (true);
