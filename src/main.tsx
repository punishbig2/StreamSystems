import { MuiThemeProvider } from "@material-ui/core";
import { Workarea } from "components/Workarea";
import { WorkareaError } from "components/Workarea/workareaError";
import { useSignOutOnIdleTimeout } from "hooks/useSignOutOnIdleTimeout";
import { observer } from "mobx-react";
import { MessagesStore, MessagesStoreContext } from "mobx/stores/messagesStore";
import { themeStore } from "mobx/stores/themeStore";
import React, { useEffect, useState } from "react";
import { createTheme } from "styles/theme";

const MIN_SCREEN_WIDTH = 1024;

const FXOptionsUI: React.FC = observer(
  (): React.ReactElement => {
    const { theme } = themeStore;
    const [inadequateScreen, setInadequateScreen] = useState<boolean>(false);
    useSignOutOnIdleTimeout();
    useEffect((): void => {
      const { body } = document;
      body.setAttribute("class", theme + "-theme");
    }, [theme]);
    useEffect((): (() => void) => {
      const checkWindowWidth = (): void => {
        setInadequateScreen(window.innerWidth < MIN_SCREEN_WIDTH);
      };
      checkWindowWidth();

      window.addEventListener("resize", checkWindowWidth);
      return (): void => {
        window.removeEventListener("resize", checkWindowWidth);
      };
    }, []);
    if (inadequateScreen) {
      return (
        <MuiThemeProvider theme={createTheme(theme)}>
          <MessagesStoreContext.Provider value={new MessagesStore()}>
            <WorkareaError
              title={"Your screen is too small to display this application"}
              detail={
                `Please try to run this application on a window with more than ${MIN_SCREEN_WIDTH}px` +
                " of width (it should match your resolution unless you have scaling enabled)"
              }
              shouldReload={false}
            />
          </MessagesStoreContext.Provider>
        </MuiThemeProvider>
      );
    }
    return (
      <MuiThemeProvider theme={createTheme(theme)}>
        <Workarea />
      </MuiThemeProvider>
    );
  }
);

export default FXOptionsUI;
