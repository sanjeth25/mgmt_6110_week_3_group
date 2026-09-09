/**
 * Serverless function: /api/bus
 * Query parameters:
 *   - BusStopCode: 5-digit bus stop code (defaults to '04121')
 *
 * Calls LTA DataMall v3 BusArrival endpoint using process.env.LTA_ACCOUNT_KEY.
 * Returns simplified arrival waits in whole minutes for each service.
 */

function computeWaitMinutes(estimatedArrival, nowMs) {
  if (!estimatedArrival || typeof estimatedArrival !== 'string' || estimatedArrival.trim() === '') {
    return null;
  }
  const arrivalTime = new Date(estimatedArrival).getTime();
  if (isNaN(arrivalTime)) {
    return null;
  }
  const diffMs = arrivalTime - nowMs;
  const minutes = Math.floor(diffMs / 60000);
  return Math.max(0, minutes);
}

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
  }

  const accountKey = process.env.LTA_ACCOUNT_KEY;
  if (!accountKey) {
    return sendResponse(res, 500, {
      error: 'MISSING_KEY',
      message: 'LTA_ACCOUNT_KEY environment variable is not configured.'
    });
  }

  // Parse BusStopCode, defaulting to 04121
  let busStopCode = '04121';
  if (req.query && req.query.BusStopCode) {
    busStopCode = String(req.query.BusStopCode).trim();
  } else if (req.url) {
    try {
      const parsedUrl = new URL(req.url, `http://${req.headers?.host || 'localhost'}`);
      const param = parsedUrl.searchParams.get('BusStopCode');
      if (param && param.trim() !== '') {
        busStopCode = param.trim();
      }
    } catch {
      // ignore parse failure, stick to default
    }
  }

  const fetchTime = Date.now();
  const upstreamUrl = `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=${encodeURIComponent(busStopCode)}`;

  let upstreamRes;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    upstreamRes = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        accept: 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
  } catch (err) {
    return sendResponse(res, 502, {
      error: 'LTA_UNREACHABLE',
      message: 'Failed to connect to LTA DataMall service.'
    });
  }

  if (!upstreamRes.ok) {
    return sendResponse(res, upstreamRes.status, {
      error: 'LTA_NON_200',
      status: upstreamRes.status,
      message: `Upstream LTA service returned status ${upstreamRes.status}`
    });
  }

  let rawData;
  try {
    rawData = await upstreamRes.json();
  } catch (err) {
    return sendResponse(res, 502, {
      error: 'INVALID_JSON',
      message: 'Upstream LTA service returned an invalid JSON response.'
    });
  }

  // Handle empty Services array as "no buses running", not an error
  const rawServices = Array.isArray(rawData?.Services) ? rawData.Services : [];

  const services = rawServices.map((service) => {
    const nextBus = computeWaitMinutes(service?.NextBus?.EstimatedArrival, fetchTime);
    const nextBus2 = computeWaitMinutes(service?.NextBus2?.EstimatedArrival, fetchTime);

    return {
      serviceNo: service.ServiceNo || '',
      ServiceNo: service.ServiceNo || '',
      nextBus,
      nextBus2,
      waits: [nextBus, nextBus2]
    };
  });

  if (typeof res.setHeader === 'function') {
    res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=40');
  }

  return sendResponse(res, 200, {
    busStopCode,
    fetchedAt: new Date(fetchTime).toISOString(),
    timestamp: fetchTime,
    services
  });
}
