# HabitForge — Mobile (Expo)

React Native / Expo build that mirrors the web app in `../web`.

## Run

```bash
cd mobile
npm install
npx expo start
```

Then scan the QR with **Expo Go** on your phone, or press `a` / `i` for Android / iOS emulator.

## What's inside

- `app/` — Expo Router file-based routes.
  - `index.tsx` — landing
  - `(auth)/sign-in.tsx`, `(auth)/sign-up.tsx`
  - `(tabs)/` — Home, Habits, Calendar, Community, Profile
  - `tasks.tsx`, `coach.tsx`, `nutrition.tsx`, `settings.tsx`, `referral.tsx`
  - `community/new-post.tsx`, `journeys/new.tsx`, `journeys/[id].tsx`
  - `+not-found.tsx`
- `src/theme.ts` — design tokens (cyan/violet/pink gradient, glass cards, etc.)
- `src/store/useAppStore.tsx` — single React context + AsyncStorage persistence
  mirroring `web/src/store/useAppStore.js` (habits, tasks, posts, profile,
  settings, coach + nutrition chats).
- `src/components/` — `ScreenBackground`, `Card`, `GradientButton`, `BrandMark`,
  `Icon`, `Header`, `DonutChart`.

See [`../docs/web-frontend-walkthrough.md`](../docs/web-frontend-walkthrough.md)
for screen-by-screen reference (with screenshots) and the source-of-truth design
tokens.
