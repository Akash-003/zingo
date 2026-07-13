# Zingo (codebase: QuoteFlow) — Claude Code Project Context

> Read this file fully before writing any code. It contains everything you need
> to understand the project, its architecture, design integration, and coding conventions.

> **Branding note:** The app ships to users as **Zingo** ("Daily status app") and the
> native bundle/package ids are `com.footprint.zingo` (renamed pre-release, before any
> store upload). The codebase, repo, Expo `slug`, and deep-link `scheme` are still
> `quoteflow` **on purpose** — they are tied to the EAS project and the Supabase
> Google-OAuth redirect, so renaming them would break updates, builds, and sign-in.
> So: **user-facing strings + store ids = "Zingo"; slug/scheme = "quoteflow".**
> See §19 for the full rebrand map.

---

## 1. What This App Is

**Zingo** is a React Native mobile app (iOS + Android) for discovering, personalizing,
and sharing quote/status cards on social media (WhatsApp, Instagram, Facebook).

The app's **core differentiator**: every quote card automatically composites the user's
own photo and name directly into the card design — not as a watermark, but as a structural
design element. The personalized card image is exactly what gets shared.

Think of it as: *"Your face. Your name. On every card. Every day."*

Reference app for inspiration: **Crafto** (https://crafto.app)

---

## 2. Tech Stack

| Layer              | Tool                              | Notes                                                  |
|--------------------|-----------------------------------|--------------------------------------------------------|
| Framework          | React Native + Expo (managed)     | Expo SDK ~54. Avoid bare workflow.                     |
| Language           | TypeScript                        | Strict mode. No `any` types.                           |
| Navigation         | React Navigation v6               | Stack + Bottom Tabs                                    |
| State Management   | Zustand                           | One store per domain (user, cards, ui)                 |
| Auth               | Supabase Auth                     | Native Google Sign-In + native Truecaller (Android) + Anonymous |
| Database           | Supabase PostgreSQL               | profiles, cards, analytics_events tables               |
| File Storage       | Supabase Storage                  | user-photos bucket (profile pics), cards bucket        |
| Image Compositing  | react-native-view-shot            | Captures card View as image for share/download         |
| Background Removal | Remove.bg API                     | Strips photo background before placing on card         |
| Sharing            | expo-sharing + expo-media-library | Share/save composited image                            |
| Photo Picker       | expo-image-picker                 | Camera + Gallery access                                |
| Payments           | Razorpay Subscriptions            | Native SDK + Supabase Edge Functions (secret server-side) |
| Push Notifications | expo-notifications                | Token stored in profiles.push_token                    |
| Analytics          | Supabase + Firebase Analytics     | track() dual-writes: analytics_events table (owned raw data) + Firebase/GA4 (dashboards). Android needs google-services.json at prebuild; iOS unwired (needs GoogleService-Info.plist + static frameworks) |
| Splash Screen      | expo-splash-screen + BrandSplash  | Two-layer: native system splash + in-app lockup (§19)  |

---

## 3. Design System — Stitch MCP Integration

**This project uses Google Stitch for UI design. The Stitch MCP server is already configured.**

### How to use Stitch designs in code

Every screen was designed in Stitch. Before building any screen component:

1. Use the Stitch MCP tool `get_screen_image` to visually inspect the screen design
2. Use `get_screen_code` to get the HTML/CSS reference for that screen
3. Translate the design to React Native (see conversion rules below)
4. Read `DESIGN.md` (in project root) for design tokens — always reference it for
   colors, spacing, typography, and border radius values

### Stitch → React Native conversion rules

| HTML/CSS               | React Native equivalent                          |
|------------------------|--------------------------------------------------|
| `div`                  | `View`                                           |
| `p`, `span`, `h1–h6`  | `Text`                                           |
| `img`                  | `Image`                                          |
| `input`                | `TextInput`                                      |
| `button`               | `TouchableOpacity` or `Pressable`                |
| CSS `flexbox`          | RN StyleSheet flex (same concepts, no `px`)      |
| CSS `border-radius`    | RN `borderRadius` (numeric, no `px`)             |
| CSS class              | `StyleSheet.create({})` object                   |
| `position: absolute`   | RN `position: 'absolute'`                        |
| `overflow: hidden`     | RN `overflow: 'hidden'`                          |
| `box-shadow`           | RN `shadow*` props (iOS) + `elevation` (Android) |

> Never use CSS strings in React Native. Always use StyleSheet.create().
> Never use `px` units. Use numeric values only.

---

## 4. Project Structure

```
QuoteFlow/
├── CLAUDE.md                  ← You are here
├── DESIGN.md                  ← Stitch design tokens (do not edit)
├── app.config.js              ← Expo config (dynamic, reads from .env)
├── eas.json                   ← EAS Build profiles (development/preview/production)
├── App.tsx                    ← Entry point. preventAutoHideAsync() + NavigationContainer
│                                + renders <BrandSplash> overlay until it finishes
├── assets/                    ← Zingo brand assets (icon, adaptive layers, splash, notif)
├── supabase/
│   └── migrations/            ← SQL migrations; apply with: npx supabase db push
├── docs/                      ← GitHub Pages site for zingo.digitalftprints.com (CNAME here).
│                                Landing page (index.html: launch countdown → auto-swaps to Play
│                                Store button at zero), privacy-policy/, delete-account/.
│                                Static HTML, no build — deploy = push to main.
├── src/
│   ├── navigation/
│   │   ├── RootNavigator.tsx  ← onAuthStateChange → AuthStack / ProfileSetup / MainTabs
│   │   ├── AuthStack.tsx      ← Welcome → ProfileSetup
│   │   ├── MainTabs.tsx       ← Bottom tab nav: Discover / Create / Collections / Profile(stack)
│   │   ├── MainStack.tsx      ← Feed / Create / Profile stack (non-tab push nav)
│   │   └── ProfileStack.tsx   ← ProfileMain → Subscription + 3 admin screens
│   │
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── WelcomeScreen.tsx       ← Google + Truecaller + Guest login (hosts useTruecaller)
│   │   │   ├── PhoneEntryScreen.tsx    ← Exists but not wired (legacy OTP flow, unused)
│   │   │   ├── OTPScreen.tsx           ← Exists but not wired (legacy OTP flow, unused)
│   │   │   └── ProfileSetupScreen.tsx  ← Name + photo + live card preview
│   │   ├── main/
│   │   │   ├── FeedScreen.tsx          ← Category chips + snapping card feed (Discover tab)
│   │   │   ├── CreateScreen.tsx        ← Upload card image + drag photo/name slots
│   │   │   ├── CollectionsScreen.tsx   ← 2-column grid of user-created cards
│   │   │   ├── ProfileScreen.tsx       ← Identity Vault (up to 5 photos) + settings + __DEV__ admin links
│   │   │   └── SubscriptionScreen.tsx  ← Zingo Premium plans + subscribe/cancel
│   │   └── admin/                      ← __DEV__-only card-personalization tooling (§6)
│   │       ├── CardReviewScreen.tsx       ← Review seed cards: does this design have a name area?
│   │       ├── NameSlotAdjustScreen.tsx   ← Drag/tune name_slot for seed cards
│   │       └── PhotoSlotAdjustScreen.tsx  ← Drag/tune photo_slot for seed cards
│   │
│   ├── components/
│   │   ├── cards/
│   │   │   └── QuoteCard.tsx           ← Core renderer: card image + photo + name overlay
│   │   ├── BottomTabBar.tsx            ← Custom tab bar component
│   │   ├── CategoryChips.tsx           ← Single-line scrollable filter chips with
│   │   │                                 scroll-driven edge fade gradients + peek (§19)
│   │   ├── BrandSplash.tsx             ← Full-screen in-app Zingo lockup splash overlay (§19)
│   │   ├── AppAlert.tsx                ← Global alert host (driven by alertStore)
│   │   ├── PaywallModal.tsx            ← Subscribe-or-share-plain paywall
│   │   ├── ActionButtons.tsx           ← Share / Save / Photo / Name buttons
│   │   └── PhotoUploader.tsx           ← Image picker → Remove.bg → Supabase Storage
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                  ← Native Google (ID token) + Truecaller + anonymous via Supabase
│   │   ├── useUserProfile.ts           ← fetch/update name, photos, primaryPhoto, signOut
│   │   ├── useCards.ts                 ← Paginated card fetch with useRef loading guard
│   │   └── useCardCapture.ts           ← react-native-view-shot capture logic
│   │
│   ├── services/
│   │   ├── supabase.ts                 ← Supabase client init (reads from app.config.js extra)
│   │   ├── analytics.ts                ← track(uid, event, props) → analytics_events table
│   │   ├── notifications.ts            ← registerForPushNotifications(uid)
│   │   ├── backgroundRemoval.ts        ← Remove.bg API integration
│   │   ├── payments.ts                 ← Razorpay subscribe/cancel via Edge Functions
│   │   └── sharing.ts                  ← expo-sharing (share) + expo-media-library (save)
│   │
│   ├── store/
│   │   ├── userStore.ts                ← uid, name, primaryPhotoUrl, photos[], isPremium
│   │   ├── cardsStore.ts               ← currentCategory, cards[], appendCards (ID-deduped)
│   │   ├── alertStore.ts               ← global app-alert queue (consumed by AppAlert)
│   │   └── uiStore.ts                  ← loading states, modals
│   │
│   ├── utils/
│   │   └── logger.ts                   ← dev-gated console wrapper (logger.log/warn/error). Use instead of console.*
│   │
│   └── types/
│       └── react-native-razorpay.d.ts ← ambient types for the untyped native module
│
├── scripts/
│   └── detect-photo-slots.js          ← one-time: Gemini Vision auto-detects photo_slot for seed cards
```

---

## 5. Screen Inventory & Stitch Screen Mapping

| Screen File              | Screen Name          | Stitch Route     |
|--------------------------|----------------------|------------------|
| `WelcomeScreen.tsx`      | Welcome / Login      | `/welcome`       |
| `ProfileSetupScreen.tsx` | Profile Setup        | `/profile-setup` |
| `FeedScreen.tsx`         | Main Feed            | `/feed`          |
| `CollectionsScreen.tsx`  | My Cards             | `/collections`   |
| `CreateScreen.tsx`       | Create Card          | `/create`        |
| `ProfileScreen.tsx`      | User Profile         | `/profile`       |
| `SubscriptionScreen.tsx` | Zingo Premium        | (no Stitch route) |
| `admin/*` (3 screens)    | Card-slot tooling    | (no Stitch route; `__DEV__` only) |

---

## 6. Core Feature — Photo Compositing

This is the most important technical feature.

### How it works

```
User selects photo (expo-image-picker)
        ↓
Remove.bg API strips background → returns transparent PNG
        ↓
PNG stored in Supabase Storage (user-photos bucket) → URL saved to profiles table
        ↓
QuoteCard renders:
  <View ref={cardRef} collapsable={false}>   ← collapsable=false required for view-shot
    <Image source={{ uri: card.imageUrl }}   ← pre-designed server card image
           style={StyleSheet.absoluteFill} />
    <Image source={{ uri: user.primaryPhotoUrl }}  ← user photo, absolutely positioned
           style={scaledPhotoSlot} />
    <Text style={scaledNameSlot}>            ← user name, absolutely positioned
      {user.name}
    </Text>
  </View>
        ↓
react-native-view-shot captures the View as a PNG tmpfile
        ↓
That captured image is what gets shared / downloaded (watermark baked in for free users)
```

### Card slot coordinate system

All `photo_slot` and `name_slot` values in the DB are **authored at 400px canvas width**.
`QuoteCard` applies `scale = renderedWidth / 400` at runtime. Never change DB slot values
to match device screen widths.

```typescript
interface PhotoSlot {
  style: 'portrait' | 'circle';
  top: number; left: number; width: number; height: number;
  borderRadius: number; // 9999 for circle, 0 for portrait fill
}

interface NameSlot {
  top?: number; bottom?: number; left?: number; right?: number;
  fontSize: number; color: string; fontWeight?: 'normal' | 'bold';
}
```

### Authoring slots for seed cards (admin tooling)

Seed cards (`created_by IS NULL`) get their `photo_slot` / `name_slot` authored via internal
tools — all gated behind `__DEV__` and reached from `ProfileScreen`:

1. `scripts/detect-photo-slots.js` — one-time bulk pass: Gemini Vision detects the photo
   placeholder in each card image and writes `photo_slot`. Run with
   `node scripts/detect-photo-slots.js [--dry-run]` (needs `GEMINI_API_KEY` + `SUPABASE_SERVICE_KEY`).
2. `CardReviewScreen` — human confirms whether a card even has a name area
   (`admin_review_card`); if not, `name_slot` is cleared and `name_slot_reviewed` set.
3. `NameSlotAdjustScreen` / `PhotoSlotAdjustScreen` — drag-tune the slots on-device,
   persisted via the `admin_update_name_slot` / `admin_update_photo_slot` RPCs.

All admin RPCs are `SECURITY DEFINER` and only touch seed cards. Slots stay in the 400px
canvas coordinate system above.

### Paywall model

All content is free to browse. Premium = watermark-free sharing/downloading.
Free users get `"Made with Zingo"` baked onto every shared/saved image via
`showWatermark={!isPremium}` on `QuoteCard`.

---

## 7. Supabase Data Model

```
profiles (id = auth.uid())
  name text
  primary_photo_url text
  photos text[]
  is_premium boolean default false
  push_token text              ← Expo push token, set after permission granted
  created_at timestamptz

cards
  id uuid
  image_url text              ← pre-designed card image in Supabase Storage
  category text               ← 'good-morning' | 'motivational' | 'love' | 'birthday' |
                                  'good-night' | 'festivals' | 'shayari' | 'devotional' |
                                  'friendship' | 'life'
  is_premium boolean
  is_public boolean           ← user-created cards can be public (community) or private
  created_by uuid nullable    ← NULL for seed cards, uid for user-created cards
  supports_personalization boolean default true
                              ← false = design has no room for a user photo/name;
                                rendered as a plain card (no overlay, no Photo/Name
                                buttons). Watermark/paywall still apply.
  photo_slot jsonb nullable   ← PhotoSlot (see above); NULL when not personalizable
  name_slot jsonb nullable    ← NameSlot (see above); NULL when not personalizable
  name_slot_reviewed boolean default false
                              ← seed-card admin QA flag; set true once a human confirms
                                (or clears) the name area via CardReviewScreen
  created_at timestamptz

  -- Admin RPCs (SECURITY DEFINER, seed cards only i.e. created_by IS NULL):
  --   admin_review_card(card_id, has_name_area)  → sets name_slot_reviewed (clears name_slot if no area)
  --   admin_update_name_slot(card_id, slot_value)
  --   admin_update_photo_slot(card_id, slot_value)

analytics_events
  id uuid
  uid uuid
  event_name text             ← view_card | share_card | download_card | change_photo |
                                  card_published | category_selected | paywall_shown |
                                  purchase_completed
  properties jsonb            ← { card_id?, category?, is_premium?, plan_id? }
  created_at timestamptz
  RLS: insert-only by owner (uid = auth.uid()). No client reads.
```

Migrations live in `supabase/migrations/`. Apply with: `npx supabase db push`

---

## 8. Auth Flow

```
WelcomeScreen
  ├── "Continue with Google" → native GoogleSignin → ID token → supabase.auth.signInWithIdToken
  ├── "Continue with Truecaller" (Android) → useTruecaller (authorizationCode + PKCE verifier)
  │        → truecaller-auth Edge Function (re-verifies server-side, returns email + single-use
  │          OTP token) → supabase.auth.verifyOtp({ type: 'email' })
  └── "Continue as Guest"    → supabase.auth.signInAnonymously()
                                     ↓ all three land on ↓
                              ProfileSetupScreen (if no name) → MainTabs

RootNavigator logic (RootNavigator.tsx):
  no session           → AuthStack
  session, no name set → ProfileSetupScreen (inline, not in stack)
  session + name       → MainTabs
```

**Native auth (no more web OAuth).** Google uses `@react-native-google-signin/google-signin`
(configured with `GOOGLE_WEB_CLIENT_ID` — the *web* client id is the ID-token audience Supabase
verifies; the Android client id just authorizes the SHA-1). Truecaller uses
`@ajitpatel28/react-native-truecaller` — Android-only, needs the Truecaller app + `TRUECALLER_CLIENT_ID`
(baked at prebuild). Both are native modules → **require an EAS dev build** (not Expo Go).

`PhoneEntryScreen` / `OTPScreen` are legacy leftovers, not wired into navigation. Phone-style
auth is now provided by Truecaller, so don't revive them.

On sign-in, `RootNavigator` also calls `registerForPushNotifications(uid)` — non-blocking.

---

## 9. Category System

```typescript
const CATEGORIES = [
  { id: 'all', label: 'ALL' },
  { id: 'good-morning', label: 'Good Morning' },
  { id: 'motivational', label: 'Motivational' },
  { id: 'love', label: 'Love' },
  { id: 'birthday', label: 'Birthday' },
  { id: 'good-night', label: 'Good Night' },
  { id: 'festivals', label: 'Festivals' },
  { id: 'shayari', label: 'Shayari' },
  { id: 'devotional', label: 'Devotional' },
  { id: 'friendship', label: 'Friendship' },
  { id: 'life', label: 'Life' },
];
```

Active chip: filled with primary brand color. Inactive: outlined, white fill. Horizontally scrollable.

---

## 10. Coding Conventions

### General
- All components: functional, TypeScript props interface defined above the component
- No class components
- No inline styles — always `StyleSheet.create()`
- All async functions: try/catch with proper error handling
- Loading states: always show `ActivityIndicator` or skeleton

### Naming
- Screens: `PascalCase` + `Screen` suffix — e.g. `FeedScreen`
- Components: `PascalCase` — e.g. `QuoteCard`
- Hooks: `camelCase` + `use` prefix — e.g. `useUserProfile`
- Store files: `camelCase` + `Store` suffix — e.g. `cardsStore`
- Services: `camelCase` — e.g. `backgroundRemoval`

### Component structure
```typescript
// 1. Imports
// 2. Type definitions / interfaces
// 3. Component function
//    a. Hooks at top
//    b. Derived state / computed values
//    c. Handlers
//    d. useEffect blocks
//    e. Return JSX
// 4. StyleSheet.create({}) at bottom
// 5. Export default
```

---

## 11. Phase Status

| Phase | Description               | Status      |
|-------|---------------------------|-------------|
| 1     | Foundation                | ✅ Complete |
| 2     | Auth Screens              | ✅ Complete (native Google + Truecaller + Anonymous) |
| 3     | Core Feature (Feed/Cards) | ✅ Complete |
| 4     | Supporting Screens        | ✅ Complete (Create, Profile, Collections) |
| 5     | Monetization & Polish     | 🔄 In progress |

**Phase 5 checklist:**
- ✅ Analytics — `analytics_events` table + `track()` wired into all key actions,
  incl. onboarding funnel (app_open → login_started/completed → profile_completed
  → home_viewed, joined by a per-install device_id). `track()` also dual-writes
  every event to Firebase Analytics (= Google Analytics 4, free dashboards/funnels).
- ✅ Push notifications — `expo-notifications`, token stored in `profiles.push_token`
- ✅ EAS Build config — `eas.json` with development / preview / production profiles
- ✅ Custom paywall + Razorpay Subscriptions (replaces RevenueCat). Triggered
  in `FeedScreen` `CardItem` when a free user taps Share/Save: choose "share
  without personalization" (plain card, watermark kept) or subscribe.
  - Plans are configurable via the `subscription_plans` table (mirrors the
    plans you create in the Razorpay dashboard) — see migration
    `20250615000001_subscriptions.sql`.
  - Client: `src/services/payments.ts` + `src/components/PaywallModal.tsx`.
  - Server (secret-holding): Supabase Edge Functions `create-subscription`,
    `verify-payment`, `cancel-subscription`, `razorpay-webhook` (plus
    `truecaller-auth` for native Truecaller sign-in — see §8). Set secrets with
    `supabase secrets set RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=... RAZORPAY_WEBHOOK_SECRET=...`.
    Deploy the webhook with `--no-verify-jwt`.
  - `is_premium`/`premium_expiry` are flipped **server-side only**; the app
    bundle carries only the public `RAZORPAY_KEY_ID`.
  - ⚠️ `react-native-razorpay` is a native module → **needs an EAS dev build**
    (no Expo Go) and does **not** officially support the New Architecture
    (`newArchEnabled: true` in `app.config.js`). Verify checkout in a dev
    build; if it fails under new arch, set `newArchEnabled: false`.
- ✅ Zingo rebrand — full brand swap (name, icon, adaptive icon, splash, notification
  icon, favicon, in-app strings). Internal ids kept as `quoteflow`. See §19.
- ✅ Splash — two-layer splash (native `expo-splash-screen` system splash + in-app
  `<BrandSplash>` lockup overlay). See §19.
- ✅ App icon / splash / notification assets — present in `assets/` and wired in
  `app.config.js`. (Designed brand assets delivered by the user.)
- ⬜ `EAS_PROJECT_ID` — run `eas init` to generate, then add to `.env`

---

## 12. Quick Start (New Developer Setup)

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | https://nodejs.org |
| Expo CLI | latest | `npm install -g expo-cli` |
| Supabase CLI | latest | `brew install supabase/tap/supabase` |
| EAS CLI | latest | `npm install -g eas-cli` |
| iOS Simulator | — | Xcode (Mac only) |
| Android Emulator | — | Android Studio |

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in values — see Section 13 for where to get each one
```

### 3. Apply database migrations

```bash
npx supabase login          # one-time auth
npx supabase link           # link to your Supabase project
npx supabase db push        # applies all migrations in supabase/migrations/
```

### 4. Run the app

```bash
npx expo start              # opens Expo dev tools
# Then press i (iOS simulator) or a (Android emulator)
```

---

## 13. Key Dependencies

All installed — `npm install` is all you need. Listed here so intent is clear.

| Package | Purpose |
|---------|---------|
| `expo ~54` | Managed workflow runtime |
| `@supabase/supabase-js` | Auth + DB + Storage client |
| `@react-navigation/native` + `bottom-tabs` + `native-stack` | Navigation |
| `zustand` | Lightweight state management |
| `react-native-view-shot` | Captures `<View>` as a PNG for share/download |
| `expo-image-picker` | Camera + photo library access |
| `expo-sharing` | System share sheet |
| `expo-media-library` | Save to camera roll |
| `expo-notifications` | Push notification token + local notifications |
| `expo-splash-screen` | Native system splash (config plugin) + preventAutoHideAsync/hideAsync control (§19) |
| `react-native-razorpay` | Native Razorpay checkout (needs an EAS dev build — not Expo Go) |
| `@react-native-google-signin/google-signin` | Native Google Sign-In → ID token for Supabase (EAS dev build) |
| `@ajitpatel28/react-native-truecaller` | Native Truecaller OAuth, Android only (EAS dev build) |
| `react-native-image-colors` | Extracts dominant colors from card images (e.g. name-slot contrast) |
| `@expo-google-fonts/dancing-script` + `expo-font` | Script/display font loading |
| `expo-system-ui` | System UI (nav/status bar) background color |
| `expo-web-browser` | OAuth redirect handling (legacy; native sign-in preferred) |
| `expo-linking` | Deep link / redirect URL construction |
| `expo-file-system` | File reads for binary upload to Supabase Storage |
| `expo-linear-gradient` | Gradient backgrounds in UI |
| `@expo/vector-icons` | Ionicons throughout the app |
| `@react-native-community/slider` | Slider control in CreateScreen |
| `react-native-url-polyfill` | Required by Supabase JS in React Native |
| `@react-native-async-storage/async-storage` | Supabase session persistence |
| `react-native-dotenv` + `dotenv` | `.env` → `process.env` in app.config.js |
| `react-native-safe-area-context` | Safe area insets |
| `react-native-screens` | Native screen containers for React Navigation |

---

## 14. Key Commands

```bash
# Start dev server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Install a package (always use expo install, not npm install, for Expo packages)
npx expo install <package-name>

# Apply Supabase migrations
npx supabase db push

# Read-only SQL against the linked remote DB (e.g. verify analytics_events — RLS blocks client reads)
npx supabase db query "select ..." --linked

# Type check
npx tsc --noEmit

# Build for internal testing (generates APK/IPA via EAS)
eas build --profile preview --platform android
eas build --profile preview --platform ios
```

---

## 16. Environment Variables

Store all secrets in `.env` (never commit). Accessed in code via
`Constants.expoConfig.extra` from `expo-constants`.

```
SUPABASE_URL=           ← Supabase dashboard → Project Settings → API → Project URL
SUPABASE_ANON_KEY=      ← Supabase dashboard → Project Settings → API → anon/public key
REMOVE_BG_API_KEY=      ← https://www.remove.bg/dashboard#api-key (free tier = 50/month)
GOOGLE_WEB_CLIENT_ID=   ← Google Cloud OAuth *web* client id (ID-token audience for Supabase)
TRUECALLER_CLIENT_ID=   ← Truecaller developer console app id (Android; baked at prebuild)
RAZORPAY_KEY_ID=        ← Razorpay dashboard → public key id (secret keys live server-side only)
EAS_PROJECT_ID=         ← run `eas init` in the project root; it writes this automatically
```

RevenueCat was dropped in favor of Razorpay Subscriptions (see §11) — no RevenueCat keys.

**Script-only (not in `extra`, used by `scripts/detect-photo-slots.js`):**
```
GEMINI_API_KEY=         ← https://aistudio.google.com/app/apikey (Gemini Vision, free tier)
SUPABASE_SERVICE_KEY=   ← Supabase service_role key — server/admin scripts only, NEVER ship in the app
```

**Edge Function secrets** (set with `supabase secrets set …`, never in the bundle):
`RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, and the Truecaller server credentials used by
the `truecaller-auth` function.

A `.env.example` is checked into the repo — copy it to `.env` and fill in values.

---

## 17. Technical Gotchas

**FlatList pagination — use `useRef` not `useState` as loading guard.**
`onEndReached` fires multiple times before React batches the state update. Pattern:
```typescript
const loadingRef = useRef(false);
if (loadingRef.current) return;
loadingRef.current = true;
// ... fetch ...
loadingRef.current = false;
```
Also deduplicate by ID in `appendCards` as a safety net against duplicate fetches.

**Slot coordinate system** — All `photo_slot` / `name_slot` values are authored at 400px
canvas width. `QuoteCard` applies `scale = renderedWidth / 400`. Never adjust DB values to
match device dimensions.

**FlatList viewability config must be stable.** `viewabilityConfig` must be a `useRef` (not
an inline object) and `onViewableItemsChanged` must be wrapped in `useCallback`. Inline
objects cause an infinite re-render loop.

**expo-notifications handler** — SDK 0.29+ requires `shouldShowBanner` and `shouldShowList`
alongside `shouldShowAlert` in `setNotificationHandler`. Omitting them causes a TypeScript
error and runtime warning.

**Cross-tab navigation** — From within a tab screen:
```typescript
navigation.navigate('Create' as never) // switches to Create tab
```

**Analytics — always fire-and-forget.** Never `await track()` in a UI event handler:
```typescript
void track(uid, 'share_card', { card_id: card.id });
```

**Android builds require JDK 17.** Android Studio's bundled JBR is JDK 21 and fails
`react-native-image-colors:compileDebugKotlin` with "Inconsistent JVM-target compatibility
(17 vs 21)". Set `JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64` before `expo run:android`
or any Gradle build.

**Verifying Firebase Analytics on-device:** enable with `adb shell setprop
debug.firebase.analytics.app com.footprint.zingo` (DebugView) plus `adb shell setprop
log.tag.FA VERBOSE` and `log.tag.FA-SVC VERBOSE`; then `adb logcat -s FA FA-SVC` shows
every logged event locally. Disable: `adb shell setprop debug.firebase.analytics.app .none.`

**`collapsable={false}` on QuoteCard root View** — Required for `react-native-view-shot`
to capture the View correctly on Android. Without it, the View may be optimized away.

**Splash uses `expo-splash-screen` config plugin, NOT the legacy `splash` key.** On Expo
SDK 54 the legacy top-level `splash` key produces broken Android 12+ wiring (it sets
`android:windowBackground` to a full-bleed drawable with no `values-v31` theme). Always
configure splash through the `expo-splash-screen` plugin in `app.config.js`. After any
splash/icon/color change you MUST `npx expo prebuild --clean --platform android` — the
`android/` folder is generated/gitignored and these are baked at prebuild.

**Android 12+ system splash can only show a centered, circle-masked icon** — never a wide
logo+text lockup. That's why the full "Zingo / Daily status app" lockup is rendered by the
in-app `<BrandSplash>` overlay (§19) instead of the native splash, which gets only the
rounded Z mark (`assets/splash-mark.png`).

**Splash is compiled into the native binary** — JS-only reloads won't show splash changes.
To verify: `adb uninstall com.footprint.zingo` then `npx expo run:android`.

---

## 18. What NOT to Do

- ❌ Don't use CSS strings — always `StyleSheet.create()`
- ❌ Don't use `any` TypeScript type — define proper interfaces
- ❌ Don't store sensitive keys in code — use `.env`
- ❌ Don't use `console.log` in production code
- ❌ Don't share the raw photo URL — always share the composited card image
- ❌ Don't skip background removal — the transparent PNG is essential for compositing
- ❌ Don't use `npm install` for Expo packages — always `npx expo install`
- ❌ Don't change DB slot values to match screen widths — apply scale in `QuoteCard` instead
- ❌ Don't `await` analytics calls in UI handlers — use `void track(...)`
- ❌ Don't call `console.*` directly — use `logger` from `src/utils/logger.ts` (dev-gated)
- ❌ Don't revive `PhoneEntryScreen` / `OTPScreen` — phone auth is handled by Truecaller (§8)
- ❌ Don't ship `SUPABASE_SERVICE_KEY` in the app — it's for admin scripts only
- ❌ Don't rename `slug` / `scheme` to "zingo" — they must stay `quoteflow` (breaks EAS
  project linkage and the Supabase OAuth redirect). `bundleIdentifier` / `package` are
  already `com.footprint.zingo` — don't change them again post-release (store identity)
