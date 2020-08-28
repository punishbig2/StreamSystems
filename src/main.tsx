import { MuiThemeProvider } from "@material-ui/core";
import { Workarea } from "components/Workarea";
import React from "react";
import { theme as muiTheme } from "theme";

const getTheme = (): "dark" | "light" => {
  const cached: string | null = localStorage.getItem("theme.ts");
  if (cached === null) {
    return "dark";
  } else {
    return cached as "dark" | "light";
  }
};

const FXOptionsUI: React.FC = () => {
  const { classList } = document.body;
  const theme: "light" | "dark" = getTheme();
  // Set the theme on the body
  classList.add(`${theme}-theme`);
  // Render the thing ;)
  return (
    <MuiThemeProvider theme={muiTheme(theme)}>
      <Workarea />
    </MuiThemeProvider>
  );
};

export default FXOptionsUI;
