import { useEffect } from "react";
import config from "../config";

const addUserActivityListener = (onActivity: () => void): (() => void) => {
  const events = ["click", "mousemove", "keyup", "keydown"];
  events.forEach((event) => {
    document.addEventListener(event, onActivity);
  });
  return (): void => {
    events.forEach((event) => {
      document.removeEventListener(event, onActivity);
    });
  };
};

export const useSignOutOnIdleTimeout = (): void => {
  useEffect(() => {
    const worker = new Worker("/idle-watcher.js");
    worker.postMessage({
      type: "START",
      data: config.IdleTimeout,
    });
    worker.addEventListener("message", (rawEvent: Event): void => {
      const event: ServiceWorkerMessageEvent = rawEvent as ServiceWorkerMessageEvent;
      console.log(event.data);
      const { type } = event.data;
      if (type === "TIMEOUT") {
        const { location } = window;
        location.href = config.SignOutUrl;
      }
    });
    return addUserActivityListener((): void => {
      worker.postMessage({
        type: "USER_ACTION_EVENT",
      });
      worker.terminate();
    });
  }, []);
};
