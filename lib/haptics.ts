import * as Haptics from "expo-haptics";

export async function hapticLight() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // ignore
  }
}

export async function hapticSuccess() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // ignore
  }
}

export async function hapticError() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // ignore
  }
}

