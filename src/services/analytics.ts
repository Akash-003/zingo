import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import { supabase } from './supabase';

export type AnalyticsEvent =
  | 'view_card'
  | 'share_card'
  | 'download_card'
  | 'change_photo'
  | 'edit_name'
  | 'paywall_shown'
  | 'purchase_completed'
  | 'subscription_cancelled'
  | 'card_published'
  | 'category_selected'
  | 'photo_uploaded'
  // Onboarding funnel
  | 'app_open'
  | 'login_started'
  | 'login_completed'
  | 'profile_completed'
  | 'home_viewed';

interface EventProperties {
  card_id?: string;
  category?: string;
  is_premium?: boolean;
  plan_id?: string;
  method?: 'google' | 'truecaller' | 'guest';
  first_open?: boolean;
  skipped?: boolean;
}

const DEVICE_ID_KEY = 'analytics_device_id';

// Stable per-install id so pre-auth funnel events (app_open, login_started)
// can be joined to the post-login ones. Regenerated on reinstall — that's the
// desired "install" semantics.
let deviceIdPromise: Promise<string> | null = null;
function getDeviceId(): Promise<string> {
  if (!deviceIdPromise) {
    deviceIdPromise = (async () => {
      const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (existing) return existing;
      const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      await AsyncStorage.setItem(DEVICE_ID_KEY, id);
      return id;
    })();
  }
  return deviceIdPromise;
}

export async function track(
  uid: string | null,
  event: AnalyticsEvent,
  properties?: EventProperties
): Promise<void> {
  const device_id = await getDeviceId();
  // Dual-write: Supabase = owned raw data (SQL joins with cards/profiles),
  // Firebase = free GA4 dashboards/funnels. Both fire-and-forget.
  logEvent(getAnalytics(), event, { ...properties, device_id }).catch(() => {});
  await supabase.from('analytics_events').insert({
    uid,
    event_name: event,
    properties: { ...properties, device_id },
  });
}

// Fired once per app launch from App.tsx. first_open doubles as the
// install proxy (no stored device id yet = fresh install).
export async function trackAppOpen(): Promise<void> {
  const firstOpen = (await AsyncStorage.getItem(DEVICE_ID_KEY)) === null;
  void track(null, 'app_open', { first_open: firstOpen });
}
