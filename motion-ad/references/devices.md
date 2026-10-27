# Devices that worked, and how to build them

Use one device per beat, and don't repeat a device. Each entry says what it is, when it fits, and the details that made it work. Names like `wordsAt` are helpers in the starter's `film.js`.

## Moving between screens (so nothing just switches)

- **A row that opens into its page.** The next screen is drawn fitted to the row's rect, cut to the row's shape (`clip-path: inset(… round r)`), and grows to the whole screen while the screen behind steps back and fades (write a helper that fits a window to any rect, and pose the card from the row's rect to the frame with it). The card is solid white before the page fades in, and the page is on it within 8 frames, so you never see a half-transparent page over another page, or an empty white box. Grow it on a soft or standard curve over 0.5–0.6 s: on a fast-start curve it is half grown in a tenth of a second. Measure its motion blur from its own corners (see `pipeline.md`).
- **A page that closes back into its row**, in another list, which then comes back round it. The page stays on its card until the card is the row's size, then the page goes, then the card. Done the other way round, an empty white card crosses the list.
- **A button that opens into what it names**: a "View report" button grows into the report, and the report's headline shows the number the screen before just mentioned.
- **A glide across one screen instead of a cut:** the camera travels from an item in a list to the same message in the conversation, on the same screen.
- **The product's own navigation, pressed.** The nav's selection marker slides on the product's spring, the old sheet lifts away and the new one comes up. Land the camera before the press, so the press and the slide are seen still.
- **A whip pan** up a feed to an earlier item, with a cut hidden in the fastest frame, matched speeds either side, and a long blur along the move.
- **A zoom through a shape the two shots share**, such as a status dot. A 6 px dot never fills the frame, even at 40×, so the cut reads as a bounce. Draw the dot in its own colour over the screen's at its own size near the cut, and let it fill the frame for 2–3 frames either side.
- **Words as a window.** Black all round giant letters, with the product seen only through them as the camera stands back. A black layer with white text, blended with `multiply`, does it with real fonts. Raise the content's colour while it's seen this way. To open the window, grow the letters' outline (SVG text, `stroke-linejoin: round`) until it swallows the frame, on a gentle ease-in-out over about 0.85 s. Grow it until the corners are white (check by measuring the frame); stop short and a black wedge stays in a corner.
- **The composer as the stage.** A text field lifts off the screen, grows to fill the frame, the line is typed into it and sent, the words rise to become the next headline, and the field settles into the next screen's own composer.

## Showing the product

- **Lift a card out of the screen beside the words.** The rest fades, the card turns slightly towards the type, and the screen comes back round it as the camera goes in. Mask the lifted card's foot with a gradient so its rows fade rather than being cut.
- **An extreme close-up on one number that changes**, through the product's own colour bands, its label changing at the real thresholds. Take the number's value from the frame's centre time, or motion blur prints two digits at once. Give the hero number a hold (rule 4) and a spotlight.
- **Rack focus inside the product.** The rows that matter lift; everything else, including the sidebar, blurs and dims.
- **An overlay that compares two records.** Slide one onto the other: what's the same lines up and is drawn once (the top copy's text and pill backgrounds go see-through), and what differs shows twice. Then mark the differences as if with a pen.
- **Deal a list in**, in the order it matters, beside the words on a wash.
- **The product filling itself in:** items arriving on the product's own entrance motion, slowed only as much as legibility needs, and rings counting up.
- **A macro on a control, then a tilt down to what it produced**: a voice note plays, and its transcript writes itself out.
- **The product's own recorded motion** (a call ringing and answered, a message waiting for the network) played back frame by frame, with a haze that tracks the subject on every frame.
- **Carry what a recorded take swaps.** When the product clears a field in one frame and shows the message elsewhere a few frames later, a copy of the words flies on an arc from the field to where the message appears, growing its bubble. Patch the take's own copy until the flight lands, and set the type to match the take's (it measured 3% wider than its CSS size).
- **A take that changes in one frame: hold, then move.** Hold the take's first new frame while the old frame's parts fade, then play the glide.

## Words

- **Typed lines with live elements inside them**: "Works when the network [chip] doesn't.", where the chip is the product's own and changes when the product's does. A pill in a sentence that later closes to a dot.
- **Words that arrive as what they describe**: "written down" coming in as a waveform, each bar becoming its letter.
- **A caption that rises from behind its own edge and leaves through it.** The line is its own mask, with room above for the caps and below for the descenders. It holds dead still while things move round it.
- **Words in out of a blur, rising slightly, one word at a time** (`wordsAt`): stagger 60–90 ms, 0.6 s in on the product's curve, 0.42 s out. This is the house style for headlines; vary their position, not their manner.
- **Clear words before the next screen arrives.** Words left over an arriving page look like a mistake.

## Brand and logo

See `logo.md`. Devices that have landed:
- **A pill that closes into a dot, and the dot becomes the logo's first stroke.** The pill's padding goes to zero as it closes, and the dot becomes the mark's first stroke, with no unrelated shape in between.
- **The mark lands as the product's own logo**: the camera pulls back and the drawn mark shrinks onto the logo in the app's sidebar, placed from the live camera every frame.
- **A thread through every screen of the film** (a wall of all of them in the order the film showed them), which then draws the logo: one pen on each of the mark's continuous strokes, all moving together, so it reads as the mark early, with each part painted in its own colour behind them.
- **The logo's own loop as the transition into the end card**: it opens into another form (a line, a ribbon), then closes back into the mark at the end card's size and place.
- **Light from the mark:** soft radial glows in the brand's colours turning slowly behind it. Use it as atmosphere, not decoration.

## Finales

- **A finale from the story in the data**: one customer, order or record whose path crossed every screen. Draw that path through a wall of every screen, then turn it into the mark.
- **A line that claims "every" touches everything**: every screen in the order the film showed them, then the rest of the product's modules by name.
- **Avoid:** screens orbiting the logo (the most common ending), letters flying along an orbit, and a drawn shape that only becomes the logo at the end.

## The end card

- The logo, the wordmark, one line, the address. Bring them in one at a time.
- A slow, constant drift (linear scale of about 4–5% over the card), so it's never dead.
- Leave over about 0.7 s: the type first (address, line, name), the logo last, on soft curves, finishing a few frames before the end so the last frames are clean.
- Hold the newly formed logo about 0.9 s before the wordmark comes in. That's the payoff's own beat.
