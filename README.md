# Crystal Quest

Grade 3 math adventure for Crystal Instruction. Students pick an avatar, walk a painted world map, unlock lands with a diagnostic, and complete quests (Pre-Test → Lesson → Practice → Game → Post-Test).

**Do not rebuild from scratch.** Keep the world map, path-only walking, avatar walk cycles, and Crystal Hills land. Read `index.html` and `js/` before changing anything.

Repo: [github.com/kennadyscott/crystal-quest](https://github.com/kennadyscott/crystal-quest) · branch `main`

Play (cache-bust with the latest commit SHA, not `/main/`):

`https://raw.githack.com/kennadyscott/crystal-quest/<SHA>/index.html`

Local: open `index.html` or serve the folder (`python3 -m http.server`). Static HTML/CSS/JS, no bundler.

## Brand

Match [crystalinstruction.com](https://crystalinstruction.com/self-guided-demo): Inter + Manrope, magenta `#ec18c8`, violet `#8b35f6`, ink `#061229`.

## How it plays

1. Title screen: new adventure, continue, or Maya’s showcase.
2. Pick a name and one of five avatars (Mai, Imani, Darius, Nolan, Lena).
3. Full world map on login. Arrow keys walk **paths only** (no water). First walk zooms the camera.
4. Lands start locked. Walk to an island, press Enter, take that land’s diagnostic.
5. At most **2 lands** with `status === 'open'`. Master one before unlocking a third.
6. Entering Place Value loads **Crystal Hills** (`assets/lands/place.jpg`) — a close-up island, not a crop of the world map.

Save is `localStorage` key `cq-save` (this browser only).

## Crystal Hills (Place Value)

The only land with a dedicated interior so far.

**Quests, in order:**

1. Place Value — Value Pool
2. Represent Numbers — Value Grove
3. Compare and Order Whole Numbers — Order Glen
4. Rounding Numbers — Rounding Ruins
5. Counting Money — Coin Keep

Master **1–3** to open the east side of the island (quests 4–5). No diagnostic skip on this land (`noSkip: true`). Shrines stay locked until the previous quest is done.

Island UI (see the land mockup we are matching):

- Top bar: Home, “Land of Place Value”, “X of 5 Side-Quests Complete”
- White shrine labels, checks on done, locks on locked, pink pin + glow on the selected shrine
- Center **Land Crystal** card with shard count
- Right **quest panel**: place name, blurb, 5-step path, Begin Quest, restore-the-crystal footer
- Compass top-left; Home returns to the world map

World-map land labels are dark-glass plaques (flavor name + topic), not white dashboard cards.

## Files

| Path | Role |
|------|------|
| `index.html` | Shell, CSS, HUD, land panel, quest/diag players |
| `js/content.js` | Lands, quests, `QUEST_CONTENT` |
| `js/state.js` | Save, XP, unlocks, 2-land cap, island gate |
| `js/world.js` | Map HUD, land view, shrine panel |
| `js/explore.js` | Camera, path snap, walker, walk cycle |
| `js/player.js` | Quest loop + Crystal Smash / Sort |
| `js/diag.js` | Practice check + island diagnostic |
| `assets/map.jpg` | World map |
| `assets/lands/place.jpg` | Crystal Hills interior (2200×1086, ocean padded for wide screens) |
| `assets/avatars/` | Idle + `*-walk-1.png` … `*-walk-4.png` per character |

`cq-characters/` is gitignored (source portraits). Cutouts and walk frames in `assets/avatars/` **are** committed.

World map is 1014×806. Island coords are in Crystal Hills pixels (origin top-left of `place.jpg`). Paths live on `LANDS.place.paths`; the first `pathsOpen` (6) polylines are the west island, the rest unlock after the gate.

## Other lands

Multiplication, Decimals, Fractions, Geometry, and Data still use the world-map zoom + 6 older quests each. They need the same treatment as Place Value: close-up art, shrine names, sequential side-quests, land panel. Don’t flatten Place Value back into that old zoom overlay.

## Conventions

- Cache-bust asset URLs with `?v=` when replacing images.
- Walker: ~64px on the world map, larger on Crystal Hills (`.hero.in-land .walker img`).
- Walking is path-snap only (`PATHS` on the world, `LANDS.*.paths` inside a land).
- Interiors that should fill a 16:9 screen need extra ocean on the sides so the island itself isn’t cropped.
- Keep Crystal Instruction voice: clear, kind, Grade 3.
