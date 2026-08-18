# เที่ยวไทย — Thailand Travel Map v2

Expo / React Native travel platform for exploring all 77 Thai provinces, saving places, planning trips, journaling, and tracking travel progress.

## What is included

- Expo Router app foundation (Expo SDK 57 / React Native 0.86)
- Home dashboard with personalized recommendations
- Interactive Thailand province map backed by real province GeoJSON boundaries
- 77-province catalog and province detail pages
- Place search with category / region / free-place filters
- Place Detail 2.0: gallery, hours, fees, best time, facilities, tags, nearby places, Google Maps link
- Persistent `ไปแล้ว` / `อยากไป` state using Zustand + AsyncStorage
- Visited dashboard and Wishlist
- Trip planner with multi-day itinerary generation
- Travel Journal with mood, rating and expenses
- Travel Analytics: national progress, regions, categories, achievements
- Onboarding personalization
- Offline-first local state + cached province GeoJSON + image disk cache
- Optional Supabase Auth and Cloud Sync

## Run

```bash
npm install
npx expo start
```

Then press `a` for Android, `i` for iOS, or `w` for web.

## Supabase (optional)

1. Copy `.env.example` to `.env`.
2. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Run `supabase/schema.sql` in the Supabase SQL Editor.
4. Open the profile icon in the app to sign in and use Cloud Sync / Restore.

Without Supabase the app remains fully usable in offline-first local mode.

## Map data

The map loads `provinces.geojson` from `chingchai/OpenGISData-Thailand` and stores a local cache after the first successful request. Province state coloring is handled locally by the app.

## Main structure

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
  PlaceCard.tsx
  ThailandMap.tsx
constants/theme.ts
data/catalog.ts
lib/
  cloudSync.ts
  supabase.ts
store/useTravelStore.ts
supabase/schema.sql
types/index.ts
```

## Notes

The province layer covers all 77 provinces. The bundled attraction catalog is a curated seed dataset and the data model is ready for a larger production catalog or Supabase-backed content service.
