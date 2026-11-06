-- Run this in the Supabase SQL Editor.
insert into storage.buckets (id, name, public) values ('retinal-images', 'retinal-images', false);

-- Users can only upload to folders for their own examinations
create policy "Users can upload retinal images"
  on storage.objects for insert
  with check (
    bucket_id = 'retinal-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] in (
      select id::text from examinations where created_by = auth.uid()
    )
  );

-- Users can only read images from their own examinations
create policy "Users can view retinal images"
  on storage.objects for select
  using (
    bucket_id = 'retinal-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] in (
      select id::text from examinations where created_by = auth.uid()
    )
  );
