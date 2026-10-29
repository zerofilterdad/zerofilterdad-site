# ZeroFilterDad.com

Plain HTML + CSS + vanilla JS. **No build step, no dependencies.** Ready for Cloudflare Pages (free).
Nothing in this folder has been deployed, and no DNS has been changed.

## Look
Dark gunmetal brushed-metal background (pure CSS) with a soft blue glow. All colors live in `:root` at the top of `assets/css/style.css`.

| Variable | Value | Use |
|---|---|---|
| `--bg` / `--metal` | `#050608` / `#14161b` | page black, gunmetal |
| `--blue-glow` | `#00a8ff` | neon blue: borders, links, labels, button glow |
| `--blue-deep` / `--blue-light` | `#1861dd` / `#63d8fa` | logo tones |
| `--body` | `#d8d7d1` | warm off-white for long text |
| `--white` / `--silver` | `#f5f7fa` / `#b9c1cc` | headings / secondary text |

Fonts are self-hosted in `assets/fonts/`: **Russo One** for headings (chrome gradient on H1/H2) and **Inter** (variable) for body.

## Files
```
index.html               Home (hero, About me, proof strip, intent cards, ... Mini Zero, newsletter)
streaming.html           Stream schedule, what the stream is, what to expect, Watch on Twitch
beginner-guide.html, automation-guides.html, consulting.html, merch.html, 404.html
robots.txt, _headers     Optional Cloudflare Pages extras
assets/css/style.css     All styling and theme variables
assets/css/donate.css    Donate section + sticky Donate pill (homepage)
assets/js/donate.js      Donate progress bar: goal/raised config at the top of the file
assets/js/main.js        Nav, obfuscated mailto, event auto-hide, Twitch player loader
assets/js/greeter.js     Mini Zero greeter (home only): bubble, search, quick buttons, voice, hover/click jokes, animated loop
assets/img/              Logo, avatar, Mini Zero still (mini-zero.webp) and loop (mini-zero-loop.webm / .webp)
assets/audio/            Mini Zero voice clips (mz-*.mp3)
assets/fonts/            Russo One + Inter (woff2)
```

## Mini Zero greeter
- Entrance once per session; dismissible; mute is remembered (localStorage `mzMuted`); welcome voice plays once per visit and only after a user gesture.
- Hover, keyboard focus or first touch tap: cap tip + "Hey, how you doin'?" (throttled to once per 10 s). Click or Enter: a random joke from 9 clean lines, no repeat until all nine are used (the list is `JOKES` in `greeter.js`, audio `mz-joke1..9.mp3` in the same order).
- Voice clips are mono MP3s (about 12-25 KB each) in the approved Mini Zero voice. They are fetched only when played, after the first interaction. Clips were made with the voice description in the promo standard (never the old Piper voice); to change a line, regenerate the clip with the same voice and keep the file name.
- Animation: `assets/img/mini-zero-loop.webm` (VP9 with alpha, about 403 KB) is loaded after the page `load` event on top of the `mini-zero.webp` still. Safari/iOS get `mini-zero-loop.webp` (animated WebP, about 460 KB). `prefers-reduced-motion` keeps the still only. No WebGL.

## Testimonial form
The homepage form posts straight to **Web3Forms** (`https://api.web3forms.com/submit`) from `assets/js/home-extras.js`. The access key in the hidden `access_key` field in `index.html` is public by design, so it is fine in the HTML. Submissions are emailed to the address the key was created for; nothing is published automatically. The form has a hidden `website` field and a hidden `botcheck` checkbox as spam traps. There is no server code or secret for this form. To change the receiving address, create a new key at web3forms.com and replace the `access_key` value.

Pages Function `functions/api/products.js` (merch grid) still needs the env var `FOURTHWALL_STOREFRONT_TOKEN`.

