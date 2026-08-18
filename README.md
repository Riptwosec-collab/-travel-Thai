# เที่ยวไทย — THAILAND GLASS

Premium Thailand travel platform built with Expo / React Native. The application covers all 77 Thai provinces, interactive map tracking, Wishlist / Visited, Smart Trip Planner, detailed trip text import, Travel Journal, Analytics, optional Supabase cloud sync, and offline-first local state.

## Live App

**Production:** https://travel-thai.vercel.app

Key routes:

- Home: https://travel-thai.vercel.app/
- Thailand Map: https://travel-thai.vercel.app/map
- Trips: https://travel-thai.vercel.app/trips
- Visited: https://travel-thai.vercel.app/visited
- Wishlist: https://travel-thai.vercel.app/wishlist
- Journal: https://travel-thai.vercel.app/journal
- Analytics: https://travel-thai.vercel.app/analytics

## THAILAND GLASS

The UI layer is designed as a **Premium Travel Operating System** inspired by tropical Thailand photography and translucent liquid-glass interfaces.

- Aqua / Cyan / Turquoise / Teal glass surfaces
- Champagne Gold accent
- Cinematic Thailand travel backgrounds
- Frosted and layered translucent panels
- Soft reflection / bloom / ambient shadow
- Responsive mobile, tablet, and desktop layouts
- Page-enter, hover, press, progress, map, and modal motion
- Floating glass bottom navigation with Quick Add
- Interactive 77-province map with Visited / Wishlist states
- Cinematic Place and Province detail screens
- Glass Travel Journal memory cards
- Premium Travel Analytics with SVG charts

The shared design system lives in:

```text
components/glass/
  index.tsx
  GlassBottomTabBar.tsx
constants/
  glassTheme.ts
```

## Preserve → Refactor → Upgrade → Integrate

The Thailand Glass work is a UI/UX refactor. Existing product logic is preserved rather than replaced.

Preserved systems include:

- Home and Search
- Real 77-province GeoJSON map
- Visited / Wishlist persistence
- Smart Trip Planner
- Trip Auto Fill
- Detailed Trip Text Import
- Multi-day itinerary / timeline
- Budget fields and detailed budget summaries
- Accommodation and packing data
- Journal
- Analytics
- Province Detail
- Place Detail
- Onboarding and Account
- Zustand + AsyncStorage Store
- Optional Supabase Auth / Cloud Sync / Restore
- Offline-first behavior and GeoJSON cache
- Existing catalog and business logic

The original Trip Planner implementation is preserved as `components/TripPlannerCore.tsx` and the route applies the Thailand Glass atmosphere around it. This keeps existing persisted trip structures and planning behavior compatible.

## Main capabilities

- Expo Router app foundation (Expo SDK 57 / React Native 0.86)
- Home dashboard with real travel progress and personalized recommendations
- Interactive Thailand province map backed by real province GeoJSON boundaries
- 77-province catalog and province detail pages
- Place search with category / region / free-place filters
- Place detail: gallery, hours, fees, best time, facilities, tags, nearby places, Maps action
- Persistent `ไปแล้ว` / `อยากไป` state using Zustand + AsyncStorage
- Visited and Wishlist dashboards
- Smart Trip Planner with detailed itinerary generation and long-text import
- Travel Journal with mood, rating, expenses, and location
- Travel Analytics: national progress, regions, categories, trips, expenses, achievements
- Onboarding personalization
- Offline-first local state + cached province GeoJSON + image disk cache
- Optional Supabase Auth and Cloud Sync

## Run locally

```bash
npm install
npx expo start
```

Then press `a` for Android, `i` for iOS, or `w` for web.

## Supabase (optional)

1. Copy `.env.example` to `.env`.
2. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Run `supabase/schema.sql` in the Supabase SQL Editor.
4. Open Account in the app to sign in and use Cloud Sync / Restore.

Without Supabase the application remains usable in offline-first local mode.

## Map data

The map loads `provinces.geojson` from `chingchai/OpenGISData-Thailand` and caches it locally after the first successful request. Province state coloring is derived from the existing application store.

## Project structure

```text
app/
  (tabs)/
    index.tsx
    map.tsx
    visited.tsx
    wishlist.tsx
    trips.tsx
  _layout.tsx
  account.tsx
  analytics.tsx
  journal.tsx
  onboarding.tsx
  place-detail.tsx
  province-detail.tsx
  search.tsx
components/
  glass/
    index.tsx
    GlassBottomTabBar.tsx
  AccountCore.tsx
  OnboardingCore.tsx
  SearchCore.tsx
  TripPlannerCore.tsx
  PlaceCard.tsx
  StatusMapDashboard.tsx
  ThailandMap.tsx
constants/
  glassTheme.ts
  theme.ts
data/
  catalog.ts
  provinceInfo.ts
lib/
  cloudSync.ts
  supabase.ts
store/
  useTravelStore.ts
supabase/
  schema.sql
types/
  index.ts
utils/
  tripTextParser.ts
```

## Notes

The province layer covers all 77 provinces. The bundled attraction catalog is a curated seed dataset; the existing data model remains ready for a larger catalog or Supabase-backed content service.
