import { View, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ActionButtonsProps {
  onShare: () => Promise<void>;
  onDownload: () => Promise<void>;
  onChangePhoto: () => void;
  onEditName: () => void;
  loading?: boolean;
}

const BUTTONS = [
  { key: 'share',   icon: 'share-social-outline' as const, label: 'Share'    },
  { key: 'save',    icon: 'download-outline'      as const, label: 'Save'     },
  { key: 'photo',   icon: 'camera-outline'        as const, label: 'Photo'    },
  { key: 'name',    icon: 'pencil-outline'        as const, label: 'Name'     },
] as const;

export default function ActionButtons({
  onShare,
  onDownload,
  onChangePhoto,
  onEditName,
  loading = false,
}: ActionButtonsProps) {
  const handlers: Record<typeof BUTTONS[number]['key'], () => void> = {
    share:  onShare,
    save:   onDownload,
    photo:  onChangePhoto,
    name:   onEditName,
  };

  return (
    <View style={styles.container}>
      {BUTTONS.map(({ key, icon, label }) => (
        <TouchableOpacity
          key={key}
          style={styles.btn}
          onPress={handlers[key]}
          activeOpacity={0.7}
          disabled={loading && (key === 'share' || key === 'save')}
        >
          {loading && key === 'share' ? (
            <ActivityIndicator size="small" color="#9d3d2c" />
          ) : (
            <Ionicons
              name={icon}
              size={22}
              color="#9d3d2c"
            />
          )}
          <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingBottom: 8,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: '#56423e',
    fontWeight: '500',
  },
});
