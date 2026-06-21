import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { showAlert } from '../store/alertStore';

export async function shareCard(uri: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    showAlert('Sharing unavailable', 'Sharing is not supported on this device.');
    return;
  }
  await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your card' });
}

export async function downloadCard(uri: string): Promise<void> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    showAlert('Permission required', 'Please allow photo library access to save the card.');
    return;
  }
  await MediaLibrary.saveToLibraryAsync(uri);
  showAlert('Saved!', 'Card saved to your photo library.');
}