## Donate section (homepage)
The "Support the Wounded Warrior Project" section sits right after the hero (`#donate` in `index.html`), with a small sticky "Donate" pill that links to it. Code: `assets/css/donate.css`, `assets/js/donate.js`.
- **The goal is $3,000** (set by Brook); change `DONATE.goal` if it moves.
- **The raised amount is NOT connected to anything (it starts at $0 as a placeholder) and must be updated by hand.** Edit `DONATE.goal` and `DONATE.raised` at the top of `assets/js/donate.js` (the only place the numbers live), or connect a live tracker later. Never enter a number that has not been confirmed.
- The main button goes to https://www.woundedwarriorproject.org. The pill and the stream line hide after Oct 31, 2026 (same `data-event` switch as the event bar); the thank-you line replaces the stream line.
- Arrows flash with CSS only and stop under `prefers-reduced-motion`.

## Schedule and event
Central time: Fri 8 PM; Sat 9 AM and 7 PM; Sun 9 AM and 7 PM. On kid weekends, Sunday is a pop-up stream with no set time. The WWP charity stream banner/cards (anything with `data-event`) hide themselves automatically after Oct 31, 2026 (`EVENT_END` in `main.js`).

## Contact
All contact points to **hello@zerofilterdad.com**. That mailbox does not exist yet: set up Cloudflare Email Routing (forward to a real inbox) or a mailbox before launch. Consulting pricing reads "Contact for pricing".

## Placeholders
Every placeholder is marked with an HTML comment starting `TODO` and, where visible, a dashed "PLACEHOLDER" box (class `todo`).
To hide the boxes without deleting them, add `class="hide-todos"` to `<body>`. Search the folder for `TODO` to find everything.

## Preview locally
```
cd zerofilterdad-site
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy on Cloudflare Pages (free)

### Option A: Git (recommended, auto-deploys on every push)
1. Put this folder in a GitHub (or GitLab) repo.
2. Cloudflare dashboard, **Workers & Pages**, **Create**, **Pages**, **Connect to Git**, pick the repo.
3. Build settings: **Framework preset: None**, **Build command: leave empty**, **Build output directory: `/`** (the repo root, or the subfolder if the site lives in one).
4. **Save and Deploy.** You get a `*.pages.dev` URL immediately.

### Option B: Direct upload (no Git)
1. Cloudflare dashboard, **Workers & Pages**, **Create**, **Pages**, **Upload assets**.
2. Name the project, then drag in this folder (or the zip, unzipped). Deploy.
3. To update later: **Create deployment** on the project and upload again. (Or use `npx wrangler pages deploy .`.)

## Attach zerofilterdad.com
Because the domain is already registered on Cloudflare, DNS is handled for you:
1. Open the Pages project, **Custom domains**, **Set up a custom domain**.
2. Enter `zerofilterdad.com`, continue. Cloudflare adds the DNS record automatically since the zone is in the same account. Wait for status **Active** (SSL is automatic).
3. Repeat for `www.zerofilterdad.com`, then add a redirect (Rules, Redirect Rules) from `www` to the apex, or the reverse, so there is one canonical address.
4. Confirm the `canonical` and `og:image` URLs in each page `<head>` match the final address.

## Before launch checklist
- Replace placeholder copy (search `TODO`), add the real stream schedule, pricing/contact, Mini Zero art, product links.
- Review the Twitch player on the live domain (Twitch requires the page hostname as `parent`; `main.js` sets it automatically).
- Review the WWP callout (home + streaming) after the Oct 30 event; WWP copy rules: "benefiting Wounded Warrior Project" only, no dollar/percent claims, no merch tie-in.

## Photos of Brook

Real cutouts live in `assets/img/` as a `.webp` plus a `.png` fallback, served through `<picture>`: `brook-headshot` (homepage About Me), `brook-consulting` (consulting.html, pricing card, round crop) and `brook-stream` (streaming.html, "What the stream is"). The shared frame style is `.bio-photo` / `.about-avatar` in `assets/css/style.css`.
