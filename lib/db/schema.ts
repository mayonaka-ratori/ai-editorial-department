// 表の定義。PGlite（手元）でもNeon（本番）でも同じSQLで作る。
export const SCHEMA_SQL = `
create table if not exists submissions (
  id text primary key,
  editor text not null,
  pen_name text not null,
  placement text not null,
  score integer not null default 0,
  title text not null,
  title_alt text not null default '',
  quote text not null default '',
  comment text not null default '',
  next_request text not null default '',
  reason_tags text not null default '[]',
  work_type text not null default '',
  safe_for_cover boolean not null default true,
  hidden boolean not null default false,
  is_sample boolean not null default false,
  device_id text not null default '',
  revision integer not null default 1,
  prev_id text not null default '',
  prev_score integer,
  issue text not null,
  created_at timestamptz not null default now()
);
-- あとから足した列。前からある表にも足す。
alter table submissions add column if not exists ai_style boolean not null default false;
create index if not exists submissions_issue_idx on submissions (issue, created_at);
create index if not exists submissions_device_idx on submissions (device_id, editor, issue);

create table if not exists settings (
  key text primary key,
  value text not null default ''
);

create table if not exists throttle (
  bucket text primary key,
  count integer not null default 0,
  expires_at timestamptz not null
);

create table if not exists text_hashes (
  hash text primary key,
  expires_at timestamptz not null
);

create table if not exists afterwords (
  editor text not null,
  issue text not null,
  body text not null,
  created_at timestamptz not null default now(),
  primary key (editor, issue)
);

create table if not exists errors (
  id serial primary key,
  editor text not null,
  message text not null,
  created_at timestamptz not null default now()
);
`;
