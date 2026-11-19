# Camera Keys checkout Worker

This little Cloudflare Worker is what lets the shopping cart on camerakeys.com take more than one item in a single Stripe checkout. The site itself stays on GitHub Pages. The Worker only creates the checkout, then Stripe takes over.

You do not need to install anything on your computer. A free Cloudflare account is enough (the one at crtivela@gmail.com is already set up). You will paste your Stripe secret key into Cloudflare yourself. Never email a key, never put one in the website files, and never send one in a chat.

Use the **test** Stripe key first (`sk_test_...`). Switch to the live key only after a test purchase works.

## 1. Create the Worker

1. Sign in to [Cloudflare](https://dash.cloudflare.com) with crtivela@gmail.com.
2. In the left sidebar, open **Workers & Pages**. (If you see **Compute**, open that, then **Workers & Pages** or **Workers**.)
3. Click **Create**, then **Create Worker**.
4. Name it `camerakeys-checkout` (or any name you like).
5. Click **Deploy**. This just publishes a starter “Hello World” page so you can edit it.

## 2. Paste the code and deploy

1. On the Worker’s page, click **Edit code**.
2. Select all of the starter code and delete it.
3. Open `worker/src/index.js` in this repo, copy the entire file, and paste it into the editor.
4. Click **Deploy** or **Save and deploy**. Confirm if it asks.

The Worker is now live, but checkout will not work until you add the Stripe key in the next step.

## 3. Add your Stripe secret key (test key first)

Do this yourself in the Cloudflare dashboard. Do not send the key to anyone.

1. In the [Stripe Dashboard](https://dashboard.stripe.com), turn **Test mode** on (the switch is in the upper right).
2. Open [API keys](https://dashboard.stripe.com/test/apikeys) and copy the **Secret key**. It starts with `sk_test_`.
3. Back in Cloudflare, open your Worker, then **Settings**.
4. Under **Variables and Secrets**, click **Add**.
5. Set the type to **Secret**, the name to exactly `STRIPE_SECRET_KEY`, and the value to the `sk_test_...` key you copied.
6. Click **Deploy** (or Save) so the secret is actually stored.

## 4. Use the free workers.dev URL

After deploy, Cloudflare shows a URL that looks like:

`https://camerakeys-checkout.YOUR-SUBDOMAIN.workers.dev`

**Use that free `*.workers.dev` URL.** That is the address the shopping cart will call.

Do **not** route `camerakeys.com` itself to the Worker. If you add camerakeys.com as a custom domain on the Worker, it will replace the GitHub Pages shop with the Worker, and the site will go down.

A custom subdomain such as `api.camerakeys.com` would also work later, but it means moving the domain’s DNS to Cloudflare. That is optional and not recommended now.

Copy the `workers.dev` URL and send it back so `WORKER_URL` can be set on the site. Until that is set, camerakeys.com keeps the existing per-item Stripe Payment Link buttons and the cart stays hidden. Even after it is set, the cart starts in test mode: shoppers still see the Payment Link buttons, and only someone who opens [camerakeys.com/?cart=test](https://camerakeys.com/?cart=test) sees the cart.

## 5. Test in Stripe test mode, then switch to the live key

Once the site has been updated with your Worker URL:

1. Open [camerakeys.com/?cart=test](https://camerakeys.com/?cart=test), add one or more cards to the cart, and click **Checkout**. (Open [camerakeys.com/?cart=off](https://camerakeys.com/?cart=off) to hide the cart again in that tab.)
2. You should land on a Stripe checkout page that says **Test mode**.
3. Use the test card number `4242 4242 4242 4242`, any future expiry date, any three-digit CVC, and a US ZIP code. You will not be charged.
4. Complete checkout. You should return to [camerakeys.com/thanks.html](https://camerakeys.com/thanks.html). In the Stripe Dashboard (Test mode still on), the payment should show as paid.
5. When that looks right, switch the Worker to your live key:
   - In Stripe, turn **Test mode** off and copy the **Secret key** from [API keys](https://dashboard.stripe.com/apikeys). It starts with `sk_live_`.
   - In Cloudflare, open the Worker → **Settings** → **Variables and Secrets**, edit `STRIPE_SECRET_KEY`, paste the `sk_live_...` key, and deploy.
6. Ask for the cart to be switched to live (`CART_LIVE = true` in `js/cart.js`). Only then do shoppers see the cart, and the Payment Link buttons are hidden, so the cart becomes the way to buy. Try a real checkout only when you are ready to take a real payment.

If checkout shows an error, double-check that the secret is named exactly `STRIPE_SECRET_KEY`, that you deployed after adding it, and that you sent the `workers.dev` URL (not `camerakeys.com`) to be set on the site.

## Wrangler CLI alternative

If you would rather deploy from a terminal instead of the dashboard:

```bash
cd worker
npx wrangler login
npx wrangler deploy
npx wrangler secret put STRIPE_SECRET_KEY
```

When prompted, paste the `sk_test_...` key first. Wrangler will print the `workers.dev` URL. Send that URL back so `WORKER_URL` can be set on the site. To run the Worker on your computer later: `npx wrangler dev`.

Optional Price IDs (`STRIPE_PRICE_SUNNY16`, `STRIPE_PRICE_DOF`, `STRIPE_PRICE_ACTION`, `STRIPE_PRICE_SET`) can be added as plain Variables if you create Prices in Stripe and want Checkout to use those IDs instead of the built-in $20 and $45 amounts. They are not required.

Never put a Stripe key in this repo, in `wrangler.toml`, or in the website files.
