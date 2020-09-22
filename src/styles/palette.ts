import createPalette, {
  Palette,
  PaletteOptions,
} from "@material-ui/core/styles/createPalette";

export const light: PaletteOptions = {
  type: "light",
  primary: {
    main: "#407af0",
  },
  text: {
    primary: "#333333",
    secondary: "#555555",
    disabled: "#d5d5d5",
  },
  error: {
    main: "#f13951",
  },
  background: {
    default: "#ffffff",
    paper: "#ffffff",
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
    disabled: "#606060",
  },
  error: {
    main: "#f13951",
  },
  background: {
    default: "#212121",
    paper: "#323232",
  },
};

export const getPalette = (theme: "light" | "dark"): Palette => {
  switch (theme) {
    case "light":
      return createPalette(light);
    case "dark":
      return createPalette(dark);
  }
};
