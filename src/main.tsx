import { MuiThemeProvider } from "@material-ui/core";
import { Workarea } from "components/Workarea";
import { observer } from "mobx-react";
import { themeStore } from "mobx/stores/themeStore";
import React, { useEffect } from "react";
import config from "./config";
import { createTheme } from "./theme";

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

const FXOptionsUI: React.FC = observer(
  (): React.ReactElement => {
    const { theme } = themeStore;
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
    useEffect(() => {
      const { body } = document;
      body.setAttribute("class", theme + "-theme");
    }, [theme]);
    return (
      <MuiThemeProvider theme={createTheme(theme)}>
        <Workarea />
      </MuiThemeProvider>
    );
  }
);

export default FXOptionsUI;
