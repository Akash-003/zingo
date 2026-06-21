import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAlertStore, AlertButton } from '../store/alertStore';

// Single mounted instance (see App.tsx). Renders the themed dialog driven by
// the alert store, replacing the platform-default Alert.alert dialog.
export default function AppAlert() {
  const visible = useAlertStore((s) => s.visible);
  const title = useAlertStore((s) => s.title);
  const message = useAlertStore((s) => s.message);
  const storeButtons = useAlertStore((s) => s.buttons);
  const hide = useAlertStore((s) => s.hide);

  // Default to a single "OK" button when none are provided (matches Alert).
  const buttons: AlertButton[] =
    storeButtons.length > 0 ? storeButtons : [{ text: 'OK', style: 'default' }];
  // Two or fewer buttons sit on one row; three or more stack vertically.
  const horizontal = buttons.length <= 2;

  const handlePress = (button: AlertButton) => {
    hide();
    button.onPress?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={hide}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={[styles.buttons, horizontal ? styles.row : styles.col]}>
            {buttons.map((button, index) => {
              const isCancel = button.style === 'cancel';
              const isDestructive = button.style === 'destructive';
              return (
                <TouchableOpacity
                  key={`${button.text}-${index}`}
                  style={styles.btn}
                  activeOpacity={0.6}
                  onPress={() => handlePress(button)}
                >
                  <Text
                    style={[
                      styles.btnText,
                      isCancel && styles.btnTextCancel,
                      isDestructive && styles.btnTextDestructive,
                      !isCancel && !isDestructive && styles.btnTextDefault,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28,28,25,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fcf9f4',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c19',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#56423e',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  buttons: {
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  col: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  // Text-only buttons, bottom-right aligned (generous tap target).
  btn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  btnTextDefault: {
    color: '#9d3d2c',
  },
  btnTextCancel: {
    color: '#89726d',
    fontWeight: '600',
  },
  btnTextDestructive: {
    color: '#ba1a1a',
  },
});
