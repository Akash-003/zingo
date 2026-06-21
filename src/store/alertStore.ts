import { create } from 'zustand';

export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface AlertButton {
  text: string;
  style?: AlertButtonStyle;
  onPress?: () => void;
}

export interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
  show: (opts: AlertOptions) => void;
  hide: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: '',
  message: undefined,
  buttons: [],
  show: ({ title, message, buttons }) =>
    set({ visible: true, title, message, buttons: buttons ?? [] }),
  hide: () => set({ visible: false }),
}));

/**
 * Themed, app-wide replacement for React Native's `Alert.alert`. Mirrors its
 * positional signature so call sites migrate mechanically. Works from anywhere
 * — components, hooks, and plain services — because it drives a Zustand store
 * that the single mounted `<AppAlert />` renders.
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
): void {
  useAlertStore.getState().show({ title, message, buttons });
}
