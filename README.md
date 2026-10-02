# Gargi College Voicebox

Anonymous complaint & suggestion box for the **Gargi College Students' Union**.
A static frontend lives in `public/`, three serverless API routes live in `api/`,
shared helpers live in `lib/`, and all data is stored in Upstash Redis.

- Students submit anonymously, optionally attach a compressed photo and a
  video link, and receive a tracking code (e.g. `GAR-7F3K2Q`).
- The Union desk (password-protected) reviews submissions, changes status,
  replies, and deletes.
- Every Redis key is namespaced under `REDIS_NAMESPACE` (default
  `du:gargi:voicebox`), so the same Upstash instance can be shared safely
  with the Aditi Mahavidyalaya deployment (`du:amv:voicebox`).

---

## Deploy in five steps

1. **Push to GitHub**

   ```bash
   git init
   git add .
   git commit -m "gargi-voicebox"
   git branch -M main
   git remote add origin https://github.com/anubhavbajpaibusiness/gargi-opress.git
   git push -u origin main
   ```

2. **Import into Vercel**
   `vercel.com → Add New Project → Import Git Repository`. Framework preset:
   **Other**. Leave build/output settings empty.

3. **Attach Upstash Redis**
   Project → **Storage → Marketplace → Upstash Redis → Create Database**
   (free tier) → **Connect Project**. Vercel automatically injects
   `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

4. **Set the admin password**
   Project → **Settings → Environment Variables** → add
   `ADMIN_PASSWORD = <your chosen password>`.
   Optionally also set `REDIS_NAMESPACE = du:gargi:voicebox`
   (only if you want to override the code default — the default is already
   correct).

5. **Redeploy**
   Deployments → **Redeploy** so the serverless functions pick up the new
   env vars.

Then visit the site, submit a test complaint, copy the tracking code, look it
up in the **Track** tab, unlock the **Union desk** with `ADMIN_PASSWORD`, and
try changing status, adding a reply, and deleting.

---

## Sharing the database

This app is designed to point at the **same Upstash Redis instance** as
**Aditi Mahavidyalaya Voicebox** without any chance of key collisions.

- Every key is built by `lib/keys.js` from a single namespace string.
- Default namespace: `du:gargi:voicebox`.
- Aditi's namespace: `du:amv:voicebox`.
- Prefixes never overlap, so the two deployments can share a database.

You can override the namespace per-deployment with the `REDIS_NAMESPACE`
env var (useful if you spin up a staging copy).

To verify: open the Upstash Data Browser and confirm every key starts with
`du:gargi:voicebox:`. If you see unprefixed keys, you deployed an older build
— redeploy.

---

## Where to drop files

```
public/
├── banners.json                 ← banner ads (see below)
└── images/
    ├── opress-logo.png          ← the Opress logo, referenced by index.html
    ├── president.jpg            ← team photos (optional)
    ├── vice-president.jpg
    └── ...
```

- **Opress logo** → `public/images/opress-logo.png`. If missing, the UI falls
  back to a mustard "O" square automatically.
- **Team photos** → `public/images/`. Then set the `photo` field on the
  matching member in `TEAM` inside `public/index.html` to
  `"/images/filename.jpg"`. Leave `photo: null` and the person's initials
  render over a cream tile instead.
- **Banner images** → `public/images/` (or anywhere under `public/`).

---

## Editing `TEAM` and `HELPLINES`

Both are plain JS arrays inside the `<script>` tag of `public/index.html`.

```js
const TEAM = [
  { name: "Abhisvara Sharma", role: "President",              party: null, photo: null },
  { name: "Deshna Jain",      role: "Vice-President",         party: null, photo: null },
  // ...
];
```

- `party` is optional — set it to `"ABVP"`, `"NSUI"`, etc. to show a tag, or
  leave it as `null` to hide it.
- The **first** member always renders as a wide "lead" card (16:9 photo).
  Reorder the array to change who gets the lead slot.

```js
const HELPLINES = [
  { label: "Emergency (police / fire / ambulance)", number: "112" },
  { label: "Women's Helpline",                      number: "181" },
  { label: "Gargi College Campus Security",         number: "" }
];
```

Any helpline with an empty `number` is hidden from the quick-helpline panel
shown by the *Report a safety issue* button.

---

## Adding banner ads

Edit `public/banners.json`. It accepts either a bare array or an object with a
`banners` key.

```json
[
  {
    "image": "/images/banner1.jpg",
    "title": "Union event this Friday",
    "subtitle": "Tap for details",
    "link": "https://example.com",
    "alt": "Event banner",
    "active": true
  }
]
```

- `image` (required) — path under `/public`, e.g. `/images/banner1.jpg`.
- `title`, `subtitle` — overlay text on the slide.
- `link` — optional URL; if present the slide opens in a new tab.
- `alt` — for screen readers.
- `active` — set to `false` to hide without deleting.

Slides auto-advance every 6 seconds, pause on hover, and support swipe on
touch. `prefers-reduced-motion` disables animation and auto-play. If the file
is `[]` or empty, the strip hides entirely.

---

## Deployment notes (full checklist)

1. `git init && git add . && git commit -m "gargi-voicebox"`
2. `git branch -M main`
3. `git remote add origin https://github.com/anubhavbajpaibusiness/gargi-opress.git`
4. `git push -u origin main`
5. vercel.com → Add New Project → import the repo → Framework preset: **Other**
6. Project → **Storage → Marketplace → Upstash Redis → Create Database**
   (free tier) → **Connect Project**. Vercel injects
   `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` automatically.
7. Project → **Settings → Environment Variables**:
   - `ADMIN_PASSWORD` = your chosen admin password
   - `REDIS_NAMESPACE` = `du:gargi:voicebox` *(optional — matches code default)*
8. Deployments → **Redeploy** so the functions pick up the env vars.
9. Visit the site, submit a test complaint, copy the tracking code, look it
   up in the Track tab. Unlock the Union desk with `ADMIN_PASSWORD` and try
   changing status, adding a reply, and deleting.
10. Open the Upstash Data Browser and confirm every key starts with
    `du:gargi:voicebox:`. If you see any unprefixed keys, you deployed an
    older build — redeploy.

---

## Hard rules this codebase follows

- No Redis key is ever string-concatenated outside `lib/keys.js`.
- `index.html` and `banners.json` live in `public/`, not at the repo root.
- The admin token is kept **in memory only** (never `localStorage`).
- `.contact` is stripped from any response to a non-admin request.
- `.image`, `.videoLink`, and `.contact` are stripped from `?meta=1` responses.
- Password comparison uses `crypto.timingSafeEqual`.
- All user text is escaped before being injected into HTML.