-- Enable pg_cron extension if it's not already enabled
create extension if not exists pg_cron;

-- Create the function to delete old media
create or replace function delete_old_feedback_media()
returns void
language plpgsql
security definer
set search_path = public, storage, extensions
as $$
declare
  deleted_count integer;
begin
  -- Delete files from the feedback-media bucket older than 45 days
  delete from storage.objects
  where bucket_id = 'feedback-media'
  and created_at < now() - interval '45 days';
  
  get diagnostics deleted_count = row_count;
  
  -- Log the result (optional, requires a logging table, skipping for now)
  -- raise notice 'Deleted % old media files', deleted_count;
end;
$$;

-- Schedule the cron job to run every day at 3:00 AM
-- We use a unique job name to avoid duplicates if migration is re-run
select cron.schedule(
  'cleanup-old-feedback-media', -- Job name
  '0 3 * * *',                  -- Schedule: 3:00 AM daily
  $$select delete_old_feedback_media()$$
);
