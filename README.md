<<<<<<< HEAD
# 🎂 Birthday Moments

A shareable birthday surprise. The sender fills a short 5-step builder, gets one link, and sends it on WhatsApp or Instagram. The birthday person opens it and plays through a series of small, tappable scenes: unwrap, light the cake, pop balloons, browse photos, read a letter.

> Inspired by the *flow* of birthday-surprise sites such as ourmoments.live. Build your own look, copy, illustrations, and music. Do not reuse another site's assets, text, or branding.

---

## ✨ Experience at a glance

```
SENDER (builder)                         RECIPIENT (surprise)
1. Birthday star  (name, age, date)      Gift box        → tap to unwrap
2. Pick a cake    (style)                Countdown lock  → opens at 00:00 on the day
3. Fill balloons  (5 reasons)            Party popper    → pull & release
4. Hang memories  (up to 5 photos)       Cake            → light, wish, blow, cut
5. Write a letter (message + from)       Balloons        → pop each to reveal a reason
→ Preview → Share link                   Fairy-light photos → swipe memories
                                         Letter          → typed out, then "Send a reply"
```

---

## 🛠️ Builder: UI suggestions

Keep it a single card on a soft background, one question per screen, with a slim progress bar and the step count ("Step 2 of 5"). A big primary button sits at the bottom, sticky on mobile.

| Step | What they enter | UI suggestion |
|---|---|---|
| 1. Birthday star | Name, age, day + month | Large name input with autofocus. Age as a stepper. Day/month as two selects (day list shrinks to fit the month). |
| 2. Pick a cake | One of 4–6 cake styles | Grid of illustrated cake cards; selected card lifts with a ring and a small bounce. |
| 3. Fill balloons | 5 short reasons (≤ 60 chars) | Show 5 balloon-shaped inputs in a row; each balloon "inflates" (scales up) as text is typed. Offer 3 tap-to-fill example lines. |
| 4. Hang memories | Up to 5 photos + optional captions | Drop zone + "Add photo" button. Thumbnails clip onto a string with tiny pegs. Caption hint: *"e.g. Ooty, 2024"*. Drag to reorder. |
| 5. Letter | Message (≤ 500 chars) + "From" | Paper-textured textarea, handwriting-style font for preview, live character counter. |
| Preview | — | Phone-frame mock that auto-plays a 10-second preview of the surprise. Then **Generate link**. |
| Share | — | Copy link, WhatsApp, Instagram story tip, QR code. |

**Small touches**
- Save the draft in `localStorage` so a refresh doesn't lose work.
- Validate per step with a friendly inline message, never a browser alert.
- "Back" never clears data.

---

## 🎁 Surprise: scene-by-scene UI

Full-screen, dark or deep-colored background, one scene at a time, with a soft fade or slide between them. A floating **Sound on** pill appears first; a mute toggle stays in the top corner afterwards.

1. **Gift box**
   - Wrapped box gently wobbling, ribbon on top. Copy: *"Someone made this just for you."*
   - Tap → lid pops off with a small burst → continue.
2. **Countdown lock** (only before the birthday)
   - *"This opens at midnight on your birthday."* Big HH : MM : SS tiles, ticking.
   - At 00:00 it unlocks automatically with a chime.
3. **Party popper**
   - A popper cone with a string. Drag down and release (or tap on desktop) → confetti cannon + *"It's your day!"*
4. **Cake**
   - Uses the cake style picked by the sender. Steps: tap to light candles → *"Make a wish"* → blow into the mic or tap the flames → smoke wisps → knife appears, swipe across to cut.
5. **Balloons**
   - 5 balloons floating up and down in the sender's colors. Each tap pops one with a sound and shows a reason card.
   - After the last one: *"…and a hundred more reasons."*
6. **Fairy-light memories**
   - Photos hang from a glowing string, polaroid style, swaying slightly. Swipe or arrows to move; tap to enlarge with the caption.
7. **Letter**
   - Envelope opens → letter slides up → message types out → signature *"With love, {from}"*.
   - Buttons: **Send a reply** (WhatsApp), **Replay**, **Make one for someone**.
8. **Expired** (optional, if links have a lifetime)
   - Calm illustration and *"This surprise has floated away."*

---

## 🎨 Design system (suggested)

