# QuoteFlow — Claude Code Project Context

> Read this file fully before writing any code. It contains everything you need
> to understand the project, its architecture, design integration, and coding conventions.

---

## 1. What This App Is

**QuoteFlow** is a React Native mobile app (iOS + Android) for discovering, personalizing,
and sharing quote cards on social media (WhatsApp, Instagram, Facebook).

The app's **core differentiator**: every quote card automatically composites the user's
own photo and name directly into the card design — not as a watermark, but as a structural
design element. The personalized card image is exactly what gets shared.

Think of it as: *"Your face. Your name. On every card. Every day."*

Reference app for inspiration: **Crafto** (https://crafto.app)

---

## 2. Tech Stack

| Layer              | Tool                          | Notes                                              |
|--------------------|-------------------------------|----------------------------------------------------|
| Framework          | React Native + Expo (managed) | Use Expo SDK 51+. Avoid bare workflow.             |
| Language           | TypeScript                    | Strict mode. No `any` types.                       |
| Navigation         | React Navigation v6           | Stack + Bottom Tabs                                |
| State Management   | Zustand                       | One store per domain (user, quotes, ui)            |
| Auth               | Firebase Auth                 | Phone OTP + Google Sign-In + Anonymous             |
| Database           | Firebase Firestore            | User profiles, saved cards, quote metadata         |
| File Storage       | Firebase Storage              | User profile photos (bg-removed PNGs)              |
| Image Compositing  | react-native-view-shot        | Captures card View as image for share/download     |
| Background Removal | Remove.bg API                 | Removes photo background before placing on card    |
| Sharing            | react-native-share            | Share composited image to WhatsApp, Instagram etc. |
| Photo Picker       | expo-image-picker             | Camera + Gallery access                            |
| Payments           | RevenueCat                    | Subscription management for iOS + Android          |
| Push Notifications | Firebase Cloud Messaging      | Daily quote notifications                          |
| Analytics          | Firebase Analytics            | Track shares, downloads, retention                 |

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

| HTML/CSS               | React Native equivalent                        |
|------------------------|------------------------------------------------|
| `div`                  | `View`                                         |
| `p`, `span`, `h1–h6`  | `Text`                                         |
| `img`                  | `Image`                                        |
| `input`                | `TextInput`                                    |
| `button`               | `TouchableOpacity` or `Pressable`              |
| CSS `flexbox`          | RN StyleSheet flex (same concepts, no `px`)    |
| CSS `border-radius`    | RN `borderRadius` (numeric, no `px`)           |
| CSS class              | `StyleSheet.create({})` object                 |
| CSS `position: absolute` | RN `position: 'absolute'`                   |
| `overflow: hidden`     | RN `overflow: 'hidden'`                        |
| `box-shadow`           | RN `shadow*` props (iOS) + `elevation` (Android) |

> Never use CSS strings in React Native. Always use StyleSheet.create().
> Never use `px` units. Use numeric values only.

---

## 4. Project Structure

```
QuoteFlow/
├── CLAUDE.md                  ← You are here
├── DESIGN.md                  ← Stitch design tokens (auto-generated, do not edit)
├── app.json                   ← Expo config
├── App.tsx                    ← Entry point, NavigationContainer
├── src/
│   ├── navigation/
│   │   ├── RootNavigator.tsx  ← Auth vs Main stack switcher
│   │   ├── AuthStack.tsx      ← Welcome → Phone → OTP → ProfileSetup
│   │   └── MainStack.tsx      ← Feed → Create → Profile
│   │
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── WelcomeScreen.tsx       ← Login options (Phone, Google, Guest)
│   │   │   ├── PhoneEntryScreen.tsx    ← Phone number + country code input
│   │   │   ├── OTPScreen.tsx           ← 6-digit OTP entry + resend
│   │   │   └── ProfileSetupScreen.tsx  ← Name + photo + live card preview
│   │   └── main/
│   │       ├── FeedScreen.tsx          ← Main quote browsing screen
│   │       ├── CreateScreen.tsx        ← Custom quote creator
│   │       └── ProfileScreen.tsx       ← User profile + multiple photos
│   │
│   ├── components/
│   │   ├── cards/
│   │   │   ├── QuoteCard.tsx           ← Core card renderer (bg + photo + quote + name)
│   │   │   ├── CardPortraitStyle.tsx   ← User photo fills top of card
│   │   │   └── CardCircleStyle.tsx     ← User photo in circular frame on card
│   │   ├── CategoryChips.tsx           ← Horizontal scrollable filter chips
│   │   ├── ActionButtons.tsx           ← Share / Download / Change Photo / Edit Name
│   │   ├── PhotoUploader.tsx           ← Camera + Gallery picker with bg removal
│   │   └── OTPInput.tsx                ← 6-box OTP input row
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                  ← Firebase auth state listener
│   │   ├── useUserProfile.ts           ← Fetch/update user name, photos, primary photo
│   │   ├── useQuotes.ts                ← Fetch quotes by category from Firestore
│   │   └── useCardCapture.ts           ← react-native-view-shot capture + share logic
│   │
│   ├── services/
│   │   ├── firebase.ts                 ← Firebase app init (Auth, Firestore, Storage)
│   │   ├── backgroundRemoval.ts        ← Remove.bg API integration
│   │   └── sharing.ts                  ← Platform-specific share logic
│   │
│   └── store/
│       ├── userStore.ts                ← Zustand: uid, name, primaryPhoto, isPremium
│       ├── quotesStore.ts              ← Zustand: current category, current card index
│       └── uiStore.ts                  ← Zustand: loading states, modals
```

---

## 5. Screen Inventory & Stitch Screen Mapping

Map each screen to its Stitch design when building. Use `get_screen_image` first.

| Screen File              | Screen Name          | Stitch Route     |
|--------------------------|----------------------|------------------|
| `WelcomeScreen.tsx`      | Welcome / Login      | `/welcome`       |
| `PhoneEntryScreen.tsx`   | Phone Number Entry   | `/phone-entry`   |
| `OTPScreen.tsx`          | OTP Verification     | `/otp`           |
| `ProfileSetupScreen.tsx` | Profile Setup        | `/profile-setup` |
| `FeedScreen.tsx`         | Main Feed            | `/feed`          |
| `CardPortraitStyle.tsx`  | Card — Portrait      | `/card-portrait` |
| `CardCircleStyle.tsx`    | Card — Circle Frame  | `/card-circle`   |
| `ProfileScreen.tsx`      | User Profile         | `/profile`       |

---

## 6. Core Feature — Photo Compositing

This is the most important technical feature. Get this right first.

### How it works

```
User selects photo (expo-image-picker)
        ↓
Remove.bg API strips background → returns transparent PNG
        ↓
PNG stored in Firebase Storage → URL saved to Firestore user doc
        ↓
QuoteCard component renders:
  <View ref={cardRef}>                      ← captured by view-shot
    <Image source={template.background} />  ← card background
    <Image source={{ uri: userPhotoUrl }}   ← user photo (transparent PNG)
           style={template.photoStyle} />   ← positioned per template
    <Text style={template.quoteStyle}>      ← quote text
      {quote}
    </Text>
    <Text style={template.nameStyle}>       ← user name
      {userName}
    </Text>
  </View>
        ↓
react-native-view-shot captures entire View as a single image file
        ↓
That captured image is what gets shared / downloaded
```

### QuoteCard template schema

```typescript
interface CardTemplate {
  id: string;
  backgroundUrl: string;
  photoStyle: {
    position: 'absolute';
    style: 'portrait' | 'circle';    // portrait = fills top, circle = circular frame
    top?: number;
    left?: number;
    width: number;
    height: number;
    borderRadius?: number;           // 9999 for circle style
  };
  namePosition: {
    position: 'absolute';
    bottom: number;
    left?: number;
    right?: number;
  };
  quotePosition: {
    position: 'absolute';
    bottom: number;
    left: number;
    right: number;
  };
}
```

### Card capture and share

```typescript
// useCardCapture.ts
const captureCard = async (cardRef: RefObject<View>): Promise<string> => {
  const uri = await captureRef(cardRef, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });
  return uri; // this is the shareable image
};

const shareToWhatsApp = async (uri: string, quote: string) => {
  await Share.shareSingle({
    url: uri,
    message: quote,
    social: Share.Social.WHATSAPP,
    type: 'image/png',
  });
};
```

---

## 7. Firebase Data Model

```
/users/{uid}
  name: string
  primaryPhotoUrl: string          ← URL to bg-removed PNG in Storage
  photos: string[]                 ← Array of all uploaded photo URLs
  isPremium: boolean
  premiumExpiry: timestamp | null
  createdAt: timestamp

/quotes/{quoteId}
  text: string
  category: string                 ← 'good-morning' | 'motivational' | 'birthday' | ...
  templateId: string               ← references /templates/{templateId}
  isPremium: boolean
  language: string                 ← 'en' | 'hi' | 'mr' etc.
  createdAt: timestamp

/templates/{templateId}
  backgroundUrl: string
  photoStyle: CardTemplate['photoStyle']
  namePosition: CardTemplate['namePosition']
  quotePosition: CardTemplate['quotePosition']
  previewUrl: string               ← thumbnail for template picker
```

---

## 8. Auth Flow

Three entry paths, all leading to ProfileSetup:

```
WelcomeScreen
  ├── "Continue with Phone" → PhoneEntryScreen → OTPScreen → ProfileSetupScreen
  ├── "Continue with Google" → Google OAuth → ProfileSetupScreen
  └── "Continue as Guest" → Firebase anonymous sign-in → ProfileSetupScreen

ProfileSetupScreen → FeedScreen (main app)
```

### Auth rules
- Check `user.displayName` and `userStore.name` after login
- If name is already set (returning user), skip ProfileSetup → go directly to Feed
- Guest users CAN add name and photo — store in Firestore against their anonymous UID
- If guest later upgrades to Google/Phone auth, merge their data by UID

---

## 9. Category System

Categories are the horizontal chip filters on the Feed screen:

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

- Active chip: filled with primary brand color
- Inactive chips: outlined, white fill
- Chips are horizontally scrollable (multiple rows in design, single scroll row in code is fine)

---

## 10. Coding Conventions

### General
- All components: functional, with TypeScript props interface defined above the component
- No class components
- No inline styles — always use `StyleSheet.create()`
- All async functions: try/catch with proper error handling
- Loading states: always show an ActivityIndicator or skeleton

### Naming
- Screens: `PascalCase` + `Screen` suffix — e.g. `FeedScreen`
- Components: `PascalCase` — e.g. `QuoteCard`
- Hooks: `camelCase` + `use` prefix — e.g. `useUserProfile`
- Store files: `camelCase` + `Store` suffix — e.g. `userStore`
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

### Environment variables
Store all secrets in `.env` (never commit):
```
REMOVE_BG_API_KEY=
FIREBASE_API_KEY=
FIREBASE_PROJECT_ID=
REVENUECAT_API_KEY_IOS=
REVENUECAT_API_KEY_ANDROID=
```
Access via `expo-constants` or `react-native-dotenv`.

---

## 11. Build Order (Suggested Sequence)

Build in this order to avoid blockers:

```
Phase 1 — Foundation
  1. Project scaffold (Expo + TypeScript + React Navigation)
  2. Firebase setup (Auth + Firestore + Storage)
  3. Zustand stores (userStore, quotesStore, uiStore)

Phase 2 — Auth Screens
  4. WelcomeScreen (Phone + Google + Guest buttons)
  5. PhoneEntryScreen + OTPScreen (Firebase Phone Auth)
  6. ProfileSetupScreen (photo upload + bg removal + name + live preview)

Phase 3 — Core Feature
  7. QuoteCard component (bg + photo overlay + name)
  8. CardPortraitStyle + CardCircleStyle variants
  9. useCardCapture hook (view-shot capture)
  10. FeedScreen (category chips + card + action buttons)
  11. Share / Download flow

Phase 4 — Supporting Screens
  12. CreateScreen (wallpaper picker + custom text)
  13. ProfileScreen (multiple photos + Set Primary)

Phase 5 — Monetization & Polish
  14. Paywall / RevenueCat integration
  15. Push notifications
  16. Analytics events
  17. App Store + Play Store prep
```

---

## 12. Key Commands

```bash
# Start dev server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Install a new package
npx expo install <package-name>

# Check Stitch designs (MCP already configured)
npx @_davideast/stitch-mcp view --projects
npx @_davideast/stitch-mcp view --project <PROJECT_ID>

# Type check
npx tsc --noEmit
```

---

## 13. What NOT to Do

- ❌ Don't use CSS strings — always `StyleSheet.create()`
- ❌ Don't use `any` TypeScript type — define proper interfaces
- ❌ Don't store sensitive keys in code — use `.env`
- ❌ Don't use `console.log` in production code — use a logger utility
- ❌ Don't share the raw photo URL — always share the composited card image
- ❌ Don't skip background removal — the transparent PNG is essential for card compositing
- ❌ Don't build a bottom tab nav on the Feed screen — action buttons replace navigation there
- ❌ Don't forget to handle both iOS and Android share differences in `sharing.ts`