import { RefObject } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

export function useCardCapture() {
  const capture = (ref: RefObject<View | null>): Promise<string> =>
    captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });

  return { capture };
}
