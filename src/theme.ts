import { createMuiTheme, Theme } from "@material-ui/core";
import { Palette } from "@material-ui/core/styles/createPalette";
import { getPalette } from "palette";

export const createTheme = (theme: "dark" | "light"): Theme => {
  const palette: Palette = getPalette(theme);
  return createMuiTheme({
    palette: palette,
    typography: {
      subtitle1: {
        fontSize: 15,
        fontFamily: '"Montserrat", sans-serif',
        fontWeight: 600,
        color: palette.text.secondary,
      },
      subtitle2: {
        fontSize: 12,
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
    },
    overrides: {
      MuiFormControl: {
        root: {
          padding: 0,
        },
        marginNormal: {
          marginTop: 8,
          marginBottom: 8,
        },
      },
      MuiFormLabel: {
        root: {
          fontFamily: '"Montserrat", sans-serif',
          fontSize: 13,
          fontWeight: 500,
          margin: 0,
          marginBottom: 8,
        },
      },
      MuiListItem: {
        root: {
          fontFamily: '"Roboto", sans-serif',
          fontWeight: 500,
          fontSize: 15,
        },
      },
      MuiFormHelperText: {
        root: {
          fontFamily: '"Montserrat", sans-serif',
        },
      },
      MuiSelect: {
        select: {
          "&:focus": {
            backgroundColor: "transparent",
          },
        },
      },
      MuiInputBase: {
        root: {
          font: "initial",
          lineHeight: "30px",
          height: 30,
        },
        input: {
          fontFamily: '"Roboto", sans-serif',
          fontWeight: 500,
          fontSize: 15,
        },
      },
    },
    props: {
      MuiSelect: {
        variant: "standard",
      },
    },
  });
};
