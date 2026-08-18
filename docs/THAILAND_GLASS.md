# THAILAND GLASS — Implementation Guide

This document describes the visual system applied to the existing **เที่ยวไทย / Travel Thai** application.

## Principle

**Preserve → Refactor → Upgrade → Integrate**

The design upgrade does not replace the product model or remove existing features. Existing Zustand state, AsyncStorage persistence, optional Supabase sync, Expo Router routes, GeoJSON map, trip text parser, trip Auto Fill, detailed itineraries, Journal and Analytics remain the source of truth.

## Visual language

- Tropical Thailand photography as atmospheric backgrounds
- Aqua / cyan / turquoise / teal glass layers
- Champagne gold as a restrained accent
- Translucent white borders and highlights
- Soft ambient shadows instead of heavy black elevation
- Web backdrop blur and saturation through `backdrop-filter`
- Rounded 22–34px surfaces
- Slow background zoom, page-enter motion, hover lift, spring press feedback
- Responsive centered app canvas on desktop rather than stretched mobile layouts

## Shared components

`components/glass/index.tsx`

- `GlassScreen` — animated travel-photo background, tint, bloom and depth layers
- `GlassCard` — reusable frosted surface and reflection
- `GlassPressable` — hover/press motion
- `GlassCircleButton` — floating glass controls
- `GlassSearch` — translucent search input/action
- `GlassChip` — filter/status chips
- `GlassSection` — shared visual hierarchy for sections
- `GlassProgress` — animated progress
- `GlassPageEnter` — stagger/fade/translate page motion
- `GlassHeader` — consistent premium page header

`components/glass/GlassBottomTabBar.tsx`

- Floating Home / Map / + / Trips / Me navigation
- Center Quick Add button
- Quick Add actions for place search, trip creation, Journal and Wishlist

`constants/glassTheme.ts`

- Glass palette
- radius and spacing tokens
- reusable glass surface recipe

## Screen integration

### Home

- Real travel progress from `visitedProvinceIds`
- Glass search
- Quick actions
- Recommended places using the existing catalog and preferences
- Province suggestions

### Thailand Map

- Existing 77-province GeoJSON geometry preserved
- Visited / Wishlist state preserved
- New translucent province fills, legend, tooltip, zoom controls and glass province panel

### Trips

The existing planner is preserved as `components/TripPlannerCore.tsx`.

The core keeps:

- Smart Auto Fill
- Wishlist-driven planning
- detailed Thai text import
- DAY parsing
- schedules and activities
- route stops
- accommodations
- budget breakdowns and budget tiers
- packing lists
- important notes
- persisted old trips

The `/trips` route places the existing planner inside the Thailand Glass atmosphere instead of rebuilding it with reduced capability.

### Place Detail

- Cinematic hero
- Favorite / share
- Info / navigation / review / Journal actions
- gallery, hours, fees, best time, duration, facilities, tags, coordinates and nearby places

### Province Detail

- Hero and status actions
- metrics
- tabs for recommendation / attractions / lodging / food / activities
- existing province information and catalog data only

### Visited / Wishlist

The existing `StatusMapDashboard` remains intact, including map interactions, statistics, selected province lists and selected place lists. The routes now run inside the Thailand Glass atmosphere.

### Journal

- Existing journal fields preserved: location, note, mood, rating and expense
- Memory cards use associated place imagery

### Analytics

- Real province progress
- total trips / trip days / expenses
- six-month trip line visualization
- region progress
- visited category visualization
- existing achievements

### Search / Account / Onboarding

Original logic is preserved in Core components and wrapped in the shared atmosphere so search behavior, cloud sync/auth and onboarding preferences do not regress.

## Performance

- Existing `expo-image` memory/disk caching retained
- Province GeoJSON AsyncStorage cache retained
- Background movement uses the native Animated driver
- Progress width animation is constrained to lightweight values
- No new heavy visual dependency was introduced
- Existing Store and data structures are reused to avoid duplicated state

## Live application

https://travel-thai.vercel.app
