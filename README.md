# Camera Keys

A one-page site for the Camera Keys shop: 3D-printed camera-settings keychains sold on Etsy, with Stripe Payment Links for checkout.

Live site (custom domain pending DNS): [camerakeys.com](https://camerakeys.com/). Source is the public GitHub repo [crtivela-ops/camerakeys](https://github.com/crtivela-ops/camerakeys), served from GitHub Pages. The working copy on this machine is still in `camkeyguides/`.

## File structure

```
camkeyguides/
  index.html                  One-page site
  README.md                   This file
  CNAME                       camerakeys.com
  .nojekyll                   Tell GitHub Pages not to run Jekyll
  css/
    styles.css                All styles; no frameworks
  assets/
    favicon.svg               Simple “C” mark (placeholder logo)
    og-image.png              1200×630 Open Graph image (placeholder)
    products/
      f-stop.jpg              4:5 3D-render placeholder
      depth-of-field.jpg
      low-light.jpg
      sunny-16.jpg
      brighter-vs-darker.jpg
      action.jpg
  screenshots/                Local only; not in the repo
    desktop.png
    mobile.png
    launch-desktop.png
    launch-mobile.png
    compare.png
    crtive-reference-1440.png
    crtive-reference-390.png
```

There are no scripts, no analytics, and no ads.

## Design (styled after crtive.la)

The look follows Oliver's site [crtive.la](https://crtive.la); only styling was borrowed, no content, logos, or images.

- **Font:** `Arial, "Liberation Sans", Helvetica, sans-serif`. crtive.la uses `Arial, sans-serif` and loads no web fonts, so nothing is downloaded or bundled. Liberation Sans is the free, metric-compatible fallback for systems without Arial.
- **Weights:** 400 body, 700 headings, nav, labels, and buttons.
- **Type:** H1 2.75rem bold uppercase, centered; tagline 1rem uppercase; nav 1.2rem bold uppercase; H2 1.5rem bold uppercase, centered; body text 1.1rem, centered, max 800px.
- **Colors:** background `#111111`, text `#ffffff`, muted text `#bdbdbd`, card surface `#1c1c1c`, accent `#0073e6` (hover `#005bb5`).
- **Buttons:** crtive.la's “ticket link” style — solid `#0073e6`, white bold uppercase text, `12px 25px` padding, 8px radius, slight scale on hover (off under reduced-motion). Buy buttons link to live Stripe Payment Links.
- **Borders/rules:** none, as on crtive.la; cards use an 8px radius and the 6px color bar.

## Copy on the page

- **Tagline:** “Learn manual exposure from a card on your keychain.”
- **Lede:** “3D-printed flashcards for aperture, shutter speed, ISO, and the exposure triangle — made for photo students and hobbyists.”
- **About:** Created by a photography teacher in downtown Los Angeles who teaches inner-city youth. The keychains are made to teach manual exposure and creative photo techniques. The teacher and school are not named. There is no address, phone number, or other personal contact information anywhere on the site.
- **Product lines:**
  - **F-STOP** — A scale of apertures from wide open to stopped down, showing how f-stop changes both brightness and background blur.
  - **Depth of Field** — How aperture shapes focus: a wide opening such as f/2.8 gives a shallow field with more blur; a smaller opening such as f/16 keeps more of the scene sharp.
  - **Low Light** — Three ways to gather more light in dim conditions: a wide aperture, a slower shutter, or a higher ISO — and the trade-offs of blur and noise.
  - **Sunny 16** — The sunny-16 rule: in bright sun, set the aperture to f/16 and the shutter to 1/ISO, then open up as the light falls, toward overcast.
  - **Brighter vs Darker** — The exposure triangle on one card: matching scales of aperture, ISO, and shutter speed, from brighter settings to darker ones.
  - **Action** — Shutter speed and motion: slower speeds such as 1/2 second smear movement; faster speeds such as 1/500 freeze it sharp.

Launch lineup is three cards (Depth of Field, Sunny 16, Action) at $20 each, plus a $45 full set. The footer Etsy link is `#etsy-link-placeholder`. Every placeholder is marked with a `<!-- TODO -->` comment in `index.html`.

## Color coding

Each card has a color so buyers can identify the kind of setting at a glance. Color is never used alone: every card has a text label (for example “Red · Exposure”), and a one-line legend sits above the grid. The hues are common PLA-like values.

| Color  | Hex     | Meaning  | Cards                      |
| ------ | ------- | -------- | -------------------------- |
| Red    | `#D7263D` | Exposure | F-STOP, Brighter vs Darker |
| Blue   | `#1F6FEB` | Focus    | Depth of Field             |
| Green  | `#2E9E5B` | Light    | Low Light, Sunny 16        |
| Orange | `#F28C28` | Action   | Action                     |

On the page this is a thin bar along the top of the product image, a small swatch, and the text label. The bar and label live in the HTML and CSS, not in the JPEG, so they stay in place when a real photo is dropped into `assets/products/<slug>.jpg`.

## Product photos

The files in `assets/products/` are 4:5 (1600×2000) JPEGs on a `#1c1c1c` ground, made from the existing 3D preview renders in the Google Drive folder “3d photo tags” (`*_preview_3d.png`). They are placeholders, not photographs of printed cards. To use a real photo, overwrite the matching file. Keep the 4:5 aspect ratio (for example 1600×2000) and the same filename:

- `assets/products/f-stop.jpg`
- `assets/products/depth-of-field.jpg`
- `assets/products/low-light.jpg`
- `assets/products/sunny-16.jpg`
- `assets/products/brighter-vs-darker.jpg`
- `assets/products/action.jpg`

No HTML change is needed.

## Stripe Payment Links

Checkout is Stripe Payment Links. The site is static, so this needs no server, no Stripe.js, and no API keys. The Payment Link URL is safe to publish; secret keys must not be added to this folder.

All six product URLs, plus an optional “Buy a set” URL, are listed in one config comment at the top of `index.html`. Until those IDs are pasted in, each Buy button is a muted “Coming soon” control that points at `#pricing`, so visitors are not sent to a broken `buy.stripe.com` URL. Each token such as `REPLACE_WITH_FSTOP_LINK` is still in the config comment (and in the button TODO) so one find-and-replace can restore the real link and the “Buy” label later.

### How to add the real links

1. Sign in to the [Stripe Dashboard](https://dashboard.stripe.com) and open **Payment links** (or go to [dashboard.stripe.com/payment-links](https://dashboard.stripe.com/payment-links)).
2. Click **New** (or **Create payment link**).
3. Add a product. Name it to match the card (for example, F-STOP), set the price you want to charge, and optionally upload a photo.
4. Turn on **Collect customers’ shipping addresses** (under the payment link’s customer or shipping options). You can also add shipping rates there. This matters because the keychains are physical goods.
5. Create the link. Stripe gives you a public URL of the form `https://buy.stripe.com/……`.
6. In `index.html`, find the token for that card (for example `REPLACE_WITH_FSTOP_LINK`) and replace it with the ID from the end of the Stripe URL. Change that card’s button from `class="buy coming-soon"` / `href="#pricing"` / “Coming soon” back to `class="buy"` / the Payment Link URL / “Buy”.
7. Repeat for each of the six cards.
8. Optionally create a seventh Payment Link for a full set of six cards and replace `REPLACE_WITH_SET_LINK`. The set button is in the Pricing section.
9. Use a test-mode link while you try the checkout yourself. Switch to a live-mode link before the shop goes public.

Tokens to replace:

- `REPLACE_WITH_FSTOP_LINK`
- `REPLACE_WITH_DEPTH_OF_FIELD_LINK`
- `REPLACE_WITH_LOW_LIGHT_LINK`
- `REPLACE_WITH_SUNNY_16_LINK`
- `REPLACE_WITH_BRIGHTER_VS_DARKER_LINK`
- `REPLACE_WITH_ACTION_LINK`
- `REPLACE_WITH_SET_LINK` (optional full set)

## Open items

1. **Real product photos** — the current images are 3D-render placeholders. Drop 4:5 JPEGs into `assets/products/<slug>.jpg` when photographs are ready.
2. **Prices** — replace every `$XX` and the “Price coming soon” / placeholder copy in the Pricing section.
3. **Stripe Payment Links** — create them in the Stripe Dashboard and paste the IDs as described above. Include a set link if you want one, and set a real set price there (not on this page until it is decided).
4. **Etsy shop URL** — replace `href="#etsy-link-placeholder"` in the footer.
5. **Logo** — the favicon is a simple “C” mark. A real logo can replace `assets/favicon.svg` (and be used in the header if wanted).
6. **Open Graph image** — `assets/og-image.png` is a text placeholder. Replace it with a real photo once one exists.
7. **DNS** — `camerakeys.com` is registered. Apex A/AAAA records and the www CNAME to GitHub Pages are being pointed separately; this repo does not manage DNS. HTTPS will start working after those records propagate and GitHub issues the certificate.

## Preview locally

From this folder:

```bash
python3 -m http.server 8080
```

Then open [http://127.0.0.1:8080/](http://127.0.0.1:8080/).
