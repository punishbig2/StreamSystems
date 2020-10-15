import { MuiThemeProvider } from "@material-ui/core";
import { Workarea } from "components/Workarea";
import { observer } from "mobx-react";
import { themeStore } from "mobx/stores/themeStore";
import React, { useEffect } from "react";
import config from "./config";
import { createTheme } from "./theme";

const FXOptionsUI: React.FC = observer(
  (): React.ReactElement => {
    const { theme } = themeStore;
    useEffect(() => {
      const timer = setTimeout((): void => {
        const { location } = window;
        location.href = config.SignOutUrl;
      }, config.IdleTimeout);
      const events: string[] = ["click", "mousemove", "keyup", "keydown"];
      const reset = (): void => {
        events.forEach((event: string): void => {
          document.removeEventListener(event, reset);
        });
        clearTimeout(timer);
      };
      events.forEach((event: string): void => {
        document.addEventListener(event, reset);
      });
      return (): void => {
        clearTimeout(timer);
      };
    });
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
