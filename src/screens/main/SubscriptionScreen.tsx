import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import {
  fetchUserSubscription,
  cancelSubscription,
  UserSubscription,
} from '../../services/payments';
import { track } from '../../services/analytics';
import { useUserStore } from '../../store/userStore';
import { showAlert } from '../../store/alertStore';

const BENEFITS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'sparkles-outline', label: 'Watermark-free sharing & downloads' },
  { icon: 'infinite-outline', label: 'Unlimited personalized cards' },
  { icon: 'person-circle-outline', label: 'Your photo & name on every card' },
  { icon: 'images-outline', label: 'Access to all premium designs' },
  { icon: 'flash-outline', label: 'Priority access to new drops' },
];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const uid = useUserStore((s) => s.uid);

  const [sub, setSub] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let active = true;
    fetchUserSubscription()
      .then((result) => {
        if (active) setSub(result);
      })
      .catch(() => {
        if (active) setSub(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCancel = async () => {
    if (!sub) return;
    try {
      setCancelling(true);
      await cancelSubscription(sub.razorpaySubscriptionId);
      void track(uid, 'subscription_cancelled');
      setSub({ ...sub, cancelAtPeriodEnd: true });
      setModalVisible(false);
      showAlert(
        'Premium stays active',
        `You'll keep Premium until ${formatDate(sub.currentPeriodEnd)}. It won't renew after that.`,
      );
    } catch {
      showAlert('Something went wrong', 'Please try again in a moment.');
    } finally {
      setCancelling(false);
    }
  };

  const willNotRenew = sub?.cancelAtPeriodEnd ?? false;
  const statusPill = willNotRenew
    ? `Ends ${formatDate(sub?.currentPeriodEnd ?? null)}`
    : 'Active';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color="#1c1c19" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#9d3d2c" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero banner */}
          <LinearGradient
            colors={['#9d3d2c', '#bd5541']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroIcon}>
              <Ionicons name="star" size={28} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>QuoteFlow Premium</Text>
            <View style={styles.statusPill}>
              <View style={[styles.statusDot, willNotRenew && styles.statusDotEnding]} />
              <Text style={styles.statusPillText}>{statusPill}</Text>
            </View>
          </LinearGradient>

          {/* Details */}
          <View style={styles.card}>
            <DetailRow label="Plan" value={sub?.planLabel ?? '—'} />
            <View style={styles.divider} />
            <DetailRow label="Price" value={sub?.planAmountDisplay ?? '—'} />
            <View style={styles.divider} />
            <DetailRow
              label={willNotRenew ? 'Premium until' : 'Renews on'}
              value={formatDate(sub?.currentPeriodEnd ?? null)}
            />
            {willNotRenew && (
              <View style={styles.noRenewNote}>
                <Ionicons name="information-circle-outline" size={16} color="#56423e" />
                <Text style={styles.noRenewText}>
                  Your subscription won't renew. You keep Premium until the date
                  above.
                </Text>
              </View>
            )}
          </View>

          {/* Benefits */}
          <Text style={styles.sectionTitle}>Your Premium benefits</Text>
          <View style={styles.card}>
            {BENEFITS.map((b, i) => (
              <View key={b.label}>
                {i > 0 && <View style={styles.divider} />}
                <View style={styles.benefitRow}>
                  <View style={styles.benefitIcon}>
                    <Ionicons name={b.icon} size={18} color="#9d3d2c" />
                  </View>
                  <Text style={styles.benefitLabel}>{b.label}</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#5a614a" />
                </View>
              </View>
            ))}
          </View>

          {/* Cancel — low emphasis */}
          {sub && !willNotRenew && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel subscription</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Retention modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismiss}
            activeOpacity={1}
            onPress={cancelling ? undefined : () => setModalVisible(false)}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Keep your Premium?</Text>
            <Text style={styles.sheetSubtitle}>
              If you cancel, here's what you'll lose when Premium ends:
            </Text>
            <View style={styles.loseList}>
              {BENEFITS.slice(0, 3).map((b) => (
                <View key={b.label} style={styles.loseRow}>
                  <Ionicons name="close-circle" size={18} color="#ba1a1a" />
                  <Text style={styles.loseText}>{b.label}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.keepBtn}
              activeOpacity={0.85}
              onPress={() => setModalVisible(false)}
              disabled={cancelling}
            >
              <Text style={styles.keepBtnText}>Keep Premium</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelAnywayBtn}
              activeOpacity={0.7}
              onPress={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color="#ba1a1a" />
              ) : (
                <Text style={styles.cancelAnywayText}>Cancel anyway</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fcf9f4' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1c1c19' },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 60 },

  // Hero
  hero: {
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 12 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#9be79b' },
  statusDotEnding: { backgroundColor: '#f0c06a' },
  statusPillText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  divider: { height: 1, backgroundColor: '#f0ede9' },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  detailLabel: { fontSize: 14, color: '#89726d' },
  detailValue: { fontSize: 15, fontWeight: '600', color: '#1c1c19' },

  noRenewNote: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
    paddingTop: 4,
    paddingBottom: 14,
  },
  noRenewText: { flex: 1, fontSize: 13, color: '#56423e', lineHeight: 18 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1c19',
    marginBottom: 12,
    marginLeft: 4,
  },

  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f6f3ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitLabel: { flex: 1, fontSize: 14, color: '#1c1c19' },

  // Cancel
  cancelBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelBtnText: { fontSize: 14, color: '#89726d', textDecorationLine: 'underline' },

  // Retention modal
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  modalDismiss: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fcf9f4',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: '#1c1c19', marginBottom: 6 },
  sheetSubtitle: { fontSize: 14, color: '#56423e', lineHeight: 20, marginBottom: 16 },
  loseList: { gap: 10, marginBottom: 24 },
  loseRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loseText: { flex: 1, fontSize: 14, color: '#56423e' },
  keepBtn: {
    backgroundColor: '#9d3d2c',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  keepBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancelAnywayBtn: { paddingVertical: 14, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  cancelAnywayText: { fontSize: 15, fontWeight: '600', color: '#ba1a1a' },
});
