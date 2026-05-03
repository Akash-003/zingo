import {
  readAsStringAsync,
  writeAsStringAsync,
  cacheDirectory,
  EncodingType,
} from 'expo-file-system/legacy';
import Constants from 'expo-constants';

const API_KEY = (Constants.expoConfig?.extra?.REMOVE_BG_API_KEY ?? '') as string;

export async function removeBackground(localUri: string): Promise<string> {
  if (!API_KEY) return localUri; // fall back to stub if key not set

  const base64Image = await readAsStringAsync(localUri, {
    encoding: EncodingType.Base64,
  });

  const formData = new FormData();
  formData.append('image_file_b64', base64Image);
  formData.append('size', 'auto');

  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': API_KEY },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Remove.bg error: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  const base64Result = btoa(binary);
  const tempPath = (cacheDirectory ?? '') + `rmbg_${Date.now()}.png`;

  await writeAsStringAsync(tempPath, base64Result, {
    encoding: EncodingType.Base64,
  });

  return tempPath;
}
