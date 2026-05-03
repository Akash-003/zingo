import { View, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ActionButtonsProps {
  onShare: () => Promise<void>;
  onDownload: () => Promise<void>;
  onChangePhoto: () => void;
  onEditName: () => void;
  loading?: boolean;
}

export default function ActionButtons({
  onShare,
  onDownload,
  onChangePhoto,
  onEditName,
  loading = false,
}: ActionButtonsProps) {
  return (
    <View style={styles.container}>
      {/* Share + Download */}
      <View style={styles.row}>
        <LinearGradient
          colors={['#1565c0', '#1e88e5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientBtn}
        >
          <TouchableOpacity
            style={styles.btn}
            onPress={onShare}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.btnText}>↑ SHARE</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>

        <LinearGradient
          colors={['#b71c1c', '#e53935']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientBtn}
        >
          <TouchableOpacity
            style={styles.btn}
            onPress={onDownload}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={styles.btnText}>↓ DOWNLOAD</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Change Photo + Edit Name */}
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.outlinedBtn}
          onPress={onChangePhoto}
          activeOpacity={0.75}
        >
          <Text style={styles.outlinedBtnText}>Change Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlinedBtn}
          onPress={onEditName}
          activeOpacity={0.75}
        >
          <Text style={styles.outlinedBtnText}>Edit Name</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  gradientBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  btn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  outlinedBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#89726d',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  outlinedBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#56423e',
  },
});
