# NeuroVision

NeuroVision is a responsive brain-game site with five activities: visual memory, a sliding image puzzle, a timed object guessing game, a hands-on sequence recall challenge, and a fish survival game. Scores, focus points, and game levels are saved in the browser on the current device.

## Design reference

The Studio theme takes cues from [Hootsuite's web dashboard on Mobbin](https://mobbin.com/screens/5aff7542-0a89-481d-af47-2b0d2ca78098): a clear sidebar, welcoming start area, and easy-to-scan activity cards. The Luma theme draws inspiration from [Luma AI's visual canvas on Mobbin](https://mobbin.com/screens/277ab165-4bd2-4021-a4fa-bbd4e273614a), with a cinematic dark backdrop and soft ambient color around the content. Both themes and the game illustrations are original to this prototype.

## Run locally

Run `npm run serve` (Python required), then open `http://localhost:8080`. The browser loads the bundled Three.js modules from `vendor/`; no build step or CDN is needed. Use HTTP rather than opening index.html as a file. An internet connection is only needed for the optional Google Fonts.

## Demo profile

The prototype starts with a simulated signed-in profile for Ruby Ferdianto. The display name is read from browser storage and used in the sidebar and welcome message. This is a local demo identity, not real authentication; it does not verify a login or sync profile and game data across devices.

## Deploy

Upload `index.html`, `styles.css`, `app.js`, `levels.js`, `fish.js`, `fish-ocean.js`, and `theme.js`, `pattern.js`, and `pattern.css` to any static web host, such as GitHub Pages, Netlify, or Cloudflare Pages. Set the publish directory to this folder (`NeuroVision`) and leave the build command empty. Upload the `assets/` folder too. Keep these files together; `levels.js` adds the level system and Pattern Echo, `fish.js` adds Tide Eater, and `theme.js` adds the theme switch.

## Games

- **What's Missing?** Study a board of 8, 12, or 16 objects, wait through a short blank screen, then choose the missing object. Across ten levels, the viewing time drops from 10 to 6 seconds and the answer list grows from 4 to 6 choices. A correct answer unlocks the next level.
- **Picture Perfect** Restore a 3×3 board in levels 1–3, then a 4×4 board from level 4 onward. Every scramble uses legal tile moves, so each board is solvable. Later levels scramble more moves and tighten the move goal; finishing within the goal earns a 150 point bonus.
- **Blur to Brilliant** Identify one of 14 objects as it sharpens over 8 to 4 seconds. Type an answer or choose from 3, 4, or 5 options. Faster correct answers score more; each correct guess advances the level.
- **Pattern Echo** Watch a sequence of 3 to 12 illuminated tiles and tap them in order. The board grows from 3×3 to 4×4 at level 5. Colorful beveled pads have a 10px board frame, progress markers, and optional musical notes. Retry the same sequence without limits, use slow replay, or request a new pattern. An unassisted first-try clear earns 50 bonus points. Clearing a level unlocks the next one.
- **Tide Eater** Steer a fish through a scrolling reef while it swims forward automatically. Eat smaller fish to grow, avoid stinging jellyfish, and steer around shielded fish that cannot be eaten. A larger predator resets your fish to its original size; reef hazards cost a heart. Clear the distance goal to advance through ten levels.

Use the theme switch in the top bar to cycle between Studio (warm/light) and Luma (cinematic charcoal with soft color bloom); the choice is remembered on the current device. The progress page tracks scores, focus points, and each game's level path. Progress and the streak counter use local browser storage. Data does not sync between browsers or devices. The focus points and levels are game rewards; they are not an IQ measurement or a promise of improved IQ.

Tide Eater uses generated reef and transparent fish assets in `assets/`, animated body deformation, rays and seabed creatures. Smaller prey is captured at the mouth, visibly increases body size, and produces a brief diffuse blood plume and growth indicator. Run gameplay regression checks with `node tests/fish.test.cjs`.

Fish levels last 3 minutes at level 1, increasing by 20 seconds per level to 6 minutes at level 10. The countdown shows remaining swimming time. Reset session restarts the current level with zero session score, original size, and three hearts; unlocked levels and saved progress are kept.

The player uses a yellowfin tuna sprite adapted from the supplied reference. Monster barracudas ambush from either side after a locked-lane warning. Each charge can remove at most one heart; dodging awards 150 points. The first warning starts at 8 seconds, with randomized shorter intervals at higher levels. Include `assets/tuna.png` and `assets/monster.png` when deploying.

Monster encounters now shuffle barracudas, great white sharks, and humpback whales without repeating within a set of three. Sharks charge faster (200-point dodge); whales cross slower with wider warning lanes (250-point dodge). Ship `assets/shark.png` and `assets/whale.png` alongside the other sprites.

## 3D edition

Four games render real mesh geometry with the locally bundled Three.js 0.186.1 library. Tide Eater uses a photographic 2.5D renderer to preserve the realistic tuna and reef artwork. Memory objects and recognition objects are procedural models; the slider uses solid textured tiles; Pattern Echo uses colorful beveled 3D pads with raycast and keyboard interaction. Tide Eater layers animated fish, moving masked caustics, diffuse shadows, drifting scenery, and foreground sea life; its realistic sharks and whales remain active hazards. The 2D mechanics and saved progress are retained. If WebGL fails, the original games remain available.

Blender is an asset authoring application, not a browser library. This edition uses procedural Three.js models and does not require Blender. Models are in `three/models.js`, scene integration in `three/main.js`, and the live photographic reef animation in `fish-ocean.js`. The procedural reef module is retained for future experiments. Include `three/`, `vendor/` (with its MIT license), and `assets/` when deploying. `npm test` covers the existing fish rules and validates model geometry and scene cleanup. Use arrow keys plus Enter/Space on the 3D puzzle/pattern canvas, or click/tap a tile. Native controls are retained for assistive technology.
