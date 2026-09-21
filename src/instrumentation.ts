export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const INTERVAL_MS = 2 * 60 * 1000; // Every 2 minutes (Railway sleeps after 5-10m of inactivity)

    console.log(
      '[Keep-Alive] Internal anti-sleep heartbeat initialized (running every 2 minutes).',
    );

    // Run first ping shortly after boot
    setTimeout(sendHeartbeat, 10 * 1000);

    const timer = setInterval(sendHeartbeat, INTERVAL_MS);
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  }
}

async function sendHeartbeat() {
  const domain =
    process.env.RAILWAY_PUBLIC_DOMAIN || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;

  // 1. Outbound network call: Railway detects inactivity solely based on absence of outbound packets.
  // Sending outbound network requests every 2 minutes ensures Railway's kernel egress counter never idles.
  try {
    await fetch('https://cloudflare.com/cdn-cgi/trace', {
      headers: { 'User-Agent': 'JourneyAI-KeepAlive/1.0' },
      cache: 'no-store',
    });
  } catch {
    // Ignore fallback
  }

  // 2. Ping public domain if available (generates both ingress & egress)
  if (domain) {
    try {
      const baseUrl =
        domain.startsWith('http://') || domain.startsWith('https://')
          ? domain
          : `https://${domain}`;
      const healthUrl = `${baseUrl.replace(/\/$/, '')}/api/health`;
      const res = await fetch(healthUrl, {
        headers: { 'User-Agent': 'JourneyAI-KeepAlive/1.0' },
        cache: 'no-store',
      });
      console.log(`[Keep-Alive] Heartbeat ping to public domain (${res.status})`);
      return;
    } catch (err: unknown) {
      console.warn(
        '[Keep-Alive] Public heartbeat failed:',
        err instanceof Error ? err.message : err,
      );
    }
  }

  // 3. Local health endpoint ping
  try {
    const port = process.env.PORT || 3000;
    await fetch(`http://127.0.0.1:${port}/api/health`, {
      cache: 'no-store',
    });
    console.log('[Keep-Alive] Internal heartbeat ping successful.');
  } catch {
    // Ignore fallback
  }
}
