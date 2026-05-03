# Phase 4 Design — Supporting Screens

**Date:** 2026-05-03
**Status:** Approved

---

## Context

Phase 3 delivered the core Feed experience: cards fetched from Supabase, composited client-side with the user's photo and name, shareable/downloadable. Phase 4 completes the app's main screens: a full ProfileScreen with Identity Vault, a UGC CreateScreen for uploading custom greeting cards, a bottom tab navigator tying all screens together, and a `useUserProfile` hook centralising all profile data operations.

---

## 1. Navigation Restructure

`MainStack.tsx` (NativeStack) is replaced by `MainTabs.tsx` (BottomTabNavigator) with 4 tabs:

| Tab | Icon | Screen |
|---|---|---|
| Discover | sparkle | FeedScreen (existing) |
| Create | add_circle | CreateScreen |
| Collections | library_books | CollectionsScreen (stub) |
| Profile | person | ProfileScreen |

The tab bar is a **custom component** `BottomTabBar.tsx`:
- Background: solid `#fcf9f4` (`backdropFilter` not supported in React Native without a native module)
- Top corners: `borderRadius: 32`
- Upward ambient shadow: `shadowOffset: {x:0, y:-8}`, blur 24, opacity 6%
- Active tab: pill highlight `backgroundColor: '#f0ede9'`, icon + label in `#9d3d2c`
- Inactive tabs: icon + label in `#89726d`

`RootNavigator.tsx` replaces `MainStack` import with `MainTabs`. No other change.

`CollectionsScreen.tsx` is a stub: centered text "Collections coming soon."

---

## 2. ProfileScreen

Single `ScrollView` with `SafeAreaView` top inset, `paddingBottom` for tab bar height.

### 2a. Hero Section
- Circle photo: 140×140px, `borderRadius: 70`
- Edit button: 36×36 `#9d3d2c` circle overlaid at bottom-right of photo. Tapping opens `PhotoUploader` in a modal.
- Name: Noto Serif bold, 28px, `#1c1c19`
- Premium badge: `#dbe3c5` pill, "PREMIUM" text, shown only when `isPremium === true`

### 2b. Stats Row
4 equal tiles in a `flexDirection: 'row'`: Collections · Followers · Saved · Featured.
- All display `0` — hardcoded display only, no interaction
- Tile background: `#f6f3ee`, number: `#9d3d2c` (Noto Serif bold 22px), label: `#56423e` (12px)

### 2c. Identity Vault
White card (`#ffffff`) with title "Identity Vault" and subtitle "Switch between your curated visual identities."

Horizontal row of up to 5 circle slots (96×96px each):
- **Primary photo**: `#9d3d2c` ring (`borderWidth: 3`), full opacity, "Primary" label below
- **Other photos**: opacity 0.6, "Set Primary" label below on tap
- **Empty slot(s)**: dashed border circle with `+` icon, tapping opens `PhotoUploader`

Tapping a non-primary photo calls `setPrimaryPhoto(url)`:
1. Updates `profiles.primary_photo_url` in Supabase
2. Updates `userStore.setPrimaryPhotoUrl` → Feed cards re-render instantly

Uploading via empty slot calls `addPhoto(url)`:
1. Appends to `profiles.photos` in Supabase
2. Updates `userStore.setPhotos`
3. If first photo ever, also calls `setPrimaryPhoto`

Max 5 photos enforced: empty slot hidden when `photos.length >= 5`.

### 2d. Account Settings
List rows on `#f6f3ee` background:
- Notifications & Updates → `Alert('Coming soon')`
- Privacy & Security → `Alert('Coming soon')`
- Appearance & Theme → `Alert('Coming soon')`
- Sign Out → `supabase.auth.signOut()` + `userStore.reset()`

Each row: icon in `#f0ede9` circle (40×40), label in `#1c1c19`, chevron in `#89726d` (except Sign Out which is `#ba1a1a` toned).

---

## 3. CreateScreen

Single scrollable screen. Three phases revealed progressively (no navigation between steps).

### Phase 1 — Pick Image
Full-width dashed-border zone (`borderStyle: 'dashed'`, `borderColor: '#89726d'`). Tapping opens `expo-image-picker` (gallery only). Once picked:
- Image fills zone maintaining native aspect ratio
- Zone height adjusts to fit
- "Change" button appears top-right

### Phase 2 — Position Slots (revealed after image picked)
Image renders inside a `View` of width `screenWidth - 32`. Two `PanResponder`-driven overlays:

**Photo handle:**
- Semi-transparent `rgba(157, 61, 44, 0.7)` circle with person icon
- `PanResponder` tracks drag, clamped to image bounds
- Horizontal slider below: circle size 60–160px (at preview width)
- Default position: centered, top 20% of image

**Name handle:**
- Pill label showing user's actual name, `rgba(0,0,0,0.5)` background, white text
- `PanResponder` tracks drag, clamped to image bounds
- Default position: centered, bottom 15% of image

Reset button restores both handles to defaults.

**Coordinate normalisation on save:**
```
savedCoord = previewCoord × (400 / previewWidth)
```
This is the inverse of QuoteCard's runtime scaling (`scale = renderedWidth / 400`).

### Phase 3 — Publish Settings (revealed after slots positioned)
- **Category picker**: horizontal scrollable chips (reuses `CategoryChips`, omits 'all'). Nothing selected by default (null category = uncategorized, appears only under 'All').
- **Visibility toggle**: two-option pill — "My Cards" (private) / "Community" (public). Defaults to "My Cards".
- **Publish button**: `#9d3d2c → #bd5541` gradient CTA.

**Publish flow:**
1. Upload image to `storage.user-photos` at `{uid}/cards/{timestamp}.jpg`
2. Insert row into `public.cards`: `created_by = uid`, `is_public`, `category` (null if none), `photo_slot`, `name_slot`
3. On success: render live `QuoteCard` preview with Share + Download buttons (reuses `shareCard`/`downloadCard`)
4. "Create Another" button resets all state

---

## 4. `useUserProfile` Hook

**Location:** `src/hooks/useUserProfile.ts`

**Interface:**
```typescript
const { loading, fetchProfile, updateName, addPhoto, setPrimaryPhoto, signOut } = useUserProfile();
```

**Responsibilities:**
- `fetchProfile(uid)` — reads `profiles` row, writes all fields to `userStore`. Replaces inline logic in `RootNavigator`.
- `updateName(name)` — upserts `profiles.name`, updates `userStore.setName`
- `addPhoto(url)` — fetches current `profiles.photos` array, appends the new url, then updates the full array in one `supabase.from('profiles').update({ photos: [...current, url] })` call. Updates `userStore.setPhotos`. If first photo, also calls `setPrimaryPhoto`.
- `setPrimaryPhoto(url)` — updates `profiles.primary_photo_url`, updates `userStore.setPrimaryPhotoUrl`
- `signOut()` — calls `supabase.auth.signOut()` then `userStore.reset()`

All mutating functions: `async`, try/catch, no optimistic updates. `loading` reflects any in-flight call.

---

## 5. Database Migration

**File:** `supabase/migrations/20250504000001_ugc_cards.sql`

```sql
ALTER TABLE public.cards
  ADD COLUMN created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN is_public  boolean NOT NULL DEFAULT true;

-- Replace public read policy to handle UGC visibility
DROP POLICY "cards: public read" ON public.cards;

CREATE POLICY "cards: public read" ON public.cards
  FOR SELECT USING (
    created_by IS NULL         -- admin-curated card
    OR is_public = true        -- public user card
    OR created_by = auth.uid() -- own private card
  );

CREATE POLICY "cards: user insert" ON public.cards
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
  );
```

Existing seed cards remain unchanged (`created_by = null`, `is_public = true` default).

---

## Files to Create / Modify

| Action | File |
|---|---|
| Replace | `src/navigation/MainStack.tsx` → `MainTabs.tsx` |
| Create | `src/components/BottomTabBar.tsx` |
| Create | `src/screens/main/CollectionsScreen.tsx` (stub) |
| Implement | `src/screens/main/ProfileScreen.tsx` |
| Implement | `src/screens/main/CreateScreen.tsx` |
| Create | `src/hooks/useUserProfile.ts` |
| Update | `src/navigation/RootNavigator.tsx` (import MainTabs) |
| Create | `supabase/migrations/20250504000001_ugc_cards.sql` |

---

## Verification

1. Bottom tab bar renders correctly on device, active tab highlighted
2. Profile → Identity Vault: tap a non-primary photo → Feed cards instantly update
3. Profile → add photo via empty slot → new photo appears in vault
4. Profile → Sign Out → lands on WelcomeScreen
5. Create → pick image → drag handles move freely within bounds → publish → card appears in feed under correct category
6. Create → publish private → card NOT visible in feed for other users (verify via RLS)
7. `npx tsc --noEmit` clean
