# Phase 4 — Supporting Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add bottom tab navigation, full ProfileScreen with Identity Vault, UGC CreateScreen for uploading custom greeting cards, and a `useUserProfile` hook centralising all profile data operations.

**Architecture:** MainStack is replaced by a BottomTabNavigator with a custom tab bar component. ProfileScreen reads/writes to Supabase `profiles` table via `useUserProfile`. CreateScreen lets users upload a greeting image, drag photo/name handles to position slots (PanResponder), then publish to the `cards` table. All profile mutations go through the hook, keeping stores in sync.

**Tech Stack:** React Navigation bottom-tabs (already installed), @expo/vector-icons (bundled with Expo 54), @react-native-community/slider (needs install), react-native-safe-area-context, Supabase JS client, Zustand userStore.

**Spec reference:** `docs/superpowers/specs/2026-05-03-phase4-design.md`

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `supabase/migrations/20250504000001_ugc_cards.sql` | Add `created_by`, `is_public` columns; update RLS |
| Create | `src/hooks/useUserProfile.ts` | All profile read/write operations |
| Create | `src/components/BottomTabBar.tsx` | Custom tab bar UI component |
| Create | `src/navigation/MainTabs.tsx` | BottomTabNavigator wiring all 4 tabs |
| Create | `src/screens/main/CollectionsScreen.tsx` | Stub screen |
| Modify | `src/navigation/RootNavigator.tsx` | Replace MainStack import with MainTabs; expand fetchProfile |
| Create | `src/screens/main/ProfileScreen.tsx` | Hero + stats + Identity Vault + settings |
| Create | `src/screens/main/CreateScreen.tsx` | 3-phase UGC card creator |

---

### Task 1: Database Migration + Slider Package

**Files:**
- Create: `supabase/migrations/20250504000001_ugc_cards.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20250504000001_ugc_cards.sql`:

```sql
ALTER TABLE public.cards
  ADD COLUMN created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN is_public  boolean NOT NULL DEFAULT true;

DROP POLICY "cards: public read" ON public.cards;

CREATE POLICY "cards: public read" ON public.cards
  FOR SELECT USING (
    created_by IS NULL
    OR is_public = true
    OR created_by = auth.uid()
  );

CREATE POLICY "cards: user insert" ON public.cards
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
  );
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push
```

Expected: `Applying migration 20250504000001_ugc_cards.sql... done`

- [ ] **Step 3: Install slider package**

```bash
npx expo install @react-native-community/slider
```

Expected: package added to `node_modules` and `package.json`.

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20250504000001_ugc_cards.sql package.json package-lock.json
git commit -m "feat: add created_by/is_public to cards + install slider"
```

---

### Task 2: useUserProfile Hook

**Files:**
- Create: `src/hooks/useUserProfile.ts`
- Modify: `src/navigation/RootNavigator.tsx`

- [ ] **Step 1: Create the hook**

Create `src/hooks/useUserProfile.ts`:

```typescript
import { useState } from 'react';
import { supabase } from '../services/supabase';
import { useUserStore } from '../store/userStore';

export function useUserProfile() {
  const [loading, setLoading] = useState(false);
  const setName = useUserStore((s) => s.setName);
  const setPrimaryPhotoUrl = useUserStore((s) => s.setPrimaryPhotoUrl);
  const setPhotos = useUserStore((s) => s.setPhotos);
  const setIsPremium = useUserStore((s) => s.setIsPremium);
  const reset = useUserStore((s) => s.reset);
  const uid = useUserStore((s) => s.uid);

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('name, primary_photo_url, photos, is_premium')
        .eq('id', userId)
        .single();
      if (data?.name) setName(data.name);
      if (data?.primary_photo_url) setPrimaryPhotoUrl(data.primary_photo_url);
      if (data?.photos) setPhotos(data.photos);
      if (data?.is_premium != null) setIsPremium(data.is_premium);
    } finally {
      setLoading(false);
    }
  };

  const updateName = async (name: string) => {
    if (!uid) return;
    setLoading(true);
    try {
      await supabase.from('profiles').upsert({ id: uid, name });
      setName(name);
    } finally {
      setLoading(false);
    }
  };

  const setPrimaryPhoto = async (url: string) => {
    if (!uid) return;
    setLoading(true);
    try {
      await supabase
        .from('profiles')
        .update({ primary_photo_url: url })
        .eq('id', uid);
      setPrimaryPhotoUrl(url);
    } finally {
      setLoading(false);
    }
  };

  const addPhoto = async (url: string) => {
    if (!uid) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('photos, primary_photo_url')
        .eq('id', uid)
        .single();
      const current: string[] = data?.photos ?? [];
      const updated = [...current, url];
      await supabase.from('profiles').update({ photos: updated }).eq('id', uid);
      setPhotos(updated);
      if (!data?.primary_photo_url) {
        await setPrimaryPhoto(url);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    reset();
  };

  return { loading, fetchProfile, updateName, addPhoto, setPrimaryPhoto, signOut };
}
```

- [ ] **Step 2: Update RootNavigator to use the hook**

Open `src/navigation/RootNavigator.tsx`. Replace the inline `fetchProfile` function and the manual `setName`/`setPrimaryPhotoUrl` calls with the hook. The file should become:

```typescript
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Session } from '@supabase/supabase-js';

