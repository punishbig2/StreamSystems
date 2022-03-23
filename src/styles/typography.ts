import { Palette } from "@material-ui/core/styles/createPalette";

export const typography = (palette: Palette, fontFamily: string) => ({
  fontFamily: fontFamily,
  subtitle1: {
    fontWeight: 600,
    color: palette.text.secondary,
  },
  subtitle2: {
    fontSize: "small",
    fontWeight: 500,
    color: palette.text.secondary,
  },
  h1: {
    fontWeight: 800,
  },
  h2: {
    fontWeight: 800,
  },
  h3: {
    fontWeight: 800,
  },
  h4: {
    fontWeight: 800,
  },
  h5: {
    fontWeight: 800,
  },
  h6: {
    fontWeight: 800,
  },
});
