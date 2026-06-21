import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { fetchPlans, startSubscription, Plan } from '../services/payments';
import { track } from '../services/analytics';

interface PaywallModalProps {
  visible: boolean;
  context: 'share' | 'save';
  uid: string | null;
  cardId: string;
  category: string;
  personalizable?: boolean;
  prefillName?: string;
  onClose: () => void;
  onShareWithoutPersonalization: () => void;
  onSubscribed: (planId: string) => void;
}

export default function PaywallModal({
  visible,
  context,
  uid,
  cardId,
  category,
  personalizable = true,
  prefillName,
  onClose,
  onShareWithoutPersonalization,
  onSubscribed,
}: PaywallModalProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);

  const actionLabel = context === 'share' ? 'Share' : 'Save';

  useEffect(() => {
    if (!visible) return;
    void track(uid, 'paywall_shown', { card_id: cardId, category });
    let active = true;
    setPlansLoading(true);
    fetchPlans()
      .then((result) => {
        if (active) setPlans(result);
      })
      .catch(() => {
        if (active) setPlans([]);
      })
      .finally(() => {
        if (active) setPlansLoading(false);
      });
    return () => {
      active = false;
    };
  }, [visible, uid, cardId, category]);

  const handleSubscribe = async (plan: Plan) => {
    try {
      setPurchasingPlanId(plan.razorpayPlanId);
      const result = await startSubscription(plan.razorpayPlanId, {
        name: prefillName,
      });
      if (result.success) {
        onSubscribed(plan.razorpayPlanId);
      }
    } catch {
      Alert.alert('Payment failed', 'Something went wrong. Please try again.');
    } finally {
      setPurchasingPlanId(null);
    }
  };

  const purchasing = purchasingPlanId !== null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.dismissArea}
          activeOpacity={1}
          onPress={purchasing ? undefined : onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>
            {personalizable ? 'Unlock personalized cards' : 'Remove the watermark'}
          </Text>
          <Text style={styles.subtitle}>
            {personalizable
              ? `Go Premium to ${actionLabel.toLowerCase()} unlimited cards with your name and photo — no watermark.`
              : `Go Premium to ${actionLabel.toLowerCase()} unlimited cards without the watermark.`}
          </Text>

          {/* Plans */}
          {plansLoading ? (
            <ActivityIndicator color="#9d3d2c" style={styles.plansLoader} />
          ) : plans.length === 0 ? (
            <Text style={styles.emptyPlans}>
              Plans are unavailable right now. Please try again later.
            </Text>
          ) : (
            <View style={styles.plans}>
              {plans.map((plan) => {
                const isThisPurchasing = purchasingPlanId === plan.razorpayPlanId;
                return (
                  <TouchableOpacity
                    key={plan.razorpayPlanId}
                    style={[styles.planBtn, purchasing && styles.btnDisabled]}
                    activeOpacity={0.85}
                    onPress={() => handleSubscribe(plan)}
                    disabled={purchasing}
                  >
                    {isThisPurchasing ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Text style={styles.planLabel}>{plan.label}</Text>
                        <Text style={styles.planAmount}>{plan.amountDisplay}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Free path */}
          <TouchableOpacity
            style={[styles.freeBtn, purchasing && styles.btnDisabled]}
            activeOpacity={0.85}
            onPress={onShareWithoutPersonalization}
            disabled={purchasing}
          >
            <Text style={styles.freeBtnText}>
              {personalizable
                ? `${actionLabel} without personalization`
                : `${actionLabel} with watermark`}
            </Text>
          </TouchableOpacity>
          <Text style={styles.freeHint}>
            {personalizable
              ? 'Free cards are shared without your name or photo.'
              : 'Free cards are shared with a watermark.'}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fcf9f4',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c19',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#56423e',
    marginBottom: 20,
    lineHeight: 20,
  },
  plansLoader: {
    marginVertical: 24,
  },
  emptyPlans: {
    fontSize: 14,
    color: '#56423e',
    textAlign: 'center',
    marginVertical: 20,
  },
  plans: {
    gap: 10,
    marginBottom: 20,
  },
  planBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#9d3d2c',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 56,
  },
  planLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  planAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  freeBtn: {
    paddingVertical: 14,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#89726d',
    alignItems: 'center',
  },
  freeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#56423e',
  },
  freeHint: {
    fontSize: 12,
    color: '#89726d',
    textAlign: 'center',
    marginTop: 10,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
