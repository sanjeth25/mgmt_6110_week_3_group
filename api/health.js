/**
 * Serverless function: /api/health
 *
 * Reports:
 *   - keyPresent: boolean only (whether LTA_ACCOUNT_KEY exists in process.env)
 *   - ltaAnswered: boolean (whether LTA responded)
 *   - upstreamStatus: number | null (upstream HTTP status code)
 *   - latencyMs: number | null (round-trip latency in milliseconds)
 *
 * Never prints or leaks the key, prefix, length, or any portion of it.
 */

function sendResponse(res, statusCode, data) {
  if (typeof res.status === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  }

  const keyPresent = Boolean(process.env.LTA_ACCOUNT_KEY);

  if (!keyPresent) {
    return sendResponse(res, 200, {
      keyPresent: false,
      ltaAnswered: false,
      upstreamStatus: null,
      latencyMs: null,
      message: 'LTA_ACCOUNT_KEY is not configured.'
    });
  }

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const upstreamRes = await fetch(
      'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=04121',
      {
        method: 'GET',
        headers: {
          AccountKey: process.env.LTA_ACCOUNT_KEY,
          accept: 'application/json'
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    return sendResponse(res, 200, {
      keyPresent: true,
      ltaAnswered: true,
      upstreamStatus: upstreamRes.status,
      latencyMs,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    return sendResponse(res, 200, {
      keyPresent: true,
      ltaAnswered: false,
      upstreamStatus: null,
      latencyMs,
      error: 'Upstream LTA service is unreachable'
    });
  }
}
