import { MuiThemeProvider } from "@material-ui/core";
import { Workarea } from "components/Workarea";
import React from "react";
import { theme as muiTheme } from "theme";

const FXOptionsUI: React.FC = () => {
  const { classList } = document.body;
  const theme: string | null = localStorage.getItem("theme.ts");
  if (theme === null) {
    classList.add(`${theme}-theme`);
  } else {
    classList.add("dark-theme");
  }
  return (
    <MuiThemeProvider theme={muiTheme}>
      <Workarea />
    </MuiThemeProvider>
  );
};

export default FXOptionsUI;