| Token | Suggestion |
|---|---|
| Background | Deep plum `#2a1022` or midnight `#0c1024` for the surprise; warm cream `#fff5f8` for the builder |
| Accent | Rose `#db2777`, gold `#fde68a` for glow and lights |
| Headings | A rounded or serif display font (e.g. Fraunces, Playfair Display) |
| Body | A clean sans (e.g. Inter, Nunito) |
| Letter | A handwriting font (e.g. Caveat, Kalam) |
| Radius | 16–24px cards, fully rounded buttons |
| Touch targets | ≥ 44px |
| Motion | 300–600ms ease-out; respect `prefers-reduced-motion` (skip confetti, no swaying) |

Mobile first: design at 390×844, then center at max 480px wide on desktop.

---

## 🔗 Link format

All data lives in the URL hash, so there is no backend for the basic version:

```
https://your-site.com/view/#draft=<base64 JSON>
```

```json
{
  "v": 1,
  "name": "Friend",
  "age": 25,
  "birthday": "12-11",
  "theme": "rose",
  "reasons": ["…", "…", "…", "…", "…"],
  "message": "…",
  "from": "Your name",
  "photos": ["https://…/1.webp"],
  "captions": [""]
}
```

- Encode with UTF-8 safe base64 so emojis and Tamil/Hindi text work (see `src/lib/codec.js`).
- Upload photos to a host (Cloudinary, Supabase Storage, ImgBB) and put **URLs** in the link. Embedding images makes links too long for WhatsApp.
- For short links like `/b/ab12cd`, store the JSON in a database row instead (Supabase works well).

---

## ✅ Status in this repo

| Feature | Status |
|---|---|
| Builder: name, age, date, cake theme, 5 reasons, message, 3–8 photos, preview, share link | ✅ Done |
| Countdown and auto-unlock on the birthday | ✅ Done (unlocks on the date; midnight tick-over works) |
| Cake with tap/blow candles + confetti | ✅ Done |
| Photo slideshow with captions | ✅ Done (Swiper) |
| Reasons as flip cards | ✅ Done; **to do:** balloon-pop version |
| Typewriter letter + WhatsApp reply | ✅ Done |
| Background music per theme + mute | ✅ Done (each theme has its own loop) |
| Gift-box opening scene | ⬜ To do |
| Party popper (pull & release) | ⬜ To do |
| Cake lighting + cutting steps | ⬜ To do |
| Fairy-light photo string | ⬜ To do (restyle current slideshow) |
| Envelope letter animation | ⬜ To do |
| Draft saved in localStorage | ⬜ To do |
| Hosted photo upload | ⬜ To do (currently resized into the link) |
| Short links, expiry, payments (Razorpay) | ⬜ Optional, needs a backend |

---

## 📁 Project structure

```
birthday-moments/
├─ index.html              # builder entry
├─ view/index.html         # surprise entry (shared links open here)
├─ public/music/           # one original loop per theme (rose, cocoa, mint, midnight)
├─ scripts/make-music.mjs  # regenerates the loops: node scripts/make-music.mjs
├─ src/
│  ├─ App.jsx              # routes: landing / wizard / viewer
│  ├─ components/
│  │  ├─ Landing.jsx
│  │  ├─ Wizard.jsx        # builder steps + share link
│  │  └─ viewer/           # Viewer, CakeScene, PhotoScene, ReasonsScene, MessageScene
│  └─ lib/                 # codec, dates, themes, photos, blow detection, share
├─ netlify.toml / vercel.json
└─ vite.config.js
```

---

## 🚀 Run it

```bash
cd birthday-moments
npm install
npm run dev          # http://localhost:5173
npm run build        # production build in dist/
```

Libraries in use: React, Vite, `canvas-confetti`, `swiper`, `gsap`, `howler`.

## 🌐 Deploy

- **Netlify / Vercel:** connect the repo; config files are included.
- **GitHub Pages:** push `dist/`; a `404.html` fallback is generated on build.

---

## 🔒 Privacy and good practice

- Names, photos, and letters are personal. Store only what's needed and let senders delete pages.
- Pages are marked `noindex`. Anyone with the link can open it, so tell senders not to post it publicly.
- Get consent before uploading someone's photos.
- Use royalty-free or original music and your own illustrations.

## 📄 License

MIT
=======
# one-day-cel
>>>>>>> 867f23a6a8e57119e862d8ecd956703ca27a6f46
