export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Railway puts serverless services to sleep if no outbound packets are detected for at least 5 minutes (sampling window: 5-10 minutes).
    // A 4.5-minute interval (270s) comfortably resets the idle timer before the 5-minute mark while minimizing ping overhead.
    const intervalMinutes = parseFloat(process.env.KEEP_ALIVE_INTERVAL_MINUTES || '4.5');
    const INTERVAL_MS = Math.max(1, intervalMinutes) * 60 * 1000;

    console.log(
      `[Keep-Alive] Anti-sleep heartbeat active (interval: ${intervalMinutes}m to align with Railway's 5m inactivity window).`,
    );

    // Initial ping 30s after server boot
    setTimeout(sendHeartbeat, 30 * 1000);

    const timer = setInterval(sendHeartbeat, INTERVAL_MS);
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  }
}

async function sendHeartbeat() {
  const domain =
    process.env.RAILWAY_PUBLIC_DOMAIN || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;

  const debug = process.env.DEBUG_KEEP_ALIVE === 'true';

  // 1. Outbound network packet: Railway tracks egress packets to detect activity
  try {
    await fetch('https://cloudflare.com/cdn-cgi/trace', {
      headers: { 'User-Agent': 'JourneyAI-KeepAlive/1.0' },
      cache: 'no-store',
    });
  } catch {
    // Silent failover
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
      if (debug) {
        console.log(`[Keep-Alive] Public heartbeat status: ${res.status}`);
      }
      return;
    } catch (err: unknown) {
      console.warn(
        '[Keep-Alive] Public heartbeat ping failed:',
        err instanceof Error ? err.message : err,
      );
    }
  }

  // 3. Local health endpoint fallback
  try {
    const port = process.env.PORT || 3000;
    await fetch(`http://127.0.0.1:${port}/api/health`, {
      cache: 'no-store',
    });
    if (debug) {
      console.log('[Keep-Alive] Internal heartbeat ping successful.');
    }
  } catch {
    // Silent fallback
  }
}
