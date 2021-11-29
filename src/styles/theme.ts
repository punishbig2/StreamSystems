import { createTheme as createMuiTheme, Theme } from "@material-ui/core";
import { Palette } from "@material-ui/core/styles/createPalette";
import { getPalette } from "styles/palette";
import { typography } from "styles/typography";

export const createTheme = (theme: "dark" | "light"): Theme => {
  const palette: Palette = getPalette(theme);
  return createMuiTheme({
    palette: palette,
    typography: typography(palette),
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
      MuiMenuItem: {
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