- ❌ Don't use the legacy `splash` config key — configure splash via the
  `expo-splash-screen` plugin (§19), then `prebuild --clean`

---

## 19. Branding & Splash (Zingo)

### Identity split — user-facing vs internal
The app is branded **Zingo** to users but keeps `quoteflow` internal identifiers.

| Identifier | Value | Why |
|------------|-------|-----|
| Expo `slug` | `quoteflow` (do NOT change) | Tied to the EAS project; renaming detaches updates/builds |
| `scheme` | `quoteflow` (do NOT change) | Supabase Google-OAuth redirect uses it; changing breaks sign-in |
| `ios.bundleIdentifier` / `android.package` | `com.footprint.zingo` (renamed pre-release 2026-07; do NOT change post-release) | Store + OAuth identity; Google OAuth Android client must be registered against this package + SHA-1 |
| `package.json` `name` | `quoteflow` | Internal only |
| GitHub repo | `Akash-003/zingo` (renamed 2026-07); local `origin` points at the new URL | — |

### User-facing "Zingo" strings (the rebrand map)
| Location | Value |
|----------|-------|
| `app.config.js` `name` | `Zingo` |
| `WelcomeScreen.tsx` | `Zingo` wordmark |
| `QuoteCard.tsx` watermark | `Made with Zingo` |
| `ProfileScreen.tsx` / `SubscriptionScreen.tsx` | `Zingo Premium` |
| `payments.ts` Razorpay checkout `name` | `Zingo Premium` |

