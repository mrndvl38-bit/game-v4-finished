# Evolution Trail

A lightweight, Oregon Trail-inspired web game about human evolution. Travel across eras, manage resources, face random events, and evolve through key hominin species—from early apes to Homo sapiens.

## Play

Open `index.html` in a browser.

- Travel to advance distance toward the next evolutionary milestone.
- Rest to restore health and morale.
- Forage/Hunt to gain food.
- Innovate to unlock advancements that improve success rates.
- Random events will present choices with trade-offs.
- Reach `Homo sapiens` with your group alive to win.

Your progress can be saved/loaded using the buttons in the header (stored in localStorage).

## Species Included

- Dryopithecus (Dryopithecine)
- Ramapithecus (Syn: Sivapithecus)
- Australopithecus (Southern Apes)
- Homo habilis (Able Man)
- Homo erectus (Upright Man)
- Homo sapiens neanderthalensis (New Human Species)
- Homo sapiens (Wise Men)

These represent a simplified, educational progression of important hominins rather than a strict, single linear ancestry.

## Tech

No build tools required. Simple HTML/CSS/JS.

- `index.html` – structure and dialogs
- `styles.css` – visual styling
- `game.js` – game logic and state

### Image assets

- **Background image:** Place your river image at `assets/oregon_river.png`. The image is displayed exactly as provided, with no animations or modifications. If the file is missing, a dark gradient background will be shown instead.
- **Evolution timeline:** Place the evolution progression image at `assets/evolution_timeline.png`. This image appears at the bottom of the page to illustrate the evolutionary journey from ape to human.

## Deploying Online (Make it Accessible to Others)

To share this game with people who aren't on your computer, you need to host it online. Here are free options:

### Option 1: GitHub Pages (Free, Recommended)
1. Create a GitHub account at [github.com](https://github.com)
2. Create a new repository (public)
3. Upload all your game files to the repository
4. Go to Settings → Pages → Select "main" branch → Save
5. Your game will be live at `https://[your-username].github.io/[repository-name]`

### Option 2: Netlify Drop (Easiest - No Account Needed)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag and drop your entire `evolution_game` folder
3. Get an instant URL to share (e.g., `https://random-name.netlify.app`)

### Option 3: Vercel (Free)
1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Import your repository or drag & drop files
4. Get a URL instantly

### Option 4: Shared Folder (Local Network Only)
- Share the folder over your local network (works only for people on the same WiFi)

**Note:** Make sure to include the `assets` folder with your images when deploying!

## Notes

- Numbers and outcomes are intentionally approximate for approachable gameplay.
- You can adjust balance by editing species modifiers or event effects in `game.js`.
