# Research: references, and the principles you'll hold yourself to

Research comes before the storyboard. Clients notice when it wasn't done first, and films improve most after it. The output of this stage is a short notes file: for each reference, what it does and what this film could take from it; then the principles this film commits to.

## 1. The user's references

Most references arrive as X/Twitter posts (`x.com/<user>/status/<id>`), sometimes as YouTube, Vimeo, Dribbble, Behance or Instagram links, or as files.

**Reading an X post without signing in.** The fxtwitter API returns a post's text, author and media as JSON:

```bash
python3 <skill>/scripts/fetch_ref.py https://x.com/<user>/status/<id>     # run from the film's folder
```

This prints the text, the author, and each video's URL, length and size. It downloads nothing (it asks the media host for the size only).

**Watching it.** You can't play video, so you look at frames. With the user's permission (name the file, its source and its size), download and make a contact sheet:

```bash
python3 <skill>/scripts/fetch_ref.py <url> --download --out refs/   # saves refs/<author>-<id>.mp4 and a sheet every 0.5 s
python3 <skill>/scripts/strips.py refs/<file>.mp4 10 20 --fps 6 --out refs/<name>-10-20.jpg   # a closer look at a stretch
```

`refs/` lives in the film's folder.

**Without permission to download**, don't guess what a film does from its caption. Ask the user for a screen recording or a few screenshots, or for a sentence on what they like in it. Meanwhile work from the post's text, length and author's other public work, and mark those notes "unseen" so no device in the storyboard rests on them.

Read every sheet, and note for each reference:
- **Structure:** hook, problem, answer, proof, logo, call to action. How long each part runs, and where the music turns.
- **Devices:** how the product is shown (live UI, floating cards, a 3D device); how words arrive (typed, blurred in, inline pills or icons inside sentences, words as windows onto imagery); how shots join (match cut, whip, zoom through a shape, the brand shape as a wipe); how the logo is revealed.
- **Rhythm:** cut and beat density, holds, where it breathes.
- **Craft:** motion blur, depth of field, colour, type size, margins, sound on every move.
- **What not to copy:** gimmicks that don't fit this brand, and cliché endings (screens orbiting a logo).

Write one paragraph a reference in the film's notes (the post, its author and length, what it does, what this film takes from it), and record the links in the project. The client asked for exactly that afterwards.

**When the user sends more references mid-project, it's feedback.** "Bro see, you're not thinking outside the box enough", with a link, meant "your finale is too literal". Read what the reference does that your film doesn't, and act on the principle, not the surface.

### Worked examples

Nine launch films studied this way, as a model for the notes, and a starting set of references. Each row is what a contact sheet showed, then the principle a new film can borrow (never the surface).

