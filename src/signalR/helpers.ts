import { getSound } from 'beep-sound';
import { ExecSound, UserPreferences } from 'types/user';

export const getSoundFile = async (name: string): Promise<string> => {
  if (name === 'default') {
    return '/sounds/alert.wav';
  } else {
    const sound: ExecSound = await getSound(name);
    if (sound === undefined) return '/sounds/alert.wav';
    return sound.data as string;
  }
};

export const playBeep = async (
  preferences: UserPreferences,
  destination: string | undefined
): Promise<void> => {
  const src: string = await (async () => {
    if (destination === 'DP') {
      return getSoundFile(preferences.darkPoolExecSound);
    } else {
      return getSoundFile(preferences.execSound);
    }
  })();
  const element: HTMLAudioElement = document.createElement('audio');
  element.src = src;

  element
    .play()
    .then((): void => {
      return;
    })
    .catch((): void => {
      return;
    });
};
