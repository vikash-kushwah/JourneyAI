export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV === 'production') {
    const rawDomain =
      process.env.RAILWAY_PUBLIC_DOMAIN || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;

    if (rawDomain) {
      const baseUrl =
        rawDomain.startsWith('http://') || rawDomain.startsWith('https://')
          ? rawDomain
          : `https://${rawDomain}`;
      const healthUrl = `${baseUrl.replace(/\/$/, '')}/api/health`;
      const INTERVAL_MS = 4 * 60 * 1000; // 4 minutes

      console.log(`[Keep-Alive] Self-ping service started targeting ${healthUrl} every 4m`);

      // Avoid keeping the process open exclusively for the timer if next tries to shut down
      const timer = setInterval(async () => {
        try {
          const res = await fetch(healthUrl, {
            headers: { 'User-Agent': 'JourneyAI-KeepAlive/1.0' },
            cache: 'no-store',
          });
          if (res.ok) {
            console.log(`[Keep-Alive] Heartbeat successful (${res.status})`);
          } else {
            console.warn(`[Keep-Alive] Heartbeat returned ${res.status}`);
          }
        } catch (err: unknown) {
          console.error('[Keep-Alive] Heartbeat failed:', err instanceof Error ? err.message : err);
        }
      }, INTERVAL_MS);

      if (typeof timer.unref === 'function') {
        timer.unref();
      }
    } else {
      console.log(
        '[Keep-Alive] No public domain detected. Use an external uptime ping (e.g. UptimeRobot / cron-job.org) targeting /api/health.',
      );
    }
  }
}
