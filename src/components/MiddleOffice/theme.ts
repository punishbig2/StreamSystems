import { createMuiTheme } from "@material-ui/core";
import { fade } from "@material-ui/core/styles";
import { Palette } from "@material-ui/core/styles/createPalette";
import { getPalette } from "styles/palette";
import { typography } from "styles/typography";

const labelWidth: string = "35%";
const fieldSize: number = 25;

export const createTheme = (name: string) => {
  const palette: Palette = getPalette(name as "light" | "dark");
  return createMuiTheme({
    spacing: 4,
    palette: palette,
    typography: typography(palette),
    overrides: {
      MuiMenuItem: {
        root: {
          fontSize: 13,
          fontWeight: 600,
        },
      },
      MuiOutlinedInput: {
        root: {
          borderRadius: 0,
        },
        input: {
          paddingTop: 0,
          paddingBottom: 0,
          paddingLeft: 8,
          paddingRight: 8,
          height: fieldSize,
          lineHeight: fieldSize + "px",
        },
        notchedOutline: {
          borderRadius: 3,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: "inherit",
        },
      },
      MuiSelect: {
        selectMenu: {
          height: fieldSize,
          lineHeight: fieldSize + "px",
        },
        iconOutlined: {
          fill: "inherit",
          "&$disabled": {
            fill: palette.text.disabled,
          },
        },
      },
      MuiInputBase: {
        root: {
          fontFamily: "'Roboto', sans-serif",
          fontWeight: 600,
          fontSize: 13,
          color: "inherit",
          height: fieldSize,
          lineHeight: fieldSize + "px",
          flex: 1,
          marginTop: 3,
          marginBottom: 3,
          "&$error": {
            backgroundColor: fade(palette.error.main, 0.15),
            color: palette.error.main,
          },
        },
        input: {
          paddingTop: 0,
          paddingBottom: 0,
        },
      },
      MuiFormLabel: {
        root: {
          fontFamily: "'Montserrat', sans-serif",
          minWidth: labelWidth,
          maxWidth: labelWidth,
          fontWeight: 500,
          fontSize: 13,
          color: "inherit",
          "&$disabled": {
            color: fade(palette.text.disabled, 0.5),
          },
        },
      },
    },
    props: {
      MuiTextField: {
        variant: "outlined",
        label: null,
      },
      MuiSelect: {
        variant: "outlined",
      },
    },
  });
};