### Brand tokens (from the delivered logo package)
Rose `#E11D48`, Orange `#F97316`, Amber `#FBBF24`, Ink `#1F2933`. Wordmark font: Baloo 2 700.
Splash/lockup background: cream `#fcf9f4`. Adaptive icon background: orange `#F97316`.

### Brand assets in `assets/`
| File | Source / content | Used by |
|------|------------------|---------|
| `icon.png` | full-bleed gradient Z (no transparency) | iOS app icon |
| `adaptive-icon.png` | white Z, transparent, safe-zone | Android adaptive foreground |
| `adaptive-background.png` | gradient | Android adaptive background |
| `splash-mark.png` | rounded gradient Z | **native system splash** (expo-splash-screen) |
| `splash-icon.png` | full horizontal lockup (icon + "Zingo" + "Daily status app") | **in-app `<BrandSplash>`** |
| `notification-icon.png` | white Z silhouette | expo-notifications small icon |
| `favicon.png` | small gradient Z | web favicon |

### Two-layer splash architecture
Android 12+ only renders a centered, circle-masked icon for the system splash, so the full
lockup can't live there. The solution is two layers:

1. **Native system splash** — `expo-splash-screen` plugin in `app.config.js`
   (`image: ./assets/splash-mark.png`, `imageWidth: 120`, `backgroundColor: '#fcf9f4'`).
   Shows the rounded **Z mark on cream** for the brief OS-controlled frame.
