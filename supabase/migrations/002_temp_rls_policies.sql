-- Run this in the Supabase SQL Editor.
-- Temporary policies (will be tightened in M9)
create policy "Users can manage their own patients" on patients for all using (created_by = auth.uid());
create policy "Users can manage their own examinations" on examinations for all using (created_by = auth.uid());
create policy "Users can view their exam images" on retinal_images for all using (examination_id in (select id from examinations where created_by = auth.uid()));
create policy "Users can view their exam results" on screening_results for all using (examination_id in (select id from examinations where created_by = auth.uid()));
