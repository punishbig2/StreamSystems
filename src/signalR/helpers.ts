import { ExecSound, UserPreferences } from "interfaces/user";
import { getSound } from "beep-sound";

export const getSoundFile = async (name: string) => {
  if (name === "default") {
    return "/sounds/alert.wav";
  } else {
    const sound: ExecSound = await getSound(name);
    if (sound === undefined) return "/sounds/alert.wav";
    return sound.data as string;
  }
};

export const playBeep = async (
  preferences: UserPreferences,
  destination: string | undefined,
) => {
  const src: string = await (async () => {
    if (destination === "DP") {
      return getSoundFile(preferences.darkPoolExecSound);
    } else {
      return getSoundFile(preferences.execSound);
    }
  })();
  const element: HTMLAudioElement = document.createElement("audio");
  element.src = src;
  element.play();
};
