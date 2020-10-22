import { MuiThemeProvider } from "@material-ui/core";
import { Workarea } from "components/Workarea";
import { observer } from "mobx-react";
import { themeStore } from "mobx/stores/themeStore";
import React, { useEffect } from "react";
import { useReloadOnVersionChange } from "./hooks/useReloadOnVersionChange";
import { useSignOutOnIdleTimeout } from "./hooks/useSignOutOnIdleTimeout";
import { createTheme } from "./theme";

const FXOptionsUI: React.FC = observer(
  (): React.ReactElement => {
    const { theme } = themeStore;
    useSignOutOnIdleTimeout();
    useReloadOnVersionChange();
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
