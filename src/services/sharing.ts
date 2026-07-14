import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { showAlert } from '../store/alertStore';
import { t } from '../i18n';

export async function shareCard(uri: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    showAlert(t('sharing.unavailableTitle'), t('sharing.unavailableBody'));
    return;
  }
  await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: t('sharing.dialogTitle') });
}

export async function downloadCard(uri: string): Promise<void> {
  const { status } = await MediaLibrary.requestPermissionsAsync(true);
  if (status !== 'granted') {
    showAlert(t('common.permissionRequired'), t('sharing.savePermissionBody'));
    return;
  }
  await MediaLibrary.saveToLibraryAsync(uri);
  showAlert(t('sharing.savedTitle'), t('sharing.savedBody'));
}
