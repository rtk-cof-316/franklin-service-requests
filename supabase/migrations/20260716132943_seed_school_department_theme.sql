-- Public Comment Module: add "School Department" to the fixed concern_themes list
-- (Budget by department group) — omitted from the original spec's seed list.

insert into public.concern_themes (id, label, group_label, sort_order) values
  ('11111111-0000-0000-0000-00000000000b','School Department','Budget by department',11)
on conflict (id) do nothing;
