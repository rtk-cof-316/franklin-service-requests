-- Public Comment Module: enums, tables, indexes

create type public.topic_status as enum ('active', 'closed');
create type public.comment_status as enum ('pending', 'approved', 'rejected');
create type public.ward_enum as enum ('Ward 1', 'Ward 2', 'Ward 3');

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  reference_url text,
  hearing_date date,
  hearing_time time,
  hearing_location text,
  comment_opens_at timestamptz not null,
  comment_closes_at timestamptz not null,
  status public.topic_status not null default 'active',
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table public.topic_positions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  label text not null,
  sort_order int not null default 0
);
create index topic_positions_topic_id_idx on public.topic_positions(topic_id, sort_order);

create table public.concern_themes (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  group_label text not null,
  sort_order int not null default 0
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  position_id uuid not null references public.topic_positions(id) on delete restrict,
  name text not null,
  ward public.ward_enum not null,
  comment_text text not null check (char_length(comment_text) between 1 and 2000),
  has_concern boolean not null default false,
  status public.comment_status not null default 'pending',
  created_at timestamptz not null default now()
);
create index comments_topic_id_status_idx on public.comments(topic_id, status);
create index comments_position_id_idx on public.comments(position_id);

create table public.comment_questions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  question_text text not null check (char_length(question_text) between 1 and 150),
  sort_order int not null default 0
);
create index comment_questions_comment_id_idx on public.comment_questions(comment_id);

-- Hard cap of 15 questions per comment, enforced server-side (not just in the UI),
-- since inserts come from an unauthenticated client and the REST API is directly reachable.
create or replace function public.enforce_max_comment_questions()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.comment_questions where comment_id = new.comment_id) >= 15 then
    raise exception 'Maximum of 15 questions per comment exceeded';
  end if;
  return new;
end;
$$;

create trigger comment_questions_max_15
  before insert on public.comment_questions
  for each row execute function public.enforce_max_comment_questions();

create table public.comment_concern_themes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  theme_id uuid not null references public.concern_themes(id) on delete restrict
);
create index comment_concern_themes_comment_id_idx on public.comment_concern_themes(comment_id);
create index comment_concern_themes_theme_id_idx on public.comment_concern_themes(theme_id);
