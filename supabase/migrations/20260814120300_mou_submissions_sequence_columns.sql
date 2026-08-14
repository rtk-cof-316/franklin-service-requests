-- Add dedicated sequence_number/year columns to mou_submissions, mirroring cases'
-- case_number generation pattern (SubmitForm.jsx) so submission_number generation can
-- sort/increment reliably instead of parsing the formatted string.

alter table public.mou_submissions add column sequence_number int;
alter table public.mou_submissions add column year int;
create index mou_submissions_year_sequence_idx on public.mou_submissions(year, sequence_number);