| Reference | What it does | The principle to borrow |
|---|---|---|
| [VeduBoi, for Vale](https://x.com/vedu_boi/status/2113927267558859147), 62 s | Dark and green, fast cuts between dark and white, pills inside typed sentences, the logo on a sunburst with an orbit diagram round it, product UI on tilted floating screens, stat chips counting up. | Put a line's key word in a pill; carry one brand colour through every shot. |
| [vlad, for Hyperdash](https://x.com/motion_conquest/status/2113388387290013733), 77 s | A rotating word over newsprint, then a short title before each stretch of dense, real product UI driven by a pointer. | The product is the hero: a short line, then the proof on screen, live. |
| [Abdullah.A, for Pulse](https://x.com/abdullah4204k/status/2111150845358444902), 52 s | Typed lines with counters inside them, a dot that grows into the logo, words beside the dashboard as it pans, a funnel of stat chips. | Grow the mark out of something already on screen; set words beside a moving product, not over it. |
| [Nazday, healthcare dashboard pages](https://x.com/nazmijavierl/status/2099784026794188975), 15.5 s | A light, calm dashboard on a tablet, shown as it's used, with slow camera moves. | A bar for calm: slow framing suits a product that asks for trust. |
| [VeduBoi, a payments card](https://x.com/vedu_boi/status/2114319230657327580), 34 s | Gradients, 3D cards with light streaks, motion-blurred words, an icon inside a line, the logo on black. | Motion blur on fast moves; an icon or image can stand in for a word. |
| [abdinmotion, "the blueprint"](https://x.com/abdinmotion/status/2114292688841548179), about 25 s | Hook, problem, solution, announcement, why us, logo; construction lines and dashed rings that type sits on; a logo revealed by rising bars. | A chapter structure to start from; construction geometry as a stage for type and the mark. |
| [Shajareditx, for Island](https://x.com/Shajareditx/status/2113843002086949354) | Dots that orbit, gather and become the logo; a radial diagram round a centre; big words over a landscape. | Things gathering into the mark. |
| [roshannnkumar, for Spark](https://x.com/roshannnkumar/status/2114092527741743391) | Clutter made literal (a wall of folder icons), then order; floating 3D cards; an image inside a line of text. | Show the problem as a picture, then let the product sort it. |
| [Abdullah.A, Commas Affiliate Center](https://x.com/abdullah4204k/status/2113321447229907015) | The brand shape is the transition (the logo wipes the scene), words as windows onto imagery, soft halos in the brand colour, a coin travelling across the UI to join moments, a clean sound on every move. | Sent mid-project as feedback on a finale that was too literal: let the brand's own shape do the cutting, and give every move a sound. |

## 2. Finding more on your own

Spend some time looking past the user's links, especially for the hardest part of this film. Good places to look:
- Apple's product films, keynote transitions and "the sound of Apple";
- Linear, Vercel Ship, Raycast, Arc and Stripe launch videos, and agency case studies (Basement Studio, Buck, ManvsMachine) that explain how the films were made;
- motion designers on X who post launch films. Search X and YouTube for "launch video", "product launch animation" and "SaaS promo";
- Dribbble and Behance for logo-reveal and kinetic type references;
- for the rules: UX in Motion (Willenskomer), Material and Carbon motion guidance, Walter Murch's rule of six for cuts, subtitle reading rates, broadcast safe areas, streaming loudness.

Use web search, fetch the pages that explain technique, and note sources. Prefer explanations of why something works over lists of trends.

## 3. Principles from the best

**Story**
- Open on the problem, on screen within 5 seconds, not on the logo. Then the product as the answer, then the proof.
- A few proofs, each given room, not a dozen 3-second beats: about three chapters of 12–15 s in a 60–90 s launch film, two or three beats of 4–6 s in a 30 s feed ad (the length table is in `intake.md`).
- The finale is the one thing only this product could show. Look for a story already in its data.

**Showing the product**
- Rebuild or drive the real UI rather than screen-recording it: you need control of timing and sharpness.
- Use one cursor, about twice life size at 1080p, because a real-size pointer disappears. It enters from outside the frame and makes one decelerating glide. Its click lands on the frame the control changes, and then it leads into the next thing or leaves.
- Every motion shows what changed or what comes next. Cut motion that only decorates.

**Editing**
- Hide cuts with continuity: cut on action, match cuts, content carried across.
- Not every beat needs a cut: continuous motion on the beat can carry energy better than fast cuts.
- Check each cut against Murch's six: emotion, story, rhythm, eye trace, the plane of the screen, space.

**Sound**
- Clicks land on the frame a control moves, and impacts on the hit frame. A whoosh peaks at the fastest frame of its move.
- J-cut: the next scene's sound arrives before its picture.
- Leave 3–8 frames of near-silence before a big reveal.
- A synthesised score is a placeholder until someone has listened to it.

## 4. Sources worth re-reading

- Apple HIG, Motion: https://developer.apple.com/design/human-interface-guidelines/motion
- Apple keynote transitions (9to5Mac on Adam Grasso's analysis): https://9to5mac.com/2023/06/21/apple-keynote-videos-transitions-and-editing/
- Basement Studio, behind Vercel Ship: https://basement.studio/post/behind-the-ship
- Kinetic product motion for Raycast: https://contra.com/p/llNMeeMX-kinetic-product-motion-for-raycast-making-a-ui-feel-alive
- Oversized cursor rules (HyperFrames): https://www.tessl.io/registry/skills/github/heygen-com/hyperframes/oversized-cursor
- UX in Motion manifesto: https://uxmag.com/articles/creating-usability-with-motion-the-ux-in-motion-manifesto
- Google, Making motion meaningful: https://design.google/library/making-motion-meaningful
- Murch's rule of six: https://nofilmschool.com/2016/11/6-rules-good-cutting-according-oscar-winning-editor-walter-murch
- Essential cuts (J, L, match): https://www.premiumbeat.com/blog/9-essential-video-editing-cuts
- The sound of Apple (Twenty Thousand Hertz): https://www.20k.org/episodes/the-sound-of-apple-2
- Carbon motion: https://carbondesignsystem.com/elements/motion/overview/
- Material motion system: https://material.io/design/motion/the-motion-system.html
- Reading time for on-screen text: https://www.ssw.com.au/rules/post-production-do-you-give-enough-time-to-read-texts-in-your-videos
- Safe margins: https://dev.to/utilitylab/how-to-calculate-title-safe-and-action-safe-margins-for-video-1ifj
- Streaming loudness: https://violetrecording.com/best-loudness-meters/
