# tap-pages

Client tap pages for the Jnuru Studio Tap Card Kit. Live at tap.jnuru.studio.

## How it works

Each client is a folder in `clients/`. Netlify runs `node build.js` on every push and turns each folder into:

- `/<slug>/` their page (one self-contained file, images baked in)
- `/<slug>/<slug>.vcf` their Save Contact file
- `/t/<slug>` the redirect link the NFC chip and QR code point to

**Cards are always programmed with `https://tap.jnuru.studio/t/<slug>`.** Never the page address, never the client's domain. That way you can change where a card goes without touching the card.

## Add a client

1. Copy `clients/_new` to `clients/<slug>` (lowercase, dashes: `smith-roofing`). The slug is permanent once cards ship.
2. Drop in `photo.jpg` (square, ~400px, under 150KB) and/or `logo.svg` (or .png).
3. Fill in `client.json`.
4. Run `node build.js` to check for warnings, open `public/<slug>/index.html` to look.
5. Commit and push. Live in about a minute.

Folders starting with `_` are skipped.

## client.json fields

| Field | What it does |
|---|---|
| `name` | Required. Big name on the page |
| `title`, `business` | Small caps line under the name |
| `pitch` | One line under that |
| `photo` | Round photo. Optional |
| `logo` | Sits above the photo. With no photo it shows bigger on its own. Neither = initials |
| `colors.background`, `colors.ink` | Page colors. Build warns if text is hard to read |
| `colors.accent` | Main button color. Defaults to ink. Button text color picks itself |
| `font` | Any Google Font name. Default Source Serif 4 |
| `primary.type` | `call`, `text`, `book`, `site`, or `email` |
| `primary.label`, `primary.note` | Button text and the small line under it |
| `primary.value` | Booking URL etc. For call/text/site/email it falls back to phone/website/email |
| `phone`, `email`, `website`, `address` | Go into the .vcf |
| `links` | List rows. `type` picks the icon: phone, text, email, web, map, book, reviews, instagram, tiktok, facebook, linkedin, youtube, x (anything else gets an arrow). Use `url` for web links, `value` for phone/text/email. `show` overrides the gray text on the right |
| `domain` | e.g. `card.smithroofing.com`. Blank = tap.jnuru.studio/slug |
| `tagline` | Small line at the bottom |
| `credit` | `false` hides "made by jnuru.studio" |
| `live` | `false` takes the page down (cards hit a "not pointing anywhere" page) |

## Client owns a domain

1. Client (or their web person) adds one DNS record: **CNAME**, name `card`, value `<this-site>.netlify.app`.
2. In Netlify: Domain management > Add a domain alias > `card.theirbusiness.com`. HTTPS turns on by itself.
3. Set `"domain"` in their client.json and push.

You never touch their WordPress, Wix, or logins. Their card link stays `tap.jnuru.studio/t/<slug>`, which now forwards to their domain.

## Don't

- Don't edit anything in `public/`. It's rebuilt every push.
- Don't rename a client folder after cards ship. It breaks their cards.
