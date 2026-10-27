# Intake: what this film needs, and what to ask for

Ask once, in one batch, before building, and give your recommendation on every question so the user can answer "yes" to most of them. Fill in what you can find yourself first, from the repo, the live site, the brand folder and earlier notes. Read the user's links too: `python3 <skill>/scripts/fetch_ref.py <url>` gives each post's text and its video's length and size without downloading anything, so the batch can ask permission for each download with its size. Then ask only what's left.

## 1. The film

| Question | Why it matters | A sensible default |
|---|---|---|
| What is it for? A launch, a feature, a fundraise, a recruiting reel, an App Store preview? | It sets the story's spine and the call to action at the end. | A launch: problem, answer, proof, logo, where to go. |
| Who watches it, and where? An X/LinkedIn feed (autoplays muted), a keynote screen, the website hero, a sales deck? | Muted feeds need the words to carry the message and a hook in the first 2 s; a keynote can breathe. | A feed, muted-first: on-screen words carry it, the music lifts it. |
| How long? | Feeds favour 15–45 s; a launch film runs 60–90 s. The length decides the structure (table below). | For a feed, 30 s; for a launch page or keynote, 60–75 s. |
| What aspect ratio and resolution? | 16:9 1920×1080 is the default; 1:1 or 4:5 for feeds; 9:16 for stories and reels. Design the layout for it from the start. | 1920×1080 at 60 fps, plus a 1:1 or 9:16 cut later if asked. |
| What is the one thing a viewer should remember? | Everything else serves it. | Ask. Don't invent it. |
| Is there a deadline, and when does the user want to see a first cut? | It decides how much research and how many review rounds fit. | A storyboard first, then a full cut, then rounds. |

**Length and structure.** Proof is what a film is made of. Shorter films keep fewer, shorter proofs, never shorter reading time.

| Length | Problem | Answer (the mark, the product) | Proof | Finale | End card |
|---|---|---|---|---|---|
| 15 s | 2–3 s | 2 s | one beat, 5–6 s | none | 3–4 s |
| 30 s | 3–5 s | 3 s | two or three beats of 4–6 s, one device each | 3–4 s, or none | 4–5 s |
| 45–60 s | 5 s | 4 s | three chapters of 8–12 s | 5–8 s | 4–5 s |
| 60–90 s | 5–8 s | 4–6 s | three chapters of 12–15 s | 8–12 s | 5–6 s |

## 2. The product

- **What can be shown live?** A running web app (URL, local dev server, or a prototype file) is best. The film drives it in an iframe on a virtual clock and stays sharp at any zoom. For a native or mobile app, ask for a simulator build or high-resolution screen recordings, and plan to rebuild key screens in HTML where the film must move parts of them.
- **Sign-in and data.** Ask for a demo account or seed data. Never enter real passwords yourself: ask the user to sign in in the browser, or use the project's own seed/test data. Use the product's own sample data on screen. Invent nothing: no fake numbers, features or customers.
- **Nothing built yet?** (A pre-launch product.) Ask for a clickable prototype (Figma, an HTML mock), the designers' screens, or recordings, and plan to rebuild the key screens in HTML so the film can drive them. Show only what will ship, and say so in the brief.
- **Which features prove the promise?** Ask for the three to five moments the product is proudest of, then check each in the app yourself.
- **Is there a story already in the data?** A customer, an order, a record whose path crosses several screens. The best finales come from that.

## 3. The brand

- **The logo as a vector** (SVG, or the app's logo component). If there's only a PNG, trace it (`scripts/trace_logo.py`) and confirm the trace with the user.
- **Colours, typeface and the product's motion curve**, from its CSS or design tokens. Use the product's own easing (for example `cubic-bezier(0.32, 0.72, 0, 1)`, read from its CSS or tokens) so the film moves like the product.
- **Existing logo animations** (splash screen, loaders) and any brand do's and don'ts.
- **Colour semantics**: where the product uses red, green and the accent, so the film uses them for the same meanings.

## 4. Sound

- **Music.** Ask whether there's a licensed track or a preferred style. If there's neither, recommend a score composed in code against the timeline (`scripts/synth.py`), which needs no licence, or a music-generation service if the user has one. Say plainly that you can't hear audio: the user must listen before it's final.
- **Voice.** The default is no narrator. Ask whether the film wants any voice. Recommend voices only where the product itself is heard (a voice note playing, a question spoken to an assistant), as a separate cut. If a voice is wanted, ask for the speaker's accent and gender, the language, and whether a real person can record it, which is better than text-to-speech.
- **Sound effects.** Clicks on the frame the control changes, whooshes on fast moves, a breath before the big reveal. These come from the synthesiser unless the user has a library.

## 5. Services and access: ask only for what this film needs

Work out which of these the film actually needs, then ask for those, saying what each is for and the cost or limit you know of.

| Need | Options to offer | What to ask for |
|---|---|---|
| A voice in the product's language or accent | Gemini TTS (`gemini-3.8-flash-tts`, voice design from a description, accents by description), ElevenLabs, OpenAI TTS, a human recording | An API key in an environment variable (for example `GEMINI_API_KEY` in the shell profile), and the tier. Check the provider's current limits: free tiers have been as low as 3 requests a minute and 10 a day. |
| Imagery the product doesn't have (backgrounds, textures, 3D objects, people) | An image-generation API the user has (Gemini/Imagen, OpenAI images, Stable Diffusion, Midjourney via the user), licensed stock | A key or the user's choice of service; the style; usage rights |
| Video clips (a person using the product, a location) | Video generation (Veo, Sora, Runway), the user's footage, stock | The same: key, budget, rights |
| Music | A licensed track, a generation service (Lyria, Suno, Udio), or a synthesised score | The file, a key, or a go-ahead for the synthesised score |
| Fonts | The product's web font (often Google Fonts) or licensed files | Font files, or a URL the film can load |
| Reference media | Downloading the posts the user shared | Permission to download each (say the file, its source and its size) |

How to ask:
- One message, one table: the service, what this film uses it for, what you need from the user, and your recommendation.
- Keep keys out of chat and files. Ask the user to put them in an environment variable or a shell profile, and read them from there. Send them only in request headers, never in URLs, and never print them.
- Before the first generation, say what it will cost or use up. Generate **one** take a line or an asset, and let the user judge it before making more.
- If a service is rate-limited, say so up front, and space requests out.

## 6. Write it down

Put the answers in `BRIEF.md` in the film's folder (decide it now; default `launch/` in the project), from `assets/templates/BRIEF.md`: the goal, the audience, the length and aspect, the product source, the brand assets, the sound decision, the services and where their keys live, and the user's own words for the bar. Every later decision is checked against it.