2. **In-app lockup** — `src/components/BrandSplash.tsx`, a full-screen overlay rendering
   the complete **Zingo lockup on cream**, unmasked, on every platform. Holds
   `HOLD_DURATION` (900ms) then fades out over `FADE_DURATION` (350ms).

Wiring in `App.tsx`:
- `SplashScreen.preventAutoHideAsync()` at module load keeps the native splash up so there's
  no blank flash before the overlay mounts.
- `<BrandSplash onFinish={...}>` renders while `!brandSplashDone`; it calls
  `SplashScreen.hideAsync()` on mount (revealing the overlay), then `onFinish()` after the fade.

Tunables: `HOLD_DURATION` / `FADE_DURATION` + logo size in `BrandSplash.tsx`; `imageWidth`
for the system mark in `app.config.js`.

> After any change here, `npx expo prebuild --clean --platform android`, then uninstall +
> reinstall the dev build (splash is compiled into the binary).

### CategoryChips discoverability
The Feed filter chips are intentionally **single-line + horizontally scrollable** (not
multi-line). `src/components/CategoryChips.tsx` adds scroll-driven edge **fade gradients**
(left fade appears once scrolled, right fade hides at the end) plus a right-edge **peek** via
asymmetric list padding (`paddingLeft: 16, paddingRight: 28`), signalling there's more to scroll.

### Removed: Appearance & Theme
The "Appearance & Theme" row was removed from `ProfileScreen` SETTINGS (theming is not
implemented). `SETTINGS` now holds only Notifications and Privacy rows.