import { supabase } from '../services/supabase';
import { useUserStore } from '../store/userStore';
import { useUserProfile } from '../hooks/useUserProfile';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';

export default function RootNavigator() {
  const [initialising, setInitialising] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  const uid = useUserStore((s) => s.uid);
  const name = useUserStore((s) => s.name);
  const setUid = useUserStore((s) => s.setUid);
  const reset = useUserStore((s) => s.reset);
  const { fetchProfile } = useUserProfile();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        setUid(s.user.id);
        fetchProfile(s.user.id).finally(() => setInitialising(false));
      } else {
        setInitialising(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        if (s?.user) {
          setUid(s.user.id);
          fetchProfile(s.user.id);
        } else {
          reset();
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  if (initialising) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#9d3d2c" />
      </View>
    );
  }

  if (!session) return <AuthStack />;
  if (!name) return <ProfileSetupScreen />;
  return <MainTabs />;
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors. (MainTabs doesn't exist yet — expect one "Cannot find module" error that will resolve in Task 3.)

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useUserProfile.ts src/navigation/RootNavigator.tsx
git commit -m "feat: add useUserProfile hook; wire into RootNavigator"
```

---

### Task 3: Bottom Tab Navigation

**Files:**
- Create: `src/components/BottomTabBar.tsx`
- Create: `src/navigation/MainTabs.tsx`
- Create: `src/screens/main/CollectionsScreen.tsx`

- [ ] **Step 1: Create CollectionsScreen stub**

Create `src/screens/main/CollectionsScreen.tsx`:

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CollectionsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.text}>Collections coming soon.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcf9f4' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: 'System', fontSize: 16, color: '#89726d' },
});
```

- [ ] **Step 2: Create custom BottomTabBar**

Create `src/components/BottomTabBar.tsx`:

```typescript
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  Discover: { active: 'sparkles', inactive: 'sparkles-outline' },
  Create: { active: 'add-circle', inactive: 'add-circle-outline' },
  Collections: { active: 'library', inactive: 'library-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

export default function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || 12 }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = (options.tabBarLabel as string) ?? route.name;
        const isActive = state.index === index;
        const icons = TAB_ICONS[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' };

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isActive && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? icons.active : icons.inactive}
              size={22}
              color={isActive ? '#9d3d2c' : '#89726d'}
            />
            <Text style={[styles.label, isActive && styles.activeLabel]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fcf9f4',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 20,
    gap: 3,
  },
  activeTab: {
    backgroundColor: '#f0ede9',
  },
  label: {
    fontSize: 10,
    color: '#89726d',
    fontWeight: '500',
  },
  activeLabel: {
    color: '#9d3d2c',
    fontWeight: '600',
  },
});
```

- [ ] **Step 3: Create MainTabs navigator**

Create `src/navigation/MainTabs.tsx`:

```typescript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FeedScreen from '../screens/main/FeedScreen';
import CreateScreen from '../screens/main/CreateScreen';
import CollectionsScreen from '../screens/main/CollectionsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import BottomTabBar from '../components/BottomTabBar';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Discover" component={FeedScreen} options={{ tabBarLabel: 'Discover' }} />
      <Tab.Screen name="Create" component={CreateScreen} options={{ tabBarLabel: 'Create' }} />
      <Tab.Screen name="Collections" component={CollectionsScreen} options={{ tabBarLabel: 'Collections' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: errors only for missing ProfileScreen and CreateScreen (will be fixed in Tasks 4–5).

- [ ] **Step 5: Commit**

```bash
git add src/components/BottomTabBar.tsx src/navigation/MainTabs.tsx src/screens/main/CollectionsScreen.tsx
git commit -m "feat: add BottomTabBar + MainTabs navigator + CollectionsScreen stub"
```

---

### Task 4: ProfileScreen

**Files:**
- Create: `src/screens/main/ProfileScreen.tsx`

This screen is a `ScrollView` with four sections: hero (photo + name + premium badge), stats row, Identity Vault, and account settings.

- [ ] **Step 1: Create ProfileScreen**

Create `src/screens/main/ProfileScreen.tsx`:

```typescript
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useUserStore } from '../../store/userStore';
import { useUserProfile } from '../../hooks/useUserProfile';
import PhotoUploader from '../../components/PhotoUploader';

const STATS = [
  { label: 'Collections', value: '0' },
  { label: 'Followers', value: '0' },
  { label: 'Saved', value: '0' },
  { label: 'Featured', value: '0' },
];

const SETTINGS = [
  { icon: 'notifications-outline' as const, label: 'Notifications & Updates' },
  { icon: 'lock-closed-outline' as const, label: 'Privacy & Security' },
  { icon: 'color-palette-outline' as const, label: 'Appearance & Theme' },
];

export default function ProfileScreen() {
  const [editPhotoModal, setEditPhotoModal] = useState(false);

  const name = useUserStore((s) => s.name);
  const primaryPhotoUrl = useUserStore((s) => s.primaryPhotoUrl);
  const photos = useUserStore((s) => s.photos);
  const isPremium = useUserStore((s) => s.isPremium);

  const { loading, addPhoto, setPrimaryPhoto, signOut } = useUserProfile();

  const handleAddPhoto = async (url: string) => {
    setEditPhotoModal(false);
    await addPhoto(url);
  };

  const handleSetPrimary = async (url: string) => {
    await setPrimaryPhoto(url);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const emptySlots = Math.max(0, 5 - photos.length);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.photoWrap}>
            {primaryPhotoUrl ? (
              <Image source={{ uri: primaryPhotoUrl }} style={styles.heroPhoto} />
            ) : (
              <View style={[styles.heroPhoto, styles.heroPlaceholder]}>
                <Ionicons name="person" size={56} color="#89726d" />
              </View>
            )}
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setEditPhotoModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroName}>{name}</Text>
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>PREMIUM</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {STATS.map((s) => (
            <View key={s.label} style={styles.statTile}>
              <Text style={styles.statNum}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Identity Vault */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Identity Vault</Text>
          <Text style={styles.cardSubtitle}>
            Switch between your curated visual identities.
          </Text>

          {loading && (
            <ActivityIndicator size="small" color="#9d3d2c" style={{ marginVertical: 8 }} />
          )}

          <View style={styles.vaultRow}>
            {photos.map((url, i) => {
              const isPrimary = url === primaryPhotoUrl;
              return (
                <TouchableOpacity
                  key={url}
                  style={styles.vaultSlot}
                  onPress={() => !isPrimary && handleSetPrimary(url)}
                  activeOpacity={isPrimary ? 1 : 0.7}
                >
                  <View style={[styles.vaultCircle, isPrimary && styles.primaryRing]}>
                    <Image source={{ uri: url }} style={styles.vaultPhoto} />
                  </View>
                  <Text style={styles.vaultLabel}>{isPrimary ? 'Primary' : 'Set Primary'}</Text>
                </TouchableOpacity>
              );
            })}

            {photos.length < 5 &&
              Array.from({ length: emptySlots > 1 ? 1 : emptySlots }).map((_, i) => (
                <PhotoUploader
                  key={`empty-${i}`}
                  onPhotoUploaded={handleAddPhoto}
                  currentPhotoUrl={null}
                />
              ))}
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.settingsSection}>
          {SETTINGS.map((row) => (
            <TouchableOpacity
              key={row.label}
              style={styles.settingsRow}
              onPress={() => Alert.alert('Coming soon')}
              activeOpacity={0.7}
            >
              <View style={styles.settingsIcon}>
                <Ionicons name={row.icon} size={20} color="#56423e" />
              </View>
              <Text style={styles.settingsLabel}>{row.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#89726d" />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <View style={[styles.settingsIcon, styles.signOutIcon]}>
              <Ionicons name="log-out-outline" size={20} color="#ba1a1a" />
            </View>
            <Text style={[styles.settingsLabel, styles.signOutLabel]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit primary photo modal */}
      <Modal visible={editPhotoModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update Profile Photo</Text>
            <PhotoUploader
              onPhotoUploaded={handleAddPhoto}
              currentPhotoUrl={primaryPhotoUrl}
            />
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setEditPhotoModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fcf9f4' },
  scroll: { flex: 1 },
  content: { paddingBottom: 100 },

  // Hero
  hero: { alignItems: 'center', paddingTop: 32, paddingBottom: 24 },
  photoWrap: { width: 140, height: 140, marginBottom: 16 },
  heroPhoto: { width: 140, height: 140, borderRadius: 70 },
  heroPlaceholder: { backgroundColor: '#f0ede9', alignItems: 'center', justifyContent: 'center' },
  editBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#9d3d2c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: { fontSize: 28, fontWeight: '700', color: '#1c1c19', marginBottom: 8 },
  premiumBadge: {
    backgroundColor: '#dbe3c5',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  premiumText: { fontSize: 11, fontWeight: '700', color: '#3a4a2a', letterSpacing: 1 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  statTile: {
    flex: 1,
    backgroundColor: '#f6f3ee',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 14,
  },
  statNum: { fontSize: 22, fontWeight: '700', color: '#9d3d2c' },
  statLabel: { fontSize: 12, color: '#56423e', marginTop: 2 },

  // Identity Vault card
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1c1c19', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#89726d', marginBottom: 16 },
  vaultRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  vaultSlot: { alignItems: 'center', gap: 6 },
  vaultCircle: { width: 96, height: 96, borderRadius: 48, overflow: 'hidden' },
  primaryRing: { borderWidth: 3, borderColor: '#9d3d2c' },
  vaultPhoto: { width: '100%', height: '100%' },
  vaultLabel: { fontSize: 11, color: '#56423e' },

  // Settings
  settingsSection: {
    marginHorizontal: 16,
    backgroundColor: '#f6f3ee',
    borderRadius: 20,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0ede9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutIcon: { backgroundColor: '#fdf0f0' },
  settingsLabel: { flex: 1, fontSize: 15, color: '#1c1c19' },
  signOutLabel: { color: '#ba1a1a' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 20,
    width: 300,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1c1c19' },
  modalClose: { paddingVertical: 8, paddingHorizontal: 24 },
  modalCloseText: { fontSize: 15, color: '#89726d' },
});
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors (except possible CreateScreen missing error).

- [ ] **Step 3: Commit**

```bash
git add src/screens/main/ProfileScreen.tsx
git commit -m "feat: add ProfileScreen with Identity Vault and account settings"
```

---

### Task 5: CreateScreen

**Files:**
- Create: `src/screens/main/CreateScreen.tsx`

Three phases revealed progressively. Phase 1: pick image. Phase 2: drag photo/name handles + size slider. Phase 3: category + visibility + publish.

- [ ] **Step 1: Create CreateScreen**

Create `src/screens/main/CreateScreen.tsx`:

```typescript
import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  PanResponder,
  Dimensions,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../services/supabase';
import { useUserStore } from '../../store/userStore';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PREVIEW_WIDTH = SCREEN_WIDTH - 32;
const CANVAS_WIDTH = 400;

const CATEGORIES = [
  'good-morning', 'motivational', 'love', 'birthday', 'good-night',
  'festivals', 'shayari', 'devotional', 'friendship', 'life',
];

interface SlotPos { x: number; y: number }

const DEFAULT_PHOTO: SlotPos = { x: PREVIEW_WIDTH / 2 - 50, y: PREVIEW_WIDTH * 0.2 - 50 };
const DEFAULT_NAME: SlotPos  = { x: PREVIEW_WIDTH / 2 - 60, y: PREVIEW_WIDTH * 0.85 };

export default function CreateScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageRatio, setImageRatio] = useState(1);
  const [photoPos, setPhotoPos] = useState<SlotPos>(DEFAULT_PHOTO);
  const [namePos, setNamePos] = useState<SlotPos>(DEFAULT_NAME);
  const [circleSize, setCircleSize] = useState(100);
  const [category, setCategory] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const uid = useUserStore((s) => s.uid);
  const name = useUserStore((s) => s.name);

  // Derived preview image height
  const previewHeight = PREVIEW_WIDTH * imageRatio;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setImageUri(asset.uri);
    if (asset.width && asset.height) {
      setImageRatio(asset.height / asset.width);
    }
    resetHandles();
  };

  const resetHandles = () => {
    setPhotoPos(DEFAULT_PHOTO);
    setNamePos(DEFAULT_NAME);
    setCircleSize(100);
  };

  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  const makePhotoResponder = useCallback(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        setPhotoPos((prev) => ({
          x: clamp(prev.x + gs.dx, 0, PREVIEW_WIDTH - circleSize),
          y: clamp(prev.y + gs.dy, 0, previewHeight - circleSize),
        }));
      },
    }),
  [circleSize, previewHeight]);

  const makeNameResponder = useCallback(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        setNamePos((prev) => ({
          x: clamp(prev.x + gs.dx, 0, PREVIEW_WIDTH - 120),
          y: clamp(prev.y + gs.dy, 0, previewHeight - 32),
        }));
      },
    }),
  [previewHeight]);

  const photoResponder = useRef(makePhotoResponder()).current;
  const nameResponder  = useRef(makeNameResponder()).current;

  const normalise = (previewCoord: number) => previewCoord * (CANVAS_WIDTH / PREVIEW_WIDTH);

  const publish = async () => {
    if (!imageUri || !uid) return;
    setPublishing(true);
    try {
      const filename = `${Date.now()}.jpg`;
      const path = `${uid}/cards/${filename}`;

      const response = await fetch(imageUri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('user-photos')
        .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: false });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('user-photos').getPublicUrl(path);

      const photoSlot = {
        style: 'circle',
        top: Math.round(normalise(photoPos.y)),
        left: Math.round(normalise(photoPos.x)),
        width: Math.round(normalise(circleSize)),
        height: Math.round(normalise(circleSize)),
        borderRadius: 9999,
      };
      const nameSlot = {
        top: Math.round(normalise(namePos.y)),
        left: Math.round(normalise(namePos.x)),
        fontSize: 18,
        color: '#ffffff',
      };

      const { error: insertError } = await supabase.from('cards').insert({
        image_url: urlData.publicUrl,
        category,
        is_premium: false,
        photo_slot: photoSlot,
        name_slot: nameSlot,
        created_by: uid,
        is_public: isPublic,
      });
      if (insertError) throw insertError;

      setPublished(true);
    } catch {
      Alert.alert('Publish failed', 'Could not publish your card. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const reset = () => {
    setImageUri(null);
    setImageRatio(1);
    setCategory(null);
    setIsPublic(false);
    setPublished(false);
    resetHandles();
  };

  if (published) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={72} color="#9d3d2c" />
          <Text style={styles.successTitle}>Card Published!</Text>
          <Text style={styles.successSub}>
            {isPublic ? 'Your card is live in the community feed.' : 'Your card is saved privately.'}
          </Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={reset}>
            <Text style={styles.ctaBtnText}>Create Another</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Create a Card</Text>

        {/* Phase 1 — Pick Image */}
        <TouchableOpacity
          style={[styles.pickZone, imageUri && { height: previewHeight }]}
          onPress={pickImage}
          activeOpacity={0.7}
        >
          {imageUri ? (
            <>
              <Image
                source={{ uri: imageUri }}
                style={{ width: PREVIEW_WIDTH, height: previewHeight }}
              />
              <TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
                <Text style={styles.changeBtnText}>Change</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.pickPlaceholder}>
              <Ionicons name="image-outline" size={48} color="#89726d" />
              <Text style={styles.pickLabel}>Tap to pick a greeting image</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Phase 2 — Position Slots */}
        {imageUri && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Position your photo & name</Text>
            <Text style={styles.sectionHint}>Drag the handles to reposition. Use the slider to resize your photo.</Text>

            <View style={[styles.canvas, { height: previewHeight }]}>
              <Image
                source={{ uri: imageUri }}
                style={{ width: PREVIEW_WIDTH, height: previewHeight }}
                pointerEvents="none"
              />

              {/* Photo handle */}
              <View
                {...photoResponder.panHandlers}
                style={[
                  styles.photoHandle,
                  { left: photoPos.x, top: photoPos.y, width: circleSize, height: circleSize, borderRadius: circleSize / 2 },
                ]}
              >
                <Ionicons name="person" size={circleSize * 0.45} color="#fff" />
              </View>

              {/* Name handle */}
              <View
                {...nameResponder.panHandlers}
                style={[styles.nameHandle, { left: namePos.x, top: namePos.y }]}
              >
                <Text style={styles.nameHandleText}>{name || 'Your Name'}</Text>
              </View>
            </View>

            <Text style={styles.sliderLabel}>Photo size: {Math.round(circleSize)}px</Text>
            <Slider
              style={styles.slider}
              minimumValue={60}
              maximumValue={160}
              value={circleSize}
              onValueChange={setCircleSize}
              minimumTrackTintColor="#9d3d2c"
              maximumTrackTintColor="#e8e0d8"
              thumbTintColor="#9d3d2c"
            />

            <TouchableOpacity style={styles.resetBtn} onPress={resetHandles}>
              <Text style={styles.resetBtnText}>Reset positions</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Phase 3 — Publish Settings */}
        {imageUri && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Publish Settings</Text>

            <Text style={styles.fieldLabel}>Category (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, category === cat && styles.chipActive]}
                  onPress={() => setCategory(category === cat ? null : cat)}
                >
                  <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                    {cat.replace(/-/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Visibility</Text>
            <View style={styles.visibilityRow}>
              <TouchableOpacity
                style={[styles.visBtn, !isPublic && styles.visBtnActive]}
                onPress={() => setIsPublic(false)}
              >
                <Text style={[styles.visBtnText, !isPublic && styles.visBtnTextActive]}>My Cards</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.visBtn, isPublic && styles.visBtnActive]}
                onPress={() => setIsPublic(true)}
              >
                <Text style={[styles.visBtnText, isPublic && styles.visBtnTextActive]}>Community</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.ctaBtn, publishing && styles.ctaBtnDisabled]}
              onPress={publish}
              disabled={publishing}
            >
              {publishing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.ctaBtnText}>Publish Card</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fcf9f4' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  heading: { fontSize: 24, fontWeight: '700', color: '#1c1c19', marginBottom: 20 },

  // Phase 1
  pickZone: {
    width: PREVIEW_WIDTH,
    height: 200,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#89726d',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  pickPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  pickLabel: { fontSize: 14, color: '#89726d' },
  changeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  changeBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Phase 2
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1c1c19', marginBottom: 4 },
  sectionHint: { fontSize: 13, color: '#89726d', marginBottom: 16 },
  canvas: {
    width: PREVIEW_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoHandle: {
    position: 'absolute',
    backgroundColor: 'rgba(157,61,44,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameHandle: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  nameHandleText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  sliderLabel: { fontSize: 13, color: '#56423e', marginTop: 16, marginBottom: 4 },
  slider: { width: PREVIEW_WIDTH, height: 40 },
  resetBtn: { alignSelf: 'flex-start', marginTop: 4 },
  resetBtnText: { fontSize: 13, color: '#9d3d2c' },

  // Phase 3
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#1c1c19', marginBottom: 8 },
  chips: { flexDirection: 'row', marginBottom: 20 },
  chip: {
    borderWidth: 1,
    borderColor: '#89726d',
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#9d3d2c', borderColor: '#9d3d2c' },
  chipText: { fontSize: 13, color: '#89726d', textTransform: 'capitalize' },
  chipTextActive: { color: '#fff' },
  visibilityRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  visBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#89726d',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  visBtnActive: { backgroundColor: '#9d3d2c', borderColor: '#9d3d2c' },
  visBtnText: { fontSize: 15, color: '#89726d', fontWeight: '600' },
  visBtnTextActive: { color: '#fff' },
  ctaBtn: {
    backgroundColor: '#9d3d2c',
    borderRadius: 99,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Success
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  successTitle: { fontSize: 28, fontWeight: '700', color: '#1c1c19' },
  successSub: { fontSize: 15, color: '#89726d', textAlign: 'center' },
});
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/screens/main/CreateScreen.tsx
git commit -m "feat: add CreateScreen with 3-phase UGC card creator"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Full type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Boot the app**

```bash
npx expo start
```

Open on device or simulator. Verify:
1. Bottom tab bar renders with 4 tabs, correct icons and labels
2. Active tab pill highlights correctly
3. Profile → Identity Vault shows photos; tapping non-primary fires setPrimaryPhoto
4. Profile → Sign Out lands back on WelcomeScreen
5. Create → pick image → drag handles move freely → publish flow reaches success state
6. Discover tab still renders the Feed correctly with no regressions

- [ ] **Step 3: Final commit and push**

```bash
git add -A
git commit -m "chore: phase 4 complete — ProfileScreen, CreateScreen, MainTabs"
git push
```
