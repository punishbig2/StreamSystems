import { createTheme as createMuiTheme, Theme } from "@material-ui/core";
import { Palette } from "@material-ui/core/styles/createPalette";
import { getPalette } from "styles/palette";
import { typography } from "styles/typography";

export const createTheme = (
  theme: "dark" | "light",
  fontFamily: string
): Theme => {
  const palette: Palette = getPalette(theme);
  return createMuiTheme({
    palette: palette,
    typography: typography(palette, fontFamily),
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
          fontWeight: 500,
          margin: 0,
          marginBottom: 8,
        },
      },
      MuiMenuItem: {
        root: {
          fontWeight: 500,
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
          fontWeight: 500,
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
