import { supabase } from './supabase';

export type AnalyticsEvent =
  | 'view_card'
  | 'share_card'
  | 'download_card'
  | 'change_photo'
  | 'edit_name'
  | 'paywall_shown'
  | 'purchase_completed'
  | 'card_published'
  | 'category_selected'
  | 'photo_uploaded';

interface EventProperties {
  card_id?: string;
  category?: string;
  is_premium?: boolean;
  plan_id?: string;
}

export async function track(
  uid: string | null,
  event: AnalyticsEvent,
  properties?: EventProperties
): Promise<void> {
  if (!uid) return;
  await supabase.from('analytics_events').insert({
    uid,
    event_name: event,
    properties: properties ?? {},
  });
}
