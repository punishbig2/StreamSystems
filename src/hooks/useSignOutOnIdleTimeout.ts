import { useEffect } from "react";
import config from "../config";

const addUserActivityListener = (
  onActivity: () => void,
  quit: () => void
): (() => void) => {
  const events = ["click", "mousemove", "keyup", "keydown"];
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
  useEffect(() => {
    const { location } = window;
    const state = { timer: 0 };
    const createIdleKiller = (): number =>
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
