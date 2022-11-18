import config from 'config';
import { useEffect } from 'react';

const addUserActivityListener = (onActivity: () => void, quit: () => void): VoidFunction => {
  const events = ['click', 'keyup', 'keydown'];
  events.forEach((event) => {
    document.addEventListener(event, onActivity);
  });
  return (): void => {
    events.forEach((event) => {
      document.removeEventListener(event, onActivity);
    });
    quit();
  };
};

export const useSignOutOnIdleTimeout = (): void => {
  useEffect((): VoidFunction | void => {
    if (config.IdleTimeout < 0) return;
    const { location } = window;
    const state = { timer: setTimeout((): void => {}, 0) };
    const createIdleKiller = (): ReturnType<typeof setTimeout> =>
      setTimeout((): void => {
        location.href = config.SignOutUrl;
      }, config.IdleTimeout);
    state.timer = createIdleKiller();

    return addUserActivityListener(
      (): void => {
        clearTimeout(state.timer);
        state.timer = createIdleKiller();
      },
      (): void => {
        clearTimeout(state.timer);
      }
    );
  }, []);
};
