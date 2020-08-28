import { PaletteOptions } from "@material-ui/core/styles/createPalette";

export const light: PaletteOptions = {
  type: "light",
  primary: {
    main: "#407af0",
  },
  text: {
    primary: "#333333",
    secondary: "#555555",
  },
};

export const dark: PaletteOptions = {
  type: "dark",
  primary: {
    main: "#84cff8",
  },
  text: {
    primary: "#ffffff",
    secondary: "#e1e1e1",
  },
};

export const palette = (theme: "light" | "dark"): PaletteOptions => {
  switch (theme) {
    case "light":
      return light;
    case "dark":
      return dark;
  }
};
