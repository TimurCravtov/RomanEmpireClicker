# Imperium Clicker

A Roman Empire idle/clicker game built with React and Vite.

Click the eagle to collect denarii, build an economy from farms to the Senate,
enact edicts to multiply output, and ascend to found new dynasties for permanent Glory.

## Run

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build
npm test         # engine unit tests (vitest)
```

## Deploy

Pushing to `main` runs tests, builds, and publishes to GitHub Pages
(`.github/workflows/deploy.yml`). One-time setup: in the repo go to
**Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Features

- 11 buildings with exponential costs and ×1 / ×10 / ×100 / Max buying
- Edicts: click multipliers, three tiers per building, and global bonuses
- 15 achievements with unlock toasts and 8 ranks, from Plebeian to Imperator Augustus
- Prestige ("Ascend"): reset a run for Glory, +5% production and clicks each
- Autosave to `localStorage` and offline earnings (50% rate, capped at 4 hours)

## Structure

```
src/
  game/        pure logic: data, reducer/engine, formatting, save/load (+ tests)
  hooks/       useGame: game loop, autosave, achievement toasts
  components/  ClickArea, Shop, Upgrades, Achievements, Ascend, Toasts, ...
  styles/      plain CSS per area
  assets/icons PNG icons
```

## Credits

See [CREDITS.md](CREDITS.md). Icons from [game-icons.net](https://game-icons.net) under CC BY 3.0.
