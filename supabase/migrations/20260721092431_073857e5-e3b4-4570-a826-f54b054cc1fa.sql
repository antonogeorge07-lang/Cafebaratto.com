
SELECT cron.unschedule('daily-owner-digest');

SELECT cron.schedule(
  'daily-owner-digest',
  '0 4 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://cafebaratto-com.lovable.app/api/public/hooks/daily-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := '{}'::jsonb
  );
  $cron$
);
