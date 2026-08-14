-- MOU Module: template version 2 — the agreement date isn't known at proposal time (it's
-- only set once City Council approves), so it can no longer be filled in by the
-- organization. The Header & Preamble section's day/month/year fields are removed and the
-- locked text instead carries blank underscores for hand-writing in later, matching how
-- the signature block already renders its blank signature/date lines.
--
-- Per the module's versioning rule, this never mutates the published version 1 row —
-- it clones every other section unchanged into a new version 2 and flips is_current.

do $$
declare
  old_id uuid;
  new_id uuid;
  next_version int;
begin
  select id, version_number + 1 into old_id, next_version
  from public.mou_templates where is_current = true;

  -- Flip the old row to not-current first — a partial unique index enforces at most one
  -- is_current=true row, so the new row can't be inserted as current while the old one
  -- still is.
  update public.mou_templates set is_current = false where id = old_id;

  insert into public.mou_templates (version_number, is_current, created_by)
  values (next_version, true, 'system')
  returning id into new_id;

  insert into public.mou_template_sections (template_id, section_order, title, locked_text, field_definitions, allow_section_comment)
  select new_id, section_order, title, locked_text, field_definitions, allow_section_comment
  from public.mou_template_sections
  where template_id = old_id and section_order <> 0;

  insert into public.mou_template_sections (template_id, section_order, title, locked_text, field_definitions, allow_section_comment)
  values (
    new_id, 0, 'Header & Preamble',
    $s0$MEMORANDUM OF UNDERSTANDING (MOU) AGREEMENT

Agreement made this _____ day of _______________, 20____ by and between the City of Franklin, a municipal corporation of the State of New Hampshire, hereinafter called the "City", and {{org_legal_name}}, a {{entity_type}} organized under the laws of the State of New Hampshire, with its principal place of business at {{org_address}}, EIN {{org_ein}}, hereinafter referred to as the "Organization".

WHEREAS, the Organization desires to {{whereas_purpose}}; and

WHEREAS, the City has determined that this collaboration serves the public interest of the City of Franklin;

NOW, THEREFORE, the City and the Organization hereby mutually agree as follows:$s0$,
    '[
      {"key":"org_legal_name","label":"Organization Legal Name","type":"short_text","required":true},
      {"key":"entity_type","label":"Entity Type","type":"short_text","required":true,"guidance":"e.g. \"501(c)(3)\" or other entity type"},
      {"key":"org_address","label":"Organization Address","type":"long_text","required":true},
      {"key":"org_ein","label":"EIN","type":"short_text","required":true},
      {"key":"whereas_purpose","label":"Purpose of Collaboration","type":"long_text","required":true,"guidance":"Describe purpose — e.g. operate/maintain/provide (activity) on/using (City property or resource)"}
    ]'::jsonb,
    true
  );
end $$;
