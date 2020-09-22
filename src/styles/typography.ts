import { Palette } from "@material-ui/core/styles/createPalette";

export const typography = (palette: Palette) => ({
  subtitle1: {
    fontSize: 15,
    fontFamily: '"Montserrat", sans-serif',
    fontWeight: 600,
    color: palette.text.secondary,
  },
  subtitle2: {
    fontSize: 14,
    fontFamily: '"Roboto", sans-serif',
    fontWeight: 500,
    color: palette.text.secondary,
  },
  h1: {
    fontFamily: '"Montserrat", sans-serif',
    fontWeight: 800,
  },
  h2: {
    fontFamily: '"Montserrat", sans-serif',
    fontWeight: 800,
  },
  h3: {
    fontFamily: '"Montserrat", sans-serif',
    fontWeight: 800,
  },
  h4: {
    fontFamily: '"Montserrat", sans-serif',
    fontWeight: 800,
  },
  h5: {
    fontFamily: '"Montserrat", sans-serif',
    fontWeight: 800,
  },
  h6: {
    fontFamily: '"Montserrat", sans-serif',
    fontWeight: 800,
  },
  body1: {
    fontFamily: '"Montserrat", sans-serif',
  },
});
