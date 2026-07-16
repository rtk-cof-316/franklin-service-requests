-- Public Comment Module: seed data (concern themes + launch topics)

-- Concern themes (fixed list, spec section 1)
insert into public.concern_themes (id, label, group_label, sort_order) values
  ('11111111-0000-0000-0000-000000000001','Municipal Services Department','Budget by department',1),
  ('11111111-0000-0000-0000-000000000002','City Clerk''s Office','Budget by department',2),
  ('11111111-0000-0000-0000-000000000003','City Manager''s Office','Budget by department',3),
  ('11111111-0000-0000-0000-000000000004','Finance Department','Budget by department',4),
  ('11111111-0000-0000-0000-000000000005','Planning/Zoning/Assessing Department','Budget by department',5),
  ('11111111-0000-0000-0000-000000000006','Police Department','Budget by department',6),
  ('11111111-0000-0000-0000-000000000007','Fire Department','Budget by department',7),
  ('11111111-0000-0000-0000-000000000008','Welfare Department','Budget by department',8),
  ('11111111-0000-0000-0000-000000000009','Library','Budget by department',9),
  ('11111111-0000-0000-0000-00000000000a','Parks & Recreation Department','Budget by department',10),
  ('22222222-0000-0000-0000-000000000001','Tax Cap','General concerns',1),
  ('22222222-0000-0000-0000-000000000002','Traffic / Parking / Safety','General concerns',2),
  ('22222222-0000-0000-0000-000000000003','Environmental Impact','General concerns',3),
  ('22222222-0000-0000-0000-000000000004','Property Values / Zoning','General concerns',4),
  ('22222222-0000-0000-0000-000000000005','Infrastructure / Utilities','General concerns',5),
  ('22222222-0000-0000-0000-000000000006','Public Safety / Emergency Services','General concerns',6),
  ('22222222-0000-0000-0000-000000000007','Personnel / Staffing','General concerns',7),
  ('22222222-0000-0000-0000-000000000008','Process / Transparency','General concerns',8),
  ('22222222-0000-0000-0000-000000000009','Quality of Life / Aesthetics','General concerns',9),
  ('22222222-0000-0000-0000-00000000000a','Communication / Notification','General concerns',10),
  ('22222222-0000-0000-0000-00000000000b','Other','General concerns',11)
on conflict (id) do nothing;

-- Topic 1: Trestle Bridge Project
-- Comment window: opens now, closes when the hearing starts (2026-07-27 18:00 America/New_York).
insert into public.topics (id, title, description, reference_url, hearing_date, hearing_time, hearing_location, comment_opens_at, comment_closes_at, status) values
  ('33333333-0000-0000-0000-000000000001',
   'Trestle Bridge Project',
   'Council is reviewing rehabilitation/replacement alternatives for the trestle bridge.',
   'https://www.franklinnh.gov/sites/g/files/vyhlif601/f/uploads/2026-07-27_packet_combined.pdf',
   '2026-07-27', '18:00', 'Franklin Public Library, 310 Central St.',
   now(), '2026-07-27 18:00:00-04',
   'active')
on conflict (id) do nothing;

insert into public.topic_positions (id, topic_id, label, sort_order) values
  ('33333333-0000-0000-0000-000000000011','33333333-0000-0000-0000-000000000001','ALT 1 — Rehabilitate Trestle',1),
  ('33333333-0000-0000-0000-000000000012','33333333-0000-0000-0000-000000000001','ALT 2 — Glulam Timber Trestle',2),
  ('33333333-0000-0000-0000-000000000013','33333333-0000-0000-0000-000000000001','ALT 3 — Steel Truss/Trestle Hybrid',3),
  ('33333333-0000-0000-0000-000000000014','33333333-0000-0000-0000-000000000001','ALT 4 — Demo Trestle',4)
on conflict (id) do nothing;

-- Topic 2: FY27 Budget
-- Comment window: opens now, closes when the hearing starts (2026-07-29 18:00 America/New_York).
insert into public.topics (id, title, description, reference_url, hearing_date, hearing_time, hearing_location, comment_opens_at, comment_closes_at, status) values
  ('44444444-0000-0000-0000-000000000001',
   'FY27 Budget',
   'Council is reviewing the proposed FY27 municipal budget.',
   'https://www.franklinnh.gov/finance-department/pages/city-budgets',
   '2026-07-29', '18:00', 'Elks Lodge, 125 S. Main St.',
   now(), '2026-07-29 18:00:00-04',
   'active')
on conflict (id) do nothing;

insert into public.topic_positions (id, topic_id, label, sort_order) values
  ('44444444-0000-0000-0000-000000000011','44444444-0000-0000-0000-000000000001','Support as proposed',1),
  ('44444444-0000-0000-0000-000000000012','44444444-0000-0000-0000-000000000001','Support with changes',2),
  ('44444444-0000-0000-0000-000000000013','44444444-0000-0000-0000-000000000001','Oppose',3)
on conflict (id) do nothing;
