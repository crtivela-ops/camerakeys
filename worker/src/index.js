/**
 * Camera Keys checkout Worker.
 * Creates a Stripe Checkout Session from a cart of known item ids.
 * Prices always come from this file (or optional STRIPE_PRICE_* env vars),
 * never from the browser.
 *
 * Secret: STRIPE_SECRET_KEY (wrangler secret put, or Variables and Secrets
 * in the Cloudflare dashboard). Never commit a key.
 */

const CATALOG = {
  sunny16: { name: 'Sunny 16', unit_amount: 2000, priceEnv: 'STRIPE_PRICE_SUNNY16' },
  dof: { name: 'Depth of Field', unit_amount: 2000, priceEnv: 'STRIPE_PRICE_DOF' },
  action: { name: 'Action', unit_amount: 2000, priceEnv: 'STRIPE_PRICE_ACTION' },
  set: { name: 'Full set', unit_amount: 4500, priceEnv: 'STRIPE_PRICE_SET' },
};

const MAX_QTY = 10;
const SITE_ORIGIN = 'https://camerakeys.com';
const SUCCESS_URL = SITE_ORIGIN + '/thanks.html?session_id={CHECKOUT_SESSION_ID}';
const CANCEL_URL = SITE_ORIGIN + '/#cards';
const STRIPE_URL = 'https://api.stripe.com/v1/checkout/sessions';

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (origin === SITE_ORIGIN || origin === 'https://www.camerakeys.com') return true;
  return /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);
}

function corsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function json(status, body, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(origin),
    },
  });
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function parseItems(body) {
  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    throw new HttpError(400, 'Cart is empty.');
  }
  const merged = new Map();
  for (const item of body.items) {
    if (!item || typeof item !== 'object') {
      throw new HttpError(400, 'Each item needs an id and a quantity.');
    }
    const id = item.id;
    if (typeof id !== 'string' || !CATALOG[id]) {
      throw new HttpError(400, 'Unknown item.');
    }
    const qty = item.qty;
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
      throw new HttpError(400, 'Quantity must be a whole number from 1 to 10.');
    }
    const next = (merged.get(id) || 0) + qty;
    if (next > MAX_QTY) {
      throw new HttpError(400, 'Quantity must be a whole number from 1 to 10.');
    }
    merged.set(id, next);
  }
  return [...merged.entries()].map(([id, qty]) => ({ id, qty }));
}

function appendForm(params, key, value) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((item, i) => appendForm(params, `${key}[${i}]`, item));
    return;
  }
  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      appendForm(params, `${key}[${k}]`, v);
    }
    return;
  }
  params.append(key, String(value));
}

function toForm(obj) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(obj)) {
    appendForm(params, key, value);
  }
  return params;
}

function lineItemsFor(items, env) {
  return items.map(({ id, qty }) => {
    const product = CATALOG[id];
    const priceId = env && typeof env[product.priceEnv] === 'string' ? env[product.priceEnv].trim() : '';
    if (priceId) {
      return { price: priceId, quantity: qty };
    }
    return {
      quantity: qty,
      price_data: {
        currency: 'usd',
        unit_amount: product.unit_amount,
        product_data: { name: product.name },
      },
    };
  });
}

async function createSession(items, env) {
  const secret = env && typeof env.STRIPE_SECRET_KEY === 'string' ? env.STRIPE_SECRET_KEY.trim() : '';
  if (!secret) {
    throw new HttpError(500, 'Checkout is not configured yet.');
  }

  const form = toForm({
    mode: 'payment',
    success_url: SUCCESS_URL,
    cancel_url: CANCEL_URL,
    shipping_address_collection: { allowed_countries: ['US'] },
    line_items: lineItemsFor(items, env),
  });

  const response = await fetch(STRIPE_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + secret,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new HttpError(502, 'Checkout is temporarily unavailable. Please try again.');
  }

  if (!response.ok || !data || !data.url) {
    throw new HttpError(502, 'Checkout is temporarily unavailable. Please try again.');
  }

  return data.url;
}

async function handlePost(request, env, origin) {
  const raw = await request.text();
  if (raw.length > 8000) {
    throw new HttpError(400, "Couldn't read the cart.");
  }
  let body;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    throw new HttpError(400, "Couldn't read the cart.");
  }
  const items = parseItems(body);
  const url = await createSession(items, env);
  return json(200, { url }, origin);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      if (!isAllowedOrigin(origin)) {
        return new Response(null, { status: 403, headers: corsHeaders(origin) });
      }
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return json(405, { error: 'Method not allowed.' }, origin);
    }

    if (origin && !isAllowedOrigin(origin)) {
      return json(403, { error: 'Forbidden.' }, origin);
    }

    try {
      return await handlePost(request, env, origin);
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      const message =
        err instanceof HttpError ? err.message : 'Checkout is temporarily unavailable. Please try again.';
      return json(status, { error: message }, origin);
    }
  },
};

export const __test = {
  CATALOG,
  isAllowedOrigin,
  parseItems,
  toForm,
  lineItemsFor,
  HttpError,
};
